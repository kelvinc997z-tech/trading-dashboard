import { NextRequest, NextResponse } from "next/server";
import { generateAndSaveMarketSignals } from "@/lib/signal-updater";

export async function POST(request: NextRequest) {
  try {
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
