import { ApiProperty } from '@nestjs/swagger';
import { PerformanceItemDto } from './performance-item.dto';

export class PerformanceSummaryDto {
  @ApiProperty({
    type: [PerformanceItemDto],
    description: 'Top N best-performing holdings',
  })
  topPerformers: PerformanceItemDto[];

  @ApiProperty({
    type: [PerformanceItemDto],
    description: 'Bottom N worst-performing holdings',
  })
  bottomPerformers: PerformanceItemDto[];
}
