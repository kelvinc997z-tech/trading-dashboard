import { NextRequest, NextResponse } from "next/server";

// GET /api/market-outlook
// Returns market outlook signals for various forex/commodities pairs
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "full"; // "full" or "list"

  // Market Outlook - Rabu, 1 Maret 2026
  const outlook = {
    generatedAt: "2026-03-01T00:00:00.000Z",
    market: "Forex And Commodities",
    pairs: [
      {
        symbol: "XAUT/USD",
        name: "Gold",
        emoji: "🪙",
        signal: "buy",
        entry: 4660,
        tp: 4727,
        sl: 4620,
        confidence: 0.75,
        reasoning: "Bullish momentum, breaking key resistance",
      },
      {
        symbol: "EUR/USD",
        name: "EURUSD",
        emoji: "💶",
        signal: "buy",
        entry: 1.1556,
        tp: 1.1577,
        sl: 1.15308,
        confidence: 0.72,
        reasoning: "Uptrend continuation, ECB hawkish stance",
      },
      {
        symbol: "USD/JPY",
        name: "USDJPY",
        emoji: "🇯🇵",
        signal: "sell",
        entry: 158.70,
        tp: 158.30,
        sl: 159.20,
        confidence: 0.68,
        reasoning: "Overbought, profit-taking expected",
      },
      {
        symbol: "GBP/USD",
        name: "GBPUSD",
        emoji: "💷",
        signal: "sell",
        entry: 1.32213,
        tp: 1.32930,
        sl: 1.31790,
        confidence: 0.70,
        reasoning: "Resistance at 1.325, bearish divergence",
      },
      {
        symbol: "OIL/USD",
        name: "OIL",
        emoji: "🛢",
        signal: "sell",
        entry: 101.50,
        tp: 99.00,
        sl: 102.20,
        confidence: 0.71,
        reasoning: "Demand concerns, inventory build-up",
      },
      {
        symbol: "XAG/USD",
        name: "Silver",
        emoji: "🥈",
        signal: "buy",
        entry: 75.00,
        tp: 75.50,
        sl: 74.00,
        confidence: 0.69,
        reasoning: "Industrial demand support, technical breakout",
      },
    ],
    disclaimer: "Sinyal yang di berikan hanya bersifat rekomendasi bukan jaminan profit , semua di buat berdasarkan analisa dan pergerakan market saat itu",
  };

  if (format === "list") {
    return NextResponse.json(outlook.pairs);
  }

  return NextResponse.json(outlook);
}
