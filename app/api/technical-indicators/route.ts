import { NextResponse } from "next/server";
import { calculateRSI, calculateMACD, calculateSMA } from "technicalindicators";

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

interface IndicatorResult {
  symbol: string;
  currentPrice: number;
  rsi: number;
  macd: "buy" | "sell" | "neutral";
  sma20: number;
  sma50: number;
  trend: "bullish" | "bearish" | "neutral";
  support: number;
  resistance: number;
  notes: string;
}

async function fetchTimeSeries(symbol: string, apiKey: string): Promise<number[]> {
  const avSymbol = SYMBOL_MAP[symbol];
  const url = `${ALPHA_VANTAGE_BASE}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(avSymbol)}&apikey=${apiKey}&outputsize=compact`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Alpha Vantage error: ${res.status}`);
  const data = await res.json();
  const timeSeries = data["Time Series (Daily)"];
  if (!timeSeries) throw new Error("No time series data");
  // Convert to sorted array of close prices (oldest first)
  const dates = Object.keys(timeSeries).sort();
  const closes = dates.map(date => parseFloat(timeSeries[date]["4. close"]));
  return closes;
}

export async function GET(request: Request) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Alpha Vantage API key not configured" }, { status: 500 });
  }

  // Get symbol from query, default to all
  const { searchParams } = new URL(request.url);
  const symbolParam = searchParams.get("symbol");
  const symbolsToProcess = symbolParam ? [symbolParam] : Object.keys(SYMBOL_MAP);

  const results: IndicatorResult[] = [];

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

      // Calculate RSI (14)
      const rsiInput = closes.slice(-50); // last 50 days
      const rsi = calculateRSI(rsiInput, 14);
      const latestRsi = rsi[rsi.length - 1];

      // Calculate MACD (12, 26, 9) using close prices
      const macdResult = calculateMACD(closes, 12, 26, 9, "close");
      const latestMacd = macdResult.macd[macdResult.macd.length - 1];
      const latestSignal = macdResult.signal[macdResult.signal.length - 1];
      const macdTrend: "buy" | "sell" | "neutral" = latestMacd > latestSignal ? "buy" : latestMacd < latestSignal ? "sell" : "neutral";

      // Calculate SMAs
      const sma20 = calculateSMA(closes.slice(-20), { period: 20 })[calculateSMA(closes.slice(-20), { period: 20 }).length - 1];
      const sma50 = calculateSMA(closes.slice(-50), { period: 50 })[calculateSMA(closes.slice(-50), { period: 50 }).length - 1];

      // Determine trend
      let trend: "bullish" | "bearish" | "neutral";
      if (currentPrice > sma20 && sma20 > sma50) trend = "bullish";
      else if (currentPrice < sma20 && sma20 < sma50) trend = "bearish";
      else trend = "neutral";

      // Support/Resistance (simple: recent low/high)
      const recent = closes.slice(-20);
      const support = Math.min(...recent);
      const resistance = Math.max(...recent);

      // Notes
      let notes = "";
      if (latestRsi < 30) notes += "Oversold. ";
      else if (latestRsi > 70) notes += "Overbought. ";
      notes += `Trend ${trend}. MACD ${macdTrend}.`;

      results.push({
        symbol,
        currentPrice,
        rsi: Math.round(latestRsi),
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
