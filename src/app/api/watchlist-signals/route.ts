"use server";

import { NextRequest, NextResponse } from "next/server";

// Copy of fetchBinanceOHLC from market-data route
async function fetchBinanceOHLC(symbol: string, timeframe: string = "1h", limit: number = 200): Promise<any | null> {
  const binanceSymbol = `${symbol.toLowerCase()}usdt`;
  const intervalMap: Record<string, string> = {
    "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
    "1h": "1h", "4h": "4h", "1d": "1d"
  };
  const interval = intervalMap[timeframe];
  if (!interval) {
    console.warn(`[Binance] timeframe ${timeframe} not supported`);
    return null;
  }

  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol.toUpperCase()}&interval=${interval}&limit=${limit}`;

  try {
    const res = await fetch(url, { next: { revalidate: 15 } }); // 15s cache
    if (!res.ok) {
      console.error(`[Binance] fetch error ${symbol}: ${res.status}`);
      return null;
    }
    const data: any[][] = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const history = data.map(item => ({
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
    console.error(`[Binance] fetch exception for ${symbol}:`, e);
    return null;
  }
}

// Rest of the file continues...

interface Signal {
  symbol: string;
  name: string;
  emoji: string;
  signal: "buy" | "sell" | "neutral";
  entry: number;
  tp: number;
  sl: number;
  confidence: number; // 0-1
  reasoning: string;
  indicators: {
    rsi: number;
    macd: { macd: number; signal: number };
    sma: { fast: number; slow: number };
    trend: "bullish" | "bearish" | "neutral";
  };
}

const WATCHLIST = [
  { symbol: "XAUT", name: "Gold", emoji: "🪙" },
  { symbol: "BTC", name: "Bitcoin", emoji: "₿" },
  { symbol: "ETH", name: "Ethereum", emoji: "Ξ" },
  { symbol: "SOL", name: "Solana", emoji: "◎" },
  { symbol: "XRP", name: "Ripple", emoji: "✕" },
  { symbol: "KAS", name: "Kaspa", emoji: "⦿" },
  { symbol: "AAPL", name: "Apple", emoji: "🍎" },
  { symbol: "AMD", name: "AMD", emoji: "🔺" },
  { symbol: "NVDA", name: "NVIDIA", emoji: "🎮" },
  { symbol: "MSFT", name: "Microsoft", emoji: "⊞" },
  { symbol: "GOOGL", name: "Alphabet", emoji: "🔍" },
  { symbol: "TSM", name: "TSMC", emoji: "🔻" },
];

// Calculate RSI
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  const changes = prices.slice(1).map((price, i) => price - prices[i]);
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? -c : 0);
  
  const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Calculate MACD
function calculateMACD(prices: number[]): { macd: number; signal: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  const signalLine = calculateEMA(prices.slice(-9).concat(macdLine), 9); // simplified
  return { macd: macdLine, signal: signalLine };
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
}

// Calculate SMA
function calculateSMA(prices: number[], period: number): number {
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

// Generate signal for a single symbol
async function generateSignalForSymbol(meta: typeof WATCHLIST[0], timeframe: string = "1h"): Promise<Signal> {
  try {
    // Fetch OHLC data from Binance (most reliable)
    const data = await fetchBinanceOHLC(meta.symbol, timeframe, 100);
    if (!data || !data.history || data.history.length < 50) {
      return {
        symbol: meta.symbol,
        name: meta.name,
        emoji: meta.emoji,
        signal: "neutral",
        entry: 0,
        tp: 0,
        sl: 0,
        confidence: 0,
        reasoning: "Insufficient data",
        indicators: { rsi: 50, macd: { macd: 0, signal: 0 }, sma: { fast: 0, slow: 0 }, trend: "neutral" },
      };
    }

    const closes = data.history.map((h: any) => h.close || h.price);
    const currentPrice = closes[closes.length - 1];
    const prevPrice = closes[closes.length - 2];

    // Calculate indicators
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);
    const smaFast = calculateSMA(closes, 10);
    const smaSlow = calculateSMA(closes, 50);

    // Determine trend
    const trend = smaFast > smaSlow ? "bullish" : smaFast < smaSlow ? "bearish" : "neutral";

    // Generate trading signal based on indicator combinations
    let signal: "buy" | "sell" | "neutral" = "neutral";
    let confidence = 0.5;
    let reasoning = "";
    let tp = 0;
    let sl = 0;

    // Calculate ATR for SL/TP (simplified)
    const atr = calculateATR(data.history, 14);

    // Buy conditions
    const rsiOversold = rsi < 30;
    const rsiOverbought = rsi > 70;
    const macdBullish = macd.macd > macd.signal;
    const macdBearish = macd.macd < macd.signal;
    const priceAboveSmaFast = currentPrice > smaFast;
    const priceBelowSmaFast = currentPrice < smaFast;

    if (rsiOversold && macdBullish && trend === "bullish") {
      signal = "buy";
      confidence = 0.7 + (30 - rsi) / 100;
      reasoning = `RSI oversold (${rsi.toFixed(1)}), MACD bullish crossover, trend up`;
      tp = currentPrice + 2 * atr;
      sl = currentPrice - 1.5 * atr;
    } else if (rsiOverbought && macdBearish && trend === "bearish") {
      signal = "sell";
      confidence = 0.7 + (rsi - 70) / 100;
      reasoning = `RSI overbought (${rsi.toFixed(1)}), MACD bearish crossover, trend down`;
      tp = currentPrice - 2 * atr;
      sl = currentPrice + 1.5 * atr;
    } else if (priceBelowSmaFast && macdBearish && rsi < 50) {
      signal = "sell";
      confidence = 0.6;
      reasoning = `Price below SMA10, MACD negative, RSI ${rsi.toFixed(1)}`;
      tp = currentPrice - 1.5 * atr;
      sl = currentPrice + 2 * atr;
    } else if (priceAboveSmaFast && macdBullish && rsi > 50) {
      signal = "buy";
      confidence = 0.6;
      reasoning = `Price above SMA10, MACD positive, RSI ${rsi.toFixed(1)}`;
      tp = currentPrice + 1.5 * atr;
      sl = currentPrice - 2 * atr;
    } else {
      signal = "neutral";
      confidence = 0.3;
      reasoning = `Mixed signals: RSI ${rsi.toFixed(1)}, trend ${trend}`;
      tp = 0;
      sl = 0;
    }

    return {
      symbol: meta.symbol,
      name: meta.name,
      emoji: meta.emoji,
      signal,
      entry: currentPrice,
      tp: Number(tp.toFixed(2)),
      sl: Number(sl.toFixed(2)),
      confidence: Math.min(confidence, 0.95),
      reasoning,
      indicators: {
        rsi: Number(rsi.toFixed(1)),
        macd: { macd: Number(macd.macd.toFixed(2)), signal: Number(macd.signal.toFixed(2)) },
        sma: { fast: Number(smaFast.toFixed(2)), slow: Number(smaSlow.toFixed(2)) },
        trend,
      },
    };
  } catch (error) {
    console.error(`Error generating signal for ${meta.symbol}:`, error);
    return {
      symbol: meta.symbol,
      name: meta.name,
      emoji: meta.emoji,
      signal: "neutral",
      entry: 0,
      tp: 0,
      sl: 0,
      confidence: 0,
      reasoning: "Error generating signal",
      indicators: { rsi: 0, macd: { macd: 0, signal: 0 }, sma: { fast: 0, slow: 0 }, trend: "neutral" },
    };
  }
}

// Calculate ATR
function calculateATR(history: any[], period: number = 14): number {
  if (history.length < period + 1) return 0;
  
  let sumTR = 0;
  for (let i = 1; i <= period; i++) {
    const high = history[history.length - i].high || history[history.length - i].price;
    const low = history[history.length - i].low || history[history.length - i].price;
    const prevClose = history[history.length - i - 1]?.close || history[history.length - i - 1]?.price || high;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    sumTR += tr;
  }
  return sumTR / period;
}

// Main API handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "1h";
    const limit = parseInt(searchParams.get("limit") || "10");

    // Generate signals for all watchlist pairs in parallel
    const signals = await Promise.all(
      WATCHLIST.slice(0, limit).map(meta => generateSignalForSymbol(meta, timeframe))
    );

    const now = new Date().toISOString();

    return NextResponse.json({
      generatedAt: now,
      timeframe,
      pairs: signals,
      total: signals.length,
      source: "Custom Technical Analysis",
    });
  } catch (error) {
    console.error("Watchlist signals error:", error);
    return NextResponse.json({ error: "Failed to generate signals" }, { status: 500 });
  }
}
