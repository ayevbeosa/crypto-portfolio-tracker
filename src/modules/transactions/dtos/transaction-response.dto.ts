import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '../../../database/entities/transaction.entity';

export class TransactionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.BUY })
  type: TransactionType;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  portfolioId: string;

  @ApiProperty({ example: 'BTC' })
  cryptoSymbol: string;

  @ApiProperty({ example: 'Bitcoin' })
  cryptoName: string;

  @ApiProperty({ example: 0.5 })
  quantity: number;

  @ApiProperty({ example: 45000 })
  pricePerUnit: number;

  @ApiProperty({ example: 22500 })
  totalAmount: number;

  @ApiProperty({ example: 10 })
  feeAmount: number;

  @ApiProperty({ example: 'Bought during market dip' })
  notes: string;

  @ApiProperty({ example: '2024-01-29T10:30:00.000Z' })
  transactionDate: Date;

  @ApiProperty({ example: '2024-01-29T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-29T10:30:00.000Z' })
  updatedAt: Date;
}
