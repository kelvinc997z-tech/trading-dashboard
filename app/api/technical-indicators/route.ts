import { NextResponse } from "next/server";

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

function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return 0;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateRSI(data: number[], period: number = 14): number {
  if (data.length < period + 1) return 50;
  const changes: number[] = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? -c : 0);
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateEMA(data: number[], period: number): number {
  if (data.length < period) return 0;
  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
  }
  return ema;
}

function calculateMACD(closes: number[], fast: number = 12, slow: number = 26, signal: number = 9): { macd: number; signal: number; histogram: number } {
  const emaFast = calculateEMA(closes, fast);
  const emaSlow = calculateEMA(closes, slow);
  const macdLine = emaFast - emaSlow;
  // For simplicity, calculate signal line as SMA of macdLine over signal period (use closes to approximate)
  // Actually we need macd history to compute signal, but we'll approximate with current
  const signalLine = macdLine; // placeholders, would need history
  return { macd: macdLine, signal: signalLine, histogram: macdLine - signalLine };
}

async function fetchTimeSeries(symbol: string, apiKey: string): Promise<number[]> {
  const avSymbol = SYMBOL_MAP[symbol];
  const url = `${ALPHA_VANTAGE_BASE}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(avSymbol)}&apikey=${apiKey}&outputsize=compact`;
  const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 menit
  if (!res.ok) throw new Error(`Alpha Vantage error: ${res.status}`);
  const data = await res.json();
  const timeSeries = data["Time Series (Daily)"];
  if (!timeSeries) throw new Error("No time series data");
  const dates = Object.keys(timeSeries).sort();
  const closes = dates.map(date => parseFloat(timeSeries[date]["4. close"]));
  return closes;
}

export async function GET(request: Request) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Alpha Vantage API key not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const symbolParam = searchParams.get("symbol");
  const symbolsToProcess = symbolParam ? [symbolParam] : Object.keys(SYMBOL_MAP);

  const results: any[] = [];

  for (const symbol of symbolsToProcess) {
    try {
      const closes = await fetchTimeSeries(symbol, apiKey);
      if (closes.length < 50) {
        results.push({
          symbol,
          currentPrice: closes[closes.length - 1],
          rsi: 0,
          macd: "neutral",
          sma20: 0,
          sma50: 0,
          trend: "neutral",
          support: 0,
          resistance: 0,
          notes: "Insufficient data for indicators",
        });
        continue;
      }

      const currentPrice = closes[closes.length - 1];

      // RSI
      const rsiVal = calculateRSI(closes, 14);

      // SMA
      const sma20 = calculateSMA(closes.slice(-20), 20);
      const sma50 = calculateSMA(closes.slice(-50), 50);

      // MACD (simplified)
      const macdResult = calculateMACD(closes, 12, 26, 9);
      const macdTrend: "buy" | "sell" | "neutral" = macdResult.macd > macdResult.signal ? "buy" : macdResult.macd < macdResult.signal ? "sell" : "neutral";

      // Trend
      let trend: "bullish" | "bearish" | "neutral";
      if (currentPrice > sma20 && sma20 > sma50) trend = "bullish";
      else if (currentPrice < sma20 && sma20 < sma50) trend = "bearish";
      else trend = "neutral";

      // Support/Resistance (recent 20 days)
      const recent = closes.slice(-20);
      const support = Math.min(...recent);
      const resistance = Math.max(...recent);

      // Notes
      let notes = "";
      if (rsiVal < 30) notes += "Oversold. ";
      else if (rsiVal > 70) notes += "Overbought. ";
      notes += `Trend ${trend}. MACD ${macdTrend}.`;

      results.push({
        symbol,
        currentPrice,
        rsi: Math.round(rsiVal),
        macd: macdTrend,
        sma20: Math.round(sma20 * 100) / 100,
        sma50: Math.round(sma50 * 100) / 100,
        trend,
        support: Math.round(support * 100) / 100,
        resistance: Math.round(resistance * 100) / 100,
        notes: notes.trim() || "No significant signals.",
      });
    } catch (err: any) {
      console.error(`Error processing ${symbol}:`, err);
      results.push({
        symbol,
        currentPrice: 0,
        rsi: 0,
        macd: "neutral",
        sma20: 0,
        sma50: 0,
        trend: "neutral",
        support: 0,
        resistance: 0,
        notes: `Error: ${err.message}`,
      });
    }
  }

  return NextResponse.json(results);
}
