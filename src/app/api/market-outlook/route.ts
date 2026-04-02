import { NextRequest, NextResponse } from "next/server";
import { generateRealTimeOutlook } from "@/lib/market-outlook";

// GET /api/market-outlook
// Returns REAL-TIME market outlook signals generated from Coinglass OHLC data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "full"; // "full" or "list"

    // Generate real-time outlook using Coinglass data
    const outlook = await generateRealTimeOutlook();

    if (format === "list") {
      return NextResponse.json(outlook.pairs);
    }

    return NextResponse.json(outlook);

  } catch (error) {
    console.error("Market outlook error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate market outlook",
        generatedAt: new Date().toISOString(),
        market: "Unavailable",
        pairs: [],
        disclaimer: "Data temporarily unavailable"
      },
      { status: 500 }
    );
  }
}
