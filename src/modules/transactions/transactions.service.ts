import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Transaction,
  TransactionType,
} from '../../database/entities/transaction.entity';
import { Repository } from 'typeorm';
import { Cryptocurrency } from '../../database/entities/cryptocurrency.entity';
import { PortfoliosService } from '../portfolios/portfolios.service';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { UpdateTransactionDto } from './dtos/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Cryptocurrency)
    private readonly cryptoRepository: Repository<Cryptocurrency>,
    private readonly portfoliosService: PortfoliosService,
  ) {}

  async create(
    userId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const {
      portfolioId,
      cryptoSymbol,
      quantity,
      pricePerUnit,
      feeAmount,
      type,
    } = createTransactionDto;

    // Verify portfolio ownership
    const hasAccess = await this.portfoliosService.verifyOwnership(
      portfolioId,
      userId,
    );
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this portfolio');
    }

    // Find cryptocurrency
    const crypto = await this.cryptoRepository.findOne({
      where: { symbol: cryptoSymbol.toUpperCase() },
    });

    if (!crypto) {
      throw new NotFoundException(`Cryptocurrency ${cryptoSymbol} not found`);
    }

    // Calculate total amount
    const totalAmount = quantity * pricePerUnit + (feeAmount || 0);

    // Create transaction
    const transaction = this.transactionRepository.create({
      portfolioId,
      cryptoId: crypto.id,
      type,
      quantity,
      pricePerUnit,
      totalAmount,
      feeAmount: feeAmount || 0,
      notes: createTransactionDto.notes,
      transactionDate: new Date(createTransactionDto.transactionDate),
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Update portfolio holdings
    await this.portfoliosService.updateHoldings(portfolioId);

    return savedTransaction;
  }

  async findAll(userId: string, portfolioId?: string): Promise<Transaction[]> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.portfolio', 'portfolio')
      .leftJoinAndSelect('transaction.cryptocurrency', 'cryptocurrency')
      .where('portfolio.userId = :userId', { userId })
      .orderBy('transaction.transactionDate', 'DESC');

    if (portfolioId) {
      queryBuilder.andWhere('transaction.portfolioId = :portfolioId', {
        portfolioId,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['portfolio', 'cryptocurrency'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify ownership
    if (transaction.portfolio.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this transaction',
      );
    }

    return transaction;
  }

  async update(
    id: string,
    userId: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findOne(id, userId);

    // If cryptoSymbol is being updated, find the new crypto
    if (updateTransactionDto.cryptoSymbol) {
      const crypto = await this.cryptoRepository.findOne({
        where: { symbol: updateTransactionDto.cryptoSymbol.toUpperCase() },
      });

      if (!crypto) {
        throw new NotFoundException(
          `Cryptocurrency ${updateTransactionDto.cryptoSymbol} not found`,
        );
      }

      transaction.cryptoId = crypto.id;
    }

    // Update other fields
    if (updateTransactionDto.type !== undefined) {
      transaction.type = updateTransactionDto.type;
    }
    if (updateTransactionDto.quantity !== undefined) {
      transaction.quantity = updateTransactionDto.quantity;
    }
    if (updateTransactionDto.pricePerUnit !== undefined) {
      transaction.pricePerUnit = updateTransactionDto.pricePerUnit;
    }
    if (updateTransactionDto.feeAmount !== undefined) {
      transaction.feeAmount = updateTransactionDto.feeAmount;
    }
    if (updateTransactionDto.notes !== undefined) {
      transaction.notes = updateTransactionDto.notes;
    }
    if (updateTransactionDto.transactionDate !== undefined) {
      transaction.transactionDate = new Date(
        updateTransactionDto.transactionDate,
      );
    }

    // Recalculate total amount
    const quantity = parseFloat(transaction.quantity.toString());
    const pricePerUnit = parseFloat(transaction.pricePerUnit.toString());
    const feeAmount = parseFloat(transaction.feeAmount.toString());
    transaction.totalAmount = quantity * pricePerUnit + feeAmount;

    const updatedTransaction =
      await this.transactionRepository.save(transaction);

    // Update portfolio holdings
    await this.portfoliosService.updateHoldings(transaction.portfolioId);

    return updatedTransaction;
  }

  async remove(id: string, userId: string): Promise<void> {
    const transaction = await this.findOne(id, userId);
    const portfolioId = transaction.portfolioId;

    await this.transactionRepository.remove(transaction);

    // Update portfolio holdings
    await this.portfoliosService.updateHoldings(portfolioId);
  }

  async findByPortfolio(
    portfolioId: string,
    userId: string,
  ): Promise<Transaction[]> {
    // Verify portfolio ownership
    const hasAccess = await this.portfoliosService.verifyOwnership(
      portfolioId,
      userId,
    );
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this portfolio');
    }

    return this.transactionRepository.find({
      where: { portfolioId },
      relations: ['cryptocurrency'],
      order: { transactionDate: 'DESC' },
    });
  }

  async getTransactionStats(portfolioId: string, userId: string) {
    // Verify portfolio ownership
    const hasAccess = await this.portfoliosService.verifyOwnership(
      portfolioId,
      userId,
    );
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this portfolio');
    }

    const transactions = await this.transactionRepository.find({
      where: { portfolioId },
      relations: ['cryptocurrency'],
    });

    const stats = {
      totalTransactions: transactions.length,
      totalBuys: 0,
      totalSells: 0,
      totalBuyAmount: 0,
      totalSellAmount: 0,
      totalFees: 0,
      cryptocurrencies: new Set<string>(),
    };

    for (const transaction of transactions) {
      const amount = parseFloat(transaction.totalAmount.toString());
      const fee = parseFloat(transaction.feeAmount.toString());

      stats.totalFees += fee;
      stats.cryptocurrencies.add(transaction.cryptocurrency.symbol);

      if (transaction.type === TransactionType.BUY) {
        stats.totalBuys++;
        stats.totalBuyAmount += amount;
      } else {
        stats.totalSells++;
        stats.totalSellAmount += amount;
      }
    }

    return {
      ...stats,
      totalCryptocurrencies: stats.cryptocurrencies.size,
      cryptocurrencies: Array.from(stats.cryptocurrencies),
    };
  }
}
