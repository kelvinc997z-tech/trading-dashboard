import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json([], { status: 200 }); // Return empty array as fallback
  }

  try {
    // Fetch current data for all symbols
    const symbols = ["XAU/USD", "BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"];
    const trades = [];

    for (const symbol of symbols) {
      try {
        const res = await fetch(
          `https://api.twelvedata.com/quote?symbol=${symbol}&interval=1h&apikey=${apiKey}`,
          { next: { revalidate: 30 } }
        );

        if (!res.ok) continue;

        const data = await res.json();
        const currentPrice = parseFloat(data.close);
        const change = parseFloat(data.change) || 0;
        const changePercent = parseFloat(data.percent_change) || 0;

        if (isNaN(currentPrice)) continue;

        // Generate simulated trade based on current price movement
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        // Determine side based on recent movement
        const side = change >= 0 ? "BUY" : "SELL";
        
        // Simulate position size (random between 0.1 and 1.0)
        const size = Math.random() * 0.9 + 0.1;
        
        // Entry price = current price minus/plus small spread
        const spread = currentPrice * 0.0001; // 0.01% spread
        const entry = side === "BUY" ? currentPrice - spread : currentPrice + spread;
        
        // Calculate P&L based on price change (percent of entry)
        const pnl = change * size;

        trades.push({
          time,
          pair: symbol.split("/")[0],
          side,
          size: parseFloat(size.toFixed(2)),
          entry: parseFloat(entry.toFixed(2)),
          pnl: parseFloat(pnl.toFixed(2)),
        });
      } catch (err) {
        console.error(`Error fetching trades for ${symbol}:`, err);
      }
    }

    // Sort by time (most recent first) and limit to 10
    trades.sort((a, b) => {
      const [hA, mA] = a.time.split(':').map(Number);
      const [hB, mB] = b.time.split(':').map(Number);
      return (hB * 60 + mB) - (hA * 60 + mA);
    });

    return NextResponse.json(trades.slice(0, 10));
  } catch (error) {
    console.error("Error generating trades:", error);
    return NextResponse.json([], { status: 200 }); // Return empty array on error
  }
}
