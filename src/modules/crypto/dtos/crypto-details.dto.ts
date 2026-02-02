import { ApiProperty } from '@nestjs/swagger';

export class CryptoDetailsDto {
  @ApiProperty({ example: 'SHA-256' })
  hashingAlgorithm?: string;

  @ApiProperty({ example: '21000000' })
  maxSupply?: number;

  @ApiProperty({ example: '19000000' })
  circulatingSupply?: number;

  @ApiProperty({ example: 'Bitcoin is a decentralized cryptocurrency...' })
  description?: string;
}
