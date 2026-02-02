import { ApiProperty } from "@nestjs/swagger";

export class CryptoPriceDto {
  @ApiProperty({ example: 'bitcoin' })
  id: string;

  @ApiProperty({ example: 'BTC' })
  symbol: string;

  @ApiProperty({ example: 'Bitcoin' })
  name: string;

  @ApiProperty({
    example: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  })
  image: string;

  @ApiProperty({ example: 45000.5 })
  currentPrice: number;

  @ApiProperty({ example: 850000000000 })
  marketCap: number;

  @ApiProperty({ example: 1 })
  marketCapRank: number;

  @ApiProperty({ example: 45000000000 })
  totalVolume: number;

  @ApiProperty({ example: 2.5 })
  priceChange24h: number;

  @ApiProperty({ example: 5.8 })
  priceChangePercentage24h: number;

  @ApiProperty({ example: 10.2 })
  priceChangePercentage7d: number;

  @ApiProperty({ example: 25.5 })
  priceChangePercentage30d: number;

  @ApiProperty({ example: 69000 })
  ath: number;

  @ApiProperty({ example: '2021-11-10T14:24:11.849Z' })
  athDate: Date | null;

  @ApiProperty({ example: 67.81 })
  atl: number;

  @ApiProperty({ example: '2013-07-06T00:00:00.000Z' })
  atlDate: Date | null;

  @ApiProperty({ example: '2024-01-29T10:30:00.000Z' })
  lastUpdated: Date;
}
