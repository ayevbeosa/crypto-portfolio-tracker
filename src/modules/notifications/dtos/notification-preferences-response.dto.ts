import { ApiProperty } from '@nestjs/swagger';

export class NotificationPreferencesResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  emailEnabled: boolean;

  @ApiProperty()
  smsEnabled: boolean;

  @ApiProperty()
  pushEnabled: boolean;

  @ApiProperty()
  websocketEnabled: boolean;

  @ApiProperty({ required: false })
  phoneNumber?: string;

  @ApiProperty({ type: [String], required: false })
  pushTokens?: string[];

  @ApiProperty()
  priceAlerts: boolean;

  @ApiProperty()
  portfolioUpdates: boolean;

  @ApiProperty()
  marketNews: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
