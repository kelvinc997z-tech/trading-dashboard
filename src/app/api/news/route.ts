import { NextResponse } from "next/server";

// Dummy news data - replace with real API (NewsAPI, CoinDesk, etc.)
const dummyNews = [
  {
    id: "1",
    title: "Bitcoin Rally Continues as Institutional Adoption Grows",
    summary: "Major banks announce BTC custody services, pushing price above $70k.",
    content: "Full article text...",
    source: "CoinDesk",
    sourceUrl: "https://www.coindesk.com",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: "crypto",
    sentiment: "bullish",
    relatedSymbols: ["BTC/USD"],
    impact: "high",
    language: "en",
  },
  {
    id: "2",
    title: "Fed Holds Rates Steady, Signals Cautious Approach",
    summary: "The Federal Reserve kept interest rates unchanged but hinted at future cuts.",
    source: "Bloomberg",
    sourceUrl: "https://www.bloomberg.com",
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    category: "macro",
    sentiment: "neutral",
    relatedSymbols: ["USD/JPY", "EUR/USD"],
    impact: "high",
    language: "en",
  },
  {
    id: "3",
    title: "Gold Prices Edge Higher on Inflation Concerns",
    summary: "XAU/USD touches new weekly high as CPI data comes in above expectations.",
    source: "Reuters",
    sourceUrl: "https://www.reuters.com",
    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    category: "commodities",
    sentiment: "bullish",
    relatedSymbols: ["XAUT/USD", "XAU/USD"],
    impact: "medium",
    language: "en",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category"); // crypto, macro, commodities, all
  const timeframe = searchParams.get("timeframe") || "24h"; // 24h, 7d, 30d
  const query = searchParams.get("q") || "";
  const language = searchParams.get("lang") || "en";

  // Filter by timeframe
  const now = new Date();
  let cutoff: Date;
  switch (timeframe) {
    case "24h":
      cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      cutoff = new Date(0);
  }

  let news = dummyNews.filter(
    (n) => new Date(n.publishedAt) >= cutoff && n.language === language
  );

  if (category && category !== "all") {
    news = news.filter((n) => n.category === category);
  }

  if (query) {
    const q = query.toLowerCase();
    news = news.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q)
    );
  }

  // Sort by publishedAt desc
  news.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return NextResponse.json({ news, total: news.length });
}
