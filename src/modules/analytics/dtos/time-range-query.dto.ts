import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class TimeRangeQueryDto {
  @ApiPropertyOptional({
    enum: ['1d', '7d', '30d', '90d', '1y', 'all'],
    default: '30d',
    description: 'Time range for the analytics window',
  })
  @IsOptional()
  range?: '1d' | '7d' | '30d' | '90d' | '1y' | 'all';
}
