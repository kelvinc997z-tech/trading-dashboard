import { NextRequest, NextResponse } from "next/server";

const SYMBOL_LABELS: Record<string, string> = {
  "XAUUSD": "Gold (XAU/USD)",
  "USOIL": "US Oil (WTI)",
  "BTC/USD": "Bitcoin",
  "ETH/USD": "Ethereum",
  "SOL/USD": "Solana",
  "XRP/USD": "Ripple",
  "KAS/USDT": "Kaspa",
};

async function fetchTechnicalIndicators(baseUrl: string) {
  const res = await fetch(`${baseUrl}/api/technical-indicators`, {
    next: { revalidate: 10 },
  });
  if (!res.ok) throw new Error("Failed to fetch technical indicators");
  return res.json();
}

function generateSignalFromIndicator(symbol: string, indicator: any) {
  const { rsi, macd, sma20, sma50, trend, currentPrice } = indicator;
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const id = `${symbol}-${Date.now()}`;

  // Base volatility for TP/SL (from mockData logic, but we'll compute from recent range if available)
  // For now use fixed offsets per symbol type
  const offsets: Record<string, { tp: number; sl: number }> = {
    "XAUUSD": { tp: 50, sl: 30 },
    "USOIL": { tp: 3, sl: 2 },
    "BTC/USD": { tp: 1000, sl: 800 },
    "ETH/USD": { tp: 120, sl: 80 },
    "SOL/USD": { tp: 8, sl: 6 },
    "XRP/USD": { tp: 0.03, sl: 0.02 },
    "KAS/USDT": { tp: 0.01, sl: 0.008 },
  };
  const base = offsets[symbol] || { tp: 3, sl: 2 };

  // Determine signal type based on RSI and MACD
  let type: "BUY" | "SELL";
  if (rsi < 30 && macd === "buy") {
    type = "BUY";
  } else if (rsi > 70 && macd === "sell") {
    type = "SELL";
  } else {
    // If not oversold/overbought, check trend
    type = trend === "bullish" ? "BUY" : trend === "bearish" ? "SELL" : "BUY"; // default BUY for neutral
  }

  const entry = currentPrice;
  const tp = type === "BUY" ? entry + base.tp : entry - base.tp;
  const sl = type === "BUY" ? entry - base.sl : entry + base.sl;

  return {
    id,
    pair: symbol,
    type,
    entry,
    tp,
    sl,
    time: timeStr,
    status: "active",
    // result only after closed
  };
}

export async function GET(request: NextRequest) {
  try {
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const indicators = await fetchTechnicalIndicators(baseUrl);
    const signals = Object.entries(indicators)
      .map(([symbol, indicator]: [string, any]) => generateSignalFromIndicator(symbol, indicator))
      .filter(sig => sig !== null);
    return NextResponse.json({ signals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
