import { AlertCondition, AlertStatus } from '@/database/entities/alert.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateAlertDto {
  @ApiPropertyOptional({
    enum: AlertCondition,
    example: AlertCondition.BELOW,
    description: 'Alert condition',
  })
  @IsEnum(AlertCondition)
  @IsOptional()
  condition?: AlertCondition;

  @ApiPropertyOptional({
    example: 45000,
    description: 'Target price',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  targetPrice?: number;

  @ApiPropertyOptional({
    example: 'Updated message',
    description: 'Alert message',
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({
    enum: AlertStatus,
    example: AlertStatus.ACTIVE,
    description: 'Alert status',
  })
  @IsEnum(AlertStatus)
  @IsOptional()
  status?: AlertStatus;
}
