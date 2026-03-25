import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "XAUUSD";

  // Base prices per symbol
  const basePrices: Record<string, number> = {
    XAUUSD: 4570.50,
    USOIL: 88.45,
    BTCUSDT: 68000,
    SOLUSDT: 170,
    ETHUSDT: 3500,
    XRPUSDT: 0.62,
    KASUSDT: 0.12,
  };

  // Volatility per symbol
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

  // Cache for 2 seconds to reduce load (revalidate in Next.js)
  const response = NextResponse.json({
    symbol,
    price,
    change,
    change_percent: changePercent,
    timestamp: new Date().toISOString(),
  });

  // Set cache control: 2 seconds
  response.headers.set('Cache-Control', 's-maxage=2, stale-while-revalidate');
  return response;
}