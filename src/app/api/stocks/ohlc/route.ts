import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/stocks/ohlc?symbol=AAPL&timeframe=1h&limit=200
// Fetch OHLC data from database for charting
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();
  const timeframe = searchParams.get("timeframe") || "1h";
  const limit = parseInt(searchParams.get("limit") || "200");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  try {
    const records = await db.oHLCData.findMany({
      where: {
        symbol,
        timeframe,
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    // Sort ascending for chart (oldest first)
    const sorted = records.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const data = sorted.map(r => ({
      timestamp: r.timestamp,
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
      volume: r.volume || undefined,
    }));

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error(`[Stocks] Error fetching OHLC for ${symbol}:`, error);
    return NextResponse.json({ error: error.message || "Database error" }, { status: 500 });
  }
}
