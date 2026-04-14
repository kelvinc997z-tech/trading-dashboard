import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Simple sentiment analysis
const positiveWords = new Set(['bull','bullish','gain','gains','up','rise','rising','soar','soaring','positive','good','great','excellent','strong','support','increase','increased','increasing','growth','grow','growing','higher','high','rally','recovery','rebound','uptrend','buy','buying','demand','adoption','breakthrough','innovation','profit','profits','earnings','success','boost','optimistic','confidence','stable','steady','climb','record','peak','surging','upside']);
const negativeWords = new Set(['bear','bearish','loss','losses','down','fall','falling','drop','dropping','plunge','plummet','negative','bad','weak','weakness','resistance','decrease','decreased','decreasing','decline','declining','lower','low','sell','selling','pressure','crash','crisis','fear','worried','uncertainty','downtrend','panic','risk','warning','caution','avoid','worse','worst','concern','worries','slump','tumble','slide','depressed','hit','damage']);

function analyzeSentiment(text: string): 'bullish'|'bearish'|'neutral' {
  const lower = text.toLowerCase();
  let pos = 0, neg = 0;
  for (const w of positiveWords) if (lower.includes(w)) pos++;
  for (const w of negativeWords) if (lower.includes(w)) neg++;
  if (pos > neg) return 'bullish';
  if (neg > pos) return 'bearish';
  return 'neutral';
}

async function fetchYahooNews(query: string) {
  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&newsCount=15`;
    const res = await fetch(url, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 600 } 
    });
    
    if (!res.ok) {
      console.error(`Yahoo News API error for ${query}: ${res.status}`);
      return [];
    }
    
    const data = await res.json();
    return (data.news || []).map((item: any) => ({
      id: item.uuid || item.link,
      title: item.title,
      summary: item.summary || "",
      source: item.publisher || "Yahoo Finance",
      url: item.link,
      publishedAt: new Date(item.providerPublishTime * 1000).toISOString(),
      category: query.toLowerCase().includes("btc") ? "crypto" : query.toLowerCase().includes("gold") ? "commodities" : "macro",
      sentiment: analyzeSentiment(item.title + " " + (item.summary || "")),
    }));
  } catch (e) {
    console.error(`Error fetching Yahoo News for ${query}:`, e);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10");

  // Fetch news for various major asset classes
  const queries = ["BTC", "Gold", "S&P 500", "Oil WTI"];
  const newsPromises = queries.map(q => fetchYahooNews(q));
  const results = await Promise.all(newsPromises);
  
  // Flatten and remove duplicates
  const allNews = results.flat();
  const uniqueNewsMap = new Map();
  allNews.forEach(item => {
    if (!uniqueNewsMap.has(item.title)) {
      uniqueNewsMap.set(item.title, item);
    }
  });

  const uniqueNews = Array.from(uniqueNewsMap.values())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);

  return NextResponse.json({ news: uniqueNews, total: uniqueNews.length });
}
