import { NextResponse } from "next/server";

// Force dynamic rendering to avoid static generation errors
export const dynamic = "force-dynamic";

const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";

const SYMBOL_MAP: Record<string, string> = {
  "XAUUSD": "XAU/USD",
  "USOIL": "WTI",
  "BTC/USD": "BTC/USD",
  "ETH/USD": "ETH/USD",
  "SOL/USD": "SOL/USD",
  "XRP/USD": "XRP/USD",
  "KAS/USDT": "KAS/USDT",
};

const DUMMY_INDICATORS: Record<string, any> = {
  "XAUUSD": { currentPrice: 4427.50, rsi: 45, macd: "buy", sma20: 4410, sma50: 4400, trend: "bullish", support: 4400, resistance: 4450, notes: "Moderate bullish trend" },
  "USOIL": { currentPrice: 88.45, rsi: 55, macd: "neutral", sma20: 87.5, sma50: 86.0, trend: "neutral", support: 86.5, resistance: 90.0, notes: "Consolidating" },
  "BTC/USD": { currentPrice: 68500.00, rsi: 62, macd: "buy", sma20: 67800, sma50: 66500, trend: "bullish", support: 67000, resistance: 69500, notes: "Strong uptrend" },
  "ETH/USD": { currentPrice: 3850.00, rsi: 58, macd: "buy", sma20: 3800, sma50: 3720, trend: "bullish", support: 3780, resistance: 3900, notes: "Momentum buying" },
  "SOL/USD": { currentPrice: 175.20, rsi: 71, macd: "sell", sma20: 180, sma50: 170, trend: "overbought", support: 168, resistance: 185, notes: "Overbought, watch for reversal" },
  "XRP/USD": { currentPrice: 0.6250, rsi: 52, macd: "neutral", sma20: 0.620, sma50: 0.610, trend: "neutral", support: 0.615, resistance: 0.635, notes: "Range bound" },
  "KAS/USDT": { currentPrice: 0.1200, rsi: 68, macd: "buy", sma20: 0.115, sma50: 0.110, trend: "bullish", support: 0.112, resistance: 0.125, notes: "Momentum acceleration" },
};

function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return 0;
  return data.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calculateRSI(data: number[], period: number = 14): number {
  if (data.length < period + 1) return 50;
  const changes: number[] = [];
  for (let i = 1; i < data.length; i++) changes.push(data[i] - data[i - 1]);
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? -c : 0);
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}

function calculateEMA(data: number[], period: number): number {
  if (data.length < period) return 0;
  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) ema = (data[i] - ema) * multiplier + ema;
  return ema;
}

function calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number } {
  const emaFast = calculateEMA(closes, 12);
  const emaSlow = calculateEMA(closes, 26);
  const macdLine = emaFast - emaSlow;
  return { macd: macdLine, signal: macdLine, histogram: 0 };
}

async function fetchTimeSeries(symbol: string, apiKey: string): Promise<number[]> {
  const avSymbol = SYMBOL_MAP[symbol];
  const url = `${ALPHA_VANTAGE_BASE}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(avSymbol)}&apikey=${apiKey}&outputsize=compact`;
  const res = await fetch(url, { next: { revalidate: 10 } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const timeSeries = data["Time Series (Daily)"];
  if (!timeSeries) throw new Error("No time series");
  const closes = Object.keys(timeSeries).sort().map(date => parseFloat(timeSeries[date]["4. close"]));
  return closes;
}

export async function GET(request: Request) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const { searchParams } = new URL(request.url);
  const symbolParam = searchParams.get("symbol");
  const symbols = symbolParam ? [symbolParam] : Object.keys(SYMBOL_MAP);

  // No API key? Return dummy data as object
  if (!apiKey) {
    console.warn("Alpha Vantage API key not set, using dummy indicators");
    const dummyObj: Record<string, any> = {};
    for (const symbol of symbols) {
      dummyObj[symbol] = DUMMY_INDICATORS[symbol];
    }
    return NextResponse.json(dummyObj);
  }

  const results: Record<string, any> = {};

  for (const symbol of symbols) {
    try {
      const closes = await fetchTimeSeries(symbol, apiKey);
      if (closes.length < 50) {
        results[symbol] = {
          currentPrice: closes[closes.length - 1],
          rsi: 0,
          macd: "neutral",
          sma20: 0,
          sma50: 0,
          trend: "neutral",
          support: 0,
          resistance: 0,
          notes: "Insufficient data",
        };
        continue;
      }

      const price = closes[closes.length - 1];
      const rsi = Math.round(calculateRSI(closes, 14));
      const sma20 = Math.round(calculateSMA(closes.slice(-20), 20) * 100) / 100;
      const sma50 = Math.round(calculateSMA(closes.slice(-50), 50) * 100) / 100;
      const { macd, signal } = calculateMACD(closes);
      const macdTrend: "buy" | "sell" | "neutral" = macd > signal ? "buy" : macd < signal ? "sell" : "neutral";

      let trend: "bullish" | "bearish" | "neutral";
      if (price > sma20 && sma20 > sma50) trend = "bullish";
      else if (price < sma20 && sma20 < sma50) trend = "bearish";
      else trend = "neutral";

      const recent = closes.slice(-20);
      const support = Math.round(Math.min(...recent) * 100) / 100;
      const resistance = Math.round(Math.max(...recent) * 100) / 100;

      let notes = "";
      if (rsi < 30) notes += "Oversold. ";
      else if (rsi > 70) notes += "Overbought. ";
      notes += `Trend ${trend}. MACD ${macdTrend}.`;

      results[symbol] = { currentPrice: price, rsi, macd: macdTrend, sma20, sma50, trend, support, resistance, notes: notes.trim() || "No signals" };
    } catch (err: any) {
      console.error(`Error ${symbol}:`, err.message);
      results[symbol] = DUMMY_INDICATORS[symbol];
    }
  }

  return NextResponse.json(results);
}
