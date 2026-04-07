import { NextRequest, NextResponse } from "next/server";
import { fetchOHLC } from "@/lib/data-provider";

// GET /api/massive/ohlc?symbol=AAPL&timeframe=1h&limit=200
// Unified endpoint: US Stocks (Massive) + Crypto (Yahoo Finance)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const timeframe = searchParams.get("timeframe") || "1d";
  const limit = parseInt(searchParams.get("limit") || "200");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  try {
    const result = await fetchOHLC(symbol, timeframe, limit);
    return NextResponse.json({ 
      data: result.data, 
      symbol: result.symbol, 
      timeframe: result.timeframe,
      source: result.source
    });
  } catch (error: any) {
    console.error(`[API] Error for ${symbol}:`, error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch data" 
    }, { status: 500 });
  }
}
