import { AlertCondition, AlertStatus } from '@/database/entities/alert.entity';
import { ApiProperty } from '@nestjs/swagger';

export class AlertResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'BTC' })
  cryptoSymbol: string;

  @ApiProperty({ example: 'Bitcoin' })
  cryptoName: string;

  @ApiProperty({ enum: AlertCondition, example: AlertCondition.ABOVE })
  condition: AlertCondition;

  @ApiProperty({ example: 50000 })
  targetPrice: number;

  @ApiProperty({ example: 45000 })
  currentPrice: number;

  @ApiProperty({ enum: AlertStatus, example: AlertStatus.ACTIVE })
  status: AlertStatus;

  @ApiProperty({ example: 'Notify me when BTC reaches $50,000' })
  message: string;

  @ApiProperty({ example: '2026-02-02T10:30:00.000Z', required: false })
  triggeredAt?: Date;

  @ApiProperty({ example: '2026-02-02T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-02T10:30:00.000Z' })
  updatedAt: Date;
}
