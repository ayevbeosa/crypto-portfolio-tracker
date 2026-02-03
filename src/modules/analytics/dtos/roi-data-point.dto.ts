import { ApiProperty } from '@nestjs/swagger';

export class RoiDataPointDto {
  @ApiProperty({ example: '2026-02-03T00:00:00.000Z' })
  date: Date;

  /** cumulative invested capital at that moment (sum of BUY totalAmount + feeAmount) */
  @ApiProperty({ example: 40000 })
  investedCapital: number;

  /** estimated portfolio market-value at that moment */
  @ApiProperty({ example: 43500 })
  portfolioValue: number;

  /** (portfolioValue - investedCapital) / investedCapital × 100 */
  @ApiProperty({ example: 8.75 })
  roiPercentage: number;
}
