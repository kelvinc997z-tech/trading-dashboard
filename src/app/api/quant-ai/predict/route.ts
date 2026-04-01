import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOHLCHistory, getIndicators } from "@/lib/quant-ai/data-collector";
import { predict } from "@/lib/quant-ai/models";

// POST /api/quant-ai/predict
// Generate AI prediction for a symbol
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { symbol, timeframe = "1h" } = body;

    if (!symbol) {
      return NextResponse.json({ error: "Symbol required" }, { status: 400 });
    }

    // Fetch latest OHLC and indicators
    const ohlc = await getOHLCHistory(symbol, timeframe, 200);
    const indicatorData = await getIndicators(symbol, timeframe, 200);

    if (ohlc.length < 60) {
      return NextResponse.json({ error: "Insufficient historical data" }, { status: 400 });
    }

    // Use the latest indicator values from database
    const latestIndicators = indicatorData[indicatorData.length - 1];

    if (!latestIndicators) {
      return NextResponse.json({ error: "No indicator data available. Please ensure indicators are calculated." }, { status: 400 });
    }

    // Build feature vector (same order as in training)
    const latest = ohlc[ohlc.length - 1];
    const features: number[] = [
      latest.close,
      latest.volume,
      latestIndicators.rsi,
      latestIndicators.macd,
      latestIndicators.macdSignal,
      latestIndicators.macdHist,
      latestIndicators.sma20,
      latestIndicators.sma50,
      latestIndicators.sma200,
      latestIndicators.ema12,
      latestIndicators.ema26,
      latestIndicators.bollingerUpper,
      latestIndicators.bollingerMiddle,
      latestIndicators.bollingerLower,
      latestIndicators.atr,
      latestIndicators.adx,
      latestIndicators.stochK,
      latestIndicators.stochD,
      latestIndicators.williamsR,
      latestIndicators.cci,
      latestIndicators.mfi,
      latestIndicators.obv,
      // Last N closes (lookback)
      ...ohlc.slice(-60).map(d => d.close),
    ];

    // Get prediction
    const prediction = await predict(symbol, timeframe, features);

    // Save prediction to database (tied to user)
    await db.prediction.create({
      data: {
        userId: session.user.id,
        symbol,
        timeframe,
        modelType: prediction.modelType,
        direction: prediction.direction,
        confidence: prediction.confidence,
        price: prediction.predictedPrice,
        features: JSON.stringify(prediction.featuresUsed),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
        timestamp: new Date(),
      },
    });

    return NextResponse.json(prediction);
  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json({ error: "Failed to generate prediction" }, { status: 500 });
  }
}

// GET /api/quant-ai/predictions
// Get recent predictions for a symbol
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const timeframe = searchParams.get("timeframe") || "1h";
  const limit = parseInt(searchParams.get("limit") || "10");

  const where: any = { timeframe };
  if (symbol) {
    where.symbol = symbol;
  }

  const predictions = await db.prediction.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  // Parse JSON features
  const parsed = predictions.map(p => ({
    ...p,
    features: p.features ? JSON.parse(p.features) : null,
  }));

  return NextResponse.json({ predictions: parsed });
}
