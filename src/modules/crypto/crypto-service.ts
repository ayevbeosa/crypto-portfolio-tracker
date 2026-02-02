import { Cryptocurrency } from '@/database/entities/cryptocurrency.entity';
import { PriceHistory } from '@/database/entities/price-history.entity';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoinGeckoService } from './coin-gecko.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CACHE_KEYS } from '@/common/constants';
import { PriceHistoryDto } from './dtos/price-history.dto';
import { CryptoPriceDto } from './dtos/crypto-price.dto';

export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);

  constructor(
    @InjectRepository(Cryptocurrency)
    private readonly cryptoRepository: Repository<Cryptocurrency>,
    @InjectRepository(PriceHistory)
    private readonly priceHistoryRepository: Repository<PriceHistory>,
    private readonly coinGeckoService: CoinGeckoService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Get all cryptocurrencies with current prices
   */
  async getAllCryptos(): Promise<Cryptocurrency[]> {
    // Try to get from cache first
    const cacheKey = CACHE_KEYS.CRYPTO_PRICES;
    const cached = await this.cacheManager.get<Cryptocurrency[]>(cacheKey);

    if (cached) {
      this.logger.log('Returning cached crypto prices');
      return cached;
    }

    // Get from database
    const cryptos = await this.cryptoRepository.find({
      order: { marketCapRank: 'ASC' },
    });

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, cryptos, 300000);

    return cryptos;
  }

  /**
   * Get cryptocurrency by symbol
   */
  async getCryptoBySymbol(symbol: string): Promise<Cryptocurrency> {
    const cacheKey = CACHE_KEYS.CRYPTO_DETAILS(symbol.toUpperCase());
    const cached = await this.cacheManager.get<Cryptocurrency>(cacheKey);

    if (cached) {
      this.logger.log(`Returning cached data for ${symbol}`);
      return cached;
    }

    const crypto = await this.cryptoRepository.findOne({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!crypto) {
      throw new NotFoundException(`Cryptocurrency ${symbol} not found`);
    }

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, crypto, 300000);

    return crypto;
  }

  /**
   * Update cryptocurrency prices from CoinGecko
   */
  async updatePrices(symbols?: string[]): Promise<void> {
    try {
      let cryptosToUpdate: Cryptocurrency[];

      if (symbols && symbols.length > 0) {
        // Update specific cryptocurrencies
        cryptosToUpdate = await this.cryptoRepository
          .createQueryBuilder('crypto')
          .where('crypto.symbol IN (:...symbols)', {
            symbols: symbols.map((s) => s.toUpperCase()),
          })
          .getMany();
      } else {
        // Update all cryptocurrencies
        cryptosToUpdate = await this.cryptoRepository.find();
      }

      if (cryptosToUpdate.length === 0) {
        this.logger.warn('No cryptocurrencies to update');
        return;
      }

      // Get CoinGecko IDs
      const coinIds = cryptosToUpdate.map((c) => c.coinGeckoId);

      // Fetch market data from CoinGecko
      const marketData = await this.coinGeckoService.getMarketData(coinIds);

      // Update database
      for (const data of marketData) {
        const crypto = cryptosToUpdate.find((c) => c.coinGeckoId === data.id);

        if (crypto) {
          // Update cryptocurrency data
          crypto.currentPrice = data.current_price || 0;
          crypto.marketCap = data.market_cap?.toString() || '0';
          crypto.marketCapRank = data.market_cap_rank;
          crypto.totalVolume = data.total_volume?.toString() || '0';
          crypto.priceChange24h = data.price_change_24h || 0;
          crypto.priceChangePercentage24h =
            data.price_change_percentage_24h || 0;
          crypto.priceChangePercentage7d =
            data.price_change_percentage_7d_in_currency || 0;
          crypto.priceChangePercentage30d =
            data.price_change_percentage_30d_in_currency || 0;
          crypto.ath = data.ath;
          crypto.athDate = data.ath_date ? new Date(data.ath_date) : null;
          crypto.atl = data.atl;
          crypto.atlDate = data.atl_date ? new Date(data.atl_date) : null;
          crypto.lastUpdated = new Date();

          await this.cryptoRepository.save(crypto);

          // Save to price history
          await this.savePriceHistory(crypto);

          // Invalidate cache
          await this.cacheManager.del(CACHE_KEYS.CRYPTO_DETAILS(crypto.symbol));

          this.logger.log(`Updated ${crypto.symbol}: $${crypto.currentPrice}`);
        }
      }

      // Invalidate main cache
      await this.cacheManager.del(CACHE_KEYS.CRYPTO_PRICES);

      this.logger.log(
        `Successfully updated ${marketData.length} cryptocurrencies`,
      );
    } catch (error) {
      this.logger.error('Failed to update prices', error.stack);
      throw error;
    }
  }

  /**
   * Save current price to history
   */
  private async savePriceHistory(crypto: Cryptocurrency): Promise<void> {
    const priceHistory = this.priceHistoryRepository.create({
      cryptoId: crypto.id,
      price: crypto.currentPrice,
      marketCap: crypto.marketCap,
      volume: crypto.totalVolume,
      timestamp: new Date(),
    });

    await this.priceHistoryRepository.save(priceHistory);
  }

  /**
   * Get price history for a cryptocurrency
   */
  async getPriceHistory(
    symbol: string,
    days: number,
  ): Promise<PriceHistoryDto[]> {
    const cacheKey = CACHE_KEYS.CRYPTO_HISTORY(
      symbol.toUpperCase(),
      days.toString(),
    );
    const cached = await this.cacheManager.get<PriceHistoryDto[]>(cacheKey);

    if (cached) {
      this.logger.log(`Returning cached price history for ${symbol}`);
      return cached;
    }

    const crypto = await this.getCryptoBySymbol(symbol);

    // Get from database
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = await this.priceHistoryRepository.find({
      where: {
        cryptoId: crypto.id,
      },
      order: { timestamp: 'ASC' },
      take: 1000, // Limit to prevent huge responses
    });

    // Filter by date range
    const filteredHistory = history
      .filter((h) => h.timestamp >= startDate)
      .map((h) => ({
        timestamp: h.timestamp,
        price: parseFloat(h.price.toString()),
        marketCap: parseFloat(h.marketCap.toString()),
        volume: parseFloat(h.volume.toString()),
      }));

    // If we don't have enough data, fetch from CoinGecko
    if (filteredHistory.length < 10) {
      this.logger.log(`Fetching price history from CoinGecko for ${symbol}`);

      try {
        const chartData = await this.coinGeckoService.getMarketChart(
          crypto.coinGeckoId,
          days,
        );

        const geckoHistory: PriceHistoryDto[] = chartData.prices.map(
          ([timestamp, price], index) => ({
            timestamp: new Date(timestamp),
            price,
            marketCap: chartData.market_caps[index]?.[1] || 0,
            volume: chartData.total_volumes[index]?.[1] || 0,
          }),
        );

        // Cache for 1 hour
        await this.cacheManager.set(cacheKey, geckoHistory, 3600000);

        return geckoHistory;
      } catch (error) {
        this.logger.error(
          'Failed to fetch history from CoinGecko',
          error.stack,
        );
      }
    }

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, filteredHistory, 3600000);

    return filteredHistory;
  }

  /**
   * Search cryptocurrencies
   */
  async searchCryptos(query: string): Promise<Cryptocurrency[]> {
    return this.cryptoRepository
      .createQueryBuilder('crypto')
      .where('LOWER(crypto.name) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(crypto.symbol) LIKE LOWER(:query)', {
        query: `%${query}%`,
      })
      .orderBy('crypto.marketCapRank', 'ASC')
      .take(20)
      .getMany();
  }

  /**
   * Get top cryptocurrencies by market cap
   */
  async getTopCryptos(limit = 10): Promise<Cryptocurrency[]> {
    return this.cryptoRepository.find({
      order: { marketCapRank: 'ASC' },
      take: limit,
    });
  }

  /**
   * Convert cryptocurrency response to DTO
   */
  toCryptoPriceDto(crypto: Cryptocurrency): CryptoPriceDto {
    return {
      id: crypto.coinGeckoId,
      symbol: crypto.symbol,
      name: crypto.name,
      image: crypto.image,
      currentPrice: parseFloat(crypto.currentPrice.toString()),
      marketCap: parseFloat(crypto.marketCap.toString()),
      marketCapRank: crypto.marketCapRank,
      totalVolume: parseFloat(crypto.totalVolume.toString()),
      priceChange24h: crypto.priceChange24h,
      priceChangePercentage24h: crypto.priceChangePercentage24h,
      priceChangePercentage7d: crypto.priceChangePercentage7d,
      priceChangePercentage30d: crypto.priceChangePercentage30d,
      ath: crypto.ath,
      athDate: crypto.athDate,
      atl: crypto.atl,
      atlDate: crypto.atlDate,
      lastUpdated: crypto.lastUpdated,
    };
  }

  /**
   * Get current price for a specific symbol (simplified)
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    const crypto = await this.getCryptoBySymbol(symbol);
    return parseFloat(crypto.currentPrice.toString());
  }
}
