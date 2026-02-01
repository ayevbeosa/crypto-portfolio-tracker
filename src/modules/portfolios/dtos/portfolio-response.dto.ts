import { ApiProperty } from '@nestjs/swagger';
import { HoldingResponseDto } from './holding-response.dto';

export class PortfolioResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'My Crypto Portfolio' })
  name: string;

  @ApiProperty({ example: 'Long-term investment portfolio' })
  description: string;

  @ApiProperty({ example: 50000 })
  totalValue: number;

  @ApiProperty({ example: 40000 })
  totalCost: number;

  @ApiProperty({ example: 10000 })
  totalProfitLoss: number;

  @ApiProperty({ example: 25 })
  totalProfitLossPercentage: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: [HoldingResponseDto] })
  holdings: HoldingResponseDto[];

  @ApiProperty({ example: '2024-01-29T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-29T10:30:00.000Z' })
  updatedAt: Date;
}
