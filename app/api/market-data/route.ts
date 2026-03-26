import { NextResponse } from "next/server";

const TWELVE_DATA_BASE = "https://api.twelvedata.com";

const SYMBOLS = [
  { symbol: "XAUUSD", type: "forex" },
  { symbol: "USOIL", type: "commodity" },
  { symbol: "BTC/USD", type: "crypto" },
  { symbol: "ETH/USD", type: "crypto" },
  { symbol: "SOL/USD", type: "crypto" },
  { symbol: "XRP/USD", type: "crypto" },
  { symbol: "KAS/USDT", type: "crypto" },
];

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Twelve Data API key not configured" }, { status: 500 });
  }

  // Build query for multiple symbols (twelvedata supports multiple with 'symbol=...&symbol=...' )
  const params = new URLSearchParams();
  params.append("apikey", apiKey);
  // We'll fetch individually to keep format consistent
  const results: Record<string, { price: number; change: number; changePercent: number }> = {};

  // Use Promise.all for parallel fetch (respect rate limits)
  const fetchPromises = SYMBOLS.map(async ({ symbol }) => {
    try {
      const url = `${TWELVE_DATA_BASE}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: 10 } }); // cache 10s
      if (!res.ok) {
        console.error(`Failed to fetch ${symbol}: ${res.status}`);
        return null;
      }
      const data = await res.json();
      if (data.code || data.message) {
        console.error(`Error for ${symbol}:`, data.message);
        return null;
      }
      // Fields: "price", "change", "percent_change"
      return {
        symbol,
        price: parseFloat(data.price),
        change: parseFloat(data.change || "0"),
        changePercent: parseFloat(data.percent_change || "0"),
      };
    } catch (err) {
      console.error(`Exception for ${symbol}:`, err);
      return null;
    }
  });

  const resultsArr = await Promise.all(fetchPromises);
  resultsArr.forEach(item => {
    if (item) {
      results[item.symbol] = {
        price: item.price,
        change: item.change,
        changePercent: item.changePercent,
      };
    }
  });

  return NextResponse.json(results);
}
