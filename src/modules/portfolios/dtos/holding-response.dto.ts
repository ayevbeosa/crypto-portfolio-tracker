import { ApiProperty } from '@nestjs/swagger';

export class HoldingResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'BTC' })
  symbol: string;

  @ApiProperty({ example: 'Bitcoin' })
  name: string;

  @ApiProperty({ example: 0.5 })
  quantity: number;

  @ApiProperty({ example: 30000 })
  averageBuyPrice: number;

  @ApiProperty({ example: 15000 })
  totalCost: number;

  @ApiProperty({ example: 22500 })
  currentValue: number;

  @ApiProperty({ example: 45000 })
  currentPrice: number;

  @ApiProperty({ example: 7500 })
  profitLoss: number;

  @ApiProperty({ example: 50 })
  profitLossPercentage: number;
}
