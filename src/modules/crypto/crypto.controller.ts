import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CryptoService } from './crypto-service';
import { CryptoPriceSchedulerService } from './crypto-price-scheduler.service';
import { Public } from '@/common/decorators/public.decorator';
import { CryptoPriceDto } from './dtos/crypto-price.dto';
import { PriceHistoryDto } from './dtos/price-history.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CryptoPriceUpdateDto } from './dtos/crypto-price-update-dto';

@ApiTags('Crypto')
@Controller('crypto')
export class CryptoController {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly priceScheduler: CryptoPriceSchedulerService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all cryptocurrencies with current prices' })
  @ApiResponse({
    status: 200,
    description: 'Cryptocurrencies retrieved successfully',
    type: [CryptoPriceDto],
  })
  async getAllCryptos() {
    const cryptos = await this.cryptoService.getAllCryptos();
    return cryptos.map((c) => this.cryptoService.toCryptoPriceDto(c));
  }

  @Public()
  @Get('top')
  @ApiOperation({ summary: 'Get top cryptocurrencies by market cap' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of cryptocurrencies to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Top cryptocurrencies retrieved successfully',
    type: [CryptoPriceDto],
  })
  async getTopCryptos(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const cryptos = await this.cryptoService.getTopCryptos(limit);
    return cryptos.map((c) => this.cryptoService.toCryptoPriceDto(c));
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search cryptocurrencies by name or symbol' })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query',
    example: 'bitcoin',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: [CryptoPriceDto],
  })
  async searchCryptos(@Query('q') query: string) {
    const cryptos = await this.cryptoService.searchCryptos(query);
    return cryptos.map((c) => this.cryptoService.toCryptoPriceDto(c));
  }

  @Public()
  @Get(':symbol')
  @ApiOperation({ summary: 'Get cryptocurrency details by symbol' })
  @ApiParam({
    name: 'symbol',
    description: 'Cryptocurrency symbol (e.g., BTC, ETH)',
    example: 'BTC',
  })
  @ApiResponse({
    status: 200,
    description: 'Cryptocurrency details retrieved successfully',
    type: CryptoPriceDto,
  })
  @ApiResponse({ status: 404, description: 'Cryptocurrency not found' })
  async getCryptoBySymbol(@Param('symbol') symbol: string) {
    const crypto = await this.cryptoService.getCryptoBySymbol(symbol);
    return this.cryptoService.toCryptoPriceDto(crypto);
  }

  @Public()
  @Get(':symbol/price')
  @ApiOperation({ summary: 'Get current price for a cryptocurrency' })
  @ApiParam({
    name: 'symbol',
    description: 'Cryptocurrency symbol',
    example: 'BTC',
  })
  @ApiResponse({
    status: 200,
    description: 'Price retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', example: 'BTC' },
        price: { type: 'number', example: 45000.5 },
        timestamp: { type: 'string', example: '2024-01-29T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Cryptocurrency not found' })
  async getCurrentPrice(@Param('symbol') symbol: string) {
    const crypto = await this.cryptoService.getCryptoBySymbol(symbol);
    return {
      symbol: crypto.symbol,
      price: parseFloat(crypto.currentPrice.toString()),
      timestamp: crypto.lastUpdated,
    };
  }

  @Public()
  @Get(':symbol/history')
  @ApiOperation({ summary: 'Get price history for a cryptocurrency' })
  @ApiParam({
    name: 'symbol',
    description: 'Cryptocurrency symbol',
    example: 'BTC',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days of history',
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'Price history retrieved successfully',
    type: [PriceHistoryDto],
  })
  @ApiResponse({ status: 404, description: 'Cryptocurrency not found' })
  async getPriceHistory(
    @Param('symbol') symbol: string,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ) {
    return this.cryptoService.getPriceHistory(symbol, days);
  }

  @Post('update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger price update' })
  @ApiResponse({
    status: 200,
    description: 'Price update triggered successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePrices(@Body() updateDto?: CryptoPriceUpdateDto) {
    const symbols = updateDto?.symbols;

    if (symbols && symbols.length > 0) {
      await this.priceScheduler.triggerUpdate(symbols);
      return {
        message: `Price update triggered for ${symbols.length} cryptocurrencies`,
        symbols,
      };
    }

    await this.priceScheduler.triggerUpdate();
    return {
      message: 'Price update triggered for all cryptocurrencies',
    };
  }

  @Public()
  @Get('prices/bulk')
  @ApiOperation({ summary: 'Get prices for multiple cryptocurrencies' })
  @ApiQuery({
    name: 'symbols',
    required: true,
    type: String,
    description: 'Comma-separated list of symbols',
    example: 'BTC,ETH,SOL',
  })
  @ApiResponse({
    status: 200,
    description: 'Prices retrieved successfully',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          price: { type: 'number' },
          change24h: { type: 'number' },
        },
      },
    },
  })
  async getBulkPrices(@Query('symbols') symbolsQuery: string) {
    const symbols = symbolsQuery.split(',').map((s) => s.trim().toUpperCase());

    const prices = {};

    for (const symbol of symbols) {
      try {
        const crypto = await this.cryptoService.getCryptoBySymbol(symbol);
        prices[symbol] = {
          price: parseFloat(crypto.currentPrice.toString()),
          change24h: crypto.priceChangePercentage24h,
          lastUpdated: crypto.lastUpdated,
        };
      } catch (error) {
        prices[symbol] = { error: 'Not found' };
      }
    }

    return prices;
  }
}
