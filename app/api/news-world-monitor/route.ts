import { NextResponse } from "next/server";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  summary: string;
  url: string;
  category: "market" | "economic" | "breaking" | "crypto" | "forex" | "general";
}

// Fallback mock data if scraping fails
const MOCK_NEWS: NewsItem[] = [
  {
    id: "wm-1",
    title: "Gold prices surge to new all-time highs on geopolitical tensions",
    source: "World Monitor",
    time: new Date().toLocaleTimeString(),
    summary: "XAUUSD reaches $2,350 as safe-haven demand increases amid global uncertainties.",
    url: "https://world-monitor.app",
    category: "breaking",
  },
  {
    id: "wm-2",
    title: "US Oil (WTI) stabilizes after overnight volatility",
    source: "World Monitor",
    time: new Date().toLocaleTimeString(),
    summary: "USOIL trading at $88.45 with 0.5% change as OPEC+ meeting approaches.",
    url: "https://world-monitor.app",
    category: "market",
  },
  {
    id: "wm-3",
    title: "Bitcoin maintains bullish momentum above $68k",
    source: "World Monitor",
    time: new Date().toLocaleTimeString(),
    summary: "BTC/USD holds steady at $68,500 with strong institutional support.",
    url: "https://world-monitor.app",
    category: "crypto",
  },
  {
    id: "wm-4",
    title: "EUR/USDpair shows consolidation patterns",
    source: "World Monitor",
    time: new Date().toLocaleTimeString(),
    summary: "Forex market analysis shows EURUSD ranging between 1.0850-1.0890.",
    url: "https://world-monitor.app",
    category: "forex",
  },
];

export async function GET(request: Request) {
  try {
    // Attempt to fetch from world-monitor.app
    const zone = "CR"; // Can be made configurable via query param
    const res = await fetch(`https://world-monitor.app/?zone=${zone}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TradingDashboard/1.0)",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }

    const html = await res.text();

    // Parse HTML to extract news (simplified regex-based approach)
    // Note: In production, use a proper HTML parser like cheerio
    const news: NewsItem[] = [];

    // Try to extract news items from common patterns
    // This is a basic implementation - adjust based on actual site structure
    const titleMatch = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/g);
    const linkMatches = html.match(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g);

    if (titleMatch && titleMatch.length > 0) {
      // Take first few titles as news
      for (let i = 0; i < Math.min(5, titleMatch.length); i++) {
        const titleMatchResult = titleMatch[i].match(/>([^<]+)</);
        if (titleMatchResult) {
          const title = titleMatchResult[1].trim();
          // Simple heuristics to identify news content
          if (title.length > 10 && title.length < 200) {
            news.push({
              id: `wm-${i + 1}`,
              title,
              source: "World Monitor",
              time: new Date().toLocaleTimeString(),
              summary: title.substring(0, 150) + "...",
              url: `https://world-monitor.app`,
              category: detectCategory(title),
            });
          }
        }
      }
    }

    // If parsing failed or no news found, use mock data
    if (news.length === 0) {
      console.warn("World Monitor: No news parsed from HTML, using mock data");
      return NextResponse.json(MOCK_NEWS);
    }

    return NextResponse.json(news);
  } catch (error) {
    console.error("World Monitor fetch error:", error);
    // Return mock data on any error
    return NextResponse.json(MOCK_NEWS);
  }
}

function detectCategory(title: string): NewsItem["category"] {
  const lower = title.toLowerCase();
  if (lower.includes("gold") || lower.includes("xau") || lower.includes("oil") || lower.includes("us oil")) return "market";
  if (lower.includes("bitcoin") || lower.includes("btc") || lower.includes("ethereum") || lower.includes("sol")) return "crypto";
  if (lower.includes("eur") || lower.includes("usd") || lower.includes("gbp") || lower.includes("fx")) return "forex";
  if (lower.includes("breaking") || lower.includes("urgent") || lower.includes("alert")) return "breaking";
  if (lower.includes("fed") || lower.includes("central bank") || lower.includes("interest")) return "economic";
  return "general";
}
