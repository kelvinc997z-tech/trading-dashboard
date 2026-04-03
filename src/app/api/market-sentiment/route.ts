import { NextResponse } from "next/server";

// Cache for 1 hour (Fear & Greed updates hourly)
const CACHE_TTL = 3600;
let cachedData: { data: any; timestamp: number } | null = null;

export async function GET() {
  // Return cache if valid
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL * 1000) {
    return NextResponse.json(cachedData.data, {
      headers: {
        "Cache-Control": `public, max-age=${CACHE_TTL}`,
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1");
    if (!res.ok) {
      throw new Error(`Alternative.me error: ${res.status}`);
    }
    const data = await res.json();

    if (!data.data || data.data.length === 0) {
      throw new Error("No sentiment data");
    }

    const fng = data.data[0];
    const value = Number(fng.value);
    // Normalize to -1..1 scale
    const normalizedScore = (value - 50) / 50;

    let trend: "bullish" | "bearish" | "neutral" = "neutral";
    const classification = fng.value_classification?.toLowerCase();
    if (classification === "greed") trend = "bullish";
    else if (classification === "fear") trend = "bearish";

    const overall = {
      score: Number(normalizedScore.toFixed(3)),
      trend,
      updatedAt: new Date(parseInt(fng.timestamp) * 1000).toISOString(),
    };

    // Empty per-symbol data for now (future extension with CryptoQuant if key available)
    const symbols: any[] = [];

    const response = { overall, symbols };
    cachedData = { data: response, timestamp: Date.now() };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": `public, max-age=${CACHE_TTL}`,
        "X-Cache": "MISS",
      },
    });
  } catch (err: any) {
    if (cachedData) {
      return NextResponse.json(cachedData.data, {
        headers: {
          "Cache-Control": `public, max-age=${CACHE_TTL}`,
          "X-Cache": "STALE",
        },
      });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
