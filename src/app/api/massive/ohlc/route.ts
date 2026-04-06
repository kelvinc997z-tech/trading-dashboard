import { NextRequest, NextResponse } from "next/server";
import { fetchStockOHLC } from "@/lib/massive";

// GET /api/massive/ohlc?symbol=AAPL&timeframe=1h&limit=200
// Fetch OHLC data directly from Massive API (no database)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();
  const timeframe = searchParams.get("timeframe") || "1h";
  const limit = parseInt(searchParams.get("limit") || "200");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  try {
    // Fetch directly from Massive API
    const rawData = await fetchStockOHLC(symbol, timeframe, limit);

    if (!rawData || !rawData.c || rawData.c.length === 0) {
      return NextResponse.json(
        { error: `No data returned from Massive for ${symbol}` },
        { status: 404 }
      );
    }

    // Transform to chart format
    // Massive format: { c: [close], o: [open], h: [high], l: [low], t: [timestamps], v: [volume] }
    const closes = rawData.c;
    const opens = rawData.o;
    const highs = rawData.h;
    const lows = rawData.l;
    const timestamps = rawData.t;
    const volumes = rawData.v;

    const data = timestamps.map((t: number, i: number) => ({
      timestamp: new Date(t).toISOString(),
      open: opens[i],
      high: highs[i],
      low: lows[i],
      close: closes[i],
      volume: volumes?.[i],
    }));

    return NextResponse.json({ data, symbol, timeframe });
  } catch (error: any) {
    console.error(`[Massive] Error fetching OHLC for ${symbol}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch from Massive API" },
      { status: 500 }
    );
  }
}
