// Utility functions for Massive API

const MASSIVE_BASE_URL = "https://api.massive.com/v1";

const ENDPOINT_VARIANTS = [
  "/stocks/candles",
  "/stocks/ohlc",
  "/market/stocks/candles",
  "/market/stocks/ohlc",
];

interface MassiveCandleResponse {
  symbol: string;
  timeframe: string;
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  v?: number[];
}

// Generate symbol variants to try
function getSymbolVariants(rawSymbol: string): string[] {
  const variants = new Set<string>();
  variants.add(rawSymbol);
  variants.add(rawSymbol.toUpperCase());
  variants.add(rawSymbol.toLowerCase());
  variants.add(`${rawSymbol}.US`);
  variants.add(`NASDAQ:${rawSymbol}`);
  variants.add(`NYSE:${rawSymbol}`);
  variants.add(`${rawSymbol}.XNAS`);
  variants.add(`${rawSymbol}.XNYS`);
  return Array.from(variants);
}

// Fetch OHLC data from Massive API with retries
export async function fetchStockOHLC(
  symbol: string,
  timeframe: string = "1d",
  limit: number = 200
): Promise<MassiveCandleResponse | null> {
  const apiKey = process.env.MASSIVE_API_KEY;

  if (!apiKey) {
    console.error(`[Massive] ❌ API key not set`);
    return null;
  }

  const symbolVariants = getSymbolVariants(symbol);
  console.log(`[Massive] 🔄 Trying ${symbolVariants.length} symbol formats for ${symbol}`);

  for (const sym of symbolVariants) {
    for (const endpoint of ENDPOINT_VARIANTS) {
      const url = new URL(`${MASSIVE_BASE_URL}${endpoint}`);
      url.searchParams.append("symbol", sym);
      url.searchParams.append("interval", timeframe);
      url.searchParams.append("limit", limit.toString());

      console.log(`[Massive] 🌐 GET ${url.toString()}`);

      try {
        const res = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        console.log(`[Massive] 📡 Response ${res.status} ${res.statusText}`);

        if (!res.ok) {
          // Log error body if possible
          try {
            const errorBody = await res.text();
            if (errorBody) console.log(`[Massive] 🚨 Error body: ${errorBody.slice(0, 200)}`);
          } catch (e) {
            // ignore
          }
          continue; // try next variant
        }

        const data: any = await res.json();
        console.log(`[Massive] ✅ Success with symbol=${sym}, endpoint=${endpoint}. Response keys:`, Object.keys(data));

        // Check data structure
        if (!data || !Array.isArray(data.c) || data.c.length === 0) {
          console.warn(`[Massive] ⚠️ Empty or invalid data structure for ${sym}`);
          continue;
        }

        // Success!
        return {
          symbol: sym,
          timeframe,
          t: data.t,
          o: data.o,
          h: data.h,
          l: data.l,
          c: data.c,
          v: data.v,
        } as MassiveCandleResponse;
      } catch (error: any) {
        console.error(`[Massive] 💥 Fetch exception for ${sym} via ${endpoint}:`, error.message);
        continue;
      }
    }
  }

  console.error(`[Massive] ❌ All attempts failed for ${symbol}`);
  return null;
}

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
