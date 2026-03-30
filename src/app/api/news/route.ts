import { NextResponse } from "next/server";

const NEWSAPI_KEY = process.env.NEWSAPI_API_KEY;

// Helper: infer category from title/summary
function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("btc") || lower.includes("bitcoin") || lower.includes("crypto") || lower.includes("ethereum") || lower.includes("solana") || lower.includes("xrp")) return "crypto";
  if (lower.includes("fed") || lower.includes("interest rate") || lower.includes("inflation") || lower.includes("macro")) return "macro";
  if (lower.includes("gold") || lower.includes("oil") || lower.includes("commodity")) return "commodities";
  if (lower.includes("forex") || lower.includes("usd") || lower.includes("eur") || lower.includes("jpy")) return "forex";
  return "general";
}

// Helper: extract symbols (simple regex for USD pairs)
function extractSymbols(text: string): string[] {
  const symbols: string[] = [];
  if (text.match(/\bXAUT\/USD\b/i)) symbols.push("XAUT/USD");
  if (text.match(/\bXAU\/USD\b/i)) symbols.push("XAU/USD");
  if (text.match(/\bBTC\/USD\b/i)) symbols.push("BTC/USD");
  if (text.match(/\bETH\/USD\b/i)) symbols.push("ETH/USD");
  if (text.match(/\bSOL\/USD\b/i)) symbols.push("SOL/USD");
  if (text.match(/\bXRP\/USD\b/i)) symbols.push("XRP/USD");
  if (text.match(/\bUSD\/JPY\b/i)) symbols.push("USD/JPY");
  if (text.match(/\bEUR\/USD\b/i)) symbols.push("EUR/USD");
  return symbols;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category"); // crypto, macro, commodities, forex, all
  const timeframe = searchParams.get("timeframe") || "24h"; // 24h, 7d, 30d (for dummy fallback)
  const query = searchParams.get("q") || "";
  const language = searchParams.get("lang") || "en";

  // If NewsAPI key exists, fetch from there
  if (NEWSAPI_KEY) {
    try {
      const apiUrl = new URL("https://newsapi.org/v2/everything");
      const qParts = [];
      if (query) qParts.push(query);
      if (category && category !== "all") {
        // Map our categories to NewsAPI keywords
        const catMap: Record<string, string> = {
          crypto: "bitcoin OR ethereum OR crypto OR cryptocurrency",
          macro: "fed OR interest rate OR inflation OR macroeconomics",
          commodities: "gold OR oil OR silver OR commodity",
          forex: "forex OR currency OR usd OR eur OR jpy",
        };
        if (catMap[category]) qParts.push(catMap[category]);
      } else {
        // default broad query
        qParts.push("trading OR markets OR bitcoin OR ethereum OR gold OR oil OR forex OR fed");
      }
      apiUrl.searchParams.append("apiKey", NEWSAPI_KEY);
      apiUrl.searchParams.append("q", qParts.join(" OR "));
      apiUrl.searchParams.append("language", language);
      // from date based on timeframe
      let fromDate = new Date();
      if (timeframe === "24h") fromDate.setHours(fromDate.getHours() - 24);
      else if (timeframe === "7d") fromDate.setDate(fromDate.getDate() - 7);
      else if (timeframe === "30d") fromDate.setDate(fromDate.getDate() - 30);
      else fromDate = new Date(0);
      apiUrl.searchParams.append("from", fromDate.toISOString().split("T")[0]);
      apiUrl.searchParams.append("pageSize", "100");
      apiUrl.searchParams.append("sortBy", "publishedAt");

      const res = await fetch(apiUrl.toString());
      if (!res.ok) {
        throw new Error(`NewsAPI error ${res.status}`);
      }
      const data = await res.json();
      const articles: any[] = data.articles.map((a: any) => {
        const title = a.title || "";
        const description = a.description || "";
        const content = a.content || "";
        const text = title + " " + description + " " + content;
        const cat = category && category !== "all" ? category : inferCategory(text);
        return {
          id: a.url,
          title,
          summary: description,
          content,
          source: a.source?.name || "Unknown",
          sourceUrl: a.url,
          publishedAt: a.publishedAt,
          category: cat,
          sentiment: "neutral", // can add sentiment analysis later
          relatedSymbols: extractSymbols(text),
          impact: "medium", // default
          language: language,
        };
      });

      // Additional filtering if specific category query given (since NewsAPI query is approximate)
      let filtered = articles;
      if (category && category !== "all") {
        filtered = articles.filter((a: any) => a.category === category);
      }
      if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter((a: any) => 
          a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
        );
      }

      // Sort by publishedAt desc
      filtered.sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      return NextResponse.json({ news: filtered, total: filtered.length });
    } catch (error) {
      console.error("NewsAPI fetch error:", error);
      // fallback to dummy on error
    }
  }

  // Fallback dummy data
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
    // ... other dummy entries omitted for brevity; they are not needed when NewsAPI works
  ];

  // Apply filters to dummy similarly
  let news = dummyNews.filter((n) => n.language === language);
  // (same filtering logic as before)
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
  news.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return NextResponse.json({ news, total: news.length });
}
