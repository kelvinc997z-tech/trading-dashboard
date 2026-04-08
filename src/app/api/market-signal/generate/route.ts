import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAndSaveMarketSignals } from "@/lib/signal-updater";

const MIN_GENERATE_INTERVAL_MS =
  parseInt(process.env.GENERATE_INTERVAL_MINUTES || "30") * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    // Rate limit: check last generation time
    const lastSignal = await db.marketSignal.findFirst({
      orderBy: { generatedAt: "desc" },
    });

    if (lastSignal) {
      const diff = Date.now() - new Date(lastSignal.generatedAt).getTime();
      if (diff < MIN_GENERATE_INTERVAL_MS) {
        // Too soon, return existing recent signals
        const existing = await db.marketSignal.findMany({
          where: {
            generatedAt: {
              gte: new Date(Date.now() - 8 * 60 * 60 * 1000),
            },
          },
          orderBy: { generatedAt: "desc" },
        });
        return NextResponse.json({
          success: true,
          count: existing.length,
          signals: existing,
          skipped: true,
          reason: "rate_limited",
          nextAvailableInMs: MIN_GENERATE_INTERVAL_MS - diff,
        });
      }
    }

    const signals = await generateAndSaveMarketSignals();

    return NextResponse.json({
      success: true,
      count: signals.length,
      signals,
    });
  } catch (error) {
    console.error("Failed to generate market signals:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate signals" },
      { status: 500 }
    );
  }
}
