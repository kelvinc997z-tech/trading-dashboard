/**
 * Yahoo Finance unofficial API client
 * For US stocks and cryptocurrency data
 * Note: Unofficial, may break without notice. Use with caution.
 */

export interface YahooFinanceCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface YahooFinanceResponse {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        currency: string;
        exchangeName: string;
        instrumentType: string;
        firstTradeDate: number;
        regularMarketTime: number;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }>;
      };
    }>;
    error?: any;
  };
}

/**
 * Fetch chart data from Yahoo Finance
 * Supports both US stocks (AAPL, MSFT) and crypto (BTC-USD, ETH-USD)
 * @param symbol - Symbol (e.g., AAPL, BTC-USD, ETH-USD)
 * @param range - Time range: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
 * @param interval - Candle interval: 1m, 2m, 5m, 15m, 30m, 60m, 1d, 1wk, 1mo
 */
export async function fetchYahooFinanceCandles(
  symbol: string,
  range: string = '5d',
  interval: string = '1h'
): Promise<YahooFinanceCandle[]> {
  // Ensure symbol format
  let formattedSymbol = symbol.toUpperCase();
  if (!formattedSymbol.includes('-') && !formattedSymbol.includes('.')) {
    // Default to -USD for crypto, but keep as is for stocks
    // We'll try both if needed
    formattedSymbol = formattedSymbol;
  }

  // Try different symbol formats
  const symbolVariants = [
    formattedSymbol,
    formattedSymbol.includes('-') ? formattedSymbol : `${formattedSymbol}-USD`,
    formattedSymbol.includes('.') ? formattedSymbol : `${formattedSymbol}.US`,
  ];

  let lastError: Error | null = null;

  for (const sym of symbolVariants) {
    try {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${sym}?range=${range}&interval=${interval}`;
      
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        next: { revalidate: 300 }, // cache 5 minutes
      });

      if (!res.ok) {
        if (res.status === 429) {
          // Rate limited, wait and retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data: YahooFinanceResponse = await res.json();

      if (data.chart.error) {
        throw new Error(data.chart.error.description || 'Yahoo Finance API error');
      }

      if (!data.chart.result || data.chart.result.length === 0) {
        throw new Error('No data returned from Yahoo Finance');
      }

      const result = data.chart.result[0];
      const { timestamp, indicators } = result;
      const quotes = indicators.quote[0];

      if (!timestamp || !quotes || !quotes.close) {
        throw new Error('Invalid data structure from Yahoo Finance');
      }

      // Map to our standard format
      return timestamp.map((ts, i) => ({
        timestamp: ts * 1000, // Convert seconds to milliseconds
        open: quotes.open[i] || 0,
        high: quotes.high[i] || 0,
        low: quotes.low[i] || 0,
        close: quotes.close[i] || 0,
        volume: quotes.volume[i] || 0,
      }));
    } catch (error: any) {
      lastError = error;
      console.log(`[YahooFinance] Attempt failed for ${sym}: ${error.message}`);
      continue;
    }
  }

  throw new Error(lastError?.message || `Failed to fetch data for ${symbol}`);
}

/**
 * Check if symbol is cryptocurrency
 */
export function isCryptoSymbol(symbol: string): boolean {
  const upper = symbol.toUpperCase();
  // Crypto symbols that Yahoo Finance uses -USD suffix
  const cryptoSymbols = [
    'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK',
    'UNI', 'SHIB', 'LTC', 'ATOM', 'VET', 'FIL', 'THETA', 'XLM', 'TRX', 'EOS',
    'AAVE', 'MKR', 'COMP', 'YFI', 'SNX', 'GRT', 'ENJ', 'MANA', 'SAND', 'AXS',
    'FLOW', 'CHZ', 'IOTA', 'NEAR', 'ALGO', 'FTM', 'ONE', 'CAKE', 'BNB', 'XMR',
    'ZEC', 'DASH', 'KSM', 'DOT', 'ICP', 'WAVES', 'HNT', 'HIVE', 'STMX', 'ANKR',
    'AAVE', 'MKR', 'CRV', 'CVX', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'BOME', 'NOT'
  ];
  
  return cryptoSymbols.includes(upper) || upper.endsWith('-USD') || upper.endsWith('-USDT');
}

/**
 * Convert timeframe to Yahoo Finance interval parameter
 */
export function convertToYahooInterval(timeframe: string): string {
  const match = timeframe.match(/(\d+)([mhdwM])/);
  if (!match) return '1h';
  
  const num = parseInt(match[1]);
  const unit = match[2];
  
  if (unit === 'm') {
    if (num <= 1) return '1m';
    if (num <= 2) return '2m';
    if (num <= 5) return '5m';
    if (num <= 15) return '15m';
    if (num <= 30) return '30m';
    return '60m';
  }
  if (unit === 'h') {
    if (num <= 1) return '60m';
    if (num <= 4) return '4h';
    return '1d';
  }
  if (unit === 'd') {
    if (num === 1) return '1d';
    if (num <= 7) return '1wk';
    return '1mo';
  }
  if (unit === 'w') return '1wk';
  if (unit === 'M') return '1mo';
  
  return '1h';
}
