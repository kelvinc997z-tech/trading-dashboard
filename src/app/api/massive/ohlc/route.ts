import { NextRequest, NextResponse } from "next/server";
import { fetchStockOHLC, convertStockToDatabaseFormat } from "@/lib/massive";

// GET /api/massive/ohlc?symbol=AAPL&timeframe=1h&limit=200
// Try multiple symbol formats and timeframes to get data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get("symbol")?.toUpperCase();
  const timeframe = searchParams.get("timeframe") || "1d"; // default to 1d for stocks
  const limit = parseInt(searchParams.get("limit") || "200");

  if (!rawSymbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  try {
    // Try different symbol formats that Massive might accept
    const symbolVariants = [
      rawSymbol,
      `${rawSymbol}.US`,
      `NASDAQ:${rawSymbol}`,
      `NYSE:${rawSymbol}`,
      `${rawSymbol}.XNAS`,
      `${rawSymbol}.XNYS`,
    ];

    let lastError: Error | null = null;

    for (const symbol of symbolVariants) {
      console.log(`[Massive] Trying symbol=${symbol}, timeframe=${timeframe}`);
      const rawData = await fetchStockOHLC(symbol, timeframe, limit);
      
      if (rawData && rawData.c && rawData.c.length > 0) {
        console.log(`[Massive] Success with symbol=${symbol}, returned ${rawData.c.length} candles`);
        const data = convertStockToDatabaseFormat(rawData, symbol, timeframe);
        return NextResponse.json({ data, symbol, timeframe });
      }
    }

    // If we get here, all attempts failed
    console.warn(`[Massive] All symbol formats failed for ${rawSymbol}`);
    return NextResponse.json(
      { error: `No data returned from Massive for ${rawSymbol}. Check MASSIVE_API_KEY and symbol format.` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error(`[Massive] Error for ${rawSymbol}:`, error);
    return NextResponse.json({ error: error.message || "Massive API error" }, { status: 500 });
  }
}
