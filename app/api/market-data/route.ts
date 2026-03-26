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

// Comprehensive dummy prices for fallback (covers all symbols)
const DUMMY_PRICES: Record<string, { price: number; change: number; changePercent: number }> = {
  "XAUUSD": { price: 2350.50, change: 12.30, changePercent: 0.53 },
  "USOIL": { price: 88.45, change: -1.25, changePercent: -1.39 },
  "BTC/USD": { price: 68500.00, change: 1250.00, changePercent: 1.86 },
  "ETH/USD": { price: 3850.00, change: 85.00, changePercent: 2.26 },
  "SOL/USD": { price: 175.20, change: 8.45, changePercent: 5.07 },
  "XRP/USD": { price: 0.6250, change: 0.0150, changePercent: 2.46 },
  "KAS/USDT": { price: 0.1200, change: 0.0050, changePercent: 4.35 },
};

export async function GET() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const results: Record<string, { price: number; change: number; changePercent: number }> = {};

  // If no API key, return all dummy data
  if (!apiKey) {
    console.warn("Alpha Vantage API key not configured, using dummy data");
    return NextResponse.json(DUMMY_PRICES);
  }

  const fetchPromises = Object.entries(SYMBOL_MAP).map(async ([originalSymbol, avSymbol]) => {
    try {
      const url = `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(avSymbol)}&apikey=${apiKey}`;
      const res = await fetch(url, { 
        next: { revalidate: 60 }, // reduced from 300s to 60s for more frequent updates
        // Don't throw on non-200, handle gracefully
      });
      
      if (!res.ok) {
        console.error(`Failed to fetch ${avSymbol}: ${res.status} ${res.statusText}`);
        return { symbol: originalSymbol, ...DUMMY_PRICES[originalSymbol] };
      }
      
      const data = await res.json();
      
      if (data["Note"] || data.Information) {
        console.warn(`API limit/info for ${avSymbol}:`, data["Note"] || data.Information);
        return { symbol: originalSymbol, ...DUMMY_PRICES[originalSymbol] };
      }
      
      const quote = data["Global Quote"];
      if (!quote) {
        console.warn(`No quote data for ${avSymbol}, using dummy`);
        return { symbol: originalSymbol, ...DUMMY_PRICES[originalSymbol] };
      }
      
      const price = parseFloat(quote["05. price"]);
      const change = parseFloat(quote["09. change"] || "0");
      const changePercentStr = quote["10. change percent"]?.replace("%", "") || "0";
      const changePercent = parseFloat(changePercentStr);
      
      return {
        symbol: originalSymbol,
        price: isNaN(price) ? DUMMY_PRICES[originalSymbol].price : price,
        change: isNaN(change) ? DUMMY_PRICES[originalSymbol].change : change,
        changePercent: isNaN(changePercent) ? DUMMY_PRICES[originalSymbol].changePercent : changePercent,
      };
    } catch (err) {
      console.error(`Exception for ${avSymbol}:`, err);
      return { symbol: originalSymbol, ...DUMMY_PRICES[originalSymbol] };
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
