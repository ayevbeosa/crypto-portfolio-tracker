import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class PortfolioIdQueryDto {
  @ApiPropertyOptional({
    description:
      'Filter by a specific portfolio UUID. Omit to aggregate all portfolios.',
  })
  @IsOptional()
  portfolioId?: string;
}
