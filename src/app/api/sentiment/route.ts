import { NextRequest, NextResponse } from "next/server";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// GET /api/sentiment?symbol=BTC&period=1d
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.replace("/", "");
  const period = searchParams.get("period") || "1d";

  if (!symbol || !FINNHUB_API_KEY) {
    return NextResponse.json({ error: "Missing symbol or Finnhub API key" }, { status: 400 });
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

    let scoreSum = 0;
    const articles: any[] = [];

    for (const item of news.slice(0, 20)) { // top 20
      const text = (item.headline + " " + (item.summary || "")).toLowerCase();
      let pos = 0, neg = 0;
      for (const w of positiveWords) if (text.includes(w)) pos++;
      for (const w of negativeWords) if (text.includes(w)) neg++;
      const sentiment = pos - neg;
      scoreSum += sentiment;
      articles.push({
        headline: item.headline,
        summary: item.summary,
        source: item.source,
        datetime: item.datetime,
        sentiment: sentiment > 0 ? "positive" : sentiment < 0 ? "negative" : "neutral",
      });
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
