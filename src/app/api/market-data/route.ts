import { NextRequest, NextResponse } from "next/server";

const CRYPTO_SYMBOLS = ["XAUT", "BTC", "ETH", "SOL", "XRP", "KAS"];
const US_STOCKS = ["AAPL", "AMD", "NVDA", "MSFT", "GOOGL", "TSM"];
const SUPPORTED_SYMBOLS = [...CRYPTO_SYMBOLS, ...US_STOCKS];

// Normalize symbol to internal format (XAUT for gold)
function normalizeSymbol(symbol: string): string {
  if (symbol === "XAU") return "XAUT"; // Alias: XAU → XAUT
  return symbol;
}

// Map our symbols to CoinMarketCap format
function getCoinMarketCapSymbol(symbol: string): string {
  // CMC uses standard symbols: XAU, BTC, ETH, SOL, XRP, KAS
  const map: Record<string, string> = {
    "XAUT": "XAU", // Gold
    "BTC": "BTC",
    "ETH": "ETH",
    "SOL": "SOL",
    "XRP": "XRP",
    "KAS": "KAS"
  };
  return map[symbol] || symbol;
}

// Fetch from CoinMarketCap (requires COINMARKETCAP_API_KEY)
async function fetchCoinMarketCapOHLC(symbol: string, timeframe: string = "1h", limit: number = 200) {
  const apiKey = process.env.COINMARKETCAP_API_KEY;
  if (!apiKey) {
    console.log(`[CMC] API key not set, skipping ${symbol}`);
    return null;
  }

  console.log(`[CMC] Fetching ${symbol} ${timeframe} (limit: ${limit})`);
  // CMC requires convert to USD and returns latest quotes
  // For OHLC history, we need to use the v2 endpoint with historical data
  // Note: CMC free tier has limited historical access
  const url = new URL(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/ohlcv/historical`);
  url.searchParams.append("symbol", cmcSymbol);
  url.searchParams.append("convert", "USD");
  url.searchParams.append("time_period", timeframe);
  url.searchParams.append("time_start", new Date(Date.now() - limit * 60 * 60 * 1000).toISOString());
  url.searchParams.append("time_end", new Date().toISOString());
  url.searchParams.append("count", limit.toString());

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "X-CMC_PRO_API_KEY": apiKey,
        "Accept": "application/json"
      }
    });
    if (!res.ok) {
      if (res.status === 429) {
        console.warn(`[MarketData] CMC rate limit hit for ${symbol}`);
      } else {
        console.error(`[MarketData] CMC fetch error ${symbol}: ${res.status}`);
      }
      return null;
    }
    const data: any = await res.json();
    
    console.log(`[CMC] Response for ${symbol}:`, { status: res.status, quotesCount: data?.data?.quotes?.length || 0 });
    
    // CMC v2 OHLC response structure
    // {
    //   "data": {
    //     "symbol": "BTC",
    //     "quotes": [...]
    //   }
    // }
    const quotes = data?.data?.quotes || [];
    if (!Array.isArray(quotes) || quotes.length === 0) return null;

    const history = quotes.map((q: any) => ({
      time: q.timestamp,
      open: Number(q.open),
      high: Number(q.high),
      low: Number(q.low),
      close: Number(q.close),
      price: Number(q.close),
      volume: Number(q.volume),
    })).sort((a, b) => a.time.localeCompare(b.time));

    if (history.length === 0) return null;

    const current = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : current;
    const change = current.close - previous.close;
    const changePercent = (change / previous.close) * 100;

    return {
      symbol,
      source: "CoinMarketCap",
      current: {
        price: current.close,
        close: current.close,
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        high: current.high,
        low: current.low,
      },
      history,
    };
  } catch (e) {
    console.error(`[MarketData] CoinMarketCap fetch exception for ${symbol}:`, e);
    return null;
  }
}

// Map our symbols to CoinAPI format
function getCoinAPISymbol(symbol: string): string {
  const map: Record<string, string> = {
    "XAUT": "XAU-USD", // Gold
    "BTC": "BTC-USD",
    "ETH": "ETH-USD",
    "SOL": "SOL-USD",
    "XRP": "XRP-USD",
    "KAS": "KAS-USD"
  };
  return map[symbol] || `${symbol}-USD`;
}

// Fetch from CoinAPI (requires COINAPI_API_KEY)
async function fetchCoinAPIOHLC(symbol: string, timeframe: string = "1h", limit: number = 200) {
  const apiKey = process.env.COINAPI_API_KEY;
  if (!apiKey) return null;

  const coinSymbol = getCoinAPISymbol(symbol);
  // CoinAPI uses ISO 8601 periods: 1h, 4h, 1d, etc.
  const period = timeframe;
  
  // Calculate date range (last N periods)
  const endDate = new Date();
  let startDate = new Date();
  const limitDays = Math.ceil(limit * getPeriodHours(timeframe) / 24);
  startDate.setDate(endDate.getDate() - limitDays);
  
  const url = new URL(`https://rest.coinapi.io/v1/ohlcv/${coinSymbol}/history`);
  url.searchParams.append("period_id", period);
  url.searchParams.append("time_start", startDate.toISOString());
  url.searchParams.append("time_end", endDate.toISOString());
  url.searchParams.append("limit", limit.toString());

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "X-CoinAPI-Key": apiKey,
        "Accept": "application/json"
      }
    });
    if (!res.ok) {
      console.error(`[MarketData] CoinAPI fetch error ${symbol}: ${res.status}`);
      return null;
    }
    const data: any[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    // Transform CoinAPI format to our format
    // CoinAPI returns: [
    //   {
    //     time_period_start: "2024-01-01T00:00:00.0000000Z",
    //     time_period_end: "2024-01-01T01:00:00.0000000Z",
    //     time_open: "2024-01-01T00:00:00.0000000Z",
    //     time_close: "2024-01-01T01:00:00.0000000Z",
    //     price_open: "50000.0",
    //     price_high: "50500.0",
    //     price_low: "49900.0",
    //     price_close: "50300.0",
    //     volume_traded: "123.45",
    //     trades_count: 100
    //   }
    // ]
    const history = data.map(item => ({
      time: item.time_period_start,
      open: Number(item.price_open),
      high: Number(item.price_high),
      low: Number(item.price_low),
      close: Number(item.price_close),
      price: Number(item.price_close),
      volume: Number(item.volume_traded),
    })).sort((a, b) => a.time.localeCompare(b.time));

    if (history.length === 0) return null;

    const current = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : current;
    const change = current.close - previous.close;
    const changePercent = (change / previous.close) * 100;

    return {
      symbol,
      source: "CoinAPI",
      current: {
        price: current.close,
        close: current.close,
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        high: current.high,
        low: current.low,
      },
      history,
    };
  } catch (e) {
    console.error(`[MarketData] CoinAPI fetch exception for ${symbol}:`, e);
    return null;
  }
}

// Fetch from FreeCryptoAPI (requires API key)
async function fetchFreeCryptoAPIOHLC(symbol: string, timeframe: string = "1h", limit: number = 200) {
  const apiKey = process.env.FREECRYPTOAPI_API_KEY;
  if (!apiKey) return null;

  const coinSymbol = getCoinAPISymbol(symbol);
  const intervalMap: Record<string, string> = {
    "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
    "1h": "1h", "4h": "4h", "1d": "1d"
  };
  const interval = intervalMap[timeframe];
  if (!interval) {
    console.warn(`[MarketData] FreeCryptoAPI: timeframe ${timeframe} not supported`);
    return null;
  }

  const url = `https://freeapi.coincap.io/v2/assets/${coinSymbol}/history?interval=${interval}&limit=${limit}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });
    if (!res.ok) {
      console.error(`[MarketData] FreeCryptoAPI fetch error ${symbol}: ${res.status}`);
      return null;
    }
    const json = await res.json();
    const data = json.data || [];
    if (!Array.isArray(data) || data.length === 0) return null;

    const history = data.map(item => ({
      time: new Date(Number(item.time)).toISOString(),
      open: Number(item.price),
      high: Number(item.price),
      low: Number(item.price),
      close: Number(item.price),
      price: Number(item.price),
      volume: Number(item.volume),
    })).sort((a, b) => a.time.localeCompare(b.time));

    if (history.length === 0) return null;

    const current = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : current;
    const change = current.close - previous.close;
    const changePercent = (change / previous.close) * 100;

    return {
      symbol,
      source: "FreeCryptoAPI",
      current: {
        price: current.close,
        close: current.close,
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        high: current.high,
        low: current.low,
      },
      history,
    };
  } catch (e) {
    console.error(`[MarketData] FreeCryptoAPI fetch exception for ${symbol}:`, e);
    return null;
  }
}

// Fetch aggregated OHLC from multiple exchanges (volume-weighted average)
async function fetchAggregatedOHLC(symbol: string, timeframe: string = "1h", limit: number = 200) {
  const exchanges = [
    { name: "binance", fetch: (s: string, t: string, l: number) => fetchBinanceOHLC(s, t, l) },
    { name: "coingecko", fetch: (s: string, t: string, l: number) => fetchCoinGeckoOHLC(s, t, l) },
    { name: "coinglass_spot", fetch: (s: string, t: string, l: number) => fetchCoinglassSpotOHLC(s, t, l) },
    { name: "coinglass_futures", fetch: (s: string, t: string, l: number) => fetchCoinglassFuturesOHLC(s, t, l) },
  ];

  // Fetch from all exchanges in parallel
  const results = await Promise.allSettled(
    exchanges.map(async (ex) => {
      try {
        const data = await ex.fetch(symbol, timeframe, limit);
        if (data) {
          return { source: ex.name, data };
        }
      } catch (e) {
        console.warn(`[Aggregated] ${ex.name} failed for ${symbol}:`, e);
      }
      return null;
    })
  );

  const validResults = results
    .filter((r): r is PromiseFulfilledResult<{ source: string; data: any }> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);

  if (validResults.length === 0) {
    console.log(`[Aggregated] No exchange returned data for ${symbol}`);
    return null;
  }

  // Use the most complete/longest history as base
  const bestData = validResults.sort((a, b) => b.data.history.length - a.data.history.length)[0].data;

  // If we have multiple sources, attempt to reconcile/validate current price
  if (validResults.length > 1) {
    const prices = validResults.map((r) => r.data.current.price);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const maxDeviation = Math.max(...prices.map((p) => Math.abs(p - avgPrice) / avgPrice));
    
    // If prices differ by > 2%, log warning (possible stale data)
    if (maxDeviation > 0.02) {
      console.warn(`[Aggregated] Price divergence for ${symbol}:`, 
        validResults.map((r) => ({ source: r.source, price: r.data.current.price })),
        `avg: ${avgPrice.toFixed(2)}`
      );
    }

    // Optionally adjust current price to average
    bestData.current.price = Number(avgPrice.toFixed(2));
    bestData.current.close = bestData.current.price;
    bestData.source = "Aggregated";
  } else {
    bestData.source = validResults[0].source;
  }

  return bestData;
}

function getPeriodHours(timeframe: string): number {
  switch (timeframe) {
    case "1m": return 1/60;
    case "5m": return 5/60;
    case "15m": return 15/60;
    case "30m": return 30/60;
    case "1h": return 1;
    case "2h": return 2;
    case "4h": return 4;
    case "6h": return 6;
    case "8h": return 8;
    case "12h": return 12;
    case "1d": return 24;
    case "3d": return 72;
    case "1w": return 168;
    case "1M": return 730; // approx
    default: return 1;
  }
}

function generateOHLC(symbol: string, timeframe: string = "1h") {
  const basePrices: Record<string, number> = {
    "XAUT": 2350,
    "BTC": 65000,
    "ETH": 3500,
    "SOL": 150,
    "XRP": 0.6,
    "KAS": 0.17,
    "AAPL": 170,
    "AMD": 120,
    "NVDA": 240,
    "MSFT": 330,
    "GOOGL": 140,
  };
  const base = basePrices[symbol] || 100;
  
  let count = 24;
  let intervalMs = 60 * 60 * 1000;
  switch (timeframe) {
    case "4h": count = 30; intervalMs = 4 * 60 * 60 * 1000; break;
    case "1d": count = 30; intervalMs = 24 * 60 * 60 * 1000; break;
    case "1w": count = 12; intervalMs = 7 * 24 * 60 * 60 * 1000; break;
    case "1m": count = 60; intervalMs = 60 * 1000; break;
    case "5m": count = 100; intervalMs = 5 * 60 * 1000; break;
    case "15m": count = 100; intervalMs = 15 * 60 * 1000; break;
  }

  const now = new Date();
  const history: Array<{ time: string; open: number; high: number; low: number; close: number; price: number; volume: number }> = [];
  let lastClose = base + (Math.random() - 0.5) * 20;
  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - 1 - i) * intervalMs);
    const open = lastClose;
    const volatilityFactor = intervalMs / (60 * 60 * 1000);
    let close = open + (Math.random() - 0.5) * base * 0.02 * Math.sqrt(volatilityFactor);
    close = Math.max(close, 0.1);
    const high = Math.max(open, close) + Math.random() * base * 0.01 * volatilityFactor;
    const low = Math.min(open, close) - Math.random() * base * 0.01 * volatilityFactor;
    const volume = Math.floor(Math.random() * 1000) + 100;
    history.push({
      time: time.toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      price: Number(close.toFixed(2)),
      volume,
    });
    lastClose = close;
  }
  const current = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : current;
  const change = current.close - previous.close;
  const changePercent = (change / previous.close) * 100;
  return {
    symbol,
    current: {
      price: current.close,
      close: current.close,
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      high: current.high,
      low: current.low,
    },
    history,
  };
}

// Fetch from Binance (no API key required)
async function fetchBinanceOHLC(symbol: string, timeframe: string = "1h", limit: number = 200) {
  const binanceSymbol = symbol === "XAUT" ? "XAUUSDT" : `${symbol}USDT`;
  const binanceSymbolUpper = binanceSymbol.toUpperCase();

  const intervalMap: Record<string, string> = {
    "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
    "1h": "1h", "2h": "2h", "4h": "4h", "6h": "6h", "8h": "8h", "12h": "12h",
    "1d": "1d", "3d": "3d", "1w": "1w", "1M": "1M"
  };

  const interval = intervalMap[timeframe];
  if (!interval) {
    console.warn(`[MarketData] Binance: timeframe ${timeframe} not supported`);
    return null;
  }

  const safeLimit = Math.min(limit, 1000);
  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbolUpper}&interval=${interval}&limit=${safeLimit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[MarketData] Binance fetch error ${symbol}: ${res.status}`);
      return null;
    }
    const data: any[][] = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const history = data.map(candle => ({
      time: new Date(Number(candle[0])).toISOString(),
      open: Number(candle[1]),
      high: Number(candle[2]),
      low: Number(candle[3]),
      close: Number(candle[4]),
      price: Number(candle[4]),
      volume: Number(candle[5]),
    }));

    if (history.length === 0) return null;

    const current = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : current;
    const change = current.close - previous.close;
    const changePercent = (change / previous.close) * 100;

    return {
      symbol,
      source: "Binance",
      current: {
        price: current.close,
        close: current.close,
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        high: current.high,
        low: current.low,
      },
      history,
    };
  } catch (e) {
    console.error(`[MarketData] Binance fetch exception for ${symbol}:`, e);
    return null;
  }
}

// Fetch from CoinGecko (free, rate-limited)
async function fetchCoinGeckoOHLC(symbol: string, timeframe: string = "1h", limit: number = 200) {
  const idMap: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    XRP: "ripple",
    XAUT: "tether-gold",
    KAS: "kaspa",
  };
  const coinId = idMap[symbol];
  if (!coinId) return null;

  let days: number;
  let needsResample = false;
  const tf = timeframe;
  if (["1m", "5m", "15m", "30m"].includes(tf)) {
    days = Math.ceil(limit / 24);
    if (days > 30) days = 30;
  } else if (tf === "1h") {
    days = Math.ceil(limit / 24);
    if (days > 30) days = 30;
  } else if (["4h", "6h", "12h"].includes(tf)) {
    const hours = parseInt(tf);
    const hourlyNeeded = limit * hours;
    days = Math.ceil(hourlyNeeded / 24);
    if (days > 30) days = 30;
    needsResample = true;
  } else if (tf === "1d") {
    days = limit;
    if (days < 31) days = 31;
    if (days > 365) days = 365;
  } else if (tf === "1w") {
    days = limit * 7;
    if (days > 365) days = 365;
  } else {
    days = Math.ceil(limit / 24);
    if (days > 30) days = 30;
  }

  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[MarketData] CoinGecko fetch error for ${symbol}: ${res.status}`);
      return null;
    }
    const data: any[][] = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.error(`[MarketData] CoinGecko returned no data for ${symbol}`);
      return null;
    }

    let history = data.map(item => ({
      time: new Date(item[0]).toISOString(),
      open: Number(item[1]),
      high: Number(item[2]),
      low: Number(item[3]),
      close: Number(item[4]),
      price: Number(item[4]),
      volume: Number(item[5]),
    }));

    // Resample if needed (for multi-hour timeframes)
    if (needsResample) {
      const factor = parseInt(tf) / 60; // convert hours to factor of 1h
      const resampled: any[] = [];
      for (let i = 0; i < history.length; i += factor) {
        const chunk = history.slice(i, i + factor);
        if (chunk.length === 0) break;
        const open = chunk[0].open;
        const high = Math.max(...chunk.map(c => c.high));
        const low = Math.min(...chunk.map(c => c.low));
        const close = chunk[chunk.length - 1].close;
        const time = chunk[0].time;
        resampled.push({ time, open, high, low, close, price: close, volume: chunk.reduce((sum, c) => sum + c.volume, 0) });
      }
      history = resampled;
    }

    if (history.length === 0) return null;

    const current = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : current;
    const change = current.close - previous.close;
    const changePercent = (change / previous.close) * 100;

    return {
      symbol,
      source: "CoinGecko",
      current: {
        price: current.close,
        close: current.close,
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        high: current.high,
        low: current.low,
      },
      history,
    };
  } catch (e) {
    console.error(`[MarketData] CoinGecko fetch exception for ${symbol}:`, e);
    return null;
  }
}

// Fetch from Coinglass Futures (requires API key)
async function fetchCoinglassFuturesOHLC(symbol: string, timeframe: string = "1h", limit: number = 200) {
  const apiKey = process.env.COINGLASS_API_KEY;
  if (!apiKey) {
    console.log(`[MarketData] Coinglass API key not set, skipping futures`);
    return null;
  }

  // Map symbol for Coinglass futures: XAUT -> XAU, others unchanged
  const coinglassSymbol = symbol === "XAUT" ? "XAU" : symbol;

  const intervalMap: Record<string, string> = {
    "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
    "1h": "1h", "2h": "2h", "4h": "4h", "6h": "6h", "8h": "8h", "12h": "12h",
    "1d": "1d", "3d": "3d", "1w": "1w", "1M": "1M"
  };
  const interval = intervalMap[timeframe];
  if (!interval) {
    console.warn(`[MarketData] Coinglass futures: unsupported timeframe ${timeframe}`);
    return null;
  }

  // Futures endpoint
  const url = `https://open-api.coinglass.com/api/v1/futures/kline?symbol=${coinglassSymbol}&interval=${interval}&limit=${limit}`;

  try {
    const res = await fetch(url, {
      headers: {
        'coinglass:secret': apiKey,
      },
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[MarketData] Coinglass futures error ${res.status}: ${errText}`);
      return null;
    }
    const data = await res.json();
    if (data.code !== 200 || !data.data) {
      console.error(`[MarketData] Coinglass futures invalid response:`, data);
      return null;
    }

    const history = data.data.map((candle: any[]) => ({
      time: new Date(candle[0]).toISOString(),
      open: Number(candle[1]),
      high: Number(candle[2]),
      low: Number(candle[3]),
      close: Number(candle[4]),
      price: Number(candle[4]),
      volume: Number(candle[5]),
    }));

    if (history.length === 0) return null;

    const current = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : current;
    const change = current.close - previous.close;
    const changePercent = (change / previous.close) * 100;

    return {
      symbol,
      source: "Coinglass Futures",
      current: {
        price: current.close,
        close: current.close,
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        high: current.high,
        low: current.low,
      },
      history,
    };
  } catch (e) {
    console.error(`[MarketData] Coinglass futures fetch exception for ${symbol}:`, e);
    return null;
  }
}

// Fetch from Coinglass Spot (requires API key)
async function fetchCoinglassSpotOHLC(symbol: string, timeframe: string = "1h", limit: number = 200) {
  const apiKey = process.env.COINGLASS_API_KEY;
  if (!apiKey) {
    console.log(`[MarketData] Coinglass API key not set, skipping spot`);
    return null;
  }

  // Map symbol for spot: XAUT -> XAUUSDT, others append USDT
  const spotSymbol = symbol === "XAUT" ? "XAUUSDT" : `${symbol}USDT`;

  const intervalMap: Record<string, string> = {
    "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
    "1h": "1h", "2h": "2h", "4h": "4h", "6h": "6h", "8h": "8h", "12h": "12h",
    "1d": "1d", "3d": "3d", "1w": "1w", "1M": "1M"
  };
  const interval = intervalMap[timeframe];
  if (!interval) {
    console.warn(`[MarketData] Coinglass spot: unsupported timeframe ${timeframe}`);
    return null;
  }

  // Spot endpoint
  const url = `https://open-api.coinglass.com/api/v1/spot/kline?symbol=${spotSymbol}&interval=${interval}&limit=${limit}`;

  try {
    const res = await fetch(url, {
      headers: {
        'coinglass:secret': apiKey,
      },
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[MarketData] Coinglass spot error ${res.status}: ${errText}`);
      return null;
    }
    const data = await res.json();
    if (data.code !== 200 || !data.data) {
      console.error(`[MarketData] Coinglass spot invalid response:`, data);
      return null;
    }

    const history = data.data.map((candle: any[]) => ({
      time: new Date(candle[0]).toISOString(),
      open: Number(candle[1]),
      high: Number(candle[2]),
      low: Number(candle[3]),
      close: Number(candle[4]),
      price: Number(candle[4]),
      volume: Number(candle[5]),
    }));

    if (history.length === 0) return null;

    const current = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : current;
    const change = current.close - previous.close;
    const changePercent = (change / previous.close) * 100;

    return {
      symbol,
      source: "Coinglass Spot",
      current: {
        price: current.close,
        close: current.close,
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        high: current.high,
        low: current.low,
      },
      history,
    };
  } catch (e) {
    console.error(`[MarketData] Coinglass spot fetch exception for ${symbol}:`, e);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "XAUT";
  const timeframe = searchParams.get("timeframe") || "1h";

  console.log(`[MarketData] Request: symbol=${symbol}, timeframe=${timeframe}`);

  if (!SUPPORTED_SYMBOLS.includes(symbol)) {
    return NextResponse.json(
      { error: `Unsupported symbol. Supported: ${SUPPORTED_SYMBOLS.join(", ")}` },
      { status: 400 }
    );
  }

  // Normalize symbol (XAU → XAUT)
  const normalizedSymbol = normalizeSymbol(symbol);

  try {
    // For crypto: Binance first (real-time WebSocket capable)
    if (CRYPTO_SYMBOLS.includes(normalizedSymbol)) {
      // 1. Binance (primary - real-time WebSocket)
      const binanceData = await fetchBinanceOHLC(symbol, timeframe, 200);
      if (binanceData) {
        console.log(`[MarketData] ${symbol} served from Binance`);
        return NextResponse.json(binanceData);
      }

      // 2. CoinMarketCap (high-quality reference data)
      const cmcData = await fetchCoinMarketCapOHLC(symbol, timeframe, 200);
      if (cmcData) {
        console.log(`[MarketData] ${symbol} served from CoinMarketCap`);
        return NextResponse.json(cmcData);
      }

      // 3. Aggregated (volume-weighted from multiple exchanges)
      const aggData = await fetchAggregatedOHLC(normalizedSymbol, timeframe, 200);
      if (aggData) {
        console.log(`[MarketData] ${symbol} served from Aggregated (multi-exchange)`);
        return NextResponse.json(aggData);
      }

      // 4. FreeCryptoAPI (single-source REST)
      const freeCryptoData = await fetchFreeCryptoAPIOHLC(normalizedSymbol, timeframe, 200);
      if (freeCryptoData) {
        console.log(`[MarketData] ${symbol} served from FreeCryptoAPI`);
        return NextResponse.json(freeCryptoData);
      }

      // 5. CoinAPI (secondary REST source)
      const coinAPIData = await fetchCoinAPIOHLC(normalizedSymbol, timeframe, 200);
      if (coinAPIData) {
        console.log(`[MarketData] ${symbol} served from CoinAPI`);
        return NextResponse.json(coinAPIData);
      }

      // 6. Coinglass Spot (fallback if API key exists)
      const coinglassKey = process.env.COINGLASS_API_KEY;
      if (coinglassKey) {
        const spotData = await fetchCoinglassSpotOHLC(normalizedSymbol, timeframe, 200);
        if (spotData) {
          console.log(`[MarketData] ${symbol} served from Coinglass Spot`);
          return NextResponse.json(spotData);
        }

        const futuresData = await fetchCoinglassFuturesOHLC(normalizedSymbol, timeframe, 200);
        if (futuresData) {
          console.log(`[MarketData] ${symbol} served from Coinglass Futures`);
          return NextResponse.json(futuresData);
        }
      }

      // 7. CoinGecko (free fallback)
      const cgData = await fetchCoinGeckoOHLC(normalizedSymbol, timeframe, 200);
      if (cgData) {
        console.log(`[MarketData] ${symbol} served from CoinGecko`);
        return NextResponse.json(cgData);
      }

      console.warn(`[MarketData] All sources failed for ${symbol}, returning synthetic`);
    } else {
      // US Stocks: fallback to synthetic (or could add other APIs later)
      console.log(`[MarketData] ${symbol} is stock, returning synthetic`);
    }

    // Fallback
    const synthetic = generateOHLC(symbol, timeframe);
    return NextResponse.json(synthetic);
  } catch (error: any) {
    console.error(`[MarketData] Error for ${symbol}:`, error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
