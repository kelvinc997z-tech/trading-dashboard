/**
 * Massive.com API Client
 * Fetches US stock data (candlestick, quotes, fundamentals)
 */

const MASSIVE_BASE = "https://api.massive.com/v1"; // Adjust if different

export function getMassiveHeaders() {
  const apiKey = process.env.MASSIVE_API_KEY;
  if (!apiKey) {
    throw new Error("MASSIVE_API_KEY is not set");
  }
  return {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

// Fetch stock OHLC data
export async function fetchStockOHLC(
  symbol: string,
  timeframe: string = "1h",
  count: number = 200
) {
  // Convert timeframe to Massive format (if needed)
  const interval = convertTimeframe(timeframe);
  
  const params = new URLSearchParams({
    symbol: symbol.toUpperCase(),
    interval,
    limit: count.toString(),
  });

  const res = await fetch(`${MASSIVE_BASE}/stocks/candles?${params}`, {
    headers: getMassiveHeaders(),
    next: { revalidate: 3600 }, // cache 1 hour
  });

  if (!res.ok) {
    throw new Error(`Massive API error: ${res.status} ${res.statusText}`);
  }

  return await res.json();
}

// Fetch latest quote (real-time price)
export async function fetchStockQuote(symbol: string) {
  const res = await fetch(`${MASSIVE_BASE}/stocks/quote?symbol=${symbol.toUpperCase()}`, {
    headers: getMassiveHeaders(),
    next: { revalidate: 60 }, // cache 1 minute
  });

  if (!res.ok) {
    throw new Error(`Massive quote fetch failed: ${res.status}`);
  }

  return await res.json();
}

// Helper: convert timeframe to Massive interval format
function convertTimeframe(timeframe: string): string {
  const map: Record<string, string> = {
    "1m": "1min",
    "5m": "5min",
    "15m": "15min",
    "30m": "30min",
    "1h": "1hour",
    "4h": "4hour",
    "1d": "1day",
    "1w": "1week",
    "1mo": "1month",
  };
  return map[timeframe] || "1hour";
}

// Convert Massive OHLC response to our OHLCData format
export function convertStockToDatabaseFormat(
  massiveData: any,
  symbol: string,
  timeframe: string
): any[] {
  // Adjust based on actual Massive API response structure
  // Assuming similar to Finnhub: { c: [], h: [], l: [], o: [], v: [], t: [] }
  if (!massiveData || !massiveData.c || massiveData.c.length === 0) {
    return [];
  }

  const { c, h, l, o, v, t } = massiveData;
  const data = [];

  for (let i = 0; i < c.length; i++) {
    data.push({
      symbol: symbol.toUpperCase(),
      timeframe,
      timestamp: new Date(t[i] * 1000), // Massive might return seconds or ms
      open: o[i],
      high: h[i],
      low: l[i],
      close: c[i],
      volume: v[i],
    });
  }

  return data;
}
