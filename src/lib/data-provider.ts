/**
 * Unified Data Provider
 * Fetches OHLC data from multiple sources:
 * - Crypto: Binance (primary) → Yahoo Finance (fallback)
 * - US Stocks: Yahoo Finance (primary) → Massive (fallback)
 */

import { fetchYahooFinanceCandles, isCryptoSymbol } from "./yahoo-finance";
import { fetchBinanceKlines } from "./binance";
import { OHLCData } from "./quant-ai/data-collector";

// Lazy import Massive to avoid unnecessary loading
let massiveModule: { fetchStockOHLC: any; convertStockToDatabaseFormat: any } | null = null;

async function getMassive() {
  if (!massiveModule) {
    massiveModule = await import('./massive');
  }
  return massiveModule;
}

export interface OHLCResponse {
  symbol: string;
  timeframe: string;
  data: OHLCData[];
  source: "binance" | "yahoo" | "massive";
  error?: string;
}

/**
 * Normalize symbol
 */
function normalizeSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  return upper.replace(/\.US$|\.XNAS$|\.XNYS$/, '');
}

/**
 * Convert timeframe to Yahoo/Binance parameters
 */
function convertTimeframe(timeframe: string): { interval: string; range: string } {
  const match = timeframe.match(/(\d+)([mhdwM])/);
  if (!match) return { interval: '1h', range: '5d' };
  
  const num = parseInt(match[1]);
  const unit = match[2];
  
  // Determine Yahoo interval
  let yahooInterval: string;
  if (unit === 'm') {
    if (num <= 1) yahooInterval = '1m';
    else if (num <= 2) yahooInterval = '2m';
    else if (num <= 5) yahooInterval = '5m';
    else if (num <= 15) yahooInterval = '15m';
    else if (num <= 30) yahooInterval = '30m';
    else yahooInterval = '60m';
  } else if (unit === 'h') {
    if (num <= 1) yahooInterval = '60m';
    else if (num <= 4) yahooInterval = '4h';
    else yahooInterval = '1d';
  } else if (unit === 'd') {
    yahooInterval = num === 1 ? '1d' : '1wk';
  } else if (unit === 'w') {
    yahooInterval = '1wk';
  } else {
    yahooInterval = '1mo';
  }
  
  // Estimate needed range in days
  let daysNeeded: number;
  if (unit === 'm') daysNeeded = Math.ceil(num * 200 / (24 * 60));
  else if (unit === 'h') daysNeeded = Math.ceil(num * 200 / 24);
  else if (unit === 'd') daysNeeded = num * 200;
  else if (unit === 'w') daysNeeded = num * 7 * 200;
  else daysNeeded = 30 * 200;
  
  let yahooRange: string;
  if (daysNeeded <= 1) yahooRange = '1d';
  else if (daysNeeded <= 5) yahooRange = '5d';
  else if (daysNeeded <= 30) yahooRange = '1mo';
  else if (daysNeeded <= 90) yahooRange = '3mo';
  else if (daysNeeded <= 180) yahooRange = '6mo';
  else if (daysNeeded <= 365) yahooRange = '1y';
  else if (daysNeeded <= 730) yahooRange = '2y';
  else yahooRange = '5y';
  
  return { interval: yahooInterval, range: yahooRange };
}

/**
 * Fetch OHLC data for any symbol
 */
export async function fetchOHLC(
  symbol: string,
  timeframe: string = "1d",
  limit: number = 200
): Promise<OHLCResponse> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const isCrypto = isCryptoSymbol(normalizedSymbol);
  
  if (isCrypto) {
    // CRYPTO: Try Binance first (faster, more reliable), then Yahoo Finance
    console.log(`[DataProvider] Crypto ${symbol} → trying Binance...`);
    
    try {
      const klines = await fetchBinanceKlines(normalizedSymbol, timeframe, limit);
      const data: OHLCData[] = klines.map(k => ({
        symbol: normalizedSymbol,
        timeframe,
        timestamp: new Date(k.timestamp),
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
        volume: k.volume,
      }));
      return { symbol: normalizedSymbol, timeframe, data, source: "binance" };
    } catch (binanceError: any) {
      console.warn(`[DataProvider] Binance failed for ${symbol}:`, binanceError.message);
      console.log(`[DataProvider] Falling back to Yahoo Finance...`);
      
      // Fallback to Yahoo Finance for crypto
      try {
        const { interval, range } = convertTimeframe(timeframe);
        const candles = await fetchYahooFinanceCandles(normalizedSymbol, range, interval);
        const limited = candles.slice(0, limit);
        const data: OHLCData[] = limited.map(c => ({
          symbol: normalizedSymbol,
          timeframe,
          timestamp: new Date(c.timestamp),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        }));
        return { symbol: normalizedSymbol, timeframe, data, source: "yahoo" };
      } catch (yahooError: any) {
        console.error(`[DataProvider] Yahoo also failed for ${symbol}:`, yahooError.message);
        return {
          symbol: normalizedSymbol,
          timeframe,
          data: [],
          source: "yahoo",
          error: `Crypto data unavailable: ${yahooError.message}`,
        };
      }
    }
  } else {
    // US STOCKS: Try Yahoo Finance first, then Massive as fallback
    console.log(`[DataProvider] Stock ${symbol} → trying Yahoo Finance...`);
    
    try {
      const { interval, range } = convertTimeframe(timeframe);
      const candles = await fetchYahooFinanceCandles(normalizedSymbol, range, interval);
      const limited = candles.slice(0, limit);
      const data: OHLCData[] = limited.map(c => ({
        symbol: normalizedSymbol,
        timeframe,
        timestamp: new Date(c.timestamp),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }));
      return { symbol: normalizedSymbol, timeframe, data, source: "yahoo" };
    } catch (yahooError: any) {
      console.warn(`[DataProvider] Yahoo failed for ${symbol}:`, yahooError.message);
      console.log(`[DataProvider] Falling back to Massive...`);
      
      try {
        const massive = await getMassive();
        const rawData = await massive.fetchStockOHLC(symbol, timeframe, limit);
        if (rawData && rawData.c && rawData.c.length > 0) {
          const data = massive.convertStockToDatabaseFormat(rawData, symbol, timeframe);
          return { symbol: symbol.toUpperCase(), timeframe, data, source: "massive" };
        }
      } catch (massiveError: any) {
        console.error(`[DataProvider] Massive also failed for ${symbol}:`, massiveError.message);
      }
      
      return {
        symbol: normalizedSymbol,
        timeframe,
        data: [],
        source: "yahoo",
        error: `Stock data unavailable: ${yahooError.message}`,
      };
    }
  }
}
