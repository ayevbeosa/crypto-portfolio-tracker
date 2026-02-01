import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePortfolioDto {
  @ApiProperty({
    example: 'My Crypto Portfolio',
    description: 'Portfolio name',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Portfolio name is required' })
  @MinLength(2, { message: 'Portfolio name must be at least 2 characters' })
  @MaxLength(100, { message: 'Portfolio name must not exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    example: 'Long-term investment portfolio',
    description: 'Portfolio description',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;
}
