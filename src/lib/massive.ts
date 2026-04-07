// Utility functions for Massive API

const MASSIVE_BASE_URL = "https://api.massive.com/v1";

interface MassiveCandleResponse {
  symbol: string;
  timeframe: string;
  t: number[];  // timestamps in ms
  o: number[];  // opens
  h: number[];  // highs
  l: number[];  // lows
  c: number[];  // closes
  v?: number[]; // volumes (optional)
}

// Fetch OHLC data from Massive API
export async function fetchStockOHLC(
  symbol: string,
  timeframe: string = "1d",
  limit: number = 200
): Promise<MassiveCandleResponse | null> {
  const apiKey = process.env.MASSIVE_API_KEY;
  
  if (!apiKey) {
    console.log(`[Massive] API key not set, skipping ${symbol}`);
    return null;
  }

  console.log(`[Massive] Fetching ${symbol} with timeframe=${timeframe}, limit=${limit}`);
  
  // Try candles endpoint first
  const url = new URL(`${MASSIVE_BASE_URL}/stocks/candles`);
  url.searchParams.append("symbol", symbol);
  url.searchParams.append("interval", timeframe);
  url.searchParams.append("limit", limit.toString());

  try {
    console.log(`[Massive] Request URL: ${url.toString()}`);
    
    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`[Massive] Response status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        console.error(`[Massive] API key invalid or insufficient permissions`);
      } else if (res.status === 404) {
        console.warn(`[Massive] Symbol ${symbol} not found or endpoint not supported`);
      } else {
        console.error(`[Massive] HTTP ${res.status}: ${res.statusText}`);
      }
      return null;
    }

    const data: any = await res.json();
    console.log(`[Massive] Response keys:`, Object.keys(data));
    
    // Validate response structure
    if (!data || !Array.isArray(data.c) || data.c.length === 0) {
      console.warn(`[Massive] Empty or invalid response for ${symbol}:`, data);
      return null;
    }

    return data as MassiveCandleResponse;
  } catch (error: any) {
    console.error(`[Massive] Fetch exception for ${symbol}:`, error.message);
    return null;
  }
}

// Convert Massive response to database-compatible format
export function convertStockToDatabaseFormat(
  raw: MassiveCandleResponse,
  symbol: string,
  timeframe: string
): Array<{ timestamp: string; open: number; high: number; low: number; close: number; volume?: number }> {
  const { t, o, h, l, c, v } = raw;
  
  return t.map((timestamp, index) => ({
    timestamp: new Date(timestamp).toISOString(),
    open: Number(o[index]),
    high: Number(h[index]),
    low: Number(l[index]),
    close: Number(c[index]),
    volume: v ? Number(v[index]) : undefined,
  }));
}
