import { NextRequest, NextResponse } from "next/server";
import { generateAndSaveMarketSignals } from "@/lib/signal-updater";

export async function POST(request: NextRequest) {
  try {
    // Security check: Match GitHub Action header
    const authHeader = request.headers.get("authorization");
    const cronSecret = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : request.headers.get("x-vercel-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecret !== expectedSecret) {
      console.error("[MarketSignal] Unauthorized trigger attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[MarketSignal] Starting manual generation (FORCED)...");
    const signals = await generateAndSaveMarketSignals(true);

    return NextResponse.json({
      success: true,
      count: signals.length,
      processedAt: new Date().toISOString(),
      signals,
    });
  } catch (error: any) {
    console.error("Failed to generate market signals:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
