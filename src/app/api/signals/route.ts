import { NextRequest, NextResponse } from "next/server";
import { fetchOHLC } from "@/lib/data-provider";
import { generateSignal } from "@/lib/signal-generator";

// GET /api/signals?symbol=BTC&timeframe=1h&limit=200
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const timeframe = searchParams.get("timeframe") || "1h";
  const limit = parseInt(searchParams.get("limit") || "200");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  try {
    // Fetch OHLC data
    const result = await fetchOHLC(symbol, timeframe, limit);

    if (result.data.length < 50) {
      return NextResponse.json({
        error: "Insufficient data for signal generation",
        dataCount: result.data.length,
      }, { status: 400 });
    }

    // Generate signal
    const signal = generateSignal(result.data, result.symbol);

    return NextResponse.json({
      symbol: result.symbol,
      timeframe: result.timeframe,
      signal: signal.signal,
      entry: signal.entry,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      confidence: signal.confidence,
      reason: signal.reason,
      timestamp: signal.timestamp.toISOString(),
      indicators: signal.indicators,
      dataPoints: result.data.length,
      source: result.source,
    });
  } catch (error: any) {
    console.error(`[Signal] Error for ${symbol}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
