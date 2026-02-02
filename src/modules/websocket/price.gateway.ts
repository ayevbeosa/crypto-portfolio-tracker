import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CryptoService } from '../crypto/crypto-service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SubscribeDto } from './dtos/subscribe.dto';
import { UnsubscribeDto } from './dtos/unsubscribe.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  subscriptions?: Set<string>;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:4200',
    ],
    credentials: true,
  },
  namespace: '/prices',
})
export class PriceGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PriceGateway.name);
  private connectedClients: Map<string, AuthenticatedSocket> = new Map();
  /**
   * symbol -> Set of client IDs
   */
  private subscriptions: Map<string, Set<string>> = new Map();

  constructor(
    private readonly cryptoService: CryptoService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (token) {
        try {
          const payload = await this.jwtService.verifyAsync(token, {
            secret: this.configService.get<string>('jwt.secret'),
          });
          client.userId = payload.sub;
          this.logger.log(
            `Client connected (authenticated): ${client.id} - User: ${client.userId}`,
          );
        } catch (error) {
          this.logger.warn(`Invalid token for client ${client.id}`);
        }
      } else {
        this.logger.log(`Client connected (anonymous): ${client.id}`);
      }

      client.subscriptions = new Set();
      this.connectedClients.set(client.id, client);

      // Send connection success
      client.emit('connected', {
        message: 'Connected to price updates',
        clientId: client.id,
        authenticated: !!client.userId,
      });

      // Send current stats
      this.emitConnectionStats();
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove all subscriptions for this client
    if (client.subscriptions) {
      client.subscriptions.forEach((symbol) => {
        this.removeSubscription(symbol, client.id);
      });
    }

    this.connectedClients.delete(client.id);
    this.emitConnectionStats();
  }

  @SubscribeMessage('subscribe')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleSubscribe(
    @MessageBody() data: SubscribeDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { symbols } = data;
      const normalizedSymbols = symbols.map((s) => s.toUpperCase());

      this.logger.log(
        `Client ${client.id} subscribing to: ${normalizedSymbols.join(', ')}`,
      );

      // Validate symbols exist
      const validSymbols: string[] = [];
      for (const symbol of normalizedSymbols) {
        try {
          await this.cryptoService.getCryptoBySymbol(symbol);
          validSymbols.push(symbol);

          // Add to subscriptions
          if (!this.subscriptions.has(symbol)) {
            this.subscriptions.set(symbol, new Set());
          }
          this.subscriptions.get(symbol)?.add(client.id);
          client.subscriptions?.add(symbol);
        } catch (error) {
          this.logger.warn(`Invalid symbol: ${symbol}`);
        }
      }

      // Send current prices for subscribed symbols
      const currentPrices = await this.getCurrentPrices(validSymbols);

      client.emit('subscribed', {
        symbols: validSymbols,
        currentPrices,
      });

      this.emitConnectionStats();
    } catch (error) {
      this.logger.error(`Subscribe error: ${error.message}`);
      client.emit('error', {
        message: 'Subscription failed',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('unsubscribe')
  @UsePipes(new ValidationPipe({ transform: true }))
  handleUnsubscribe(
    @MessageBody() data: UnsubscribeDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { symbols } = data;
      const normalizedSymbols = symbols.map((s) => s.toUpperCase());

      this.logger.log(
        `Client ${client.id} unsubscribing from: ${normalizedSymbols.join(', ')}`,
      );

      normalizedSymbols.forEach((symbol) => {
        this.removeSubscription(symbol, client.id);
        client.subscriptions?.delete(symbol);
      });

      client.emit('unsubscribed', { symbols: normalizedSymbols });
      this.emitConnectionStats();
    } catch (error) {
      this.logger.error(`Unsubscribe error: ${error.message}`);
      client.emit('error', {
        message: 'Unsubscribe failed',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('getSubscriptions')
  handleGetSubscriptions(@ConnectedSocket() client: AuthenticatedSocket) {
    const subscriptions = Array.from(client.subscriptions || []);
    client.emit('subscriptions', { symbols: subscriptions });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: new Date() });
  }

  /**
   * Broadcast price update to all subscribed clients
   */
  async broadcastPriceUpdate(symbol: string, price: number, change24h: number) {
    const subscribedClients = this.subscriptions.get(symbol);

    if (!subscribedClients || subscribedClients.size === 0) {
      return;
    }

    const update = {
      symbol,
      price,
      change24h,
      timestamp: new Date(),
    };

    subscribedClients.forEach((clientId) => {
      const client = this.connectedClients.get(clientId);
      if (client) {
        client.emit('price-update', update);
      }
    });

    this.logger.debug(
      `Broadcasted ${symbol} price update to ${subscribedClients.size} clients`,
    );
  }

  /**
   * Broadcast price updates for multiple symbols
   */
  async broadcastMultiplePriceUpdates(
    updates: Array<{ symbol: string; price: number; change24h: number }>,
  ) {
    for (const update of updates) {
      await this.broadcastPriceUpdate(
        update.symbol,
        update.price,
        update.change24h,
      );
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.debug(`Broadcasted ${event} to all clients`);
  }

  /**
   * Send portfolio update to specific user
   */
  async sendPortfolioUpdate(userId: string, portfolioId: string, data: any) {
    const userClients = Array.from(this.connectedClients.values()).filter(
      (client) => client.userId === userId,
    );

    if (userClients.length === 0) {
      return;
    }

    const update = {
      portfolioId,
      ...data,
      timestamp: new Date(),
    };

    userClients.forEach((client) => {
      client.emit('portfolio-update', update);
    });

    this.logger.debug(
      `Sent portfolio update to user ${userId} (${userClients.length} clients)`,
    );
  }

  /**
   * Get current prices for symbols
   */
  private async getCurrentPrices(symbols: string[]) {
    const prices = {};

    for (const symbol of symbols) {
      try {
        const crypto = await this.cryptoService.getCryptoBySymbol(symbol);
        prices[symbol] = {
          price: parseFloat(crypto.currentPrice.toString()),
          change24h: crypto.priceChangePercentage24h,
          lastUpdated: crypto.lastUpdated,
        };
      } catch (error) {
        this.logger.warn(`Failed to get price for ${symbol}`);
      }
    }

    return prices;
  }

  /**
   * Remove subscription
   */
  private removeSubscription(symbol: string, clientId: string) {
    const subscribedClients = this.subscriptions.get(symbol);
    if (subscribedClients) {
      subscribedClients.delete(clientId);
      if (subscribedClients.size === 0) {
        this.subscriptions.delete(symbol);
      }
    }
  }

  /**
   * Emit connection statistics
   */
  private emitConnectionStats() {
    const stats = {
      totalConnections: this.connectedClients.size,
      authenticatedConnections: Array.from(
        this.connectedClients.values(),
      ).filter((c) => c.userId).length,
      subscriptions: {},
    };

    this.subscriptions.forEach((clients, symbol) => {
      stats.subscriptions[symbol] = clients.size;
    });

    this.server.emit('stats', stats);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.connectedClients.size,
      authenticatedConnections: Array.from(
        this.connectedClients.values(),
      ).filter((c) => c.userId).length,
      subscriptions: Object.fromEntries(
        Array.from(this.subscriptions.entries()).map(([symbol, clients]) => [
          symbol,
          clients.size,
        ]),
      ),
      connectedUsers: Array.from(
        new Set(
          Array.from(this.connectedClients.values())
            .filter((c) => c.userId)
            .map((c) => c.userId),
        ),
      ).length,
    };
  }
}
