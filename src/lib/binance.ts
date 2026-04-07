/**
 * Binance API client for cryptocurrency data
 * Free, no API key required for public endpoints
 */

export interface BinanceKline {
  timestamp: number; // milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Convert symbol to Binance format (e.g., BTC-USD -> BTCUSDT)
 */
function toBinanceSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  // Remove -USD, -USDT, .US suffixes
  let base = upper.replace(/-USD$|-USDT$|\.US$/, '');
  // Ensure USDT pair
  return base + 'USDT';
}

/**
 * Convert timeframe to Binance interval
 * Binance intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
 */
function toBinanceInterval(timeframe: string): string {
  const match = timeframe.match(/(\d+)([mhdwM])/);
  if (!match) return '1d';
  
  const num = parseInt(match[1]);
  const unit = match[2];
  
  if (unit === 'm') {
    if (num === 1) return '1m';
    if (num === 3) return '3m';
    if (num === 5) return '5m';
    if (num === 15) return '15m';
    if (num === 30) return '30m';
    return '1m'; // fallback
  }
  if (unit === 'h') {
    if (num === 1) return '1h';
    if (num === 2) return '2h';
    if (num === 4) return '4h';
    if (num === 6) return '6h';
    if (num === 8) return '8h';
    if (num === 12) return '12h';
    return '1h';
  }
  if (unit === 'd') {
    if (num === 1) return '1d';
    if (num === 3) return '3d';
    return '1d';
  }
  if (unit === 'w') return '1w';
  if (unit === 'M') return '1M';
  
  return '1d';
}

/**
 * Fetch OHLC data from Binance
 */
export async function fetchBinanceKlines(
  symbol: string,
  timeframe: string = '1d',
  limit: number = 200
): Promise<BinanceKline[]> {
  const binanceSymbol = toBinanceSymbol(symbol);
  const interval = toBinanceInterval(timeframe);
  
  // Binance max limit is 1000 per request
  const safeLimit = Math.min(limit, 1000);
  
  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${safeLimit}`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TradingDashboard/1.0)',
    },
    next: { revalidate: 60 }, // cache 1 minute (crypto needs fresh data)
  });

  if (!res.ok) {
    throw new Error(`Binance HTTP ${res.status}: ${res.statusText}`);
  }

  const data: any[] = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No klines data from Binance');
  }

  return data.map(k => ({
    timestamp: parseInt(k[0]),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}
