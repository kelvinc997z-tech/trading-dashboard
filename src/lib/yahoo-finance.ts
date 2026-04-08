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
 * Fetch chart data from Yahoo Finance
 * For crypto, symbol should be like BTC-USD. For stocks, try common formats.
 * @param symbol - Symbol (already formatted for crypto: BTC-USD; for stocks may try variants)
 * @param isCrypto - If true, only use symbol as provided (expects -USD suffix)
 */
export async function fetchYahooFinanceCandles(
  symbol: string,
  range: string = '5d',
  interval: string = '1h',
  isCrypto?: boolean
): Promise<YahooFinanceCandle[]> {
  let formattedSymbol = symbol.toUpperCase();

  // If crypto, ensure -USD suffix and skip variants
  if (isCrypto) {
    if (!formattedSymbol.includes('-')) {
      formattedSymbol = `${formattedSymbol}-USD`;
    }
  } else {
    // For stocks, try both plain and with .US suffix if not already present
    if (!formattedSymbol.includes('.') && !formattedSymbol.includes('-')) {
      formattedSymbol = `${formattedSymbol}.US`;
    }
  }

  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?range=${range}&interval=${interval}`;

  // Retry logic with exponential backoff
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { next: { revalidate: 300 } });
      
      if (!res.ok) {
        if (res.status === 429) {
          const waitMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`[YahooFinance] Rate limited, waiting ${waitMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
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

      // Map to our standard format, filtering out null values
      const candles: YahooFinanceCandle[] = [];
      for (let i = 0; i < timestamp.length; i++) {
        const t = timestamp[i] * 1000;
        const open = quotes.open[i] ?? null;
        const high = quotes.high[i] ?? null;
        const low = quotes.low[i] ?? null;
        const close = quotes.close[i] ?? null;
        const volume = quotes.volume[i] ?? null;
        
        // Skip if all are null
        if (open === null && high === null && low === null && close === null && volume === null) {
          continue;
        }
        
        candles.push({
          timestamp: t,
          open: open || 0,
          high: high || 0,
          low: low || 0,
          close: close || 0,
          volume: volume || 0,
        });
      }
      
      if (candles.length === 0) {
        throw new Error('All candle data is null');
      }
      
      return candles;
    } catch (error: any) {
      lastError = error;
      console.log(`[YahooFinance] Attempt failed for ${formattedSymbol}: ${error.message}`);
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  throw new Error(lastError?.message || `Failed to fetch data for ${formattedSymbol}`);
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
    else if (num <= 2) return '2m';
    else if (num <= 5) return '5m';
    else if (num <= 15) return '15m';
    else if (num <= 30) return '30m';
    else return '60m';
  } else if (unit === 'h') {
    if (num <= 1) return '60m';
    else if (num <= 4) return '4h';
    else return '1d';
  } else if (unit === 'd') {
    if (num === 1) return '1d';
    else if (num <= 7) return '1wk';
    else return '1mo';
  } else if (unit === 'w') {
    return '1wk';
  } else {
    return '1mo';
  }
}
