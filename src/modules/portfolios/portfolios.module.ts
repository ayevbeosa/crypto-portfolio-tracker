import { Module } from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { Portfolio } from '../../database/entities/portfolio.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioHolding } from '../../database/entities/portfolio-holding.entity';
import { Cryptocurrency } from '../../database/entities/cryptocurrency.entity';
import { PortfoliosController } from './portfolios.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cryptocurrency, Portfolio, PortfolioHolding]),
  ],
  providers: [PortfoliosService],
  exports: [PortfoliosService],
  controllers: [PortfoliosController],
})
export class PortfoliosModule {}
