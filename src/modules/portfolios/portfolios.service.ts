import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Portfolio } from '../../database/entities/portfolio.entity';
import { Repository } from 'typeorm';
import { PortfolioHolding } from '../../database/entities/portfolio-holding.entity';
import { Cryptocurrency } from '../../database/entities/cryptocurrency.entity';
import { CreatePortfolioDto } from './dtos/create-portfolio.dto';
import { PortfolioResponseDto } from './dtos/portfolio-response.dto';
import { UpdatePortfolioDto } from './dtos/update-portfolio.dto';

@Injectable()
export class PortfoliosService {
  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    @InjectRepository(PortfolioHolding)
    private readonly holdingRepository: Repository<PortfolioHolding>,
    @InjectRepository(Cryptocurrency)
    private readonly cryptocurrencyRepository: Repository<Cryptocurrency>,
  ) {}

  async create(
    userId: string,
    createPortfolioDto: CreatePortfolioDto,
  ): Promise<Portfolio> {
    const portfolio = this.portfolioRepository.create({
      ...createPortfolioDto,
      userId,
    });

    return this.portfolioRepository.save(portfolio);
  }

  async findAll(userId: string): Promise<Portfolio[]> {
    return this.portfolioRepository.find({
      where: { userId, isActive: true },
      relations: ['holdings', 'holdings.cryptocurrency'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id, userId },
      relations: ['holdings', 'holdings.cryptocurrency', 'transactions'],
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    return portfolio;
  }

  async findOneWithCalculations(
    id: string,
    userId: string,
  ): Promise<PortfolioResponseDto> {
    const portfolio = await this.findOne(id, userId);

    // Calculate holdings with current prices
    const holdingsWithCalculations = await Promise.all(
      portfolio.holdings.map(async (holding) => {
        const crypto = holding.cryptocurrency;
        const currentPrice = parseFloat(crypto.currentPrice.toString());
        const quantity = parseFloat(holding.quantity.toString());
        const averageBuyPrice = parseFloat(holding.averageBuyPrice.toString());
        const totalCost = parseFloat(holding.totalCost.toString());

        const currentValue = quantity * currentPrice;
        const profitLoss = currentValue - totalCost;
        const profitLossPercentage =
          totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

        return {
          id: holding.id,
          symbol: crypto.symbol,
          name: crypto.name,
          quantity,
          averageBuyPrice,
          totalCost,
          currentValue,
          currentPrice,
          profitLoss,
          profitLossPercentage,
        };
      }),
    );

    // Calculate portfolio totals
    const totalValue = holdingsWithCalculations.reduce(
      (sum, h) => sum + h.currentValue,
      0,
    );
    const totalCost = holdingsWithCalculations.reduce(
      (sum, h) => sum + h.totalCost,
      0,
    );
    const totalProfitLoss = totalValue - totalCost;
    const totalProfitLossPercentage =
      totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

    return {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      totalValue,
      totalCost,
      totalProfitLoss,
      totalProfitLossPercentage,
      isActive: portfolio.isActive,
      holdings: holdingsWithCalculations,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
    };
  }

  async update(
    id: string,
    userId: string,
    updatePortfolioDto: UpdatePortfolioDto,
  ): Promise<Portfolio> {
    const portfolio = await this.findOne(id, userId);

    Object.assign(portfolio, updatePortfolioDto);

    return this.portfolioRepository.save(portfolio);
  }

  async remove(id: string, userId: string): Promise<void> {
    const portfolio = await this.findOne(id, userId);

    // Soft delete by setting isActive to false
    portfolio.isActive = false;
    await this.portfolioRepository.save(portfolio);
  }

  async updateHoldings(portfolioId: string): Promise<void> {
    // This will be called after transactions to recalculate holdings
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId },
      relations: ['transactions', 'transactions.cryptocurrency'],
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    // Group transactions by cryptocurrency
    const transactionsByCrypto = new Map<string, any[]>();

    for (const transaction of portfolio.transactions) {
      const cryptoId = transaction.cryptoId;
      if (!transactionsByCrypto.has(cryptoId)) {
        transactionsByCrypto.set(cryptoId, []);
      }
      transactionsByCrypto.get(cryptoId)!.push(transaction);
    }

    // Calculate holdings for each cryptocurrency
    for (const [cryptoId, transactions] of transactionsByCrypto.entries()) {
      let totalQuantity = 0;
      let totalCost = 0;
      let totalBuyQuantity = 0;

      for (const transaction of transactions) {
        const quantity = parseFloat(transaction.quantity.toString());
        const pricePerUnit = parseFloat(transaction.pricePerUnit.toString());
        const feeAmount = parseFloat(transaction.feeAmount.toString() || '0');

        if (transaction.type === 'BUY') {
          totalQuantity += quantity;
          totalBuyQuantity += quantity;
          totalCost += quantity * pricePerUnit + feeAmount;
        } else {
          // SELL
          totalQuantity -= quantity;
          // For sells, reduce cost proportionally
          const sellRatio = quantity / totalQuantity;
          totalCost -= totalCost * sellRatio;
        }
      }

      // Only create/update holding if quantity > 0
      if (totalQuantity > 0) {
        const averageBuyPrice =
          totalBuyQuantity > 0 ? totalCost / totalBuyQuantity : 0;

        // Find or create holding
        let holding = await this.holdingRepository.findOne({
          where: { portfolioId, cryptoId },
        });

        if (!holding) {
          holding = this.holdingRepository.create({
            portfolioId,
            cryptoId,
          });
        }

        holding.quantity = totalQuantity;
        holding.averageBuyPrice = averageBuyPrice;
        holding.totalCost = totalCost;

        await this.holdingRepository.save(holding);
      } else {
        // Remove holding if quantity is 0
        await this.holdingRepository.delete({ portfolioId, cryptoId });
      }
    }

    // Update portfolio totals
    await this.updatePortfolioTotals(portfolioId);
  }

  async updatePortfolioTotals(portfolioId: string): Promise<void> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId },
      relations: ['holdings', 'holdings.cryptocurrency'],
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    let totalValue = 0;
    let totalCost = 0;

    for (const holding of portfolio.holdings) {
      const currentPrice = parseFloat(
        holding.cryptocurrency.currentPrice.toString(),
      );
      const quantity = parseFloat(holding.quantity.toString());
      const cost = parseFloat(holding.totalCost.toString());

      totalValue += quantity * currentPrice;
      totalCost += cost;
    }

    const totalProfitLoss = totalValue - totalCost;
    const totalProfitLossPercentage =
      totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

    portfolio.totalValue = totalValue;
    portfolio.totalCost = totalCost;
    portfolio.totalProfitLoss = totalProfitLoss;
    portfolio.totalProfitLossPercentage = totalProfitLossPercentage;

    await this.portfolioRepository.save(portfolio);
  }

  async verifyOwnership(portfolioId: string, userId: string): Promise<boolean> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId, userId },
    });

    return !!portfolio;
  }
}
