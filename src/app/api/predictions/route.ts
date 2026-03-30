import { NextRequest, NextResponse } from "next/server";

// GET /api/predictions?symbol=BTC&timeframe=1h
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const timeframe = searchParams.get("timeframe") || "1h";
  const modelType = searchParams.get("model") || "ensemble";

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  // Dummy prediction: random walk with slight upward bias
  // In production, fetch real market data and run ML model
  const basePrices: Record<string, number> = {
    "BTC/USD": 65000,
    "ETH/USD": 3500,
    "SOL/USD": 150,
    "XRP/USD": 0.6,
    "XAUT/USD": 2350,
  };
  const base = basePrices[symbol] || 100;

  const now = new Date();
  const periods = timeframe === "1h" ? 24 : timeframe === "4h" ? 30 : timeframe === "1d" ? 365 : 30;

  // Generate fake predictions for next N periods
  const predictions: { time: string; price: number; lower: number; upper: number }[] = [];
  let current = base;
  for (let i = 0; i < periods; i++) {
    const time = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000); // next hour+
    const drift = (Math.random() - 0.45) * base * 0.01; // slight upward bias
    current += drift;
    const lower = current - base * 0.02;
    const upper = current + base * 0.02;
    predictions.push({
      time: time.toISOString(),
      price: Number(current.toFixed(2)),
      lower: Number(lower.toFixed(2)),
      upper: Number(upper.toFixed(2)),
    });
  }

  // Confidence based on historical accuracy (dummy)
  const confidence = modelType === "ensemble" ? 0.78 : modelType === "xgboost" ? 0.72 : 0.65;

  return NextResponse.json({
    symbol,
    timeframe,
    modelType,
    confidence,
    currentPrice: base,
    predictions,
    message: "Predictions are dummy values. Connect real ML models for production.",
  });
}
