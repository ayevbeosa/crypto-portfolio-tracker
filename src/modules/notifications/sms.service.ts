import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

export interface SmsPayload {
  to: string;
  message: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private enabled: boolean;
  private twilioClient: Twilio;
  private fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<boolean>(
      'notifications.sms.enabled',
      false,
    );

    if (this.enabled) {
      this.initializeTwilio();
    } else {
      this.logger.warn('SMS notifications are disabled in configuration');
    }
  }

  private initializeTwilio() {
    const accountSid = this.configService.get<string>(
      'notifications.sms.accountSid',
    );
    const authToken = this.configService.get<string>(
      'notifications.sms.authToken',
    );
    this.fromNumber =
      this.configService.get<string>('notifications.sms.fromNumber') || '';

    if (!accountSid || !authToken || !this.fromNumber) {
      this.logger.warn(
        'SMS credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER to enable SMS.',
      );
      this.enabled = false;
      return;
    }

    this.twilioClient = new Twilio(accountSid, authToken);
    this.logger.log('SMS service initialized successfully (Twilio)');
  }

  async sendSms(payload: SmsPayload): Promise<boolean> {
    if (!this.enabled) {
      this.logger.debug('SMS not sent (service disabled)');
      return false;
    }

    // Validate phone number format
    if (!this.isValidPhoneNumber(payload.to)) {
      this.logger.error(`Invalid phone number format: ${payload.to}`);
      return false;
    }

    try {
      const message = await this.twilioClient.messages.create({
        body: payload.message,
        from: this.fromNumber,
        to: payload.to,
      });

      this.logger.log(`SMS sent to ${payload.to}: ${message.sid}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${payload.to}`, error.stack);
      return false;
    }
  }

  async sendPriceAlert(
    phoneNumber: string,
    symbol: string,
    condition: string,
    targetPrice: number,
    currentPrice: number,
  ): Promise<boolean> {
    const message = `🔔 ${symbol} Alert: Price ${condition.toLowerCase()} $${targetPrice.toFixed(2)}. Current: $${currentPrice.toFixed(2)}`;

    return this.sendSms({ to: phoneNumber, message });
  }

  async sendPortfolioUpdate(
    phoneNumber: string,
    portfolioName: string,
    totalValue: number,
    profitLoss: number,
  ): Promise<boolean> {
    const emoji = profitLoss >= 0 ? '📈' : '📉';
    const sign = profitLoss >= 0 ? '+' : '';
    const message = `${emoji} ${portfolioName}: $${totalValue.toFixed(2)} (${sign}$${profitLoss.toFixed(2)})`;

    return this.sendSms({ to: phoneNumber, message });
  }

  async sendTestSms(
    phoneNumber: string,
    customMessage?: string,
  ): Promise<boolean> {
    const message =
      customMessage ||
      '✅ Test SMS from Crypto Portfolio Tracker. Your SMS notifications are working!';

    return this.sendSms({ to: phoneNumber, message });
  }

  private isValidPhoneNumber(phone: string): boolean {
    // E.164 format: +[country code][number]
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }
}
