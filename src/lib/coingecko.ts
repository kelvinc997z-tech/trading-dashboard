/**
 * CoinGecko API Client
 * Fetches cryptocurrency market data as an alternative to Binance
 * No API key required (free tier: 10-30 calls/min, use caching)
 *
 * Rate Limits:
 * - Free: 10-30 calls/min (varies)
 * - Pro: Higher limits
 *
 * Rate limiting is essential: add delays between calls or batch requests.
 */

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

// Symbol to CoinGecko ID mapping
// Common crypto symbols -> CoinGecko coin IDs
export const COINGECKO_ID_MAP: Record<string, string> = {
  BTC: "bitcoin",
  BITCOIN: "bitcoin",
  ETH: "ethereum",
  ETHEREUM: "ethereum",
  SOL: "solana",
  SOLANA: "solana",
  XRP: "ripple",
  RIPPLE: "ripple",
  DOGE: "dogecoin",
  DOGECOIN: "dogecoin",
  ADA: "cardano",
  CARDANO: "cardano",
  AVAX: "avalanche-2",
  AVALANCHE: "avalanche-2",
  MATIC: "matic-network",
  POLYGON: "matic-network",
  DOT: "polkadot",
  POLKADOT: "polkadot",
  LTC: "litecoin",
  LITECOIN: "litecoin",
  LINK: "chainlink",
  CHAINLINK: "chainlink",
  UNI: "uniswap",
  UNISWAP: "uniswap",
  SHIB: "shiba-inu",
  SHIBAINU: "shiba-inu",
  XAUT: "tether-gold",
  GOLD: "tether-gold",
  USDT: "tether",
  USDC: "usd-coin",
  BNB: "binancecoin",
  BINANCE: "binancecoin",
  // Add more as needed
};

// Get CoinGecko ID from symbol
export function getCoinGeckoId(symbol: string): string | null {
  const normalized = symbol.toUpperCase().replace(/USDT?/, "").replace(/USD/, "");
  return COINGECKO_ID_MAP[normalized] || null;
}

// Timeframe to CoinGecko interval/days mapping
export function getCoinGeckoParams(
  symbol: string,
  timeframe: string,
  limit: number = 1000
) {
  const coinId = getCoinGeckoId(symbol);
  if (!coinId) {
    throw new Error(`Unsupported symbol for CoinGecko: ${symbol}. Add mapping to COINGECKO_ID_MAP.`);
  }

  const coinGeckoTimeframe = mapTimeframeToCoinGecko(timeframe);

  // For OHLC endpoint:
  // days parameter controls granularity:
  // - 1: hourly (last 24h)
  // - 7: hourly (last 7 days)
  // - 14: hourly (last 14 days)
  // - 30: hourly (last 30 days)
  // - 90: daily (last 90 days)
  // We need enough days to get at least `limit` candles
  // With hourly data: 30 days = 720 candles, 14 days = 336 candles, 7 days = 168 candles
  let daysNeeded: number;
  switch (timeframe) {
    case "1h":
      daysNeeded = Math.ceil(limit / 24);
      break;
    case "4h":
      daysNeeded = Math.ceil(limit / 6);
      break;
    case "1d":
      daysNeeded = limit;
      break;
    default:
      daysNeeded = 30; // default fallback
  }

  // Clamp to CoinGecko limits
  if (timeframe === "1d") {
    daysNeeded = Math.min(daysNeeded, 90);
  } else {
    // hourly data max is 30 days
    daysNeeded = Math.min(daysNeeded, 30);
  }

  return {
    coinId,
    vsCurrency: "usd",
    days: daysNeeded.toString(),
    timeframe,
  };
}

// Map our timeframe to CoinGecko expectations
function mapTimeframeToCoinGecko(timeframe: string): string {
  const map: Record<string, string> = {
    "1m": "minute", // Not supported in public OHLC, would require paid
    "5m": "minute", // Not supported
    "15m": "minute", // Not supported
    "30m": "minute", // Not supported
    "1h": "hourly",
    "4h": "hourly",
    "1d": "daily",
    "1w": "daily",
  };
  return map[timeframe] || "hourly";
}

// Fetch OHLC from CoinGecko
// Returns array of [timestamp, open, high, low, close] (CoinGecko format)
// Note: CoinGecko free OHLC does NOT include volume
export async function fetchCoinGeckoOHLC(
  symbol: string,
  timeframe: string = "1h",
  limit: number = 1000
): Promise<{ symbol: string; timeframe: string; data: any[] }> {
  const { coinId, vsCurrency, days } = getCoinGeckoParams(symbol, timeframe, limit);

  const url = `${COINGECKO_BASE}/coins/${coinId}/ohlc?vs_currency=${vsCurrency}&days=${days}`;
  
  const res = await fetch(url, {
    next: { revalidate: 900 }, // cache 15 minutes (CoinGecko rate limits)
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("CoinGecko rate limit exceeded. Increase cache or reduce call frequency.");
    }
    const errorText = await res.text();
    throw new Error(`CoinGecko OHLC fetch failed: ${res.status} ${errorText}`);
  }

  const data: any[][] = await res.json();
  // CoinGecko returns: [[timestamp(ms), open, high, low, close], ...]
  // We filter to keep only required candles (most recent first)
  // The API returns ascending order (oldest first), so we slice the last `limit` items

  // Sort by timestamp ascending just in case
  data.sort((a, b) => a[0] - b[0]);

  // Take the last `limit` candles
  const sliced = data.slice(-limit);

  return {
    symbol: symbol.toUpperCase(),
    timeframe,
    data: sliced,
  };
}

// Alternative: Use market_chart endpoint for volume data
// Supports hourly intervals for up to 90 days (but may be rate-limited)
export async function fetchCoinGeckoMarketChart(
  symbol: string,
  timeframe: string = "1h",
  days: number = 30
): Promise<{ symbol: string; timeframe: string; prices: number[][]; volumes: number[][] }> {
  const coinId = getCoinGeckoId(symbol);
  if (!coinId) {
    throw new Error(`Unsupported symbol for CoinGecko: ${symbol}`);
  }

  // Map timeframe to interval
  const intervalMap: Record<string, string | null> = {
    "1h": "hourly",
    "4h": null, // Not directly supported, use daily and downsample
    "1d": "daily",
  };
  const interval = intervalMap[timeframe];
  
  const params = new URLSearchParams({
    vs_currency: "usd",
    days: days.toString(),
  });
  if (interval) {
    params.append("interval", interval);
  }

  const url = `${COINGECKO_BASE}/coins/${coinId}/market_chart?${params}`;

  const res = await fetch(url, {
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    throw new Error(`CoinGecko market_chart failed: ${res.status}`);
  }

  const result = await res.json();
  return {
    symbol: symbol.toUpperCase(),
    timeframe,
    prices: result.prices, // [[timestamp, price], ...]
    volumes: result.total_volumes || [], // [[timestamp, volume], ...]
  };
}

// Convert CoinGecko OHLC data to our database format (matches Finnhub pattern)
export function convertCoinGeckoToDatabaseFormat(
  coingeckoData: { symbol: string; timeframe: string; data: any[] },
  includeVolume: boolean = false
): any[] {
  const { symbol, timeframe, data } = coingeckoData;
  const records = [];

  for (const candle of data) {
    // CoinGecko: [timestamp(ms), open, high, low, close]
    records.push({
      symbol: symbol.toUpperCase(),
      timeframe,
      timestamp: new Date(candle[0]),
      open: Number(candle[1]),
      high: Number(candle[2]),
      low: Number(candle[3]),
      close: Number(candle[4]),
      volume: includeVolume ? 0 : undefined, // Volume not available in OHLC endpoint
    });
  }

  return records;
}

// Helper: generate timestamp keys for caching
export function getCoinGeckoCacheKey(
  symbol: string,
  timeframe: string,
  limit: number
): string {
  return `coingecko:${symbol.toUpperCase()}:${timeframe}:${limit}`;
}

// Rate limiting helper for batch requests
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Batch fetch multiple symbols with rate limiting
export async function fetchMultipleCoinGeckoOHLC(
  symbols: Array<{ symbol: string; timeframe: string }>,
  limit: number = 1000,
  delayMs: number = 1500 // CoinGecko free tier: ~1 call per second to be safe
) {
  const results = [];

  for (const { symbol, timeframe } of symbols) {
    try {
      const data = await fetchCoinGeckoOHLC(symbol, timeframe, limit);
      results.push({
        symbol,
        timeframe,
        provider: "coingecko",
        status: "success",
        data,
      });
    } catch (error: any) {
      results.push({
        symbol,
        timeframe,
        provider: "coingecko",
        status: "error",
        error: error.message,
      });
    }

    // Rate limit delay (skip after last)
    if (delayMs > 0 && symbols.indexOf({ symbol, timeframe }) < symbols.length - 1) {
      await delay(delayMs);
    }
  }

  return results;
}
