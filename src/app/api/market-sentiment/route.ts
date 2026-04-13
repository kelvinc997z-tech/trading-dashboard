import { NextResponse } from "next/server";
import { fetchYahooFinanceCandles } from "@/lib/yahoo-finance";

// Cache for 30 minutes
const CACHE_TTL = 1800;
let cachedData: { data: any; timestamp: number } | null = null;

async function fetchCryptoFNG() {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1");
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchMarketVIX() {
  try {
    // ^VIX is the CBOE Volatility Index
    const candles = await fetchYahooFinanceCandles("^VIX", "1d", "1h");
    if (candles.length > 0) {
      const latest = candles[candles.length - 1];
      return latest.close;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL * 1000) {
    return NextResponse.json(cachedData.data, {
      headers: { "X-Cache": "HIT" },
    });
  }

  try {
    const [cryptoData, vixValue] = await Promise.all([
      fetchCryptoFNG(),
      fetchMarketVIX()
    ]);

    const cryptoScore = cryptoData ? Number(cryptoData.value) : 50;
    
    // Normalize VIX: < 15 is greed (80), > 35 is fear (20), 20 is neutral (50)
    // Formula: Max(0, Min(100, 100 - (vixValue - 10) * 3)) approx
    let marketScore = 50;
    if (vixValue) {
      if (vixValue <= 15) marketScore = 80;
      else if (vixValue >= 35) marketScore = 20;
      else {
        // Linear interpolation between 15 (80) and 35 (20)
        marketScore = 80 - ((vixValue - 15) / (35 - 15)) * (80 - 20);
      }
    }

    // Weighted average: 40% Crypto, 60% Market VIX
    const combinedValue = (cryptoScore * 0.4) + (marketScore * 0.6);
    
    // Map to -1..1 for backward compatibility in internal scoring if needed
    const normalizedScore = (combinedValue - 50) / 50;

    const classification = (val: number) => {
      if (val >= 75) return "extreme greed";
      if (val >= 55) return "greed";
      if (val >= 45) return "neutral";
      if (val >= 25) return "fear";
      return "extreme fear";
    };

    const overall = {
      value: Math.round(combinedValue),
      score: Number(normalizedScore.toFixed(3)), // -1..1
      trend: combinedValue >= 55 ? "bullish" : combinedValue <= 45 ? "bearish" : "neutral",
      classification: classification(combinedValue),
      updatedAt: new Date().toISOString(),
      details: {
        crypto: cryptoScore,
        traditional: Math.round(marketScore),
        vix: vixValue
      }
    };

    const response = { overall, symbols: [] };
    cachedData = { data: response, timestamp: Date.now() };

    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
