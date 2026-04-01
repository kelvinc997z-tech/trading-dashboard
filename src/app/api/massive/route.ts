import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchStockOHLC, convertStockToDatabaseFormat, fetchStockQuote } from "@/lib/massive";
import { calculateAllIndicators } from "@/lib/quant-ai/indicators";
import { saveOHLCData, saveIndicators } from "@/lib/quant-ai/data-collector";

// POST /api/massive/fetch
// Fetch US stock OHLC data from Massive.com and store in database
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { symbol, timeframe = "1h", count = 200 } = body;

    if (!symbol) {
      return NextResponse.json({ error: "Symbol required" }, { status: 400 });
    }

    // 1. Fetch OHLC from Massive
    const rawData = await fetchStockOHLC(symbol, timeframe, count);

    if (!rawData.c || rawData.c.length === 0) {
      return NextResponse.json({ error: "No data returned from Massive" }, { status: 404 });
    }

    // 2. Convert to database format
    const ohlcRecords = convertStockToDatabaseFormat(rawData, symbol, timeframe);

    if (ohlcRecords.length === 0) {
      return NextResponse.json({ error: "Failed to parse OHLC data" }, { status: 500 });
    }

    // 3. Save to OHLCData table
    await saveOHLCData(ohlcRecords);

    // 4. Calculate indicators for all records (or recent ones)
    const indicatorsList = calculateAllIndicators(ohlcRecords);

    // 5. Save indicators to database (batch)
    for (const ind of indicatorsList) {
      if (!ind.timestamp) continue;
      await saveIndicators(
        symbol.toUpperCase(),
        timeframe,
        ind.timestamp,
        {
          rsi: ind.rsi,
          macd: ind.macd,
          macdSignal: ind.macdSignal,
          macdHist: ind.macdHist,
          sma20: ind.sma20,
          sma50: ind.sma50,
          sma200: ind.sma200,
          ema12: ind.ema12,
          ema26: ind.ema26,
          bollingerUpper: ind.bollingerUpper,
          bollingerMiddle: ind.bollingerMiddle,
          bollingerLower: ind.bollingerLower,
          atr: ind.atr,
          adx: ind.adx,
          stochK: ind.stochK,
          stochD: ind.stochD,
          williamsR: ind.williamsR,
          cci: ind.cci,
          mfi: ind.mfi,
          obv: ind.obv,
        }
      );
    }

    return NextResponse.json({
      success: true,
      symbol: symbol.toUpperCase(),
      timeframe,
      recordsAdded: ohlcRecords.length,
      indicatorsAdded: indicatorsList.length,
      message: `Fetched and saved ${ohlcRecords.length} OHLC records from Massive`,
    });
  } catch (error: any) {
    console.error("Massive fetch error:", error);
    return NextResponse.json({
      error: error.message || "Failed to fetch data from Massive",
    }, { status: 500 });
  }
}

// GET /api/massive/status?symbol=AAPL
// Check Massive API status and recent data
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  try {
    // Check if we have recent data in DB
    const latest = await db.oHLCData.findFirst({
      where: {
        symbol: symbol?.toUpperCase(),
        timeframe: "1h",
      },
      orderBy: { timestamp: "desc" },
    });

    const count = await db.oHLCData.count({
      where: {
        symbol: symbol?.toUpperCase(),
        timeframe: "1h",
      },
    });

    // Try to fetch quote from Massive to check API connectivity
    let quoteStatus = "unknown";
    if (symbol) {
      try {
        const quote = await fetchStockQuote(symbol);
        quoteStatus = quote ? "ok" : "no_data";
      } catch (e) {
        quoteStatus = "error";
      }
    }

    return NextResponse.json({
      configured: !!process.env.MASSIVE_API_KEY,
      symbol: symbol?.toUpperCase(),
      totalRecords: count,
      latestRecord: latest ? {
        timestamp: latest.timestamp,
        close: latest.close,
      } : null,
      quoteStatus,
    });
  } catch (error) {
    console.error("Massive status error:", error);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}
