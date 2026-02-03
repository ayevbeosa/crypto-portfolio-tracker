import { AlertCondition } from '@/database/entities/alert.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateAlertDto {
  @ApiProperty({
    example: 'BTC',
    description: 'Cryptocurrency symbol',
  })
  @IsString()
  @IsNotEmpty({ message: 'Cryptocurrency symbol is required' })
  cryptoSymbol: string;

  @ApiProperty({
    enum: AlertCondition,
    example: AlertCondition.ABOVE,
    description: 'Alert condition (ABOVE or BELOW)',
  })
  @IsEnum(AlertCondition, { message: 'Condition must be ABOVE or BELOW' })
  @IsNotEmpty({ message: 'Condition is required' })
  condition: AlertCondition;

  @ApiProperty({
    example: 50000,
    description: 'Target price to trigger the alert',
    minimum: 0,
  })
  @IsNumber({}, { message: 'Target price must be a number' })
  @Min(0, { message: 'Target price must be greater than or equal to 0' })
  @IsNotEmpty({ message: 'Target price is required' })
  targetPrice: number;

  @ApiPropertyOptional({
    example: 'Notify me when BTC reaches $50,000',
    description: 'Optional message for the alert',
  })
  @IsString()
  @IsOptional()
  message?: string;
}
