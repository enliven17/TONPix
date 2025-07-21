import axios from 'axios';
import { ExchangeRate, ExchangeRateResponse } from '@/types';
import { exchangeConfig } from '@/config';
import { Logger } from './Logger';

export class ExchangeRateService {
  private logger: Logger;
  private cache: Map<string, { rate: ExchangeRate; expiresAt: Date }> = new Map();

  constructor() {
    this.logger = new Logger('ExchangeRateService');
  }

  public async getExchangeRate(fromCurrency: string, toToken: string): Promise<number> {
    try {
      const cacheKey = `${fromCurrency}_${toToken}`;
      const cached = this.cache.get(cacheKey);

      // Check if we have a valid cached rate
      if (cached && cached.expiresAt > new Date()) {
        this.logger.debug(`Using cached exchange rate for ${cacheKey}`, {
          rate: cached.rate.rate,
          expiresAt: cached.expiresAt
        });
        return cached.rate.rate;
      }

      // Fetch fresh exchange rate
      const rate = await this.fetchExchangeRate(fromCurrency, toToken);
      
      // Cache the rate
      const expiresAt = new Date(Date.now() + exchangeConfig.cacheTTL);
      this.cache.set(cacheKey, { rate, expiresAt });

      this.logger.info(`Fetched exchange rate for ${fromCurrency} to ${toToken}`, {
        rate: rate.rate,
        timestamp: rate.timestamp
      });

      return rate.rate;

    } catch (error) {
      this.logger.error('Error getting exchange rate:', error);
      
      // Return fallback rates for common currencies
      return this.getFallbackRate(fromCurrency, toToken);
    }
  }

  private async fetchExchangeRate(fromCurrency: string, toToken: string): Promise<ExchangeRate> {
    try {
      // For MVP, we'll use a simple approach with hardcoded rates
      // In production, you would integrate with real exchange rate APIs
      
      if (toToken === 'TON') {
        return this.getTONExchangeRate(fromCurrency);
      } else if (toToken === 'jUSDT') {
        return this.getUSDTExchangeRate(fromCurrency);
      }

      throw new Error(`Unsupported token: ${toToken}`);

    } catch (error) {
      this.logger.error('Error fetching exchange rate:', error);
      throw error;
    }
  }

  private async getTONExchangeRate(fromCurrency: string): Promise<ExchangeRate> {
    const supported = ['USD', 'EUR', 'BRL', 'TON'];
    if (!supported.includes(fromCurrency)) {
      throw new Error(`Unsupported currency: ${fromCurrency}`);
    }
    if (fromCurrency === 'TON') {
      return {
        from: 'TON',
        to: 'TON',
        rate: 1.0,
        timestamp: new Date()
      };
    }
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd,eur,brl`;
      const response = await axios.get(url);
      const data = response.data;
      console.log('[CoinGecko API yanıtı]', data); // <-- LOG
      const price = data['the-open-network'][fromCurrency.toLowerCase()];
      if (!price || typeof price !== 'number') {
        console.error('[CoinGecko] Geçersiz fiyat:', price, 'Para birimi:', fromCurrency); // <-- LOG
        throw new Error('Invalid price from CoinGecko');
      }
      const rate = 1 / price;
      return {
        from: fromCurrency,
        to: 'TON',
        rate,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[CoinGecko] Hata:', error); // <-- LOG
      this.logger.error('Error fetching CoinGecko rate, using fallback', error);
      const fallbackRates: Record<string, number> = {
        'BRL': 0.00015,
        'USD': 0.00075,
        'EUR': 0.00082,
        'TON': 1.0,
      };
      return {
        from: fromCurrency,
        to: 'TON',
        rate: fallbackRates[fromCurrency] || 0.00075,
        timestamp: new Date()
      };
    }
  }

  private async getUSDTExchangeRate(fromCurrency: string): Promise<ExchangeRate> {
    // Hardcoded rates for MVP - in production, use real API
    const rates: Record<string, number> = {
      'BRL': 0.20,  // 1 BRL = 0.20 USDT
      'USD': 1.0,   // 1 USD = 1.0 USDT
      'EUR': 1.09,  // 1 EUR = 1.09 USDT
      'TON': 1333,  // 1 TON = 1333 USDT (approximate)
    };

    const rate = rates[fromCurrency];
    if (!rate) {
      throw new Error(`Unsupported currency: ${fromCurrency}`);
    }

    return {
      from: fromCurrency,
      to: 'jUSDT',
      rate,
      timestamp: new Date()
    };
  }

  private getFallbackRate(fromCurrency: string, toToken: string): number {
    this.logger.warn(`Using fallback rate for ${fromCurrency} to ${toToken}`);

    // Fallback rates for common currencies
    if (toToken === 'TON') {
      const fallbackRates: Record<string, number> = {
        'BRL': 0.00015,
        'USD': 0.00075,
        'EUR': 0.00082,
        'TON': 1.0,
      };
      return fallbackRates[fromCurrency] || 0.00075; // Default to USD rate
    } else if (toToken === 'jUSDT') {
      const fallbackRates: Record<string, number> = {
        'BRL': 0.20,
        'USD': 1.0,
        'EUR': 1.09,
        'TON': 1333,
      };
      return fallbackRates[fromCurrency] || 1.0; // Default to USD rate
    }

    return 1.0; // Default fallback
  }

  public async getSupportedCurrencies(): Promise<string[]> {
    return ['BRL', 'USD', 'EUR', 'TON'];
  }

  public async getSupportedTokens(): Promise<string[]> {
    return ['TON', 'jUSDT'];
  }

  public clearCache(): void {
    this.cache.clear();
    this.logger.info('Exchange rate cache cleared');
  }

  public getCacheStats(): {
    size: number;
    entries: Array<{ key: string; expiresAt: Date }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      expiresAt: value.expiresAt
    }));

    return {
      size: this.cache.size,
      entries
    };
  }

  // Method to manually update rates (for testing or admin use)
  public async updateRate(fromCurrency: string, toToken: string, newRate: number): Promise<void> {
    const cacheKey = `${fromCurrency}_${toToken}`;
    const expiresAt = new Date(Date.now() + exchangeConfig.cacheTTL);
    
    this.cache.set(cacheKey, {
      rate: {
        from: fromCurrency,
        to: toToken,
        rate: newRate,
        timestamp: new Date()
      },
      expiresAt
    });

    this.logger.info(`Manually updated exchange rate for ${cacheKey}`, {
      newRate,
      expiresAt
    });
  }
} 