import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PortfoliosService } from './portfolios.service';
import { PortfolioResponseDto } from './dtos/portfolio-response.dto';
import {
  CurrentUser,
  type CurrentUserData,
} from '../../common/decorators/current-user.decorator';
import { CreatePortfolioDto } from './dtos/create-portfolio.dto';
import { UpdatePortfolioDto } from './dtos/update-portfolio.dto';

@ApiTags('Portfolios')
@ApiBearerAuth()
@Controller('portfolios')
@UseGuards(JwtAuthGuard)
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new portfolio' })
  @ApiResponse({
    status: 201,
    description: 'Portfolio created successfully',
    type: PortfolioResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() createPortfolioDto: CreatePortfolioDto,
  ) {
    return this.portfoliosService.create(user.id, createPortfolioDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user portfolios' })
  @ApiResponse({
    status: 200,
    description: 'Portfolios retrieved successfully',
    type: [PortfolioResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@CurrentUser() user: CurrentUserData) {
    return this.portfoliosService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get portfolio by ID with calculations' })
  @ApiParam({ name: 'id', description: 'Portfolio ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio retrieved successfully',
    type: PortfolioResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.portfoliosService.findOneWithCalculations(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio updated successfully',
    type: PortfolioResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
  ) {
    return this.portfoliosService.update(id, user.id, updatePortfolioDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID', type: 'string' })
  @ApiResponse({ status: 204, description: 'Portfolio deleted successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.portfoliosService.remove(id, user.id);
  }

  @Post(':id/recalculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually recalculate portfolio holdings and totals',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio recalculated successfully',
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async recalculate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    // Verify ownership first
    await this.portfoliosService.findOne(id, user.id);

    await this.portfoliosService.updateHoldings(id);
    await this.portfoliosService.updatePortfolioTotals(id);

    return { message: 'Portfolio recalculated successfully' };
  }
}
