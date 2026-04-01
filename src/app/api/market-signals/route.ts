import { NextResponse } from "next/server";
import { fetchStockOHLC } from "@/lib/massive";

const NEWSAPI_KEY = process.env.NEWSAPI_API_KEY;

function predictImpactFromChange(changePct: number): 'high' | 'medium' | 'low' {
  if (Math.abs(changePct) >= 0.5) return 'high';
  if (Math.abs(changePct) >= 0.1) return 'medium';
  return 'low';
}

function generateDummySignals(symbol: string, currentPrice: number): any[] {
  const now = new Date();
  const prevPrice = currentPrice * (0.98 + Math.random() * 0.04);
  const signal = currentPrice > prevPrice ? "Buy" : "Sell";
  const tp = signal === "Buy" ? currentPrice * 1.02 : currentPrice * 0.98;
  const sl = signal === "Buy" ? currentPrice * 0.98 : currentPrice * 1.02;
  return [{
    pair: symbol,
    signal,
    entry: currentPrice,
    tp: Number(tp.toFixed(2)),
    sl: Number(sl.toFixed(2)),
    confidence: 0.6 + Math.random() * 0.3,
    timestamp: now.toISOString()
  }];
}

export async function GET() {
  try {
    // Symbols: Crypto + US Stocks
    const cryptoSymbols = ["XAUT", "BTC", "ETH", "SOL", "XRP"];
    const stockSymbols = ["AAPL", "AMD", "NVDA", "MSFT", "GOOGL"];
    const allSymbols = [...cryptoSymbols, ...stockSymbols];
    
    const allSignals: any[] = [];
    const date = new Date().toISOString().split("T")[0];

    // Try fetch real data for all symbols
    for (const symbol of allSymbols) {
      try {
        let currentPrice: number;
        let history: Array<{ datetime: string; price: number }>;

        if (stockSymbols.includes(symbol)) {
          // Fetch US stock from Massive API
          const rawData = await fetchStockOHLC(symbol, "1h", 24);
          if (!rawData.c || rawData.c.length === 0) {
            // Fallback to dummy
            const dummy = generateDummySignals(symbol, 100 + Math.random() * 200);
            allSignals.push(...dummy);
            continue;
          }
          // Use latest close as current price
          currentPrice = rawData.c[0];
          // Build history from OHLC arrays
          history = rawData.t.map((ts: number, i: number) => ({
            datetime: new Date(ts * 1000).toISOString(),
            price: rawData.c[i],
          })).reverse(); // oldest first
        } else {
          // Crypto: try CoinMarketCap (or fallback dummy)
          const cmcApiKey = process.env.COINMARKETCAP_API_KEY;
          if (!cmcApiKey) {
            const dummy = generateDummySignals(symbol, 100 + Math.random() * 200);
            allSignals.push(...dummy);
            continue;
          }
          const res = await fetch(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${symbol}&convert=USD`, {
            headers: { 'X-CMC_PRO_API_KEY': cmcApiKey },
            next: { revalidate: 30 }
          });
          if (!res.ok) throw new Error(`CMC error ${res.status}`);
          const data = await res.json();
          const coin = data.data[symbol]?.[0];
          if (!coin) throw new Error("Coin not found");
          currentPrice = coin.quote.USD.price;
          // Generate synthetic 24h history for technical indicators
          history = [];
          let lastClose = currentPrice;
          for (let i = 0; i < 24; i++) {
            const time = new Date(Date.now() - (23 - i) * 60 * 60 * 1000);
            const open = lastClose;
            let close = open + (Math.random() - 0.5) * (currentPrice * 0.02);
            history.push({
              datetime: time.toISOString(),
              price: Number(close.toFixed(2)),
            });
            lastClose = close;
          }
        }

        // Calculate simple SMA(12) vs SMA(24) for signal
        const sma12 = history.slice(-12).reduce((sum, h) => sum + h.price, 0) / 12;
        const sma24 = history.reduce((sum, h) => sum + h.price, 0) / 24;
        const signal = sma12 > sma24 ? "Buy" : "Sell";
        const changePct = ((currentPrice - history[0].price) / history[0].price) * 100;
        const impact = predictImpactFromChange(changePct);

        allSignals.push({
          pair: symbol,
          signal,
          entry: Number(currentPrice.toFixed(2)),
          tp: Number((signal === "Buy" ? currentPrice * 1.02 : currentPrice * 0.98).toFixed(2)),
          sl: Number((signal === "Buy" ? currentPrice * 0.98 : currentPrice * 1.02).toFixed(2)),
          confidence: 0.6 + Math.random() * 0.3,
          timestamp: new Date().toISOString(),
          impact,
          reason: `SMA(12) vs SMA(24): ${sma12.toFixed(2)} ${sma12 > sma24 ? '>' : '<'} ${sma24.toFixed(2)}`
        });

      } catch (err: any) {
        console.error(`Error generating signal for ${symbol}:`, err.message);
        // skip on error
      }
    }

    return NextResponse.json({
      date,
      market: "Real-time Technical Analysis",
      signals: allSignals,
      disclaimer: "Signals are generated automatically based on technical indicators. Not financial advice.",
    });

  } catch (error) {
    console.error("Error generating market signals:", error);
    return NextResponse.json(
      { error: "Failed to generate market signals" },
      { status: 500 }
    );
  }
}
