/**
 * Unified Data Provider
 * Routes data requests to appropriate source based on symbol type
 */

import { fetchStockOHLC, convertStockToDatabaseFormat } from "./massive";
import { fetchYahooFinanceCandles, isCryptoSymbol } from "./yahoo-finance";
import { OHLCData } from "./quant-ai/data-collector";

export interface OHLCResponse {
  symbol: string;
  timeframe: string;
  data: OHLCData[];
  source: "massive" | "yahoo";
}

/**
 * Fetch OHLC data for any symbol (auto-selects provider)
 * - US Stocks → Massive.com API
 * - Crypto → Yahoo Finance
 */
export async function fetchOHLC(
  symbol: string,
  timeframe: string = "1d",
  limit: number = 200
): Promise<OHLCResponse> {
  const isCrypto = isCryptoSymbol(symbol);

  if (isCrypto) {
    // Crypto: use Yahoo Finance
    try {
      const candles = await fetchYahooFinanceCandles(symbol, convertRange(limit, timeframe), timeframe);
      
      // Convert to OHLCData format
      const data: OHLCData[] = candles.map(c => ({
        symbol: symbol.toUpperCase().replace('-USD', ''),
        timeframe,
        timestamp: new Date(c.timestamp),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }));

      return {
        symbol: symbol.toUpperCase(),
        timeframe,
        data,
        source: "yahoo",
      };
    } catch (error: any) {
      console.error(`[DataProvider] Yahoo Finance error for ${symbol}:`, error.message);
      throw error;
    }
  } else {
    // US Stocks: use Massive
    try {
      const rawData = await fetchStockOHLC(symbol, timeframe, limit);
      if (!rawData || !rawData.c || rawData.c.length === 0) {
        throw new Error(`No data from Massive for ${symbol}`);
      }

      const data = convertStockToDatabaseFormat(rawData, symbol, timeframe);

      return {
        symbol: symbol.toUpperCase(),
        timeframe,
        data,
        source: "massive",
      };
    } catch (error: any) {
      console.error(`[DataProvider] Massive error for ${symbol}:`, error.message);
      throw error;
    }
  }
}

/**
 * Convert limit to appropriate Yahoo Finance range parameter
 * Yahoo uses date ranges, not limit counts. Estimate based on timeframe.
 */
function convertRange(limit: number, timeframe: string): string {
  // Rough estimates for Yahoo Finance ranges
  if (timeframe.includes('d')) {
    // Daily candles
    if (limit <= 30) return '1mo';
    if (limit <= 90) return '3mo';
    if (limit <= 180) return '6mo';
    if (limit <= 365) return '1y';
    return '2y';
  } else if (timeframe.includes('h')) {
    // Hourly candles
    if (limit <= 24) return '1d';
    if (limit <= 120) return '5d';
    if (limit <= 720) return '1mo';
    return '3mo';
  } else if (timeframe.includes('m')) {
    // Minute candles
    if (limit <= 60) return '1d';
    if (limit <= 480) return '5d';
    return '1mo';
  }
  return '5d'; // default
}
