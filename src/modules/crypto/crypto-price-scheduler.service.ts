import { Injectable, Logger } from '@nestjs/common';
import { CryptoService } from './crypto-service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CryptoPriceSchedulerService {
  private readonly logger = new Logger(CryptoPriceSchedulerService.name);
  private isUpdating = false;

  constructor(private readonly cryptoService: CryptoService) {}

  /**
   * Update prices every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async updatePricesEvery5Minutes() {
    if (this.isUpdating) {
      this.logger.warn('Price update already in progress, skipping...');
      return;
    }

    this.isUpdating = true;

    try {
      this.logger.log('Starting scheduled price update...');
      await this.cryptoService.updatePrices();
      this.logger.log('Scheduled price update completed successfully');
    } catch (error) {
      this.logger.error('Scheduled price update failed', error.stack);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Update prices every hour (backup)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async updatePricesEveryHour() {
    if (!this.isUpdating) {
      this.logger.log('Running hourly price update...');
      await this.updatePricesEvery5Minutes();
    }
  }

  /**
   * Cleanup old price history (keep last 90 days)
   * Runs daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldPriceHistory() {
    this.logger.log('Starting price history cleanup...');

    // This will be implemented when needed
    // For now, keep all history

    this.logger.log('Price history cleanup completed');
  }

  /**
   * Manual trigger for price update
   */
  async triggerUpdate(symbols?: string[]): Promise<void> {
    this.logger.log('Manual price update triggered');
    await this.cryptoService.updatePrices(symbols);
  }
}
