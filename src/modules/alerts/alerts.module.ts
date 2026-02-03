import { forwardRef, Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from '@/database/entities/alert.entity';
import { Cryptocurrency } from '@/database/entities/cryptocurrency.entity';
import { CryptoModule } from '../crypto/crypto.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { AlertsMonitorService } from './alerts-monitor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert, Cryptocurrency]),
    CryptoModule,
    forwardRef(() => WebsocketModule),
  ],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsMonitorService],
  exports: [AlertsService, AlertsMonitorService],
})
export class AlertsModule {}
