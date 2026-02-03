import { ApiProperty } from '@nestjs/swagger';

export class PerformanceItemDto {
  @ApiProperty({ example: 'BTC' })
  symbol: string;

  @ApiProperty({ example: 'Bitcoin' })
  name: string;

  @ApiProperty({ example: 15.3 })
  roiPercentage: number;

  @ApiProperty({ example: 3500 })
  profitLoss: number;

  @ApiProperty({ example: 22800 })
  totalCost: number;

  @ApiProperty({ example: 26300 })
  currentValue: number;
}
