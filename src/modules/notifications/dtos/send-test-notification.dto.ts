import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SendTestNotificationDto {
  @ApiProperty({
    enum: ['email', 'sms', 'push'],
    description: 'Channel to test',
  })
  @IsString()
  channel: 'email' | 'sms' | 'push';

  @ApiPropertyOptional({ description: 'Custom test message' })
  @IsString()
  @IsOptional()
  message?: string;
}
