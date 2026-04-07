import { OHLCData } from "@/lib/quant-ai/data-collector";

// Utility functions for Massive API

const MASSIVE_BASE_URL = "https://api.massive.com/v2";

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

interface MassiveQuoteResponse {
  symbol: string;
  price: number;
  change?: number;
  changePercent?: number;
  timestamp?: number;
}

// FALLBACK HARDCODED KEY - use only if env var missing
const FALLBACK_MASSIVE_KEY = "EOxPULzhbFSBLBGzxI4yN5TnLtiplHwp";

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

// Convert timeframe to Massive v2 format
function convertTimeframeV2(timeframe: string): { multiplier: number; timespan: string } {
  const match = timeframe.match(/(\d+)([mhdwM])/);
  if (!match) {
    return { multiplier: 1, timespan: "hour" };
  }
  const mult = parseInt(match[1]);
  const unit = match[2];
  const timespanMap: Record<string, string> = {
    "m": "minute",
    "h": "hour",
    "d": "day",
    "w": "week",
    "M": "month"
  };
  return {
    multiplier: mult,
    timespan: timespanMap[unit] || "hour"
  };
}

// Calculate date range for fetching
function getDateRange(limit: number, timeframe: string): { from: string; to: string } {
  const now = new Date();
  const { multiplier, timespan } = convertTimeframeV2(timeframe);

  // Estimate end date (usually now or previous bar)
  const toDate = new Date(now);

  // Estimate start date based on limit and timeframe
  const fromDate = new Date(now);
  let msPerCandle: number;
  switch (timespan) {
    case "minute":
      msPerCandle = 60 * 1000 * multiplier;
      break;
    case "hour":
      msPerCandle = 60 * 60 * 1000 * multiplier;
      break;
    case "day":
      msPerCandle = 24 * 60 * 60 * 1000 * multiplier;
      break;
    case "week":
      msPerCandle = 7 * 24 * 60 * 60 * 1000 * multiplier;
      break;
    case "month":
      msPerCandle = 30 * 24 * 60 * 60 * 1000 * multiplier; // approx
      break;
    default:
      msPerCandle = 60 * 60 * 1000; // default 1 hour
  }

  fromDate.setTime(fromDate.getTime() - (limit * msPerCandle));

  // Format as YYYY-MM-DD
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    from: formatDate(fromDate),
    to: formatDate(toDate)
  };
}

export async function fetchStockOHLC(
  symbol: string,
  timeframe: string = "1d",
  limit: number = 200
): Promise<MassiveCandleResponse | null> {
  // Get API key from env or fallback
  let apiKey = process.env.MASSIVE_API_KEY;
  if (!apiKey) {
    apiKey = FALLBACK_MASSIVE_KEY;
    console.log(`[Massive] ⚠️ Using FALLBACK API key (env not set)`);
  }

  const symbolVariants = getSymbolVariants(symbol);
  console.log(`[Massive] 🔄 Trying ${symbolVariants.length} symbol formats for ${symbol} with key: ${apiKey.slice(0,8)}...`);

  // Try endpoint v2 first (new format)
  for (const sym of symbolVariants) {
    try {
      const { multiplier, timespan } = convertTimeframeV2(timeframe);
      const { from, to } = getDateRange(limit, timeframe);

      const url = new URL(`${MASSIVE_BASE_URL}/aggs/ticker/${sym}/range/${multiplier}/${timespan}/${from}/${to}`);
      url.searchParams.append("limit", limit.toString());
      url.searchParams.append("adjusted", "true");

      console.log(`[Massive v2] 🌐 GET ${url.toString()}`);

      const res = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`[Massive v2] 📡 Response ${res.status} ${res.statusText}`);

      if (!res.ok) {
        if (res.status === 404) {
          console.warn(`[Massive v2] Symbol ${sym} not found or endpoint not available`);
          continue;
        }
        try {
          const errorBody = await res.text();
          if (errorBody) console.log(`[Massive v2] 🚨 Error body: ${errorBody.slice(0, 200)}`);
        } catch (e) {}
        continue;
      }

      const data: any = await res.json();
      console.log(`[Massive v2] ✅ Success with symbol=${sym}. Response keys:`, Object.keys(data));

      // Check if data has results array (v2 format)
      if (!data || !data.results || !Array.isArray(data.results) || data.results.length === 0) {
        console.warn(`[Massive v2] ⚠️ Empty or invalid data structure for ${sym}`);
        continue;
      }

      // Convert v2 response to our internal format
      const results = data.results;
      // v2 timestamps are already in milliseconds
      const response: MassiveCandleResponse = {
        symbol: sym,
        timeframe,
        t: results.map((r: any) => r.t || r.timestamp),
        o: results.map((r: any) => r.o),
        h: results.map((r: any) => r.h),
        l: results.map((r: any) => r.l),
        c: results.map((r: any) => r.c),
        v: results.map((r: any) => r.v || r.volume),
      };

      return response;
    } catch (error: any) {
      console.error(`[Massive v2] 💥 Fetch exception for ${sym}:`, error.message);
      continue;
    }
  }

  // If v2 fails, try legacy v1 endpoints (fallback)
  console.log(`[Massive] 🔄 Falling back to legacy v1 endpoints...`);
  for (const sym of symbolVariants) {
    for (const endpoint of ENDPOINT_VARIANTS) {
      const url = new URL(`${MASSIVE_BASE_URL.replace("/v2", "/v1")}${endpoint}`);
      url.searchParams.append("symbol", sym);
      url.searchParams.append("interval", timeframe);
      url.searchParams.append("limit", limit.toString());

      console.log(`[Massive v1] 🌐 GET ${url.toString()}`);

      try {
        const res = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        console.log(`[Massive v1] 📡 Response ${res.status} ${res.statusText}`);

        if (!res.ok) {
          try {
            const errorBody = await res.text();
            if (errorBody) console.log(`[Massive v1] 🚨 Error body: ${errorBody.slice(0, 200)}`);
          } catch (e) {}
          continue;
        }

        const data: any = await res.json();
        console.log(`[Massive v1] ✅ Success with symbol=${sym}, endpoint=${endpoint}. Response keys:`, Object.keys(data));

        if (!data || !Array.isArray(data.c) || data.c.length === 0) {
          console.warn(`[Massive v1] ⚠️ Empty or invalid data structure for ${sym}`);
          continue;
        }

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
        console.error(`[Massive v1] 💥 Fetch exception for ${sym} via ${endpoint}:`, error.message);
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
): OHLCData[] {
  const { t, o, h, l, c, v } = raw;

  return t.map((timestamp, index) => ({
    symbol: symbol.toUpperCase(),
    timeframe,
    // v2 returns ms, v1 returns seconds. Normalize to ms for Date constructor.
    timestamp: new Date(timestamp > 1e12 ? timestamp : timestamp * 1000),
    open: Number(o[index]),
    high: Number(h[index]),
    low: Number(l[index]),
    close: Number(c[index]),
    volume: v ? Number(v[index]) : 0,
  }));
}

// Fetch latest quote (real-time price)
export async function fetchStockQuote(symbol: string): Promise<MassiveQuoteResponse | null> {
  try {
    const apiKey = process.env.MASSIVE_API_KEY;
    if (!apiKey) {
      console.log(`[Massive] API key not set, skipping quote for ${symbol}`);
      return null;
    }

    // Try v2 quote endpoint first
    const urlv2 = new URL(`${MASSIVE_BASE_URL}/quotes/${symbol.toUpperCase()}`);
    const res = await fetch(urlv2.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }, // cache 1 minute
    });

    if (res.ok) {
      const data: any = await res.json();
      return {
        symbol: symbol.toUpperCase(),
        price: data.p || data.c?.[0] || data.price || 0,
        change: data.pc || data.change,
        changePercent: data.pcp || data.changePercent,
        timestamp: Date.now(),
      };
    }

    // Fallback to v1 quote endpoint
    const urlv1 = new URL(`${MASSIVE_BASE_URL.replace("/v2", "/v1")}/stocks/quote`);
    urlv1.searchParams.append("symbol", symbol.toUpperCase());
    const resv1 = await fetch(urlv1.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resv1.ok) {
      console.warn(`[Massive] Quote error ${symbol}: ${resv1.status} ${resv1.statusText}`);
      return null;
    }

    const data: any = await resv1.json();
    return {
      symbol: symbol.toUpperCase(),
      price: data.price || data.latestPrice || data.c?.[0] || 0,
      change: data.change,
      changePercent: data.changePercent,
      timestamp: data.timestamp || Date.now(),
    };
  } catch (error) {
    console.error(`[Massive] Quote fetch error for ${symbol}:`, error);
    return null;
  }
}
