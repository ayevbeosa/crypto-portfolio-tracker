import { NotificationPreferences } from '@/database/entities/notification-preferences.entity';
import { User } from '@/database/entities/user.entity';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { PushService } from './push.service';
import { UpdateNotificationPreferencesDto } from './dtos/update-notification-preferences.dto';

export interface AlertNotificationPayload {
  userId: string;
  symbol: string;
  condition: string;
  targetPrice: number;
  currentPrice: number;
  message?: string;
}

export interface PortfolioNotificationPayload {
  userId: string;
  portfolioName: string;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationPreferences)
    private readonly preferencesRepository: Repository<NotificationPreferences>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly pushService: PushService,
    private readonly smsService: SmsService,
  ) {}

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    let prefs = await this.preferencesRepository.findOne({ where: { userId } });

    // Create default preferences if they don't exist
    if (!prefs) {
      prefs = await this.createDefaultPreferences(userId);
    }

    return prefs;
  }

  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferences> {
    let prefs = await this.getPreferences(userId);

    Object.assign(prefs, dto);
    return this.preferencesRepository.save(prefs);
  }

  async addPushToken(
    userId: string,
    token: string,
  ): Promise<NotificationPreferences> {
    const prefs = await this.getPreferences(userId);

    if (!prefs.pushTokens) {
      prefs.pushTokens = [];
    }

    // Avoid duplicates
    if (!prefs.pushTokens.includes(token)) {
      prefs.pushTokens.push(token);
      await this.preferencesRepository.save(prefs);
      this.logger.log(`Added push token for user ${userId}`);
    }

    return prefs;
  }

  async removePushToken(
    userId: string,
    token: string,
  ): Promise<NotificationPreferences> {
    const prefs = await this.getPreferences(userId);

    if (prefs.pushTokens) {
      prefs.pushTokens = prefs.pushTokens.filter((t) => t !== token);
      await this.preferencesRepository.save(prefs);
      this.logger.log(`Removed push token for user ${userId}`);
    }

    return prefs;
  }

  private async createDefaultPreferences(
    userId: string,
  ): Promise<NotificationPreferences> {
    const prefs = this.preferencesRepository.create({
      userId,
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: false,
      websocketEnabled: true,
      priceAlerts: true,
      portfolioUpdates: true,
      marketNews: false,
    });

    return this.preferencesRepository.save(prefs);
  }

  async sendPriceAlert(payload: AlertNotificationPayload): Promise<void> {
    const prefs = await this.getPreferences(payload.userId);
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });

    if (!user) {
      this.logger.error(`User not found: ${payload.userId}`);
      return;
    }

    if (!prefs.priceAlerts) {
      this.logger.debug(`Price alerts disabled for user ${payload.userId}`);
      return;
    }

    const { symbol, condition, targetPrice, currentPrice, message } = payload;

    // Send via enabled channels in parallel
    const promises: Promise<boolean>[] = [];

    if (prefs.emailEnabled) {
      promises.push(
        this.emailService.sendPriceAlert(
          user.email,
          symbol,
          condition,
          targetPrice,
          currentPrice,
          message,
        ),
      );
    }

    if (prefs.smsEnabled && prefs.phoneNumber) {
      promises.push(
        this.smsService.sendPriceAlert(
          prefs.phoneNumber,
          symbol,
          condition,
          targetPrice,
          currentPrice,
        ),
      );
    }

    if (prefs.pushEnabled && prefs.pushTokens?.length > 0) {
      promises.push(
        this.pushService.sendPriceAlert(
          prefs.pushTokens,
          symbol,
          condition,
          targetPrice,
          currentPrice,
        ),
      );
    }

    // Execute all notifications
    const results = await Promise.allSettled(promises);

    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value,
    ).length;
    this.logger.log(
      `Price alert sent to user ${payload.userId}: ${successCount}/${promises.length} channels succeeded`,
    );
  }

  async sendPortfolioUpdate(
    payload: PortfolioNotificationPayload,
  ): Promise<void> {
    const prefs = await this.getPreferences(payload.userId);
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });

    if (!user) {
      this.logger.error(`User not found: ${payload.userId}`);
      return;
    }

    if (!prefs.portfolioUpdates) {
      this.logger.debug(
        `Portfolio updates disabled for user ${payload.userId}`,
      );
      return;
    }

    const { portfolioName, totalValue, profitLoss, profitLossPercentage } =
      payload;

    // Send via enabled channels in parallel
    const promises: Promise<boolean>[] = [];

    if (prefs.emailEnabled) {
      promises.push(
        this.emailService.sendPortfolioUpdate(
          user.email,
          portfolioName,
          totalValue,
          profitLoss,
          profitLossPercentage,
        ),
      );
    }

    if (prefs.smsEnabled && prefs.phoneNumber) {
      promises.push(
        this.smsService.sendPortfolioUpdate(
          prefs.phoneNumber,
          portfolioName,
          totalValue,
          profitLoss,
        ),
      );
    }

    if (prefs.pushEnabled && prefs.pushTokens?.length > 0) {
      promises.push(
        this.pushService.sendPortfolioUpdate(
          prefs.pushTokens,
          portfolioName,
          totalValue,
          profitLoss,
          profitLossPercentage,
        ),
      );
    }

    // Execute all notifications
    const results = await Promise.allSettled(promises);

    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value,
    ).length;
    this.logger.log(
      `Portfolio update sent to user ${payload.userId}: ${successCount}/${promises.length} channels succeeded`,
    );
  }

  async sendTestNotification(
    userId: string,
    channel: 'email' | 'sms' | 'push',
    customMessage?: string,
  ): Promise<boolean> {
    const prefs = await this.getPreferences(userId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    switch (channel) {
      case 'email':
        return this.emailService.sendTestEmail(user.email, customMessage);

      case 'sms':
        if (!prefs.phoneNumber) {
          throw new NotFoundException('Phone number not configured');
        }
        return this.smsService.sendTestSms(prefs.phoneNumber, customMessage);

      case 'push':
        if (!prefs.pushTokens || prefs.pushTokens.length === 0) {
          throw new NotFoundException('No push tokens registered');
        }
        return this.pushService.sendTestPush(prefs.pushTokens, customMessage);

      default:
        return false;
    }
  }

  async getNotificationStats(userId: string) {
    const prefs = await this.getPreferences(userId);

    return {
      enabledChannels: {
        email: prefs.emailEnabled,
        sms: prefs.smsEnabled,
        push: prefs.pushEnabled,
        websocket: prefs.websocketEnabled,
      },
      contactInfo: {
        hasPhoneNumber: !!prefs.phoneNumber,
        pushTokenCount: prefs.pushTokens?.length || 0,
      },
      preferences: {
        priceAlerts: prefs.priceAlerts,
        portfolioUpdates: prefs.portfolioUpdates,
        marketNews: prefs.marketNews,
      },
    };
  }
}
