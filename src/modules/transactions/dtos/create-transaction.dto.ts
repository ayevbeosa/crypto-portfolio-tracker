import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { TransactionType } from '../../../database/entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Portfolio ID',
  })
  @IsUUID('4', { message: 'Invalid portfolio ID' })
  @IsNotEmpty({ message: 'Portfolio ID is required' })
  portfolioId: string;

  @ApiProperty({
    example: 'BTC',
    description: 'Cryptocurrency symbol',
  })
  @IsString()
  @IsNotEmpty({ message: 'Cryptocurrency symbol is required' })
  cryptoSymbol: string;

  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.BUY,
    description: 'Transaction type (BUY or SELL)',
  })
  @IsEnum(TransactionType, { message: 'Transaction type must be BUY or SELL' })
  @IsNotEmpty({ message: 'Transaction type is required' })
  type: TransactionType;

  @ApiProperty({
    example: 0.5,
    description: 'Quantity of cryptocurrency',
    minimum: 0.00000001,
  })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(0.00000001, { message: 'Quantity must be greater than 0' })
  @IsNotEmpty({ message: 'Quantity is required' })
  quantity: number;

  @ApiProperty({
    example: 45000,
    description: 'Price per unit in USD',
    minimum: 0,
  })
  @IsNumber({}, { message: 'Price per unit must be a number' })
  @Min(0, { message: 'Price per unit must be greater than or equal to 0' })
  @IsNotEmpty({ message: 'Price per unit is required' })
  pricePerUnit: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Transaction fee amount',
    minimum: 0,
  })
  @IsNumber({}, { message: 'Fee amount must be a number' })
  @Min(0, { message: 'Fee amount must be greater than or equal to 0' })
  @IsOptional()
  feeAmount?: number;

  @ApiPropertyOptional({
    example: 'Bought during market dip',
    description: 'Additional notes about the transaction',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: '2024-01-29T10:30:00.000Z',
    description: 'Transaction date and time',
  })
  @IsDateString({}, { message: 'Invalid date format' })
  @IsNotEmpty({ message: 'Transaction date is required' })
  transactionDate: string;
}
