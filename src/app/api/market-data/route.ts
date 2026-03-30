import { NextResponse } from "next/server";

const SUPPORTED_SYMBOLS = ["XAU/USD", "BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"];

export async function GET(request: Request) {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  // Get symbol from query param, default to XAU/USD
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "XAU/USD";
  
  // Validate symbol
  if (!SUPPORTED_SYMBOLS.includes(symbol)) {
    return NextResponse.json(
      { error: `Unsupported symbol. Supported: ${SUPPORTED_SYMBOLS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    // Fetch current quote
    const quoteRes = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbol}&interval=1h&apikey=${apiKey}`,
      { next: { revalidate: 30 } }
    );

    if (!quoteRes.ok) {
      throw new Error(`Twelvedata error: ${quoteRes.statusText}`);
    }

    const quoteData = await quoteRes.json();

    // Fetch historical data (last 24h)
    const tsRes = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1h&outputsize=24&apikey=${apiKey}`,
      { next: { revalidate: 30 } }
    );

    const tsData = tsRes.ok ? await tsRes.json() : { values: [] };

    return NextResponse.json({
      symbol,
      current: {
        price: parseFloat(quoteData.close) || quoteData.close,
        change: parseFloat(quoteData.change) || 0,
        changePercent: parseFloat(quoteData.percent_change) || 0,
        high: parseFloat(quoteData.high) || 0,
        low: parseFloat(quoteData.low) || 0,
      },
      history: (tsData.values || []).map((v: any) => ({
        time: new Date(v.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        price: parseFloat(v.close),
        datetime: v.datetime,
      })).reverse(),
    });
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch market data for ${symbol}` },
      { status: 500 }
    );
  }
}
