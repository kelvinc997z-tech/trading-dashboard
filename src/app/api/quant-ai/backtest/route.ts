import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prepareTrainingDataset } from "@/lib/quant-ai/data-collector";
import { backtest } from "@/lib/quant-ai/models";

// POST /api/quant-ai/backtest
// Run backtest on historical data
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { symbol, timeframe = "1h", initialCapital = 10000 } = body;

    if (!symbol) {
      return NextResponse.json({ error: "Symbol required" }, { status: 400 });
    }

    // Prepare dataset
    const { X, y } = await prepareTrainingDataset(symbol, timeframe);

    if (X.length < 100) {
      return NextResponse.json({ error: "Insufficient data for backtesting" }, { status: 400 });
    }

    // Run backtest
    const results = await backtest(X, y, initialCapital);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Backtest error:", error);
    return NextResponse.json({ error: "Backtest failed" }, { status: 500 });
  }
}
