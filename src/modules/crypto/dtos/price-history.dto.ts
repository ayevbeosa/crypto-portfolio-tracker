import { ApiProperty } from "@nestjs/swagger";

export class PriceHistoryDto {
  @ApiProperty({ example: '2024-01-29T10:30:00.000Z' })
  timestamp: Date;

  @ApiProperty({ example: 45000 })
  price: number;

  @ApiProperty({ example: 850000000000 })
  marketCap: number;

  @ApiProperty({ example: 45000000000 })
  volume: number;
}
