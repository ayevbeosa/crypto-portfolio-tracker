import { ApiProperty } from '@nestjs/swagger';

export class AssetAllocationItemDto {
  @ApiProperty({ example: 'BTC' })
  symbol: number;

  @ApiProperty({ example: 'Bitcoin' })
  name: string;

  @ApiProperty({ example: 0.75 })
  quantity: number;

  @ApiProperty({ example: 33750 })
  currentValue: number;

  @ApiProperty({
    example: 61.36,
    description: 'Percentage of total portfolio value',
  })
  allocationPercentage: number;

  @ApiProperty({ example: 30000 })
  totalCost: number;

  @ApiProperty({ example: 3750 })
  profitLoss: number;

  @ApiProperty({ example: 12.5 })
  profitLossPercentage: number;
}
