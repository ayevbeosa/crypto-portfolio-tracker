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
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionResponseDto } from './dtos/transaction-response.dto';
import {
  CurrentUser,
  type CurrentUserData,
} from '../../common/decorators/current-user.decorator';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { UpdateTransactionDto } from './dtos/update-transaction.dto';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({
    status: 404,
    description: 'Portfolio or cryptocurrency not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(user.id, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user transactions' })
  @ApiQuery({
    name: 'portfolioId',
    required: false,
    description: 'Filter by portfolio ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
    type: [TransactionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('portfolioId') portfolioId?: string,
  ) {
    return this.transactionsService.findAll(user.id, portfolioId);
  }

  @Get('portfolio/:portfolioId')
  @ApiOperation({ summary: 'Get all transactions for a specific portfolio' })
  @ApiParam({
    name: 'portfolioId',
    description: 'Portfolio ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
    type: [TransactionResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not your portfolio' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByPortfolio(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.transactionsService.findByPortfolio(portfolioId, user.id);
  }

  @Get('portfolio/:portfolioId/stats')
  @ApiOperation({ summary: 'Get transaction statistics for a portfolio' })
  @ApiParam({
    name: 'portfolioId',
    description: 'Portfolio ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not your portfolio' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.transactionsService.getTransactionStats(portfolioId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your transaction' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.transactionsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Transaction updated successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your transaction' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, user.id, updateTransactionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID', type: 'string' })
  @ApiResponse({ status: 204, description: 'Transaction deleted successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your transaction' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.transactionsService.remove(id, user.id);
  }
}
