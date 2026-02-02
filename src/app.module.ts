import { Module, OnModuleInit } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import {
  appConfig,
  coinGeckoConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  throttleConfig,
} from './config/configuration';
import * as redisStore from 'cache-manager-redis-store';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HealthModule } from './modules/health/health.module';
import { PortfoliosModule } from './modules/portfolios/portfolios.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { CryptoModule } from './modules/crypto/crypto.module';
import { WebsocketModule } from './modules/websocket/websocket.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        databaseConfig,
        redisConfig,
        jwtConfig,
        appConfig,
        coinGeckoConfig,
        throttleConfig,
      ],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: redisStore,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT!, 10) || 6379,
        ttl: parseInt(process.env.REDIS_TTL!, 10) || 3600,
      }),
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          ttl: parseInt(process.env.THROTTLE_TTL!, 10) || 60000,
          limit: parseInt(process.env.THROTTLE_LIMIT!, 10) || 100,
        },
      ],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    UsersModule,
    AuthModule,
    HealthModule,
    PortfoliosModule,
    TransactionsModule,
    CryptoModule,
    WebsocketModule,
  ],
  providers: [
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global Filters
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly cryptoPriceScheduler: any, // CryptoPriceScheduler
    private readonly webSocketService: any, // WebSocketService
  ) {}

  onModuleInit() {
    // Wire WebSocket service to crypto price scheduler to avoid circular dependency
    if (this.cryptoPriceScheduler && this.webSocketService) {
      this.cryptoPriceScheduler.setWebSocketService(this.webSocketService);
    }
  }
}
