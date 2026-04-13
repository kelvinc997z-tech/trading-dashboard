import { NextRequest, NextResponse } from "next/server";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// GET /api/sentiment?symbol=BTC&period=1d
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.replace("/", "");
  const period = searchParams.get("period") || "1d";

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  try {
    // Finnhub news endpoint (free tier has rate limits)
    const days = period === "1h" ? 1 : period === "4h" ? 1 : period === "1d" ? 7 : 30;
    const url = `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Finnhub error: ${res.status}`);

    const news = await res.json();

    // Simple sentiment scoring: count positive/negative words
    const positiveWords = ["bull", "gain", "rise", "growth", "positive", "up", "surge", "soar", "rally", "strong", "buy"];
    const negativeWords = ["bear", "loss", "drop", "fall", "decline", "negative", "down", "crash", "weak", "sell", "risk", "fear"];

    const articles: any[] = [];
    
    // Fallback to Yahoo Finance Search if Finnhub fails or for better relevance
    const yahooUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&newsCount=15`;
    const yRes = await fetch(yahooUrl, { next: { revalidate: 3600 } });
    
    if (yRes.ok) {
      const yData = await yRes.json();
      const newsItems = yData.news || [];
      
      for (const item of newsItems) {
        const text = (item.title + " " + (item.summary || "")).toLowerCase();
        let pos = 0, neg = 0;
        for (const w of positiveWords) if (text.includes(w)) pos++;
        for (const w of negativeWords) if (text.includes(w)) neg++;
        const sentimentScore = pos - neg;
        scoreSum += sentimentScore;
        articles.push({
          headline: item.title,
          summary: item.summary || "",
          source: item.publisher || "Yahoo Finance",
          datetime: item.provider_publish_time,
          sentiment: sentimentScore > 0 ? "positive" : sentimentScore < 0 ? "negative" : "neutral",
        });
      }
    } else {
      // Fallback to generic Finnhub news if Yahoo fails
      const url = `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (res.ok) {
        const news = await res.json();
        for (const item of news.slice(0, 15)) {
          const text = (item.headline + " " + (item.summary || "")).toLowerCase();
          let pos = 0, neg = 0;
          for (const w of positiveWords) if (text.includes(w)) pos++;
          for (const w of negativeWords) if (text.includes(w)) neg++;
          const sentimentScore = pos - neg;
          scoreSum += sentimentScore;
          articles.push({
            headline: item.headline,
            summary: item.summary,
            source: item.source,
            datetime: item.datetime,
            sentiment: sentimentScore > 0 ? "positive" : sentimentScore < 0 ? "negative" : "neutral",
          });
        }
      }
    }

    const avgScore = articles.length ? scoreSum / articles.length : 0;
    const normalizedScore = Math.max(-1, Math.min(1, avgScore / 5)); // clamp -1..1

    // Simulated Social Sentiment (Reddit/Twitter)
    // Based on news trend with some randomized noise to simulate volatility
    const socialBase = normalizedScore;
    const socialScore = Math.max(-1, Math.min(1, socialBase + (Math.random() * 0.4 - 0.2)));
    
    const socialMetrics = {
      reddit: {
        score: Number(socialScore.toFixed(3)),
        mentions: Math.floor(Math.random() * 1000) + 500,
        sentiment: socialScore > 0.2 ? "positive" : socialScore < -0.2 ? "negative" : "neutral",
      },
      twitter: {
        score: Number((socialScore + 0.1).toFixed(3)),
        mentions: Math.floor(Math.random() * 5000) + 1000,
        sentiment: (socialScore + 0.1) > 0.2 ? "positive" : (socialScore + 0.1) < -0.2 ? "negative" : "neutral",
      }
    };

    return NextResponse.json({
      symbol,
      period,
      score: Number(normalizedScore.toFixed(3)),
      articles: articles.slice(0, 10),
      totalArticles: articles.length,
      social: socialMetrics,
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Sentiment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
