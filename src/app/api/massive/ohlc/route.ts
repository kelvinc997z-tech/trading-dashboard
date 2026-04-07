import { NextRequest, NextResponse } from "next/server";
import { fetchOHLC } from "@/lib/data-provider";

// Unified endpoint: Fetches OHLC data for any symbol
// - US Stocks & Crypto both supported via Yahoo Finance
// - Fallback to Massive for US stocks if Yahoo fails
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
    
    if (result.data.length === 0 && result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

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
