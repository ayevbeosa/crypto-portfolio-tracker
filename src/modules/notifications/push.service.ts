import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface PushPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<boolean>(
      'notifications.push.enabled',
      false,
    );

    if (this.enabled) {
      this.initializeFirebase();
    } else {
      this.logger.warn('Push notifications are disabled in configuration');
    }
  }

  private initializeFirebase() {
    const serviceAccount = this.configService.get<string>(
      'notifications.push.firebaseServiceAccount',
    );

    if (!serviceAccount) {
      this.logger.warn(
        'Firebase service account not configured. Set FIREBASE_SERVICE_ACCOUNT env var (path to JSON file) to enable push notifications.',
      );
      this.enabled = false;
      return;
    }

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccount)),
    });

    this.logger.log(
      'Push notification service initialized successfully (Firebase)',
    );
  }

  async sendPushNotification(payload: PushPayload): Promise<boolean> {
    if (!this.enabled) {
      this.logger.debug(`Push not sent (service disabled): ${payload.title}`);
      return false;
    }

    if (!payload.tokens || payload.tokens.length === 0) {
      this.logger.warn('No push tokens provided');
      return false;
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        tokens: payload.tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      this.logger.log(
        `Push sent: ${response.successCount}/${payload.tokens.length} successful`,
      );

      // Log failed tokens for cleanup
      if (response.failureCount > 0) {
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            this.logger.warn(
              `Failed token: ${payload.tokens[idx]} - ${resp.error?.message}`,
            );
          }
        });
      }

      return response.successCount > 0;
    } catch (error) {
      this.logger.error('Failed to send push notification', error.stack);
      return false;
    }
  }

  async sendPriceAlert(
    tokens: string[],
    symbol: string,
    condition: string,
    targetPrice: number,
    currentPrice: number,
  ): Promise<boolean> {
    const title = `🔔 Price Alert: ${symbol}`;
    const body = `${symbol} is now ${condition.toLowerCase()} $${targetPrice.toFixed(2)} at $${currentPrice.toFixed(2)}`;
    const data = {
      type: 'price_alert',
      symbol,
      condition,
      targetPrice: targetPrice.toString(),
      currentPrice: currentPrice.toString(),
    };

    return this.sendPushNotification({ tokens, title, body, data });
  }

  async sendPortfolioUpdate(
    tokens: string[],
    portfolioName: string,
    totalValue: number,
    profitLoss: number,
    profitLossPercentage: number,
  ): Promise<boolean> {
    const emoji = profitLoss >= 0 ? '📈' : '📉';
    const sign = profitLoss >= 0 ? '+' : '';
    const title = `${emoji} Portfolio Update: ${portfolioName}`;
    const body = `Value: $${totalValue.toFixed(2)} | P/L: ${sign}$${profitLoss.toFixed(2)} (${profitLossPercentage.toFixed(2)}%)`;
    const data = {
      type: 'portfolio_update',
      portfolioName,
      totalValue: totalValue.toString(),
      profitLoss: profitLoss.toString(),
      profitLossPercentage: profitLossPercentage.toString(),
    };

    return this.sendPushNotification({ tokens, title, body, data });
  }

  async sendTestPush(
    tokens: string[],
    customMessage?: string,
  ): Promise<boolean> {
    const title = '✅ Test Notification';
    const body =
      customMessage || 'Your push notifications are working correctly!';
    const data = { type: 'test' };

    return this.sendPushNotification({ tokens, title, body, data });
  }

  /**
   * Validate and clean up invalid tokens
   */
  async validateTokens(tokens: string[]): Promise<string[]> {
    if (!this.enabled || !tokens || tokens.length === 0) {
      return [];
    }

    const validTokens: string[] = [];

    // Send a test message to validate tokens
    for (const token of tokens) {
      try {
        await admin.messaging().send(
          {
            token,
            data: { test: 'validation' },
          },
          true,// dryRun = true
        ); 

        validTokens.push(token);
      } catch (error) {
        this.logger.warn(
          `Invalid token detected: ${token.substring(0, 20)}...`,
        );
      }
    }

    return validTokens;
  }
}
