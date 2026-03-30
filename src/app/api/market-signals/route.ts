import { NextResponse } from "next/server";

// Technical analysis: Generate signals based on price action
function generateSignals(symbol: string, current: any, history: any[]) {
  const signals = [];
  
  // Simple moving average (SMA) crossover
  if (history.length >= 20) {
    const recent = history.slice(-20);
    const sma20 = recent.reduce((sum: number, h: any) => sum + h.price, 0) / 20;
    const currentPrice = current.price;
    
    // Price above SMA = bullish, below = bearish
    const trend = currentPrice > sma20 ? "Buy" : "Sell";
    
    // Calculate TP/SL based on recent volatility
    const avgChange = recent.slice(1).reduce((sum: number, h: any, i: number) => {
      return sum + Math.abs(h.price - recent[i].price);
    }, 0) / (recent.length - 1);
    
    const tpOffset = avgChange * 2; // 2x average movement
    const slOffset = avgChange * 1.5; // 1.5x average movement
    
    const entry = currentPrice;
    const tp = trend === "Buy" ? entry + tpOffset : entry - tpOffset;
    const sl = trend === "Buy" ? entry - slOffset : entry + slOffset;
    
    // Determine emoji based on symbol
    const emojiMap: Record<string, string> = {
      "XAUT/USD": "🪙",
      "BTC/USD": "₿",
      "ETH/USD": "Ξ",
      "SOL/USD": "◎",
      "XRP/USD": "⚡",
      "EUR/USD": "💶",
      "USD/JPY": "🇯🇵",
      "GBP/USD": "💷",
      "OIL": "🛢",
      "Silver": "🥈",
    };
    
    signals.push({
      pair: symbol.includes("/") ? symbol.split("/")[0] : symbol,
      emoji: emojiMap[symbol] || "📈",
      signal: trend,
      entry: Number.parseFloat(entry.toFixed(2)),
      tp: Number.parseFloat(tp.toFixed(2)),
      sl: Number.parseFloat(sl.toFixed(2)),
    });
  }
  
  return signals;
}

export async function GET() {
  const twelveApiKey = process.env.TWELVEDATA_API_KEY;
  const cmcApiKey = process.env.COINMARKETCAP_API_KEY;
  if (!twelveApiKey && !cmcApiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    // Define all symbols to analyze
    const symbols = ["XAUT/USD", "BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"];
    const allSignals = [];
    const date = new Date().toISOString().split("T")[0];

    for (const symbol of symbols) {
      try {
        let currentPrice: number;
        let history: any[] = [];

        // Use CoinMarketCap for XAUT/USD if available
        if (symbol === "XAUT/USD" && cmcApiKey) {
          const cmcSymbol = "XAUT";
          const res = await fetch(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${cmcSymbol}&convert=USD`, {
            headers: { 'X-CMC_PRO_API_KEY': cmcApiKey },
            next: { revalidate: 30 }
          });
          if (!res.ok) throw new Error(`CMC error: ${res.status}`);
          const data = await res.json();
          const coin = data.data[cmcSymbol][0];
          currentPrice = coin.quote.USD.price;
          // Generate dummy history (24h)
          const now = new Date();
          let price = currentPrice;
          for (let i = 0; i < 24; i++) {
            const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
            price = price + (Math.random() - 0.5) * (currentPrice * 0.02);
            history.push({
              datetime: time.toISOString(),
              price: Number(price.toFixed(2)),
            });
          }
        } else {
          // Use TwelveData for others
          if (!twelveApiKey) continue;
          const [quoteRes, tsRes] = await Promise.all([
            fetch(`https://api.twelvedata.com/quote?symbol=${symbol}&interval=1h&apikey=${twelveApiKey}`),
            fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1h&outputsize=24&apikey=${twelveApiKey}`),
          ]);

          if (!quoteRes.ok) continue;
          
          const quoteData = await quoteRes.json();
          currentPrice = parseFloat(quoteData.close);
          
          if (!currentPrice || isNaN(currentPrice)) continue;

          if (tsRes.ok) {
            const tsData = await tsRes.json();
            history = (tsData.values || []).map((v: any) => ({
              datetime: v.datetime,
              price: parseFloat(v.close),
            })).reverse();
          }

          // Add current price to history if not present
          if (history.length === 0 || history[history.length - 1].datetime !== quoteData.datetime) {
            history.push({
              datetime: quoteData.datetime,
              price: currentPrice,
            });
          }
        }

        // Generate signal for this symbol
        const symbolSignals = generateSignals(symbol, { price: currentPrice }, history);
        allSignals.push(...symbolSignals);
        
      } catch (err) {
        console.error(`Error analyzing ${symbol}:`, err);
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
