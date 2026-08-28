import axios from 'axios';
import { Cryptocurrency } from '../types';

export class CryptoSearcher {
  private apiUrl: string = 'https://api.coingecko.com/api/v3';
  private cache: Map<string, Cryptocurrency> = new Map();
  private cacheExpiry: number = 3600000; // 1 hour
  private lastUpdate: Map<string, number> = new Map();

  /**
   * Search for cryptocurrency by symbol or name
   */
  async searchCrypto(query: string): Promise<Cryptocurrency[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/search`, {
        params: { query },
      });

      const results: Cryptocurrency[] = [];

      for (const coin of response.data.coins.slice(0, 10)) {
        const crypto: Cryptocurrency = {
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          algorithm: this.inferAlgorithm(coin.symbol),
          difficulty: await this.fetchDifficulty(coin.symbol),
          blockReward: await this.fetchBlockReward(coin.symbol),
          networkHashrate: await this.fetchNetworkHashrate(coin.symbol),
          profitability: await this.calculateProfitability(coin.symbol),
        };

        results.push(crypto);
        this.cache.set(coin.symbol.toUpperCase(), crypto);
        this.lastUpdate.set(coin.symbol.toUpperCase(), Date.now());
      }

      return results;
    } catch (error) {
      console.error('Crypto search failed:', error);
      return [];
    }
  }

  /**
   * Get detailed info for a specific cryptocurrency
   */
  async getCryptoInfo(symbol: string): Promise<Cryptocurrency | null> {
    const cached = this.cache.get(symbol);
    const lastUpdate = this.lastUpdate.get(symbol);

    if (
      cached &&
      lastUpdate &&
      Date.now() - lastUpdate < this.cacheExpiry
    ) {
      return cached;
    }

    try {
      const response = await axios.get(
        `${this.apiUrl}/coins/${symbol.toLowerCase()}`
      );

      const crypto: Cryptocurrency = {
        symbol: symbol.toUpperCase(),
        name: response.data.name,
        algorithm: this.inferAlgorithm(symbol),
        difficulty: response.data.market_data?.difficulty || 0,
        blockReward: response.data.market_data?.block_reward || 0,
        networkHashrate: response.data.market_data?.total_volume?.usd || 0,
        profitability: response.data.market_data?.current_price?.usd || 0,
      };

      this.cache.set(symbol, crypto);
      this.lastUpdate.set(symbol, Date.now());

      return crypto;
    } catch (error) {
      console.error(`Failed to fetch info for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get popular cryptocurrencies for mining
   */
  async getPopularMiningCoins(): Promise<Cryptocurrency[]> {
    const symbols = ['BTC', 'ETH', 'LTC', 'XMR', 'ZEC', 'DOGE'];
    const results: Cryptocurrency[] = [];

    for (const symbol of symbols) {
      const info = await this.getCryptoInfo(symbol);
      if (info) results.push(info);
    }

    return results;
  }

  private inferAlgorithm(symbol: string): string {
    const algorithms: { [key: string]: string } = {
      BTC: 'SHA-256',
      BCH: 'SHA-256',
      LTC: 'Scrypt',
      DOGE: 'Scrypt',
      ETH: 'Ethash',
      ETC: 'Ethash',
      XMR: 'RandomX',
      ZEC: 'Equihash',
    };
    return algorithms[symbol] || 'Unknown';
  }

  private async fetchDifficulty(symbol: string): Promise<number> {
    // Placeholder - integrate with actual mining pool APIs
    return Math.random() * 1000000;
  }

  private async fetchBlockReward(symbol: string): Promise<number> {
    // Placeholder - integrate with actual blockchain data
    return Math.random() * 50;
  }

  private async fetchNetworkHashrate(symbol: string): Promise<number> {
    // Placeholder - integrate with actual network data
    return Math.random() * 10000000;
  }

  private async calculateProfitability(symbol: string): Promise<number> {
    // Placeholder - calculate based on difficulty, block reward, and current price
    return Math.random() * 0.5;
  }
}
