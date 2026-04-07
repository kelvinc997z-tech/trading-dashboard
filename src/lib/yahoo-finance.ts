/**
 * Yahoo Finance unofficial API client
 * For cryptocurrency data (BTC-USD, ETH-USD, etc.)
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
 * Fetch crypto chart data from Yahoo Finance
 * @param symbol - Crypto symbol (e.g., BTC-USD, ETH-USD)
 * @param range - Time range: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
 * @param interval - Candle interval: 1m, 2m, 5m, 15m, 30m, 60m, 1d, 1wk, 1mo
 */
export async function fetchYahooFinanceCandles(
  symbol: string,
  range: string = '5d',
  interval: string = '1h'
): Promise<YahooFinanceCandle[]> {
  const formattedSymbol = symbol.toUpperCase().includes('-') 
    ? symbol.toUpperCase() 
    : `${symbol.toUpperCase()}-USD`;

  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?range=${range}&interval=${interval}`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
    next: { revalidate: 300 }, // cache 5 minutes
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance HTTP ${res.status}: ${res.statusText}`);
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
}

/**
 * Check if symbol is cryptocurrency
 * Crypto symbols typically: BTC, ETH, SOL, XRP, DOGE, etc. ending with -USD or -USDT
 */
export function isCryptoSymbol(symbol: string): boolean {
  const upper = symbol.toUpperCase();
  const cryptoSymbols = [
    'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK',
    'UNI', 'SHIB', 'LTC', 'ATOM', 'VET', 'FIL', 'THETA', 'XLM', 'TRX', 'EOS',
    'AAVE', 'MKR', 'COMP', 'YFI', 'SNX', 'GRT', 'ENJ', 'MANA', 'SAND', 'AXS',
    'FLOW', 'CHZ', 'IOTA', 'NEAR', 'ALGO', 'FTM', 'ONE', 'CAKE', 'BNB', 'XMR',
    'ZEC', 'DASH', 'KSM', 'DOT', 'ICP', 'WAVES', 'HNT', 'HIVE', 'STMX', 'ANKR'
  ];
  
  return cryptoSymbols.includes(upper) || upper.endsWith('-USD') || upper.endsWith('-USDT');
}
