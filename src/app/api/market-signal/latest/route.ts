import { NextRequest, NextResponse } from "next/server";
import { getLatestMarketSignals } from "@/lib/signal-updater";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  try {
    const signals = await getLatestMarketSignals(forceRefresh);

    return NextResponse.json({
      success: true,
      count: signals.length,
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
