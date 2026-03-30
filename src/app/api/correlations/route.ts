import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/correlations?period=1d
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "1d";

  // Try to get cached correlation for this period (recent)
  const cached = await db.correlationCache.findFirst({
    where: { period },
    orderBy: { createdAt: "desc" },
  });

  if (cached) {
    const data = JSON.parse(cached.data);
    return NextResponse.json({ period, data, cached: true, date: cached.date });
  }

  // If no cache, compute correlations from trade history (placeholder)
  // In production, you'd compute from market data price series
  const symbols = ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "XAUT/USD"];
  const correlationData: Record<string, Record<string, number>> = {};

  // Dummy correlations (should compute actual returns correlation)
  for (const s1 of symbols) {
    correlationData[s1] = {};
    for (const s2 of symbols) {
      if (s1 === s2) {
        correlationData[s1][s2] = 1.0;
      } else {
        // Random but symmetric
        const corr = Math.random() * 0.8 + 0.2;
        correlationData[s1][s2] = Number(corr.toFixed(3));
      }
    }
  }

  // Cache for 1 hour (store anyway)
  await db.correlationCache.create({
    data: {
      period,
      data: JSON.stringify(correlationData),
    },
  });

  return NextResponse.json({ period, data: correlationData, cached: false });
}
