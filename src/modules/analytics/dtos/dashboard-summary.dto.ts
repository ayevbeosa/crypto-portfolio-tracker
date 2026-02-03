import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryDto {
  @ApiProperty({ example: 3 })
  totalPortfolios: number;

  @ApiProperty({ example: 42 })
  totalTransactions: number;

  @ApiProperty({ example: 7 })
  uniqueAssets: number;

  @ApiProperty({ example: 55200 })
  totalCurrentValue: number;

  @ApiProperty({ example: 48000 })
  totalInvested: number;

  @ApiProperty({ example: 7200 })
  totalProfitLoss: number;

  @ApiProperty({ example: 15.0 })
  totalRoiPercentage: number;

  @ApiProperty({
    example: 'BTC',
    description: 'Symbol of the best performing holding today',
  })
  bestPerformerSymbol: string;

  @ApiProperty({
    example: 4.2,
    description: '24 h % change of the best performer',
  })
  bestPerformerChange24h: number;

  @ApiProperty({ example: 'SOL' })
  worstPerformerSymbol: string;

  @ApiProperty({ example: -1.8 })
  worstPerformerChange24h: number;
}
