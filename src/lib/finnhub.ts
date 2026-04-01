/**
 * Finnhub API Client
 * Fetches market data, news, and indicators
 */

const FINNHUB_BASE = "https://finnhub.io/api/v1";

export function getFinnhubHeaders() {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error("FINNHUB_API_KEY is not set");
  }
  return {
    "X-Finnhub-Token": apiKey,
  };
}

// Fetch OHLC candlestick data
// Returns: { c: number[], h: number[], l: number[], o: number[], v: number[], t: number[] }
export async function fetchOHLC(
  symbol: string,
  resolution: string = "1h",
  count: number = 200
) {
  const params = new URLSearchParams({
    symbol: normalizeSymbol(symbol),
    resolution,
    count: count.toString(),
  });

  const res = await fetch(`${FINNHUB_BASE}/stock/candle?${params}`, {
    headers: getFinnhubHeaders(),
    next: { revalidate: 3600 }, // cache 1 hour
  });

  if (!res.ok) {
    throw new Error(`Finnhub OHLC fetch failed: ${res.status}`);
  }

  return await res.json();
}

// Fetch basic financials (PE, EPS, etc)
export async function fetchBasicFinancials(symbol: string) {
  const params = new URLSearchParams({
    symbol: normalizeSymbol(symbol),
  });

  const res = await fetch(`${FINNHUB_BASE}/stock/profile2?${params}`, {
    headers: getFinnhubHeaders(),
    next: { revalidate: 86400 }, // cache 1 day
  });

  if (!res.ok) {
    throw new Error(`Finnhub financials fetch failed: ${res.status}`);
  }

  return await res.json();
}

// Fetch news (crypto & market)
export async function fetchNews(
  category: "crypto" | "forex" | "general" = "crypto",
  count: number = 20
) {
  const params = new URLSearchParams({
    category,
    count: count.toString(),
  });

  const res = await fetch(`${FINNHUB_BASE}/news?${params}`, {
    headers: getFinnhubHeaders(),
    next: { revalidate: 900 }, // cache 15 minutes
  });

  if (!res.ok) {
    throw new Error(`Finnhub news fetch failed: ${res.status}`);
  }

  return await res.json();
}

// Fetch news for a specific company/crypto
export async function fetchCompanyNews(
  symbol: string,
  count: number = 10
) {
  // For crypto, use ticker format (e.g., BTC)
  const ticker = symbol.toUpperCase().replace("USD", "").replace("/", "");
  const params = new URLSearchParams({
    symbol: ticker,
    count: count.toString(),
  });

  const res = await fetch(`${FINNHUB_BASE}/company-news?${params}`, {
    headers: getFinnhubHeaders(),
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    throw new Error(`Finnhub company news fetch failed: ${res.status}`);
  }

  return await res.json();
}

// Fetch sentiment (not available in free tier, placeholder for future)
export async function fetchSentiment(symbol: string) {
  // Finnhub sentiment requires paid subscription
  // This is a placeholder that returns neutral sentiment
  return {
    symbol,
    score: 0,
    confidence: 0.5,
    trend: "neutral",
  };
}

// Helper: normalize symbol format for Finnhub
function normalizeSymbol(symbol: string): string {
  // Convert common formats to Finnhub format
  const map: Record<string, string> = {
    "BTC": "BINANCE:BTCUSDT",
    "ETH": "BINANCE:ETHUSDT",
    "SOL": "BINANCE:SOLUSDT",
    "XRP": "BINANCE:XRPUSDT",
    "XAUT": "TIO:BTCUSD", // For gold, different provider
    "GOLD": "TIO:BTCUSD",
    "EURUSD": "OANDA:EURUSD",
    "USDJPY": "OANDA:USDJPY",
    "OIL": "NYMEX:CL1!", // Crude oil
  };

  const normalized = map[symbol.toUpperCase()];
  if (normalized) return normalized;

  // If it's already in exchange:symbol format, return as-is
  if (symbol.includes(":")) return symbol;

  // Default: assume Binance USDT pair
  return `BINANCE:${symbol.toUpperCase()}USDT`;
}

// Convert Finnhub OHLC response to our OHLCData format
export function convertOHLCtoDatabaseFormat(
  finnhubData: any,
  symbol: string,
  timeframe: string
): any[] {
  if (!finnhubData || !finnhubData.c || finnhubData.c.length === 0) {
    return [];
  }

  const { c, h, l, o, v, t } = finnhubData;
  const data = [];

  for (let i = 0; i < c.length; i++) {
    data.push({
      symbol: symbol.toUpperCase(),
      timeframe,
      timestamp: new Date(t[i] * 1000), // Finnhub returns seconds
      open: o[i],
      high: h[i],
      low: l[i],
      close: c[i],
      volume: v[i],
    });
  }

  return data;
}
