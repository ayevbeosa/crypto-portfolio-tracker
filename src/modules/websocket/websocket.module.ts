import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CryptoModule } from '../crypto/crypto.module';
import { WebsocketController } from './websocket.controller';
import { PriceGateway } from './price.gateway';
import { WebSocketService } from './websocket.service';

@Module({
  imports: [
    JwtModule.register({}), // Use config from AuthModule
    forwardRef(() => CryptoModule), // Forward ref to avoid circular dependency
  ],
  controllers: [WebsocketController],
  providers: [PriceGateway, WebSocketService],
  exports: [WebSocketService, PriceGateway],
})
export class WebsocketModule {}
