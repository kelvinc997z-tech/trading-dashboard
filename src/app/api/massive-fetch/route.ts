import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchStockOHLC, convertStockToDatabaseFormat } from "@/lib/massive";
import { saveOHLCData } from "@/lib/quant-ai/data-collector";
import { calculateAllIndicators } from "@/lib/quant-ai/indicators";
import { saveIndicators } from "@/lib/quant-ai/data-collector";

const US_STOCKS = ['AAPL', 'AMD', 'NVDA', 'MSFT', 'GOOGL'];
const RATE_LIMIT_DELAY = 650; // ms between calls

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { symbols } = await request.json();
    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json({ error: "Missing or invalid symbols array" }, { status: 400 });
    }

    const filteredSymbols = symbols.filter(s => US_STOCKS.includes(s.toUpperCase()));
    if (filteredSymbols.length === 0) {
      return NextResponse.json({ error: "No valid US stock symbols provided" }, { status: 400 });
    }

    const results = [], errors = [];

    for (const symbol of filteredSymbols) {
      try {
        const rawData = await fetchStockOHLC(symbol, "1h", 200);
        if (!rawData.c?.length) {
          results.push({ symbol, status: "no_data" });
          continue;
        }

        const ohlcRecords = convertStockToDatabaseFormat(rawData, symbol, "1h");
        await saveOHLCData(ohlcRecords);

        const indicatorsList = calculateAllIndicators(ohlcRecords.slice(-100));
        for (const ind of indicatorsList) {
          if (!ind.timestamp) continue;
          await saveIndicators(symbol.toUpperCase(), "1h", ind.timestamp, {
            rsi: ind.rsi, macd: ind.macd, macdSignal: ind.macdSignal, macdHist: ind.macdHist,
            sma20: ind.sma20, sma50: ind.sma50, sma200: ind.sma200, ema12: ind.ema12, ema26: ind.ema26,
            bollingerUpper: ind.bollingerUpper, bollingerMiddle: ind.bollingerMiddle, bollingerLower: ind.bollingerLower,
            atr: ind.atr, adx: ind.adx, stochK: ind.stochK, stochD: ind.stochD,
            williamsR: ind.williamsR, cci: ind.cci, mfi: ind.mfi, obv: ind.obv,
          });
        }

        results.push({ symbol, status: "success", ohlcCount: ohlcRecords.length, indicatorCount: indicatorsList.length });
        await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY));
      } catch (error: any) {
        errors.push({ symbol, error: error.message });
        results.push({ symbol, status: "error", error: error.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      summary: { total: filteredSymbols.length, successful: results.filter(r => r.status === "success").length, failed: errors.length },
      results, errors 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const symbol = new URL(request.url).searchParams.get("symbol");
  if (!symbol || !US_STOCKS.includes(symbol.toUpperCase())) {
    return NextResponse.json({ error: "Invalid or missing US stock symbol" }, { status: 400 });
  }

  try {
    const rawData = await fetchStockOHLC(symbol.toUpperCase(), "1h", 1);
    const latest = rawData.c?.[0] ? { timestamp: rawData.t[0], close: rawData.c[0] } : null;
    return NextResponse.json({ 
      configured: !!process.env.MASSIVE_API_KEY, 
      symbol: symbol.toUpperCase(), 
      latestRecord: latest 
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
