import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Enable/disable email notifications' })
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable/disable SMS notifications' })
  @IsBoolean()
  @IsOptional()
  smsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable/disable push notifications' })
  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable WebSocket notifications',
  })
  @IsBoolean()
  @IsOptional()
  websocketEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Phone number for SMS (E.164 format)' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Push notification device tokens',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  pushTokens?: string[];

  @ApiPropertyOptional({ description: 'Receive price alert notifications' })
  @IsBoolean()
  @IsOptional()
  priceAlerts?: boolean;

  @ApiPropertyOptional({
    description: 'Receive portfolio update notifications',
  })
  @IsBoolean()
  @IsOptional()
  portfolioUpdates?: boolean;

  @ApiPropertyOptional({ description: 'Receive market news notifications' })
  @IsBoolean()
  @IsOptional()
  marketNews?: boolean;
}
