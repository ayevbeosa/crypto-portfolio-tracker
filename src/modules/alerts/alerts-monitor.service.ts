import { Logger } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { WebSocketService } from '../websocket/websocket.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export class AlertsMonitorService {
  private readonly logger = new Logger(AlertsMonitorService.name);
  private isChecking = false;
  private webSocketService: WebSocketService;

  constructor(private readonly alertsService: AlertsService) {}

  /**
   * Set WebSocket service (to avoid circular dependency)
   */
  setWebSocketService(webSocketService: WebSocketService) {
    this.webSocketService = webSocketService;
  }

  /**
   * Check alerts every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkAlertsEveryMinute() {
    if (this.isChecking) {
      this.logger.debug('Alert check already in progress, skipping...');
      return;
    }

    this.isChecking = true;

    try {
      this.logger.debug('Checking all active alerts...');
      const triggeredAlerts = await this.alertsService.checkAllAlerts();

      if (triggeredAlerts.length > 0) {
        this.logger.log(`Triggered ${triggeredAlerts.length} alerts`);

        // Send notifications via WebSocket
        for (const alert of triggeredAlerts) {
          await this.notifyUser(alert);
        }
      } else {
        this.logger.debug('No alerts triggered');
      }
    } catch (error) {
      this.logger.error('Failed to check alerts', error.stack);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Check alerts every 5 minutes (backup)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkAlertsEvery5Minutes() {
    if (!this.isChecking) {
      this.logger.log('Running 5-minute alert check...');
      await this.checkAlertsEveryMinute();
    }
  }

  /**
   * Manual trigger for alert checking
   */
  async triggerCheck(): Promise<number> {
    this.logger.log('Manual alert check triggered');
    const triggeredAlerts = await this.alertsService.checkAllAlerts();

    // Send notifications
    for (const alert of triggeredAlerts) {
      await this.notifyUser(alert);
    }

    return triggeredAlerts.length;
  }

  /**
   * Notify user via WebSocket
   */
  private async notifyUser(alert: any) {
    if (!this.webSocketService) {
      this.logger.warn('WebSocket service not available for notifications');
      return;
    }

    try {
      const notification = {
        type: 'alert-triggered',
        alertId: alert.id,
        symbol: alert.cryptocurrency.symbol,
        condition: alert.condition,
        targetPrice: parseFloat(alert.targetPrice.toString()),
        currentPrice: parseFloat(alert.cryptocurrency.currentPrice.toString()),
        message: alert.message || this.generateDefaultMessage(alert),
        triggeredAt: alert.triggeredAt,
      };

      // Send to specific user
      await this.webSocketService.sendAlertNotification(
        alert.userId,
        notification,
      );

      this.logger.log(
        `Notification sent to user ${alert.userId} for ${alert.cryptocurrency.symbol}`,
      );
    } catch (error) {
      this.logger.error('Failed to send alert notification', error.stack);
    }
  }

  /**
   * Generate default alert message
   */
  private generateDefaultMessage(alert: any): string {
    const symbol = alert.cryptocurrency.symbol;
    const condition = alert.condition.toLowerCase();
    const price = parseFloat(alert.targetPrice.toString());
    const currentPrice = parseFloat(
      alert.cryptocurrency.currentPrice.toString(),
    );

    return `${symbol} price alert: Now at $${currentPrice.toFixed(2)} (${condition} your target of $${price.toFixed(2)})`;
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    return {
      isChecking: this.isChecking,
      lastCheck: new Date(),
    };
  }
}
