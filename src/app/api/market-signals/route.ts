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
      "XAU/USD": "🪙",
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
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    // Define all symbols to analyze
    const symbols = ["XAU/USD", "BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"];
    const allSignals = [];
    const date = new Date().toISOString().split("T")[0];

    for (const symbol of symbols) {
      try {
        // Fetch current quote and 24h history
        const [quoteRes, tsRes] = await Promise.all([
          fetch(`https://api.twelvedata.com/quote?symbol=${symbol}&interval=1h&apikey=${apiKey}`),
          fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1h&outputsize=24&apikey=${apiKey}`),
        ]);

        if (!quoteRes.ok) continue;
        
        const quoteData = await quoteRes.json();
        const currentPrice = parseFloat(quoteData.close);
        
        if (!currentPrice || isNaN(currentPrice)) continue;

        let history = [];
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
