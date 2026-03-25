import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Mock response to avoid external API calls
  const symbol = new URL(request.url).searchParams.get("symbol") || "XAUUSD";
  const mockPrice = symbol === "XAUUSD" ? 4570.50 : 88.45;
  const mockChange = symbol === "XAUUSD" ? 12.30 : -0.75;

  return NextResponse.json({
    symbol,
    price: mockPrice,
    change: mockChange,
    change_percent: (mockChange / mockPrice) * 100,
    timestamp: new Date().toISOString(),
  });
}