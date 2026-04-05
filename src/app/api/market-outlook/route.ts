import { NextRequest, NextResponse } from "next/server";
import { generateRealTimeOutlook } from "@/lib/market-outlook";

// GET /api/market-outlook
// Returns REAL-TIME market outlook signals
// Must be dynamic (uses request.url, external APIs)
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "full";

    // Generate real-time outlook using multiple data sources
    console.log("[MarketOutlook] GET request received");
    const outlook = await generateRealTimeOutlook();

    console.log("[MarketOutlook] Generated:", { pairs: outlook.pairs.length, sources: outlook.pairs.map(p => p.symbol + ":" + (p as any).source) });

    if (format === "list") {
      return NextResponse.json(outlook.pairs);
    }

    return NextResponse.json(outlook);

  } catch (error) {
    console.error("[MarketOutlook] Error:", error);
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
      { status: 200 }
    );
  }
}
