import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../../database/entities/transaction.entity';
import { PortfoliosModule } from '../portfolios/portfolios.module';
import { Cryptocurrency } from '../../database/entities/cryptocurrency.entity';
import { TransactionsController } from './transactions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cryptocurrency, Transaction]),
    PortfoliosModule,
  ],
  providers: [TransactionsService],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}
