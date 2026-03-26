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

function generateSignalFromIndicator(symbol: string, indicator: any, entryPrice?: number) {
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

  // Use real-time entry price if provided, otherwise fallback to indicator's currentPrice
  const entry = entryPrice || currentPrice;
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
    const cookieHeader = request.headers.get('cookie');
    const headers: Record<string, string> = {};
    if (cookieHeader) headers['cookie'] = cookieHeader;

    // Fetch both technical indicators and real-time market data in parallel, forwarding session
    const [indicators, marketData] = await Promise.all([
      fetch(`${baseUrl}/api/technical-indicators`, { headers }).then(r => r.json()),
      fetch(`${baseUrl}/api/market-data`, { headers }).then(r => r.json()),
    ]);

    const signals = Object.entries(indicators)
      .map(([symbol, indicator]: [string, any]) => {
        // Use real-time price from marketData if available, otherwise fallback to indicator's currentPrice
        const realPrice = marketData[symbol]?.price;
        if (!realPrice) return null;
        return generateSignalFromIndicator(symbol, indicator, realPrice);
      })
      .filter(sig => sig !== null);
    return NextResponse.json({ signals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
