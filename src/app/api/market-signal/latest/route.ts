import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Cache signals in memory for 7 hours (less than 8h cron interval)
let cachedSignals: any[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL = 7 * 60 * 60 * 1000; // 7 hours

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  try {
    // Check in-memory cache first
    if (!forceRefresh && cachedSignals && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        count: cachedSignals.length,
        timeframe: "8h",
        lastUpdated: cachedSignals[0]?.generatedAt || null,
        signals: cachedSignals,
        cached: true,
      });
    }

    // Check DB for recent signals (< 8 hours)
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);

    let signals = await db.marketSignal.findMany({
      where: {
        generatedAt: {
          gte: eightHoursAgo,
        },
      },
      orderBy: {
        generatedAt: "desc",
      },
    });

    // If no recent signals, generate fresh
    if (signals.length === 0 || forceRefresh) {
      const { generateAndSaveMarketSignals } = await import("@/lib/signal-updater");
      signals = await generateAndSaveMarketSignals();
    }

    // Update cache
    cachedSignals = signals;
    cacheTimestamp = Date.now();

    return NextResponse.json({
      success: true,
      count: signals.length,
      timeframe: "8h",
      lastUpdated: signals[0]?.generatedAt || null,
      signals,
      cached: false,
    });
  } catch (error) {
    console.error("Failed to fetch market signals:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch signals" },
      { status: 500 }
    );
  }
}
