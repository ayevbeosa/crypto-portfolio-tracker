import {
  Alert,
  AlertCondition,
  AlertStatus,
} from '@/database/entities/alert.entity';
import { Cryptocurrency } from '@/database/entities/cryptocurrency.entity';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoService } from '../crypto/crypto-service';
import { CreateAlertDto } from './dtos/create-alert.dto';
import { UpdateAlertDto } from './dtos/update-alert.dto';
import { AlertStatsDto } from './dtos/alert-stats.dto';
import { AlertResponseDto } from './dtos/alert-response.dto';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(Cryptocurrency)
    private readonly cryptoRepository: Repository<Cryptocurrency>,
    private readonly cryptoService: CryptoService,
  ) {}

  /**
   * Create a new price alert
   */
  async create(userId: string, createAlertDto: CreateAlertDto): Promise<Alert> {
    const { cryptoSymbol, condition, targetPrice, message } = createAlertDto;

    // Validate cryptocurrency exists
    const crypto = await this.cryptoRepository.findOne({
      where: { symbol: cryptoSymbol.toUpperCase() },
    });

    if (!crypto) {
      throw new NotFoundException(`Cryptocurrency ${cryptoSymbol} not found`);
    }

    // Check for duplicate active alerts
    const existingAlert = await this.alertRepository.findOne({
      where: {
        userId,
        cryptoId: crypto.id,
        condition,
        targetPrice,
        status: AlertStatus.ACTIVE,
      },
    });

    if (existingAlert) {
      throw new BadRequestException(
        'An identical active alert already exists for this cryptocurrency',
      );
    }

    // Create alert
    const alert = this.alertRepository.create({
      userId,
      cryptoId: crypto.id,
      condition,
      targetPrice,
      message,
      status: AlertStatus.ACTIVE,
    });

    const savedAlert = await this.alertRepository.save(alert);

    this.logger.log(
      `Alert created: ${userId} - ${crypto.symbol} ${condition} $${targetPrice}`,
    );

    return savedAlert;
  }

  /**
   * Get all alerts for a user
   */
  async findAll(userId: string, status?: AlertStatus): Promise<Alert[]> {
    const query = this.alertRepository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.cryptocurrency', 'cryptocurrency')
      .where('alert.userId = :userId', { userId })
      .orderBy('alert.createdAt', 'DESC');

    if (status) {
      query.andWhere('alert.status = :status', { status });
    }

    return query.getMany();
  }

  /**
   * Get a single alert by ID
   */
  async findOne(id: string, userId: string): Promise<Alert> {
    const alert = await this.alertRepository.findOne({
      where: { id, userId },
      relations: ['cryptocurrency'],
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    return alert;
  }

  /**
   * Update an alert
   */
  async update(
    id: string,
    userId: string,
    updateAlertDto: UpdateAlertDto,
  ): Promise<Alert> {
    const alert = await this.findOne(id, userId);

    // Don't allow updating triggered alerts
    if (alert.status === AlertStatus.TRIGGERED) {
      throw new BadRequestException('Cannot update a triggered alert');
    }

    Object.assign(alert, updateAlertDto);

    const updatedAlert = await this.alertRepository.save(alert);

    this.logger.log(`Alert updated: ${id} - ${userId}`);

    return updatedAlert;
  }

  /**
   * Delete an alert
   */
  async remove(id: string, userId: string): Promise<void> {
    const alert = await this.findOne(id, userId);
    await this.alertRepository.remove(alert);

    this.logger.log(`Alert deleted: ${id} - ${userId}`);
  }

  /**
   * Cancel an alert (soft delete)
   */
  async cancel(id: string, userId: string): Promise<Alert> {
    const alert = await this.findOne(id, userId);

    if (alert.status !== AlertStatus.ACTIVE) {
      throw new BadRequestException('Only active alerts can be cancelled');
    }

    alert.status = AlertStatus.CANCELLED;
    const updatedAlert = await this.alertRepository.save(alert);

    this.logger.log(`Alert cancelled: ${id} - ${userId}`);

    return updatedAlert;
  }

  /**
   * Get active alerts for a cryptocurrency
   */
  async getActiveAlertsForCrypto(cryptoSymbol: string): Promise<Alert[]> {
    const crypto = await this.cryptoRepository.findOne({
      where: { symbol: cryptoSymbol.toUpperCase() },
    });

    if (!crypto) {
      return [];
    }

    return this.alertRepository.find({
      where: {
        cryptoId: crypto.id,
        status: AlertStatus.ACTIVE,
      },
      relations: ['cryptocurrency'],
    });
  }

  /**
   * Get all active alerts
   */
  async getAllActiveAlerts(): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { status: AlertStatus.ACTIVE },
      relations: ['cryptocurrency'],
    });
  }

  /**
   * Check if an alert should be triggered
   */
  shouldTrigger(alert: Alert, currentPrice: number): boolean {
    if (alert.condition === AlertCondition.ABOVE) {
      return currentPrice >= alert.targetPrice;
    } else {
      return currentPrice <= alert.targetPrice;
    }
  }

  /**
   * Trigger an alert
   */
  async triggerAlert(alertId: string): Promise<Alert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId },
      relations: ['cryptocurrency'],
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    alert.status = AlertStatus.TRIGGERED;
    alert.triggeredAt = new Date();

    const triggeredAlert = await this.alertRepository.save(alert);

    this.logger.log(
      `Alert triggered: ${alert.cryptocurrency.symbol} ${alert.condition} $${alert.targetPrice}`,
    );

    return triggeredAlert;
  }

  /**
   * Check alerts for a specific cryptocurrency
   */
  async checkAlertsForCrypto(
    cryptoSymbol: string,
    currentPrice: number,
  ): Promise<Alert[]> {
    const activeAlerts = await this.getActiveAlertsForCrypto(cryptoSymbol);
    const triggeredAlerts: Alert[] = [];

    for (const alert of activeAlerts) {
      if (this.shouldTrigger(alert, currentPrice)) {
        const triggered = await this.triggerAlert(alert.id);
        triggeredAlerts.push(triggered);
      }
    }

    if (triggeredAlerts.length > 0) {
      this.logger.log(
        `Triggered ${triggeredAlerts.length} alerts for ${cryptoSymbol} at $${currentPrice}`,
      );
    }

    return triggeredAlerts;
  }

  /**
   * Check all active alerts
   */
  async checkAllAlerts(): Promise<Alert[]> {
    const activeAlerts = await this.getAllActiveAlerts();
    const triggeredAlerts: Alert[] = [];

    // Group alerts by cryptocurrency to minimize price lookups
    const alertsByCrypto = new Map<string, Alert[]>();

    for (const alert of activeAlerts) {
      const symbol = alert.cryptocurrency.symbol;
      if (!alertsByCrypto.has(symbol)) {
        alertsByCrypto.set(symbol, []);
      }
      alertsByCrypto.get(symbol)?.push(alert);
    }

    // Check each cryptocurrency's alerts
    for (const [symbol, alerts] of alertsByCrypto.entries()) {
      try {
        const crypto = await this.cryptoService.getCryptoBySymbol(symbol);
        const currentPrice = parseFloat(crypto.currentPrice.toString());

        for (const alert of alerts) {
          if (this.shouldTrigger(alert, currentPrice)) {
            const triggered = await this.triggerAlert(alert.id);
            triggeredAlerts.push(triggered);
          }
        }
      } catch (error) {
        this.logger.error(`Failed to check alerts for ${symbol}`, error.stack);
      }
    }

    if (triggeredAlerts.length > 0) {
      this.logger.log(`Total alerts triggered: ${triggeredAlerts.length}`);
    }

    return triggeredAlerts;
  }

  /**
   * Get alert statistics for a user
   */
  async getStats(userId: string): Promise<AlertStatsDto> {
    const alerts = await this.findAll(userId);

    const stats: AlertStatsDto = {
      totalAlerts: alerts.length,
      activeAlerts: 0,
      triggeredAlerts: 0,
      cancelledAlerts: 0,
      alertsByCrypto: {},
    };

    for (const alert of alerts) {
      // Count by status
      if (alert.status === AlertStatus.ACTIVE) stats.activeAlerts++;
      if (alert.status === AlertStatus.TRIGGERED) stats.triggeredAlerts++;
      if (alert.status === AlertStatus.CANCELLED) stats.cancelledAlerts++;

      // Count by cryptocurrency
      const symbol = alert.cryptocurrency.symbol;
      stats.alertsByCrypto[symbol] = (stats.alertsByCrypto[symbol] || 0) + 1;
    }

    return stats;
  }

  /**
   * Convert alert to response DTO
   */
  async toResponseDto(alert: Alert): Promise<AlertResponseDto> {
    const currentPrice = parseFloat(
      alert.cryptocurrency.currentPrice.toString(),
    );

    return {
      id: alert.id,
      cryptoSymbol: alert.cryptocurrency.symbol,
      cryptoName: alert.cryptocurrency.name,
      condition: alert.condition,
      targetPrice: parseFloat(alert.targetPrice.toString()),
      currentPrice,
      status: alert.status,
      message: alert.message,
      triggeredAt: alert.triggeredAt,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    };
  }
}
