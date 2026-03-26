import { NextResponse } from "next/server";

const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";

const SYMBOL_MAP: Record<string, string> = {
  "XAUUSD": "XAU/USD",
  "USOIL": "WTI", // WTI crude oil
  "BTC/USD": "BTC/USD",
  "ETH/USD": "ETH/USD",
  "SOL/USD": "SOL/USD",
  "XRP/USD": "XRP/USD",
  "KAS/USDT": "KAS/USDT",
};

export async function GET() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Alpha Vantage API key not configured" }, { status: 500 });
  }

  const results: Record<string, { price: number; change: number; changePercent: number }> = {};

  const fetchPromises = Object.entries(SYMBOL_MAP).map(async ([originalSymbol, avSymbol]) => {
    try {
      const url = `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(avSymbol)}&apikey=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: 30 } }); // cache 30s
      if (!res.ok) {
        console.error(`Failed to fetch ${avSymbol}: ${res.status}`);
        return null;
      }
      const data = await res.json();
      if (data["Note"] || data.Information) {
        console.error(`API message for ${avSymbol}:`, data["Note"] || data.Information);
        return null;
      }
      const quote = data["Global Quote"];
      if (!quote) {
        console.error(`No quote data for ${avSymbol}`);
        return null;
      }
      const price = parseFloat(quote["05. price"]);
      const change = parseFloat(quote["09. change"] || "0");
      const changePercentStr = quote["10. change percent"]?.replace("%", "") || "0";
      const changePercent = parseFloat(changePercentStr);
      return {
        symbol: originalSymbol,
        price: isNaN(price) ? 0 : price,
        change: isNaN(change) ? 0 : change,
        changePercent: isNaN(changePercent) ? 0 : changePercent,
      };
    } catch (err) {
      console.error(`Exception for ${originalSymbol}:`, err);
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
