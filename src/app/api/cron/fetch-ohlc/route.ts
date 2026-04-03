import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchCoinglassOHLC, fetchCoinglassSpotOHLC } from "@/lib/coinglass";
import { calculateAllIndicators } from "@/lib/quant-ai/indicators";
import { saveOHLCData, saveIndicators } from "@/lib/quant-ai/data-collector";
import { randomUUID } from "crypto";

// POST /api/cron/fetch-ohlc
// Cron job to fetch OHLC data for all active symbols
// This endpoint should be called by Vercel Cron (daily on Hobby plan) or manually via admin
export async function POST(request: NextRequest) {
  // Optional: verify cron secret (configured in Vercel)
  const cronSecret = request.headers.get("x-vercel-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;
  
  if (expectedSecret && cronSecret !== expectedSecret) {
    // If cron secret doesn't match, check if user is admin (manual trigger from dashboard)
    const session = await getSession();
    if (!session?.user || session.user.role !== "admin" && session.user.role !== "pro") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // For manual triggers, continue without rate limiting delay
  } else if (expectedSecret) {
    // Cron-triggered: respect rate limits
  } else {
    // No secret set and not admin: allow (for dev) but warn
    console.warn("Fetch-ohlc called without CRON_SECRET and without admin auth");
  }

  // List of symbols to fetch using Coinglass
  const symbols = [
    { symbol: "BTC", timeframe: "1h" },
    { symbol: "XAUT", timeframe: "1h" },
    { symbol: "SOL", timeframe: "1h" },
    // Add more as needed: ETH, XRP, etc.
  ];

  const results = [];
  const errors = [];
  const rateLimitDelay = 500; // ms between API calls (Coinglass rate limit ~200 req/min)

  for (const { symbol, timeframe } of symbols) {
    try {
      // Fetch from Coinglass (try futures first, then spot)
      let coinglassData = await fetchCoinglassOHLC(symbol, timeframe, 1000);
      if (!coinglassData) {
        coinglassData = await fetchCoinglassSpotOHLC(symbol, timeframe, 1000);
      }
      if (!coinglassData || !coinglassData.data || coinglassData.data.length === 0) {
        results.push({ symbol, timeframe, provider: "coinglass", status: "no_data" });
        continue;
      }

      // Convert to database format
      const ohlcRecords = coinglassData.data.map((candle: any[]) => ({
        symbol: coinglassData.symbol,
        timeframe: coinglassData.timeframe,
        timestamp: new Date(candle[0]),
        open: Number(candle[1]),
        high: Number(candle[2]),
        low: Number(candle[3]),
        close: Number(candle[4]),
        volume: Number(candle[5]),
      }));

      // Save OHLC data
      await saveOHLCData(ohlcRecords);

      // Calculate indicators for the latest data points (last 200)
      // Only calculate for the most recent entries to save processing
      const recentOHLC = ohlcRecords.slice(-100); // last 100 periods
      let indicatorsList: any[] = [];
      if (recentOHLC.length >= 50) {
        indicatorsList = calculateAllIndicators(recentOHLC);
        
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
      }

      results.push({ 
        symbol, 
        timeframe, 
        provider: "coinglass",
        status: "success", 
        ohlcCount: ohlcRecords.length,
        indicatorCount: recentOHLC.length >= 50 ? indicatorsList.length : 0
      });

      // Rate limiting: small delay between API calls
      await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
      
    } catch (error: any) {
      console.error(`Cron fetch failed for ${symbol} (coinglass):`, error);
      errors.push({ symbol, timeframe, provider: "coinglass", error: error.message });
      results.push({ symbol, timeframe, provider: "coinglass", status: "error", error: error.message });
    }
  }

  // Log this fetch run to database (for monitoring)
  try {
    await db.fetchLog.create({
      data: {
        jobName: "fetch-ohlc",
        status: errors.length === 0 ? "success" : "partial",
        symbolsFetched: results.length,
        successful: results.filter(r => r.status === "success").length,
        failed: errors.length,
        details: JSON.stringify({ results, errors }),
      },
    });
  } catch (e) {
    // Ignore logging errors
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    summary: {
      total: symbols.length,
      successful: results.filter(r => r.status === "success").length,
      failed: errors.length,
    },
    results,
    errors,
  });
}

  // GET /api/cron/fetch-ohlc
  // Check status of last fetch runs
  export async function GET(request: NextRequest) {
    try {
      const lastRuns = await db.fetchLog.findMany({
        where: { jobName: "fetch-ohlc" },
        orderBy: { startedAt: "desc" },
        take: 10,
      });

      const latest = lastRuns[0];
      
      return NextResponse.json({
        latest: latest || null,
        recentRuns: lastRuns,
      });
    } catch (error) {
      return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
  }
