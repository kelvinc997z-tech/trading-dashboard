import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const MIN_GENERATE_INTERVAL_MS =
  parseInt(process.env.GENERATE_INTERVAL_MINUTES || "30") * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  try {
    // Check in-memory cache first (if implemented)
    // Then check DB for recent signals (< 8 hours)
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

    // If forceRefresh or no recent signals, consider generating fresh
    if (signals.length === 0 || forceRefresh) {
      // Rate limit check before generating
      const lastSignal = await db.marketSignal.findFirst({
        orderBy: { generatedAt: "desc" },
      });

      const shouldGenerate =
        signals.length === 0 ||
        !lastSignal ||
        Date.now() - new Date(lastSignal.generatedAt).getTime() >=
          MIN_GENERATE_INTERVAL_MS;

      if (shouldGenerate) {
        const { generateAndSaveMarketSignals } = await import(
          "@/lib/signal-updater"
        );
        signals = await generateAndSaveMarketSignals();
      } else {
        // Rate limited: keep existing signals (may be empty if none)
        // Already have signals from DB query above
        console.log("[MarketSignal] Generation skipped due to rate limit");
      }
    }

    return NextResponse.json({
      success: true,
      count: signals.length,
      timeframe: "8h",
      lastUpdated: signals[0]?.generatedAt || null,
      signals,
    });
  } catch (error) {
    console.error("Failed to fetch market signals:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch signals" },
      { status: 500 }
    );
  }
}
