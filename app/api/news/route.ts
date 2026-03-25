import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "general"; // general, forex, crypto, stock

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    // Fallback to mock news if no API key configured
    return NextResponse.json([
      {
        id: "1",
        title: "Gold prices surge to new all-time highs on geopolitical tensions",
        source: "Bloomberg",
        time: "10 min ago",
        summary: "XAUUSD reach $4570 as safe-haven demand increases amid Middle East concerns.",
        url: "#",
        category: "breaking",
      },
      {
        id: "2",
        title: "US Oil jumps 3% on supply disruption fears",
        source: "Reuters",
        time: "25 min ago",
        summary: "WTI crude rises to $88.50 on reports of potential Strait of Hormuz closure.",
        url: "#",
        category: "market",
      },
    ]);
  }

  const url = `https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    const data = await res.json();

    if (data.error || !Array.isArray(data)) {
      console.error("Finnhub error:", data);
      return NextResponse.json([], { status: 500 });
    }

    // Transform to our NewsItem format
    const news = data.map((item: any, index: number) => ({
      id: `${index}-${item.datetime || Date.now()}`,
      title: item.headline,
      source: item.source || "Finnhub",
      time: item.datetime ? new Date(item.datetime * 1000).toLocaleTimeString() : "Unknown",
      summary: item.summary || "",
      url: item.url || "#",
      category: category as "general" | "forex" | "crypto" | "stock" | "breaking",
    }));

    return NextResponse.json(news);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json([], { status: 500 });
  }
}