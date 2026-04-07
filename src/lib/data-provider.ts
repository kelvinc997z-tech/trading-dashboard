/**
 * Unified Data Provider
 * Fetches OHLC data from Yahoo Finance for both US stocks and crypto
 * Fallback to Massive for US stocks if Yahoo fails
 */

import { fetchYahooFinanceCandles, isCryptoSymbol, convertToYahooInterval } from "./yahoo-finance";
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
  source: "yahoo" | "massive";
  error?: string;
}

/**
 * Normalize symbol for Yahoo Finance
 */
function normalizeSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  // Remove common suffixes if present
  return upper.replace(/\.US$|\.XNAS$|\.XNYS$/, '');
}

/**
 * Convert limit & timeframe to Yahoo Finance range parameter
 */
function convertLimitToRange(limit: number, timeframe: string): string {
  const daysNeeded = estimateDays(limit, timeframe);
  
  if (daysNeeded <= 1) return '1d';
  if (daysNeeded <= 5) return '5d';
  if (daysNeeded <= 30) return '1mo';
  if (daysNeeded <= 90) return '3mo';
  if (daysNeeded <= 180) return '6mo';
  if (daysNeeded <= 365) return '1y';
  if (daysNeeded <= 730) return '2y';
  return '5y';
}

/**
 * Estimate days needed based on limit and timeframe
 */
function estimateDays(limit: number, timeframe: string): number {
  const match = timeframe.match(/(\d+)([mhdwM])/);
  if (!match) return 5;
  
  const num = parseInt(match[1]);
  const unit = match[2];
  
  let candlesPerDay: number;
  if (unit === 'm') candlesPerDay = (24 * 60) / num;
  else if (unit === 'h') candlesPerDay = 24 / num;
  else if (unit === 'd') candlesPerDay = 1 / num;
  else if (unit === 'w') candlesPerDay = 1 / (7 * num);
  else if (unit === 'M') candlesPerDay = 1 / (30 * num);
  else candlesPerDay = 1;
  
  return Math.ceil(limit / candlesPerDay);
}

/**
 * Fetch OHLC data for any symbol from Yahoo Finance
 * US Stocks: AAPL, MSFT, GOOGL
 * Crypto: BTC-USD, ETH-USD, SOL-USD (auto-formatted)
 */
export async function fetchOHLC(
  symbol: string,
  timeframe: string = "1d",
  limit: number = 200
): Promise<OHLCResponse> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const isCrypto = isCryptoSymbol(normalizedSymbol);
  
  // Convert to Yahoo parameters
  const yahooInterval = convertToYahooInterval(timeframe);
  const yahooRange = convertLimitToRange(limit, timeframe);
  
  console.log(`[DataProvider] Fetching ${symbol} (crypto:${isCrypto}) from Yahoo: range=${yahooRange}, interval=${yahooInterval}`);
  
  try {
    const candles = await fetchYahooFinanceCandles(normalizedSymbol, yahooRange, yahooInterval, isCrypto);
    
    // Apply limit (Yahoo might return more than requested)
    const limitedData = candles.slice(0, limit);
    
    // Convert to OHLCData format
    const data: OHLCData[] = limitedData.map(c => ({
      symbol: normalizedSymbol,
      timeframe,
      timestamp: new Date(c.timestamp),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }));

    return {
      symbol: normalizedSymbol,
      timeframe,
      data,
      source: "yahoo",
    };
  } catch (error: any) {
    console.error(`[DataProvider] Yahoo Finance error for ${symbol}:`, error.message);
    
    // For US stocks only: try Massive as fallback
    if (!isCrypto) {
      console.log(`[DataProvider] Trying Massive fallback for ${symbol}...`);
      try {
        const massive = await getMassive();
        const rawData = await massive.fetchStockOHLC(symbol, timeframe, limit);
        
        if (rawData && rawData.c && rawData.c.length > 0) {
          const data = massive.convertStockToDatabaseFormat(rawData, symbol, timeframe);
          return {
            symbol: symbol.toUpperCase(),
            timeframe,
            data,
            source: "massive",
          };
        }
      } catch (massiveError: any) {
        console.error(`[DataProvider] Massive fallback also failed for ${symbol}:`, massiveError.message);
      }
    }
    
    return {
      symbol: symbol.toUpperCase(),
      timeframe,
      data: [],
      source: "yahoo",
      error: `Failed to fetch data: ${error.message}`,
    };
  }
}
