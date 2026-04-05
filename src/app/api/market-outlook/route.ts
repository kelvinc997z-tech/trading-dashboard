import { NextRequest, NextResponse } from "next/server";
import { generateRealTimeOutlook } from "@/lib/market-outlook";

// GET /api/market-outlook
// Returns REAL-TIME market outlook signals generated from Coinglass OHLC data
// Marked as dynamic to avoid static generation errors
import dynamic from "next/dynamic";

export const dynamic = "force-dynamic"; // This route must be dynamic (uses request, external APIs)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "full"; // "full" or "list"

    // Generate real-time outlook using multiple data sources
    const outlook = await generateRealTimeOutlook();

    if (format === "list") {
      return NextResponse.json(outlook.pairs);
    }

    return NextResponse.json(outlook);

  } catch (error) {
    console.error("[MarketOutlook] Error:", error);
    // Return fallback data even on error to prevent build failures
    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        market: "Limited (Service Unavailable)",
        pairs: [
          {
            symbol: "XAUT/USD",
            name: "Gold",
            emoji: "🪙",
            signal: "neutral",
            entry: 0,
            tp: 0,
            sl: 0,
            confidence: 0,
            reasoning: "Market data temporarily unavailable"
          }
        ],
        disclaimer: "Some signals may be delayed or unavailable due to API limits"
      },
      { status: 200 } // Return 200 to not break builds/static pages
    );
  }
}
