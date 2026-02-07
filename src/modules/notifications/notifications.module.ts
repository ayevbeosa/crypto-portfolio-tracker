import { NotificationPreferences } from '@/database/entities/notification-preferences.entity';
import { User } from '@/database/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { PushService } from './push.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationPreferences, User])],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, SmsService, PushService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
