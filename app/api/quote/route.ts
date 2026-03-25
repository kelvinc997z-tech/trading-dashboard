import { NextResponse } from "next/server";

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

function generateMockData(symbol: string) {
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "XAUUSD";

  // If symbol not supported, return mock
  if (!basePrices[symbol]) {
    return NextResponse.json(generateMockData(symbol));
  }

  // For now, always return mock to avoid rate limit and config issues
  // This ensures stable deployment. Can be upgraded later with proper caching.
  return NextResponse.json(generateMockData(symbol));
}