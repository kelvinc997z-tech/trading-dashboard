import { NextResponse } from "next/server";

const TWELVE_DATA_BASE = "https://api.twelvedata.com";
const FINNHUB_BASE = "https://finnhub.io/api/v1";

const SYMBOLS = [
  { id: "XAUUSD", twelvedata: "XAU/USD", finnhub: "OANDA:XAUUSD", name: "Gold (XAU/USD)" },
  { id: "USOIL", twelvedata: "WTI", finnhub: "OANDA:WTICO_USD", name: "US Oil (WTI)" },
  { id: "BTC/USD", twelvedata: "BTC/USD", finnhub: "BINANCE:BTCUSDT", name: "Bitcoin" },
  { id: "ETH/USD", twelvedata: "ETH/USD", finnhub: "BINANCE:ETHUSDT", name: "Ethereum" },
  { id: "SOL/USD", twelvedata: "SOL/USD", finnhub: "BINANCE:SOLUSDT", name: "Solana" },
  { id: "XRP/USD", twelvedata: "XRP/USD", finnhub: "BINANCE:XRPUSDT", name: "Ripple" },
  { id: "KAS/USDT", twelvedata: "KAS/USDT", finnhub: "BINANCE:KASUSDT", name: "Kaspa" },
];

// Realistic fallback prices (updated March 2026)
const FALLBACK_PRICES: Record<string, { price: number; change: number; changePercent: number }> = {
  "XAUUSD": { price: 2350.50, change: 12.30, changePercent: 0.53 },
  "USOIL": { price: 88.45, change: -1.25, changePercent: -1.39 },
  "BTC/USD": { price: 68500.00, change: 1250.00, changePercent: 1.86 },
  "ETH/USD": { price: 3850.00, change: 85.00, changePercent: 2.26 },
  "SOL/USD": { price: 175.20, change: 8.45, changePercent: 5.07 },
  "XRP/USD": { price: 0.6250, change: 0.0150, changePercent: 2.46 },
  "KAS/USDT": { price: 0.1200, change: 0.0050, changePercent: 4.35 },
};

export async function GET() {
  const twelvedataKey = process.env.TWELVEDATA_API_KEY;
  const finnhubKey = process.env.FINNHUB_API_KEY;
  const results: Record<string, { price: number; change: number; changePercent: number }> = {};

  // Helper: format change percent
  const formatChange = (val: number) => Math.abs(val);

  // Try Twelvedata first (best for forex & commodities)
  if (twelvedataKey) {
    try {
      const symbolsParam = SYMBOLS.map(s => s.twelvedata).join(",");
      const url = `${TWELVE_DATA_BASE}/quote?symbol=${encodeURIComponent(symbolsParam)}&apikey=${twelvedataKey}`;
      const res = await fetch(url, { next: { revalidate: 30 } }); // 30s cache

      if (res.ok) {
        const data = await res.json();
        // Twelvedata returns array of quotes
        if (Array.isArray(data)) {
          for (const quote of data) {
            const symbolObj = SYMBOLS.find(s => s.twelvedata === quote.symbol);
            if (symbolObj) {
              const price = parseFloat(quote.close || quote.price || "0");
              const prevClose = parseFloat(quote.previous_close || quote.precious_close || "0");
              const change = price - prevClose;
              const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
              results[symbolObj.id] = {
                price: isNaN(price) ? FALLBACK_PRICES[symbolObj.id].price : price,
                change: isNaN(change) ? FALLBACK_PRICES[symbolObj.id].change : change,
                changePercent: isNaN(changePercent) ? FALLBACK_PRICES[symbolObj.id].changePercent : changePercent,
              };
            }
          }
        } else if (data.code) {
          // Single quote response
          const symbolObj = SYMBOLS.find(s => s.twelvedata === data.symbol);
          if (symbolObj) {
            const price = parseFloat(data.close || data.price || "0");
            const prevClose = parseFloat(data.previous_close || data.precious_close || "0");
            const change = price - prevClose;
            const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
            results[symbolObj.id] = {
              price: isNaN(price) ? FALLBACK_PRICES[symbolObj.id].price : price,
              change: isNaN(change) ? FALLBACK_PRICES[symbolObj.id].change : change,
              changePercent: isNaN(changePercent) ? FALLBACK_PRICES[symbolObj.id].changePercent : changePercent,
            };
          }
        }
      }
    } catch (error) {
      console.error("Twelvedata fetch error:", error);
    }
  }

  // If we got all symbols, return
  if (Object.keys(results).length === SYMBOLS.length) {
    return NextResponse.json(results);
  }

  // Try Finnhub for missing symbols or as fallback
  if (finnhubKey) {
    for (const symbolObj of SYMBOLS) {
      if (results[symbolObj.id]) continue; // already have

      try {
        const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbolObj.finnhub)}&token=${finnhubKey}`;
        const res = await fetch(url, { next: { revalidate: 30 } });
        if (res.ok) {
          const data = await res.json();
          const price = parseFloat(data.c || "0"); // current price
          const prevClose = parseFloat(data.pc || "0"); // previous close
          const change = price - prevClose;
          const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
          results[symbolObj.id] = {
            price: isNaN(price) ? FALLBACK_PRICES[symbolObj.id].price : price,
            change: isNaN(change) ? FALLBACK_PRICES[symbolObj.id].change : change,
            changePercent: isNaN(changePercent) ? FALLBACK_PRICES[symbolObj.id].changePercent : changePercent,
          };
        }
      } catch (error) {
        console.error(`Finnhub fetch error for ${symbolObj.id}:`, error);
      }
    }
  }

  // Fill any remaining missing with fallback
  for (const symbolObj of SYMBOLS) {
    if (!results[symbolObj.id]) {
      results[symbolObj.id] = FALLBACK_PRICES[symbolObj.id];
    }
  }

  return NextResponse.json(results);
}
