import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  price_change_percentage_30d_in_currency: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export interface CoinGeckoMarketChart {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

@Injectable()
export class CoinGeckoService {
  private readonly logger = new Logger(CoinGeckoService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly apiUrl: string | undefined;
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('coingecko.apiUrl');
    this.apiKey = this.configService.get<string>('coingecko.apiKey');

    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      timeout: 10000,
      headers: this.apiKey ? { 'x-cg-demo-api-key': this.apiKey } : {},
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error(
          `CoinGecko API error: ${error.message}`,
          error.response?.data,
        );
        throw new HttpException(
          'Failed to fetch cryptocurrency data',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      },
    );
  }

  /**
   * Get current prices for multiple cryptocurrencies
   */
  async getMarketData(
    coinIds: string[],
    currency = 'usd',
  ): Promise<CoinGeckoPrice[]> {
    try {
      const response = await this.axiosInstance.get('/coins/markets', {
        params: {
          vs_currency: currency,
          ids: coinIds.join(','),
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h,7d,30d',
        },
      });

      this.logger.log(`Fetched market data for ${coinIds.length} coins`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch market data', error.stack);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific cryptocurrency
   */
  async getCoinDetails(coinId: string) {
    try {
      const response = await this.axiosInstance.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
        },
      });

      this.logger.log(`Fetched details for ${coinId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch details for ${coinId}`, error.stack);
      throw error;
    }
  }

  /**
   * Get historical market data (price, market cap, volume)
   */
  async getMarketChart(
    coinId: string,
    days: number,
    currency = 'usd',
  ): Promise<CoinGeckoMarketChart> {
    try {
      const response = await this.axiosInstance.get(
        `/coins/${coinId}/market_chart`,
        {
          params: {
            vs_currency: currency,
            days,
            interval: days === 1 ? 'hourly' : 'daily',
          },
        },
      );

      this.logger.log(`Fetched ${days}-day chart for ${coinId}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch market chart for ${coinId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get price at a specific timestamp
   */
  async getHistoricalPrice(coinId: string, date: string, currency = 'usd') {
    try {
      const response = await this.axiosInstance.get(
        `/coins/${coinId}/history`,
        {
          params: {
            date, // Format: dd-mm-yyyy
            localization: false,
          },
        },
      );

      this.logger.log(`Fetched historical price for ${coinId} on ${date}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch historical price for ${coinId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Search for cryptocurrencies
   */
  async searchCoins(query: string) {
    try {
      const response = await this.axiosInstance.get('/search', {
        params: { query },
      });

      this.logger.log(`Searched for: ${query}`);
      return response.data.coins;
    } catch (error) {
      this.logger.error(`Failed to search for ${query}`, error.stack);
      throw error;
    }
  }

  /**
   * Get list of all supported coins
   */
  async getCoinsList() {
    try {
      const response = await this.axiosInstance.get('/coins/list');

      this.logger.log('Fetched coins list');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch coins list', error.stack);
      throw error;
    }
  }

  /**
   * Get trending coins
   */
  async getTrendingCoins() {
    try {
      const response = await this.axiosInstance.get('/search/trending');

      this.logger.log('Fetched trending coins');
      return response.data.coins;
    } catch (error) {
      this.logger.error('Failed to fetch trending coins', error.stack);
      throw error;
    }
  }

  /**
   * Get simple price for quick lookups
   */
  async getSimplePrice(coinIds: string[], currency = 'usd') {
    try {
      const response = await this.axiosInstance.get('/simple/price', {
        params: {
          ids: coinIds.join(','),
          vs_currencies: currency,
          include_24hr_change: true,
          include_market_cap: true,
          include_24hr_vol: true,
        },
      });

      this.logger.log(`Fetched simple prices for ${coinIds.length} coins`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch simple prices', error.stack);
      throw error;
    }
  }
}
