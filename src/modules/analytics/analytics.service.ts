import { Cryptocurrency } from '@/database/entities/cryptocurrency.entity';
import { PortfolioHolding } from '@/database/entities/portfolio-holding.entity';
import { Portfolio } from '@/database/entities/portfolio.entity';
import { PriceHistory } from '@/database/entities/price-history.entity';
import {
  Transaction,
  TransactionType,
} from '@/database/entities/transaction.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardSummaryDto } from './dtos/dashboard-summary.dto';
import { RoiSummaryDto } from './dtos/roi-summary.dto';
import { AssetAllocationItemDto } from './dtos/asset-allocation-item.dto';
import { PerformanceSummaryDto } from './dtos/performance-summary.dto';
import { TransactionHistoryPointDto } from './dtos/transaction-history-point.dto';
import { FeeSummaryDto } from './dtos/fee-summary.dto';

/** Map string keys to calendar offsets used by getDateForRange */
const RANGE_DAYS: Record<string, number | null> = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
  all: null, // no lower bound
};

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    @InjectRepository(PortfolioHolding)
    private readonly holdingRepository: Repository<PortfolioHolding>,
    @InjectRepository(Cryptocurrency)
    private readonly cryptoRepo: Repository<Cryptocurrency>,
    @InjectRepository(PriceHistory)
    private readonly priceHistoryRepo: Repository<PriceHistory>,
  ) {}

  async getDashboard(userId: string): Promise<DashboardSummaryDto> {
    const portfolioIds = await this.resolvePortfolioIds(userId);

    // portfolios + transactions in parallel
    const [portfolios, allTx, allHoldings] = await Promise.all([
      this.portfolioRepository.find({ where: { userId, isActive: true } }),
      this.fetchTransactions(portfolioIds, null),
      this.holdingRepository
        .createQueryBuilder('h')
        .leftJoinAndSelect('h.cryptocurrency', 'c')
        .where('h.portfolioId IN (:...ids)', { ids: portfolioIds })
        .andWhere('h.quantity > 0')
        .getMany(),
    ]);

    // unique assets
    const uniqueSymbols = new Set(
      allHoldings.map((h) => h.cryptocurrency.symbol),
    );

    // totals
    const totalCurrentValue = allHoldings.reduce(
      (s, h) => s + Number(h.cryptocurrency.currentPrice) * Number(h.quantity),
      0,
    );
    const totalInvested = allTx
      .filter((t) => t.type === TransactionType.BUY)
      .reduce((s, t) => s + Number(t.totalAmount) + Number(t.feeAmount), 0);
    const totalWithdrawn = allTx
      .filter((t) => t.type === TransactionType.SELL)
      .reduce((s, t) => s + Number(t.totalAmount) - Number(t.feeAmount), 0);
    const netInvested = totalInvested - totalWithdrawn;
    const totalPL = totalCurrentValue - netInvested;
    const totalRoi = netInvested > 0 ? (totalPL / netInvested) * 100 : 0;

    // best / worst performer by 24h change across held cryptos
    let bestSymbol = '';
    let bestChange = -Infinity;
    let worstSymbol = '';
    let worstChange = Infinity;

    for (const h of allHoldings) {
      const c = h.cryptocurrency;
      const chg = Number(c.priceChangePercentage24h);
      if (chg > bestChange) {
        bestChange = chg;
        bestSymbol = c.symbol;
      }
      if (chg < worstChange) {
        worstChange = chg;
        worstSymbol = c.symbol;
      }
    }

    return {
      totalPortfolios: portfolios.length,
      totalTransactions: allTx.length,
      uniqueAssets: uniqueSymbols.size,
      totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
      totalInvested: Math.round(netInvested * 100) / 100,
      totalProfitLoss: Math.round(totalPL * 100) / 100,
      totalRoiPercentage: Math.round(totalRoi * 100) / 100,
      bestPerformerSymbol: bestSymbol,
      bestPerformerChange24h:
        bestChange === -Infinity ? 0 : Math.round(bestChange * 100) / 100,
      worstPerformerSymbol: worstSymbol,
      worstPerformerChange24h:
        worstChange === Infinity ? 0 : Math.round(worstChange * 100) / 100,
    };
  }

  async getRoi(
    userId: string,
    range: string,
    portfolioId?: string,
  ): Promise<RoiSummaryDto> {
    const portfolioIds = await this.resolvePortfolioIds(userId, portfolioId);
    // For ROI we always need ALL transactions to compute invested capital correctly;
    // we only slice the *output* dataPoints to the requested range.
    const allTx = await this.fetchTransactions(portfolioIds, null);

    if (allTx.length === 0) {
      return {
        totalInvested: 0,
        currentValue: 0,
        totalProfitLoss: 0,
        totalRoiPercentage: 0,
        annualisedReturn: 0,
        firstTransactionDate: null,
        dataPoints: [],
      };
    }

    // ── current value from live holdings ──
    const holdings = await this.holdingRepository.find({
      where: {
        portfolioId: portfolioIds.length === 1 ? portfolioIds[0] : undefined,
      },
      relations: ['cryptocurrency'],
    });
    // If multiple portfolios, fetch all holdings for those IDs via query builder
    let allHoldings: PortfolioHolding[];
    if (portfolioIds.length === 1) {
      allHoldings = holdings;
    } else {
      allHoldings = await this.holdingRepository
        .createQueryBuilder('h')
        .leftJoinAndSelect('h.cryptocurrency', 'c')
        .where('h.portfolioId IN (:...ids)', { ids: portfolioIds })
        .getMany();
    }

    const currentValue = allHoldings.reduce(
      (sum, h) =>
        sum + Number(h.cryptocurrency.currentPrice) * Number(h.quantity),
      0,
    );

    // ── group transactions by day ──
    const dayBuckets = new Map<
      string,
      { buyAmt: number; sellAmt: number; fees: number }
    >();
    for (const tx of allTx) {
      const key = tx.transactionDate.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!dayBuckets.has(key)) {
        dayBuckets.set(key, { buyAmt: 0, sellAmt: 0, fees: 0 });
      }
      const bucket = dayBuckets.get(key)!;
      const amt = Number(tx.totalAmount);
      const fee = Number(tx.feeAmount);
      if (tx.type === TransactionType.BUY) {
        bucket.buyAmt += amt + fee;
      } else {
        bucket.sellAmt += amt - fee; // net proceeds
      }
      bucket.fees += fee;
    }

    // Sort days ascending
    const sortedDays = [...dayBuckets.keys()].sort();

    // Build cumulative dataPoints
    let cumulativeInvested = 0;
    const allDataPoints: {
      date: Date;
      investedCapital: number;
      portfolioValue: number;
      roiPercentage: number;
    }[] = [];

    for (const day of sortedDays) {
      const { buyAmt, sellAmt } = dayBuckets.get(day)!;
      cumulativeInvested += buyAmt - sellAmt; // net capital in play
      // We cannot replay historical portfolio value without historical prices for every holding
      // on every day, so we approximate: scale currentValue by (cumulativeInvested / totalInvested)
      // This is a common lightweight heuristic; a full replay would need price_history joins.
      const totalInvested = allTx
        .filter((t) => t.type === TransactionType.BUY)
        .reduce((s, t) => s + Number(t.totalAmount) + Number(t.feeAmount), 0);
      const ratio = totalInvested > 0 ? cumulativeInvested / totalInvested : 0;
      const estValue = currentValue * ratio;
      const roi =
        cumulativeInvested > 0
          ? ((estValue - cumulativeInvested) / cumulativeInvested) * 100
          : 0;

      allDataPoints.push({
        date: new Date(day + 'T00:00:00.000Z'),
        investedCapital: Math.round(cumulativeInvested * 100) / 100,
        portfolioValue: Math.round(estValue * 100) / 100,
        roiPercentage: Math.round(roi * 100) / 100,
      });
    }

    // Slice dataPoints to range
    const rangeStart = this.startDate(range);
    const dataPoints = rangeStart
      ? allDataPoints.filter((dp) => dp.date >= rangeStart)
      : allDataPoints;

    // ── totals ──
    const totalInvested = allTx
      .filter((t) => t.type === TransactionType.BUY)
      .reduce((s, t) => s + Number(t.totalAmount) + Number(t.feeAmount), 0);
    const totalWithdrawn = allTx
      .filter((t) => t.type === TransactionType.SELL)
      .reduce((s, t) => s + Number(t.totalAmount) - Number(t.feeAmount), 0);
    const netInvested = totalInvested - totalWithdrawn;
    const totalProfitLoss = currentValue - netInvested;
    const totalRoi =
      netInvested > 0 ? (totalProfitLoss / netInvested) * 100 : 0;

    // Annualised return (simple): roi × (365 / holdingDays)
    const firstTxDate = new Date(allTx[0].transactionDate);
    const holdingDays = Math.max(
      1,
      (Date.now() - firstTxDate.getTime()) / 86_400_000,
    );
    const annualised = totalRoi * (365 / holdingDays);

    return {
      totalInvested: Math.round(netInvested * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      totalProfitLoss: Math.round(totalProfitLoss * 100) / 100,
      totalRoiPercentage: Math.round(totalRoi * 100) / 100,
      annualisedReturn: Math.round(annualised * 100) / 100,
      firstTransactionDate: firstTxDate,
      dataPoints,
    };
  }

  async getAllocation(
    userId: string,
    portfolioId?: string,
  ): Promise<AssetAllocationItemDto[]> {
    const portfolioIds = await this.resolvePortfolioIds(userId, portfolioId);

    const holdings = await this.holdingRepository
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.cryptocurrency', 'c')
      .where('h.portfolioId IN (:...ids)', { ids: portfolioIds })
      .andWhere('h.quantity > 0')
      .getMany();

    // Aggregate holdings across portfolios for the same crypto
    const map = new Map<
      string,
      {
        symbol: string;
        name: string;
        quantity: number;
        totalCost: number;
        profitLoss: number;
        currentValue: number;
      }
    >();
    for (const h of holdings) {
      const sym = h.cryptocurrency.symbol;
      const price = Number(h.cryptocurrency.currentPrice);
      const qty = Number(h.quantity);
      const cv = price * qty;

      if (map.has(sym)) {
        const agg = map.get(sym)!;
        agg.quantity += qty;
        agg.totalCost += Number(h.totalCost);
        agg.currentValue += cv;
        agg.profitLoss += Number(h.profitLoss);
      } else {
        map.set(sym, {
          symbol: sym,
          name: h.cryptocurrency.name,
          quantity: qty,
          totalCost: Number(h.totalCost),
          currentValue: cv,
          profitLoss: Number(h.profitLoss),
        });
      }
    }

    const totalValue = [...map.values()].reduce(
      (s, v) => s + v.currentValue,
      0,
    );

    return [...map.values()]
      .sort((a, b) => b.currentValue - a.currentValue)
      .map((item) => ({
        symbol: item.symbol as any,
        name: item.name,
        quantity: Math.round(item.quantity * 1e8) / 1e8,
        currentValue: Math.round(item.currentValue * 100) / 100,
        allocationPercentage:
          totalValue > 0
            ? Math.round((item.currentValue / totalValue) * 10000) / 100
            : 0,
        totalCost: Math.round(item.totalCost * 100) / 100,
        profitLoss: Math.round(item.profitLoss * 100) / 100,
        profitLossPercentage:
          item.totalCost > 0
            ? Math.round((item.profitLoss / item.totalCost) * 10000) / 100
            : 0,
      }));
  }

  async getPerformance(
    userId: string,
    limit: number,
    portfolioId?: string,
  ): Promise<PerformanceSummaryDto> {
    const allocation = await this.getAllocation(userId, portfolioId);

    // ROI per holding = profitLoss / totalCost × 100
    const ranked = allocation
      .filter((a) => a.totalCost > 0)
      .map((a) => ({
        symbol: a.symbol as unknown as string,
        name: a.name,
        roiPercentage: a.profitLossPercentage,
        profitLoss: a.profitLoss,
        totalCost: a.totalCost,
        currentValue: a.currentValue,
      }))
      .sort((a, b) => b.roiPercentage - a.roiPercentage);

    return {
      topPerformers: ranked.slice(0, limit),
      bottomPerformers: [...ranked].reverse().slice(0, limit),
    };
  }

  async getTransactionHistory(
    userId: string,
    range: string,
    portfolioId?: string,
  ): Promise<TransactionHistoryPointDto[]> {
    const portfolioIds = await this.resolvePortfolioIds(userId, portfolioId);
    const start = this.startDate(range);
    const txs = await this.fetchTransactions(portfolioIds, start);

    // Bucket by day
    const buckets = new Map<
      string,
      { buyAmount: number; sellAmount: number; totalFees: number }
    >();
    for (const tx of txs) {
      const key = tx.transactionDate.toISOString().slice(0, 10);
      if (!buckets.has(key))
        buckets.set(key, { buyAmount: 0, sellAmount: 0, totalFees: 0 });
      const b = buckets.get(key)!;
      if (tx.type === TransactionType.BUY) {
        b.buyAmount += Number(tx.totalAmount);
      } else {
        b.sellAmount += Number(tx.totalAmount);
      }
      b.totalFees += Number(tx.feeAmount);
    }

    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, vals]) => ({
        date: new Date(day + 'T00:00:00.000Z'),
        buyAmount: Math.round(vals.buyAmount * 100) / 100,
        sellAmount: Math.round(vals.sellAmount * 100) / 100,
        totalFees: Math.round(vals.totalFees * 100) / 100,
      }));
  }

  async getFees(
    userId: string,
    range: string,
    portfolioId?: string,
  ): Promise<FeeSummaryDto> {
    const portfolioIds = await this.resolvePortfolioIds(userId, portfolioId);
    const start = this.startDate(range);
    const txs = await this.fetchTransactions(portfolioIds, start);

    const totalFees = txs.reduce((s, t) => s + Number(t.feeAmount), 0);
    const totalInvested = txs
      .filter((t) => t.type === TransactionType.BUY)
      .reduce((s, t) => s + Number(t.totalAmount) + Number(t.feeAmount), 0);

    return {
      totalFees: Math.round(totalFees * 100) / 100,
      averageFeePerTransaction:
        txs.length > 0 ? Math.round((totalFees / txs.length) * 100) / 100 : 0,
      transactionCount: txs.length,
      feeToInvestedRatio:
        totalInvested > 0
          ? Math.round((totalFees / totalInvested) * 10000) / 100
          : 0,
    };
  }

  /** Returns a Date for the start of the requested range, or null for "all" */
  private startDate(range: string): Date | null {
    const days = RANGE_DAYS[range];
    if (days === null || days === undefined) return null;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }

  /** Resolve the list of portfolio IDs that belong to userId, optionally filtered to one */
  private async resolvePortfolioIds(
    userId: string,
    portfolioId?: string,
  ): Promise<string[]> {
    if (portfolioId) return [portfolioId];
    const portfolios = await this.portfolioRepository.find({
      where: { userId, isActive: true },
      select: ['id'],
    });
    return portfolios.map((p) => p.id);
  }

  /** Fetch all transactions for the given portfolios, optionally bounded by start date */
  private async fetchTransactions(
    portfolioIds: string[],
    start: Date | null,
  ): Promise<Transaction[]> {
    const qb = this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.cryptocurrency', 'crypto')
      .where('tx.portfolioId IN (:...ids)', { ids: portfolioIds })
      .orderBy('tx.transactionDate', 'ASC');

    if (start) qb.andWhere('tx.transactionDate >= :start', { start });

    return qb.getMany();
  }
}
