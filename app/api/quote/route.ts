import { NextRequest, NextResponse } from "next/server";

// Map our internal symbols to TwelveData format
const tdSymbolMap: Record<string, { symbol: string; exchange?: string }> = {
  XAUUSD: { symbol: "XAU/USD" }, // Gold
  USOIL: { symbol: "USOIL" },    // US Oil (WTI)
  BTCUSDT: { symbol: "BTC/USD", exchange: "Binance" },
  ETHUSDT: { symbol: "ETH/USD", exchange: "Binance" },
  SOLUSDT: { symbol: "SOL/USD", exchange: "Binance" },
  XRPUSDT: { symbol: "XRP/USD", exchange: "Binance" },
  KASUSDT: { symbol: "KAS/USD", exchange: "Binance" },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "XAUUSD";

  // Check if we have TwelveData API key configured
  const apiKey = process.env.TWELVEDATA_API_KEY;

  // If no API key, fallback to mock
  if (!apiKey) {
    return NextResponse.json(generateMockData(symbol));
  }

  const tdConfig = tdSymbolMap[symbol];
  if (!tdConfig) {
    // Unknown symbol, return mock
    return NextResponse.json(generateMockData(symbol));
  }

  // Build TwelveData URL
  const params = new URLSearchParams({
    symbol: tdConfig.symbol,
    interval: "1min",
    apikey: apiKey,
  });
  if (tdConfig.exchange) {
    params.append("exchange", tdConfig.exchange);
  }
  const url = `https://api.twelvedata.com/quote?${params.toString()}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 }, // Cache for 60 seconds to respect rate limit
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();

    if (data.code || data.message) {
      // API error (rate limit, invalid symbol, etc.) → fallback mock
      console.warn(`Twelvedata error for ${symbol}:`, data.message || data.code);
      return NextResponse.json(generateMockData(symbol));
    }

    const price = parseFloat(data.close || data.price || 0);
    const change = parseFloat(data.change || 0);
    const change_percent = parseFloat(data.change_percent || 0);

    return NextResponse.json({
      symbol,
      price,
      change,
      change_percent,
      high: data.high ? parseFloat(data.high) : undefined,
      low: data.low ? parseFloat(data.low) : undefined,
      volume: data.volume ? parseInt(data.volume) : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Twelvedata fetch error:", error);
    return NextResponse.json(generateMockData(symbol));
  }
}

// Mock data generator (same logic as before)
function generateMockData(symbol: string) {
  const basePrices: Record<string, number> = {
    XAUUSD: 4570.50,
    USOIL: 88.45,
    BTCUSDT: 68000,
    SOLUSDT: 170,
    ETHUSDT: 3500,
    XRPUSDT: 0.62,
    KASUSDT: 0.12,
  };

  const volatility: Record<string, number> = {
    XAUUSD: 30,
    USOIL: 5,
    BTCUSDT: 800,
    SOLUSDT: 10,
    ETHUSDT: 150,
    XRPUSDT: 0.05,
    KASUSDT: 0.03,
  };

  const base = basePrices[symbol] || 100;
  const vol = volatility[symbol] || 5;
  const change = (Math.random() - 0.5) * vol;
  const price = base + change;
  const changePercent = (change / base) * 100;

  return {
    symbol,
    price,
    change,
    change_percent: changePercent,
    timestamp: new Date().toISOString(),
  };
}