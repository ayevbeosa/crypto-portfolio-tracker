import { Module } from '@nestjs/common';
import { CryptoService } from './crypto-service';
import { CryptoPriceSchedulerService } from './crypto-price-scheduler.service';
import { CryptoController } from './crypto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cryptocurrency } from '@/database/entities/cryptocurrency.entity';
import { PriceHistory } from '@/database/entities/price-history.entity';
import { CoinGeckoService } from './coin-gecko.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cryptocurrency, PriceHistory]),
    HttpModule,
  ],
  controllers: [CryptoController],
  providers: [CryptoService, CryptoPriceSchedulerService, CoinGeckoService],
  exports: [CryptoService, CoinGeckoService, CryptoPriceSchedulerService],
})
export class CryptoModule {}
