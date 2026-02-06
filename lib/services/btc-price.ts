import { BTCPrice } from '@/lib/types/wallet';
import { logger } from '@/lib/utils/logger';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let priceCache: BTCPrice | null = null;

export class BTCPriceService {
  /**
   * Fetch current BTC price from CoinGecko API
   */
  static async fetchPrice(): Promise<BTCPrice> {
    // Check cache first
    if (priceCache && Date.now() - priceCache.lastUpdated.getTime() < CACHE_DURATION) {
      return priceCache;
    }

    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch BTC price');
      }

      const data = await response.json();
      const price: BTCPrice = {
        usd: data.bitcoin.usd,
        lastUpdated: new Date(),
      };

      priceCache = price;
      return price;
    } catch (error) {
      logger.error('Failed to fetch BTC price', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Return cached price if available, otherwise throw
      if (priceCache) {
        return priceCache;
      }

      throw error;
    }
  }

  /**
   * Convert satoshis to USD
   */
  static async satsToUSD(sats: number): Promise<number> {
    const price = await this.fetchPrice();
    const btc = sats / 100_000_000; // Convert sats to BTC
    return btc * price.usd;
  }

  /**
   * Convert USD to satoshis
   */
  static async usdToSats(usd: number): Promise<number> {
    const price = await this.fetchPrice();
    const btc = usd / price.usd;
    return Math.round(btc * 100_000_000); // Convert BTC to sats
  }

  /**
   * Format sats with USD equivalent
   */
  static async formatSatsWithUSD(sats: number): Promise<string> {
    try {
      const usd = await this.satsToUSD(sats);
      return `${sats.toLocaleString()} sats ($${usd.toFixed(2)})`;
    } catch (error) {
      return `${sats.toLocaleString()} sats`;
    }
  }

  /**
   * Get cached price (no API call)
   */
  static getCachedPrice(): BTCPrice | null {
    return priceCache;
  }

  /**
   * Clear price cache
   */
  static clearCache(): void {
    priceCache = null;
  }
}
