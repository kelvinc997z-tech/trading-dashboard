import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOHLCHistory } from "@/lib/quant-ai/data-collector";
import { calculateAllIndicators } from "@/lib/quant-ai/indicators";
import { saveIndicators } from "@/lib/quant-ai/data-collector";

// POST /api/indicators/calculate
// Calculate technical indicators from OHLC data and save to database
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { symbol, timeframe = "1h", limit = 1000 } = body;

    if (!symbol) {
      return NextResponse.json({ error: "Symbol required" }, { status: 400 });
    }

    // 1. Fetch OHLC data from database
    const ohlcData = await getOHLCHistory(symbol, timeframe, limit);

    if (ohlcData.length < 50) {
      return NextResponse.json({
        error: "Insufficient OHLC data. Please fetch data first via /api/finnhub/fetch",
      }, { status: 400 });
    }

    // 2. Convert to format expected by calculateAllIndicators
    const ohlcForIndicators = ohlcData.map(d => ({
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
      timestamp: d.timestamp,
    }));

    // 3. Calculate all indicators
    const indicatorsList = calculateAllIndicators(ohlcForIndicators);

    if (indicatorsList.length === 0) {
      return NextResponse.json({ error: "Failed to calculate indicators (insufficient data)" }, { status: 400 });
    }

    // 4. Save each indicator to database
    let savedCount = 0;
    for (const ind of indicatorsList) {
      if (!ind.timestamp) continue; // skip if no timestamp
      
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
      savedCount++;
    }

    return NextResponse.json({
      success: true,
      symbol: symbol.toUpperCase(),
      timeframe,
      ohlcRecords: ohlcData.length,
      indicatorsCalculated: indicatorsList.length,
      indicatorsSaved: savedCount,
      message: `Calculated and saved ${savedCount} indicator records`,
    });
  } catch (error: any) {
    console.error("Calculate indicators error:", error);
    return NextResponse.json({
      error: error.message || "Failed to calculate indicators",
    }, { status: 500 });
  }
}

// GET /api/indicators/calculate?symbol=BTC&timeframe=1h
// Check status: latest indicator timestamp vs OHLC
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const timeframe = searchParams.get("timeframe") || "1h";

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  try {
    // Check latest OHLC
    const latestOHLC = await db.oHLCData.findFirst({
      where: {
        symbol: symbol.toUpperCase(),
        timeframe,
      },
      orderBy: { timestamp: "desc" },
    });

    // Check latest indicator
    const latestIndicator = await db.indicator.findFirst({
      where: {
        symbol: symbol.toUpperCase(),
        timeframe,
      },
      orderBy: { timestamp: "desc" },
    });

    const ohlcCount = await db.oHLCData.count({
      where: {
        symbol: symbol.toUpperCase(),
        timeframe,
      },
    });

    const indicatorCount = await db.indicator.count({
      where: {
        symbol: symbol.toUpperCase(),
        timeframe,
      },
    });

    const isUpToDate = latestOHLC && latestIndicator && 
      latestIndicator.timestamp.getTime() >= latestOHLC.timestamp.getTime() - 60 * 60 * 1000; // within 1 hour

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      timeframe,
      ohlcCount,
      indicatorCount,
      latestOHLC: latestOHLC ? latestOHLC.timestamp : null,
      latestIndicator: latestIndicator ? latestIndicator.timestamp : null,
      isUpToDate,
      needsCalculation: !latestIndicator || (latestOHLC && latestIndicator.timestamp < latestOHLC.timestamp),
    });
  } catch (error) {
    console.error("Indicators status error:", error);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}
