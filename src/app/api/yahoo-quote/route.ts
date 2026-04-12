export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

// GET /api/yahoo-quote?symbol=AAPL
// Returns latest quote for a symbol from Yahoo Finance
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol is required" },
      { status: 400 }
    );
  }

  // Determine if crypto or stock
  const upperSymbol = symbol.toUpperCase();
  const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'XAUT', 'KAS'];
  const isCrypto = cryptoSymbols.includes(upperSymbol) || upperSymbol.includes('-');
  
  // Format symbol for Yahoo Finance
  const formattedSymbol = isCrypto 
    ? (upperSymbol.endsWith('-USD') ? upperSymbol : `${upperSymbol}-USD`)
    : upperSymbol; // Stocks just need the symbol

  // Fetch 5 days of hourly data (we'll use the latest candle)
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?range=5d&interval=1h`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 60 }, // 1 min cache for ticker
    });

    if (!res.ok) {
      console.error(`[YahooQuote] Error ${res.status} for ${symbol}`);
      return NextResponse.json(
        { error: `Failed to fetch quote (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      return NextResponse.json(
        { error: "No data available" },
        { status: 404 }
      );
    }

    const indicators = result.indicators?.quote?.[0] || {};
    const closes = indicators.close || [];
    const volumes = indicators.volume || [];
    
    // Get the latest valid close price
    let latestClose = 0;
    let latestVolume = 0;
    
    for (let i = closes.length - 1; i >= 0; i--) {
      if (closes[i] !== null && closes[i] !== undefined) {
        latestClose = closes[i];
        latestVolume = volumes[i] ?? 0;
        break;
      }
    }

    if (latestClose === 0) {
      return NextResponse.json(
        { error: "No valid price data" },
        { status: 404 }
      );
    }

    // Get previous close for change calculation
    let prevClose = latestClose;
    for (let i = closes.length - 2; i >= 0; i--) {
      if (closes[i] !== null && closes[i] !== undefined) {
        prevClose = closes[i];
        break;
      }
    }

    const change = latestClose - prevClose;
    const changePercent = (change / prevClose) * 100;

    return NextResponse.json({
      symbol: upperSymbol,
      price: latestClose,
      change,
      changePercent,
      volume: latestVolume,
      source: "Yahoo Finance",
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error(`[YahooQuote] Error for ${symbol}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch quote" },
      { status: 500 }
    );
  }
}