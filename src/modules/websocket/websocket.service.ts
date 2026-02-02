import { Injectable, Logger } from '@nestjs/common';
import { PriceGateway } from './price.gateway';
import { CryptoService } from '../crypto/crypto-service';

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);

  constructor(
    private readonly priceGateway: PriceGateway,
    private readonly cryptoService: CryptoService,
  ) {}

  /**
   * Broadcast price update after crypto service updates
   */
  async broadcastPriceUpdate(symbol: string) {
    try {
      const crypto = await this.cryptoService.getCryptoBySymbol(symbol);

      await this.priceGateway.broadcastPriceUpdate(
        symbol,
        parseFloat(crypto.currentPrice.toString()),
        crypto.priceChangePercentage24h,
      );

      this.logger.debug(`Broadcasted price update for ${symbol}`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast price for ${symbol}: ${error.message}`,
      );
    }
  }

  /**
   * Broadcast multiple price updates
   */
  async broadcastMultiplePrices(symbols: string[]) {
    const updates: { symbol: string; price: number; change24h: number }[] = [];

    for (const symbol of symbols) {
      try {
        const crypto = await this.cryptoService.getCryptoBySymbol(symbol);
        updates.push({
          symbol,
          price: parseFloat(crypto.currentPrice.toString()),
          change24h: crypto.priceChangePercentage24h,
        });
      } catch (error) {
        this.logger.warn(`Failed to get price for ${symbol}`);
      }
    }

    if (updates.length > 0) {
      await this.priceGateway.broadcastMultiplePriceUpdates(updates);
      this.logger.log(`Broadcasted ${updates.length} price updates`);
    }
  }

  /**
   * Broadcast all crypto prices (after scheduled update)
   */
  async broadcastAllPrices() {
    try {
      const cryptos = await this.cryptoService.getAllCryptos();

      const updates = cryptos.map((crypto) => ({
        symbol: crypto.symbol,
        price: parseFloat(crypto.currentPrice.toString()),
        change24h: crypto.priceChangePercentage24h,
      }));

      await this.priceGateway.broadcastMultiplePriceUpdates(updates);
      this.logger.log(`Broadcasted all ${updates.length} crypto prices`);
    } catch (error) {
      this.logger.error(`Failed to broadcast all prices: ${error.message}`);
    }
  }

  /**
   * Send portfolio update to specific user
   */
  async sendPortfolioUpdate(
    userId: string,
    portfolioId: string,
    data: {
      totalValue: number;
      totalProfitLoss: number;
      totalProfitLossPercentage: number;
    },
  ) {
    await this.priceGateway.sendPortfolioUpdate(userId, portfolioId, data);
  }

  /**
   * Get WebSocket statistics
   */
  getStats() {
    return this.priceGateway.getStats();
  }

  /**
   * Broadcast system announcement
   */
  broadcastAnnouncement(
    message: string,
    type: 'info' | 'warning' | 'error' = 'info',
  ) {
    this.priceGateway.broadcastToAll('announcement', {
      message,
      type,
      timestamp: new Date(),
    });
  }
}
