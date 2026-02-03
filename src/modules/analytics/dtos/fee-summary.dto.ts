import { ApiProperty } from '@nestjs/swagger';

export class FeeSummaryDto {
  @ApiProperty({ example: 125.5 })
  totalFees: number;

  @ApiProperty({ example: 2.98 })
  averageFeePerTransaction: number;

  @ApiProperty({ example: 42 })
  transactionCount: number;

  @ApiProperty({
    example: 0.23,
    description: 'Total fees as % of total invested capital',
  })
  feeToInvestedRatio: number;
}
