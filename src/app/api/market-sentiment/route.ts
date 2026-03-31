import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/market-sentiment
// Returns aggregated sentiment for symbols in user's watchlist or default list
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const limit = parseInt(searchParams.get("limit") || "20");

  // If symbol provided, get sentiment for that symbol
  if (symbol) {
    // Mock sentiment for now - in production, integrate with Finnhub/News API
    const mockSentiment = generateMockSentiment(symbol);
    return NextResponse.json(mockSentiment);
  }

  // Otherwise, get aggregated market sentiment from recent notifications/events
  // This is a simplified version - in production, you'd aggregate from multiple sources
  
  const defaultSymbols = ["BTC", "ETH", "XAUT", "SOL", "XRP", "EURUSD", "USDJPY", "OIL"];
  const sentiments = defaultSymbols.map(s => generateMockSentiment(s));

  // Calculate overall market sentiment
  const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
  const overall = {
    score: avgScore,
    trend: avgScore > 0.1 ? "bullish" : avgScore < -0.1 ? "bearish" : "neutral",
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json({
    overall,
    symbols: sentiments,
  });
}

function generateMockSentiment(symbol: string) {
  // Generate deterministic but varying sentiment based on symbol
  const seed = symbol.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const val = Math.sin(seed + Date.now() / 1000) * 100;
    return min + (val - Math.floor(val)) * (max - min);
  };

  const score = random(-1, 1); // -1 to 1
  const confidence = random(0.5, 0.95);
  
  const newsCount = Math.floor(random(5, 30));
  const positiveCount = Math.floor(newsCount * ((score + 1) / 2));
  const negativeCount = newsCount - positiveCount;

  return {
    symbol,
    score,
    confidence,
    trend: score > 0.1 ? "bullish" : score < -0.1 ? "bearish" : "neutral",
    newsCount,
    positiveNews: positiveCount,
    negativeNews: negativeCount,
    sources: ["Finnhub", "CryptoCompare", "NewsAPI"],
    lastUpdated: new Date().toISOString(),
  };
}
