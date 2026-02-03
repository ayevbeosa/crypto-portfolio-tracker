import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { DashboardSummaryDto } from './dtos/dashboard-summary.dto';
import {
  CurrentUser,
  type CurrentUserData,
} from '@/common/decorators/current-user.decorator';
import { RoiSummaryDto } from './dtos/roi-summary.dto';
import { AssetAllocationItemDto } from './dtos/asset-allocation-item.dto';
import { PerformanceSummaryDto } from './dtos/performance-summary.dto';
import { TransactionHistoryPointDto } from './dtos/transaction-history-point.dto';
import { FeeSummaryDto } from './dtos/fee-summary.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Portfolio dashboard summary',
    description:
      'Returns aggregate counts, total value, net invested, P&L, ROI, and the best/worst 24 h movers across all active portfolios for the authenticated user.',
  })
  @ApiResponse({ status: 200, type: DashboardSummaryDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboard(
    @CurrentUser() user: CurrentUserData,
  ): Promise<DashboardSummaryDto> {
    return this.analyticsService.getDashboard(user.id);
  }

  @Get('roi')
  @ApiOperation({
    summary: 'Return-on-investment timeline',
    description:
      'Computes cumulative invested capital and estimated portfolio value at each transaction day, then slices the series to the requested time range. Also returns totals and an annualised return figure.',
  })
  @ApiQuery({
    name: 'range',
    required: false,
    enum: ['1d', '7d', '30d', '90d', '1y', 'all'],
    description: 'Time window for the data-point series',
    example: '30d',
  })
  @ApiQuery({
    name: 'portfolioId',
    required: false,
    description: 'Limit to a single portfolio UUID',
  })
  @ApiResponse({ status: 200, type: RoiSummaryDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRoi(
    @CurrentUser() user: CurrentUserData,
    @Query('range') range: string = '30d',
    @Query('portfolioId') portfolioId?: string,
  ): Promise<RoiSummaryDto> {
    return this.analyticsService.getRoi(user.id, range, portfolioId);
  }

  @Get('allocation')
  @ApiOperation({
    summary: 'Asset-allocation breakdown',
    description:
      'Returns one row per held cryptocurrency with quantity, current value, allocation %, cost-basis, and per-asset P&L. Sorted descending by current value.',
  })
  @ApiQuery({
    name: 'portfolioId',
    required: false,
    description: 'Limit to a single portfolio UUID',
  })
  @ApiResponse({ status: 200, type: [AssetAllocationItemDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllocation(
    @CurrentUser() user: CurrentUserData,
    @Query('portfolioId') portfolioId?: string,
  ): Promise<AssetAllocationItemDto[]> {
    return this.analyticsService.getAllocation(user.id, portfolioId);
  }

  @Get('performance')
  @ApiOperation({
    summary: 'Top and bottom performers',
    description:
      'Ranks every held asset by its lifetime ROI percentage and returns the top-N winners and bottom-N losers.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'How many assets to return in each list (1-50)',
    example: 5,
  })
  @ApiQuery({
    name: 'portfolioId',
    required: false,
    description: 'Limit to a single portfolio UUID',
  })
  @ApiResponse({ status: 200, type: PerformanceSummaryDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPerformance(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit: number = 5,
    @Query('portfolioId') portfolioId?: string,
  ): Promise<PerformanceSummaryDto> {
    return this.analyticsService.getPerformance(
      user.id,
      Number(limit),
      portfolioId,
    );
  }

  @Get('transactions')
  @ApiOperation({
    summary: 'Daily buy / sell / fee chart data',
    description:
      'Aggregates every transaction into daily buckets with total buy amount, sell amount, and fees. Useful for rendering a bar or area chart of trading activity over time.',
  })
  @ApiQuery({
    name: 'range',
    required: false,
    enum: ['1d', '7d', '30d', '90d', '1y', 'all'],
    description: 'Time window',
    example: '30d',
  })
  @ApiQuery({
    name: 'portfolioId',
    required: false,
    description: 'Limit to a single portfolio UUID',
  })
  @ApiResponse({ status: 200, type: [TransactionHistoryPointDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTransactionHistory(
    @CurrentUser() user: CurrentUserData,
    @Query('range') range: string = '30d',
    @Query('portfolioId') portfolioId?: string,
  ): Promise<TransactionHistoryPointDto[]> {
    return this.analyticsService.getTransactionHistory(
      user.id,
      range,
      portfolioId,
    );
  }

  @Get('fees')
  @ApiOperation({
    summary: 'Fee summary for the selected window',
    description:
      'Total fees paid, average fee per transaction, transaction count, and the fee-to-invested ratio — all scoped to the requested time range.',
  })
  @ApiQuery({
    name: 'range',
    required: false,
    enum: ['1d', '7d', '30d', '90d', '1y', 'all'],
    description: 'Time window',
    example: '30d',
  })
  @ApiQuery({
    name: 'portfolioId',
    required: false,
    description: 'Limit to a single portfolio UUID',
  })
  @ApiResponse({ status: 200, type: FeeSummaryDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFees(
    @CurrentUser() user: CurrentUserData,
    @Query('range') range: string = '30d',
    @Query('portfolioId') portfolioId?: string,
  ): Promise<FeeSummaryDto> {
    return this.analyticsService.getFees(user.id, range, portfolioId);
  }
}
