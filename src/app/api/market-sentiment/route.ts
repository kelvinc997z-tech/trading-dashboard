import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchCompanyNews, fetchNews } from "@/lib/finnhub";
import { aggregateSentiment } from "@/lib/sentiment-analyzer";

// GET /api/market-sentiment
// Returns aggregated sentiment for symbols
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const limit = parseInt(searchParams.get("limit") || "20");

  // If specific symbol requested, return sentiment for that symbol only
  if (symbol) {
    const sentiment = await getSymbolSentiment(symbol);
    return NextResponse.json(sentiment);
  }

  // Otherwise, return sentiment for default set of symbols
  const defaultSymbols = ["BTC", "ETH", "XAUT", "SOL", "XRP", "EURUSD", "USDJPY", "OIL"];
  const sentiments: any[] = [];
  
  // Fetch sentiment for each symbol (with some concurrency limit)
  for (const sym of defaultSymbols.slice(0, 8)) {
    try {
      const sentiment = await getSymbolSentiment(sym);
      sentiments.push(sentiment);
    } catch (error) {
      console.error(`Failed to fetch sentiment for ${sym}:`, error);
      // Add placeholder with error flag
      sentiments.push({
        symbol: sym,
        score: 0,
        confidence: 0,
        trend: "neutral",
        newsCount: 0,
        positiveNews: 0,
        negativeNews: 0,
        sources: [],
        lastUpdated: new Date().toISOString(),
        error: true,
      });
    }
  }

  // Calculate overall market sentiment (average of non-error entries)
  const validSentiments = sentiments.filter(s => !s.error);
  const avgScore = validSentiments.reduce((sum, s) => sum + s.score, 0) / validSentiments.length;
  const overall = {
    score: avgScore,
    trend: avgScore > 0.1 ? "bullish" : avgScore < -0.1 ? "bearish" : "neutral",
    updatedAt: new Date().toISOString(),
    symbolsCount: validSentiments.length,
  };

  return NextResponse.json({
    overall,
    symbols: sentiments,
  });
}

// Helper: get sentiment for a single symbol
async function getSymbolSentiment(symbol: string): Promise<any> {
  try {
    // Try to fetch company/crypto news from Finnhub
    let articles: any[] = [];
    
    if (symbol.includes("USD") || symbol.includes("/")) {
      // Forex pair - use general crypto/forex news
      const category = symbol.includes("JPY") || symbol.includes("EUR") || symbol.includes("GBP") ? "forex" : "general";
      const newsData = await fetchNews(category, 20);
      articles = newsData.slice(0, 15) || [];
    } else {
      // Crypto - fetch company news
      articles = await fetchCompanyNews(symbol, 15);
    }

    if (!articles || articles.length === 0) {
      return {
        symbol,
        score: 0,
        confidence: 0,
        trend: "neutral",
        newsCount: 0,
        positiveNews: 0,
        negativeNews: 0,
        sources: [],
        lastUpdated: new Date().toISOString(),
        error: false,
      };
    }

    // Analyze sentiment
    const analysis = aggregateSentiment(articles, symbol);

    return {
      symbol,
      score: analysis.score,
      confidence: analysis.confidence,
      trend: analysis.score > 0.1 ? "bullish" : analysis.score < -0.1 ? "bearish" : "neutral",
      newsCount: analysis.totalCount,
      positiveNews: analysis.positiveCount,
      negativeNews: analysis.negativeCount,
      sources: ["Finnhub"],
      lastUpdated: new Date().toISOString(),
      topArticles: analysis.articles.slice(0, 3).map(a => a.title),
      error: false,
    };
  } catch (error) {
    console.error(`Sentiment error for ${symbol}:`, error);
    return {
      symbol,
      score: 0,
      confidence: 0,
      trend: "neutral",
      newsCount: 0,
      positiveNews: 0,
      negativeNews: 0,
      sources: [],
      lastUpdated: new Date().toISOString(),
      error: true,
    };
  }
}
