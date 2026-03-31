import { NextRequest, NextResponse } from "next/server";

// GET /api/market-outlook
// Returns market outlook signals for various forex/commodities pairs
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "full"; // "full" or "list"

  // For now, return static/dummy outlook (could be generated from AI/analysis)
  // In production, this would come from your analysis engine or external signals provider
  const outlook = {
    generatedAt: new Date().toISOString(),
    pairs: [
      {
        symbol: "XAUT/USD",
        name: "Gold",
        signal: "sell",
        entry: 4530,
        tp: 4487,
        sl: 4600,
        confidence: 0.65,
        reasoning: " Bearish divergence on RSI, resistance at 4550",
      },
      {
        symbol: "EUR/USD",
        name: "EURUSD",
        signal: "buy",
        entry: 1.1466,
        tp: 1.1497,
        sl: 1.14308,
        confidence: 0.72,
        reasoning: "Breaking above 1.1450 resistance, MACD bullish",
      },
      {
        symbol: "USD/JPY",
        name: "USDJPY",
        signal: "buy",
        entry: 159.50,
        tp: 160.70,
        sl: 159.50, // breakeven SL
        confidence: 0.68,
        reasoning: "Uptrend continuation, BOJ policy stance",
      },
      {
        symbol: "GBP/USD",
        name: "GBPUSD",
        signal: "buy",
        entry: 1.31513,
        tp: 1.32030,
        sl: 1.30790,
        confidence: 0.71,
        reasoning: "Strong UK data, support at 1.3120",
      },
      {
        symbol: "OIL/USD",
        name: "Oil",
        signal: "buy",
        entry: 105.00,
        tp: 106.80,
        sl: 100.20,
        confidence: 0.69,
        reasoning: "Supply constraints, demand recovery",
      },
      {
        symbol: "XAG/USD",
        name: "Silver",
        signal: "sell",
        entry: 69.90,
        tp: 68.20,
        sl: 71.00,
        confidence: 0.63,
        reasoning: "Overbought on daily, profit-taking",
      },
    ],
  };

  if (format === "list") {
    return NextResponse.json(outlook.pairs);
  }

  return NextResponse.json(outlook);
}
