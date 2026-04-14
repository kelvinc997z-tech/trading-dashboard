export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

interface YahooCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// GET /api/yahoo-finance?symbol=AAPL&range=5d&interval=1h
// Proxy to Yahoo Finance to avoid CORS issues
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const range = searchParams.get("range") || "5d";
  const interval = searchParams.get("interval") || "1h";

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol is required" },
      { status: 400 }
    );
  }

  // Format symbol for Yahoo Finance
  // For crypto: use SYMBOL-USD (e.g., BTC-USD)
  // For stocks: use SYMBOL (e.g., AAPL) - no suffix needed
  const upperSymbol = symbol.toUpperCase();
  let formattedSymbol: string;
  if (upperSymbol.includes('-') || ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'XAUT', 'KAS'].includes(upperSymbol)) {
    // Crypto: add -USD if not present
    formattedSymbol = upperSymbol.endsWith('-USD') ? upperSymbol : `${upperSymbol}-USD`;
  } else {
    // Stocks: just the symbol (AAPL, NVDA, etc.)
    formattedSymbol = upperSymbol;
  }

  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?range=${range}&interval=${interval}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 300 }, // 5 min cache
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[YahooFinance] Error ${res.status} for ${symbol}:`, errorText);
      return NextResponse.json(
        { error: `Yahoo Finance returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    // Extract timestamps and indicators
    const result = data.chart?.result?.[0];
    if (!result) {
      return NextResponse.json(
        { error: "No data available" },
        { status: 404 }
      );
    }

    const timestamps = result.timestamp || [];
    const indicators = result.indicators?.quote?.[0] || {};
    const closes = indicators.close || [];
    const opens = indicators.open || [];
    const highs = indicators.high || [];
    const lows = indicators.low || [];
    const volumes = indicators.volume || [];

    const candles: YahooCandle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (close === null || close === undefined) continue;
      candles.push({
        timestamp: timestamps[i],
        open: opens[i] ?? close,
        high: highs[i] ?? close,
        low: lows[i] ?? close,
        close,
        volume: volumes[i] ?? 0,
      });
    }

    return NextResponse.json({
      symbol: result.meta?.symbol || formattedSymbol,
      currency: result.meta?.currency,
      exchange: result.meta?.exchange,
      candles,
    });

  } catch (error: any) {
    console.error(`[YahooFinance] Fetch error for ${symbol}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch data" },
      { status: 500 }
    );
  }
}