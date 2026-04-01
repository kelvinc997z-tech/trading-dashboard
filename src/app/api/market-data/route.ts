import { NextRequest, NextResponse } from "next/server";
import { fetchStockOHLC, convertStockToDatabaseFormat } from "@/lib/massive";

const CRYPTO_SYMBOLS = ["XAUT", "BTC", "ETH", "SOL", "XRP"];
const US_STOCKS = ["AAPL", "AMD", "NVDA", "MSFT", "GOOGL"];
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
  
  // Determine data points and interval based on timeframe
  let count = 24;
  let intervalMs = 60 * 60 * 1000; // 1h default
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
    // Adjust volatility based on timeframe (larger timeframe = bigger moves)
    const volatilityFactor = intervalMs / (60 * 60 * 1000); // normalize to hourly
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

async function fetchCoinMarketCap(symbol: string, apiKey: string, timeframe: string = "1h") {
  const cmcSymbol = symbol; // symbol is already simple like "BTC", "ETH"
  const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${cmcSymbol}&convert=USD`;
  const res = await fetch(url, {
    headers: { 'X-CMC_PRO_API_KEY': apiKey },
    next: { revalidate: 30 }
  });
  if (!res.ok) throw new Error(`CoinMarketCap error: ${res.status}`);
  const data = await res.json();
  const coin = data.data[cmcSymbol]?.[0];
  if (!coin) throw new Error("Coin not found in CMC response");
  const price = coin.quote.USD.price;

  // Determine data points and interval
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
  let lastClose = price;
  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - 1 - i) * intervalMs);
    const open = lastClose;
    const volatilityFactor = intervalMs / (60 * 60 * 1000);
    let close = open + (Math.random() - 0.5) * (price * 0.02 * Math.sqrt(volatilityFactor));
    const high = Math.max(open, close) + Math.random() * (price * 0.01 * volatilityFactor);
    const low = Math.min(open, close) - Math.random() * (price * 0.01 * volatilityFactor);
    history.push({
      time: time.toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      price: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 1000) + 100,
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

async function fetchMassiveOHLC(symbol: string, timeframe: string = "1h") {
  try {
    // Fetch from Massive API (use our lib)
    const rawData = await fetchStockOHLC(symbol, timeframe, 200);
    if (!rawData.c || rawData.c.length === 0) {
      throw new Error("No data from Massive");
    }
    // Convert to our format
    const ohlcRecords = convertStockToDatabaseFormat(rawData, symbol, timeframe);
    // Map to history array shape
    const history = ohlcRecords.map(rec => ({
      time: rec.timestamp.toISOString(),
      open: rec.open,
      high: rec.high,
      low: rec.low,
      close: rec.close,
      price: rec.close,
      volume: rec.volume,
    }));
    const latest = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : latest;
    const change = latest.close - previous.close;
    const changePercent = (change / previous.close) * 100;
    return {
      symbol,
      current: {
        price: latest.close,
        close: latest.close,
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        high: latest.high,
        low: latest.low,
      },
      history,
    };
  } catch (error) {
    console.error(`Massive fetch failed for ${symbol}:`, error);
    // Fallback to dummy data so charts still render
    return generateOHLC(symbol, timeframe);
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
    if (US_STOCKS.includes(symbol)) {
      // Fetch US stock from Massive API
      return NextResponse.json(await fetchMassiveOHLC(symbol, timeframe));
    } else {
      // Crypto: use CoinMarketCap if available, else dummy
      const cmcApiKey = process.env.COINMARKETCAP_API_KEY;
      if (cmcApiKey) {
        return NextResponse.json(await fetchCoinMarketCap(symbol, cmcApiKey, timeframe));
      }
      return NextResponse.json(generateOHLC(symbol, timeframe));
    }
  } catch (error: any) {
    console.error(`Market data fetch error for ${symbol}:`, error);
    return NextResponse.json(generateOHLC(symbol, timeframe));
  }
}
