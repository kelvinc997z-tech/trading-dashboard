import { NextRequest, NextResponse } from "next/server";

const CRYPTO_SYMBOLS = ["XAUT", "BTC", "ETH", "SOL", "XRP"];
const US_STOCKS = ["AAPL", "AMD", "NVDA", "MSFT", "GOOGL", "TSM"];
const SUPPORTED_SYMBOLS = [...CRYPTO_SYMBOLS, ...US_STOCKS];

function generateOHLC(symbol: string, timeframe: string = "1h") {
  const basePrices: Record<string, number> = {
    "XAUT": 2350,
    "BTC": 65000,
    "ETH": 3500,
    "SOL": 150,
    "XRP": 0.6,
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
  // Map symbol to Binance format: XAUT -> XAUUSDT, BTC -> BTCUSDT, etc.
  const binanceSymbol = symbol === "XAUT" ? "XAUUSDT" : `${symbol}USDT`;
  const binanceSymbolUpper = binanceSymbol.toUpperCase();
  
  // Binance interval mapping
  const intervalMap: Record<string, string> = {
    "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
    "1h": "1h", "2h": "2h", "4h": "4h", "6h": "6h", "8h": "8h", "12h": "12h",
    "1d": "1d", "3d": "3d", "1w": "1w", "1M": "1M"
  };
  
  const interval = intervalMap[timeframe];
  if (!interval) {
    console.warn(`Binance: timeframe ${timeframe} not supported`);
    return null;
  }
  
  const safeLimit = Math.min(limit, 1000);
  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbolUpper}&interval=${interval}&limit=${safeLimit}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Binance fetch error ${symbol}: ${res.status}`);
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
    console.error(`Binance fetch error for ${symbol}:`, e);
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
      console.error(`CoinGecko fetch error for ${symbol}: ${res.status}`);
      return null;
    }
    const data: any[][] = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.error(`CoinGecko returned no data for ${symbol}`);
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
    console.error(`CoinGecko fetch error for ${symbol}:`, e);
    return null;
  }
}

// Fetch from Coinglass (requires API key)
async function fetchCoinglassOHLC(symbol: string, timeframe: string = "1h", limit: number = 200) {
  const apiKey = process.env.COINGLASS_API_KEY;
  if (!apiKey) return null;

  // Coinglass uses different symbol format: BTC -> BTC, XAUT -> XAU
  const coinglassSymbol = symbol === "XAUT" ? "XAU" : symbol;
  
  // Coinglass endpoint for klines/candles
  const url = `https://open-api.coinglass.com/public/v2/klines?symbol=${coinglassSymbol}&timeframe=${timeframe}&limit=${limit}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'coinglassSecret': apiKey,
      },
    });
    if (!res.ok) {
      console.error(`Coinglass fetch error for ${symbol}: ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.data)) {
      console.error(`Coinglass invalid response for ${symbol}`);
      return null;
    }

    // Coinglass returns array of [time, open, high, low, close, volume] (类似 Binance)
    const history = data.data.map((item: any[]) => ({
      time: new Date(Number(item[0])).toISOString(),
      open: Number(item[1]),
      high: Number(item[2]),
      low: Number(item[3]),
      close: Number(item[4]),
      price: Number(item[4]),
      volume: Number(item[5]),
    }));

    if (history.length === 0) return null;

    const current = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : current;
    const change = current.close - previous.close;
    const changePercent = (change / previous.close) * 100;

    return {
      symbol,
      source: "Coinglass",
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
    console.error(`Coinglass fetch error for ${symbol}:`, e);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "XAUT";
  const timeframe = searchParams.get("timeframe") || "1h";

  if (!SUPPORTED_SYMBOLS.includes(symbol)) {
    return NextResponse.json(
      { error: `Unsupported symbol. Supported: ${SUPPORTED_SYMBOLS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    // For crypto: try Coinglass first (if key exists), then Binance, then CoinGecko
    if (CRYPTO_SYMBOLS.includes(symbol)) {
      // 1. Coinglass (if API key set)
      const cgData = await fetchCoinglassOHLC(symbol, timeframe, 200);
      if (cgData) {
        return NextResponse.json(cgData);
      }

      // 2. Binance (free, no key required)
      const binanceData = await fetchBinanceOHLC(symbol, timeframe, 200);
      if (binanceData) {
        return NextResponse.json(binanceData);
      }

      // 3. CoinGecko (free, rate-limited)
      const coingeckoData = await fetchCoinGeckoOHLC(symbol, timeframe, 200);
      if (coingeckoData) {
        return NextResponse.json(coingeckoData);
      }
    } else {
      // For US Stocks: currently only synthetic (no API key configured)
      // Could add Finnhub or Massive later
    }

    // All sources failed, return fallback synthetic data
    return NextResponse.json(generateOHLC(symbol, timeframe));
  } catch (error: any) {
    console.error(`Market data fetch error for ${symbol}:`, error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
