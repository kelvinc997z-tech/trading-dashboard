import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchOHLC, convertOHLCtoDatabaseFormat } from "@/lib/finnhub";
import { calculateAllIndicators } from "@/lib/quant-ai/indicators";
import { saveOHLCData, saveIndicators } from "@/lib/quant-ai/data-collector";

// POST /api/finnhub/fetch
// Fetch OHLC data from Finnhub and store in database
// Requires Pro subscription (or admin)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional: restrict to pro users
  // if (session.user.role !== "pro") {
  //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // }

  try {
    const body = await request.json();
    const { symbol, timeframe = "1h", count = 200 } = body;

    if (!symbol) {
      return NextResponse.json({ error: "Symbol required" }, { status: 400 });
    }

    // 1. Fetch OHLC from Finnhub
    const rawData = await fetchOHLC(symbol, timeframe, count);

    if (!rawData.c || rawData.c.length === 0) {
      return NextResponse.json({ error: "No data returned from Finnhub" }, { status: 404 });
    }

    // 2. Convert to database format
    const ohlcRecords = convertOHLCtoDatabaseFormat(rawData, symbol, timeframe);

    if (ohlcRecords.length === 0) {
      return NextResponse.json({ error: "Failed to parse OHLC data" }, { status: 500 });
    }

    // 3. Save to OHLCData table
    await saveOHLCData(ohlcRecords);

    // 4. Calculate indicators for all records
    const indicatorsList = calculateAllIndicators(ohlcRecords);

    // 5. Save indicators to database (batch)
    for (const ind of indicatorsList) {
      await saveIndicators(
        symbol,
        timeframe,
        new Date(ind.timestamp),
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
      symbol,
      timeframe,
      recordsAdded: ohlcRecords.length,
      indicatorsAdded: indicatorsList.length,
    });
  } catch (error: any) {
    console.error("Finnhub fetch error:", error);
    return NextResponse.json({
      error: error.message || "Failed to fetch data from Finnhub",
    }, { status: 500 });
  }
}

// GET /api/finnhub/status
// Check Finnhub API key and recent data status
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const timeframe = searchParams.get("timeframe") || "1h";

  try {
    // Check if we have recent data
    const latest = await db.oHLCData.findFirst({
      where: {
        symbol: symbol?.toUpperCase(),
        timeframe,
      },
      orderBy: { timestamp: "desc" },
    });

    // Count total records
    const count = await db.oHLCData.count({
      where: {
        symbol: symbol?.toUpperCase(),
        timeframe,
      },
    });

    return NextResponse.json({
      configured: !!process.env.FINNHUB_API_KEY,
      symbol,
      timeframe,
      totalRecords: count,
      latestRecord: latest ? {
        timestamp: latest.timestamp,
        close: latest.close,
      } : null,
    });
  } catch (error) {
    console.error("Finnhub status error:", error);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}
