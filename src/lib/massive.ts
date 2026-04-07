import { OHLCData } from "@/lib/quant-ai/data-collector";

/**
 * Massive.com API Client (v2)
 * Fetches US stock data (candlestick, quotes, fundamentals)
 */

const MASSIVE_BASE = "https://api.massive.com/v2";

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

function getDateRange(limit: number, timeframe: string): { from: string; to: string } {
  const now = new Date();
  const { multiplier, timespan } = convertTimeframeV2(timeframe);
  const toDate = new Date();
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
      msPerCandle = 30 * 24 * 60 * 60 * 1000 * multiplier;
      break;
    default:
      msPerCandle = 60 * 60 * 1000;
  }
  fromDate.setTime(fromDate.getTime() - (limit * msPerCandle));
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  return {
    from: formatDate(fromDate),
    to: formatDate(toDate),
  };
}

export async function fetchStockOHLC(
  symbol: string,
  timeframe: string = "1h",
  count: number = 200
): Promise<any | null> {
  try {
    const apiKey = process.env.MASSIVE_API_KEY;
    if (!apiKey) {
      console.log(`[Massive] API key not set, skipping ${symbol}`);
      return null;
    }

    const { multiplier, timespan } = convertTimeframeV2(timeframe);
    const { from, to } = getDateRange(count, timeframe);

    const url = `${MASSIVE_BASE}/aggs/ticker/${symbol.toUpperCase()}/range/${multiplier}/${timespan}/${from}/${to}`;
    const res = await fetch(`${url}?limit=${count}&adjusted=true`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn(`[Massive] Error ${symbol}: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();

    if (data.results && Array.isArray(data.results)) {
      const results = data.results;
      return {
        c: results.map((r: any) => r.c),
        h: results.map((r: any) => r.h),
        l: results.map((r: any) => r.l),
        o: results.map((r: any) => r.o),
        v: results.map((r: any) => r.v),
        t: results.map((r: any) => r.t),
        s: data.ticker || symbol.toUpperCase(),
      };
    }

    return data;
  } catch (error) {
    console.error(`[Massive] Fetch error for ${symbol}:`, error);
    return null;
  }
}

// Fetch latest quote (real-time price)
export async function fetchStockQuote(symbol: string): Promise<any | null> {
  try {
    const apiKey = process.env.MASSIVE_API_KEY;
    if (!apiKey) {
      console.log(`[Massive] API key not set, skipping quote for ${symbol}`);
      return null;
    }

    const url = `${MASSIVE_BASE}/quotes/${symbol.toUpperCase()}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn(`[Massive] Quote error ${symbol}: ${res.status} ${res.statusText}`);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error(`[Massive] Quote fetch error for ${symbol}:`, error);
    return null;
  };
}

// Convert Massive OHLC response to our OHLCData format
export function convertStockToDatabaseFormat(
  massiveData: any,
  symbol: string,
  timeframe: string
): OHLCData[] {
  const data = massiveData;
  if (!data || !data.c || !Array.isArray(data.c) || data.c.length === 0) {
    return [];
  }
  const { c, h, l, o, v, t } = data;
  const result = [];
  for (let i = 0; i < c.length; i++) {
    result.push({
      symbol: symbol.toUpperCase(),
      timeframe,
      timestamp: new Date(t[i] > 1e12 ? t[i] : t[i] * 1000),
      open: Number(o[i]),
      high: Number(h[i]),
      low: Number(l[i]),
      close: Number(c[i]),
      volume: v ? Number(v[i]) : 0,
    });
  }
  return result;
}
