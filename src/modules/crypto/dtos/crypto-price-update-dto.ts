import { ApiProperty } from '@nestjs/swagger';

export class CryptoPriceUpdateDto {
  @ApiProperty({ example: ['BTC', 'ETH', 'SOL'] })
  symbols?: string[];

  @ApiProperty({ example: true })
  updateAll?: boolean;
}
