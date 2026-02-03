import { ApiProperty } from '@nestjs/swagger';
import { RoiDataPointDto } from './roi-data-point.dto';

export class RoiSummaryDto {
  @ApiProperty({ example: 50000 })
  totalInvested: number;

  @ApiProperty({ example: 55200 })
  currentValue: number;

  @ApiProperty({ example: 5200 })
  totalProfitLoss: number;

  @ApiProperty({ example: 10.4 })
  totalRoiPercentage: number;

  @ApiProperty({ example: 12.2, description: 'Annualised return (simple)' })
  annualisedReturn: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  firstTransactionDate: Date | null;

  @ApiProperty({ type: [RoiDataPointDto] })
  dataPoints: RoiDataPointDto[];
}
