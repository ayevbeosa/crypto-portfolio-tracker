import { ApiProperty } from '@nestjs/swagger';

export class TransactionHistoryPointDto {
  @ApiProperty({ example: '2024-01-15T00:00:00.000Z' })
  date: Date;

  @ApiProperty({
    example: 5000,
    description: 'Total amount bought on this day',
  })
  buyAmount: number;

  @ApiProperty({ example: 2000, description: 'Total amount sold on this day' })
  sellAmount: number;

  @ApiProperty({ example: 45, description: 'Total fees paid on this day' })
  totalFees: number;
}
