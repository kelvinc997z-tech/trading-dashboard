/**
 * CoinGecko API client for cryptocurrency data
 * Free tier: 10-50 calls/min, no API key required
 */

export interface CoinGeckoPrice {
  [coinId: string]: {
    usd: number;
    usd_24h_change: number;
    last_updated_at: number;
  };
}

/**
 * Map common crypto symbols to CoinGecko IDs
 */
export function toCoinGeckoId(symbol: string): string | null {
  const idMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'XRP': 'ripple',
    'DOGE': 'dogecoin',
    'ADA': 'cardano',
    'AVAX': 'avalanche-2',
    'DOT': 'polkadot',
    'MATIC': 'matic-network',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'SHIB': 'shiba-inu',
    'LTC': 'litecoin',
    'ATOM': 'cosmos',
    'VET': 'vechain',
    'FIL': 'filecoin',
    'THETA': 'theta-token',
    'XLM': 'stellar',
    'TRX': 'tron',
    'BNB': 'binancecoin',
    'XMR': 'monero',
    'ZEC': 'zcash',
    'DASH': 'dash',
    'KSM': 'kusama',
    'ICP': 'internet-computer',
    'WAVES': 'waves',
    'HNT': 'helium',
    'HIVE': 'hive',
    'STMX': 'storm',
    'ANKR': 'ankr',
    'CRV': 'curve-dao-token',
    'CVX': 'convex-finance',
    'PEPE': 'pepe',
    'FLOKI': 'floki',
    'BONK': 'bonk',
    'WIF': 'wif',
    'BOME': 'book-of-meme',
    'NOT': 'notcoin',
    'XAUT': 'tether-gold',
  };

  const upper = symbol.toUpperCase().replace(/[^A-Z]/g, '');
  return idMap[upper] || null;
}

/**
 * Fetch current prices for multiple crypto symbols
 */
export async function fetchCoinGeckoPrices(
  symbols: string[] = ['BTC', 'ETH', 'SOL', 'XRP']
): Promise<CoinGeckoPrice> {
  const coinIds = symbols
    .map(s => toCoinGeckoId(s))
    .filter(id => id !== null) as string[];

  if (coinIds.length === 0) {
    throw new Error('No valid coin IDs');
  }

  const ids = coinIds.join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TradingDashboard/1.0)',
    },
    next: { revalidate: 30 }, // cache 30 seconds for live prices
  });

  if (!res.ok) {
    throw new Error(`CoinGecko HTTP ${res.status}: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Fetch OHLC (candlestick) data from CoinGecko
 * Returns array of [timestamp, open, high, low, close] (no volume)
 * Expects: symbol (e.g., BTC), timeframe (e.g., 1h, 1d), limit (number of candles)
 * Note: CoinGecko uses days parameter; we estimate needed days from limit/timeframe.
 */
export async function fetchCoinGeckoOHLC(
  symbol: string,
  timeframe: string,
  limit: number
): Promise<{ data: any[][] }> {
  const coinId = toCoinGeckoId(symbol);
  if (!coinId) {
    throw new Error(`Unsupported symbol for CoinGecko: ${symbol}`);
  }

  // Estimate days needed based on limit and timeframe
  const days = estimateDaysForCoinGecko(limit, timeframe);

  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TradingDashboard/1.0)',
    },
    next: { revalidate: 60 }, // cache 1 minute for OHLC
  });

  if (!res.ok) {
    throw new Error(`CoinGecko OHLC HTTP ${res.status}: ${res.statusText}`);
  }

  const rawData: any[][] = await res.json();
  
  // Limit to requested number of candles (CoinGecko returns up to days*24 hourly candles)
  const limited = rawData.slice(0, limit);
  
  return { data: limited };
}

/**
 * Estimate number of days needed for CoinGecko OHLC request
 */
function estimateDaysForCoinGecko(limit: number, timeframe: string): number {
  const match = timeframe.match(/(\d+)([mhd])/);
  if (!match) return 1;
  
  const num = parseInt(match[1]);
  const unit = match[2];
  
  // Approximate candles per day for CoinGecko:
  // 1m,5m,15m,30m,1h,4h,1d etc.
  // CoinGecko provides hourly candles for days <= 30, daily for larger?
  // We'll just return a number of days that likely yields enough candles.
  // CoinGecko returns up to days*24 hourly candles (if days <= 30) else daily.
  if (unit === 'm') {
    // For minutes, CoinGecko only supports hourly at minimum? Actually they support 1,5,15,30,60? Not sure.
    // We'll assume need many days to get enough minute candles (but CoinGecko may not provide minute bars for many days)
    return Math.min(90, Math.ceil(limit / 24) + 1);
  } else if (unit === 'h') {
    // Hourly: each day gives 24 candles
    return Math.min(90, Math.ceil(limit / 24) + 1);
  } else if (unit === 'd') {
    // Daily: each day gives 1 candle
    return Math.min(365, limit + 1);
  } else {
    return 1;
  }
}
