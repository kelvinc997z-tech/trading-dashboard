import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prepareTrainingDataset } from "@/lib/quant-ai/data-collector";
import { trainModel } from "@/lib/quant-ai/models";
import { db } from "@/lib/db";

// POST /api/quant-ai/train
// Trigger model training (Pro users only)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow pro users to trigger training
  if (session.user.role !== "pro") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { symbol, timeframe = "1h" } = body;

    if (!symbol) {
      return NextResponse.json({ error: "Symbol required" }, { status: 400 });
    }

    // Prepare dataset
    const { X, y } = await prepareTrainingDataset(symbol, timeframe);

    if (X.length < 100) {
      return NextResponse.json({ error: "Insufficient data for training" }, { status: 400 });
    }

    // Train model
    const { modelPath, metrics } = await trainModel(symbol, timeframe, X, y);

    // Note: Model metrics could be saved to a ModelMetric table in the future
    // For now, just return the results

    return NextResponse.json({ success: true, modelPath, metrics });
  } catch (error) {
    console.error("Training error:", error);
    return NextResponse.json({ error: "Training failed" }, { status: 500 });
  }
}
