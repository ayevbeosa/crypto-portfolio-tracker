import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '@/database/entities/transaction.entity';
import { Portfolio } from '@/database/entities/portfolio.entity';
import { PortfolioHolding } from '@/database/entities/portfolio-holding.entity';
import { Cryptocurrency } from '@/database/entities/cryptocurrency.entity';
import { PriceHistory } from '@/database/entities/price-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      Portfolio,
      PortfolioHolding,
      Cryptocurrency,
      PriceHistory,
    ]),
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
