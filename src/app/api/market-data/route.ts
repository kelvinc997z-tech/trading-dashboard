import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol") || "BTC";
  const timeframe = url.searchParams.get("timeframe") || "1h";

  // Return dummy data for testing
  const basePrice = symbol === "BTC" ? 65000 : symbol === "ETH" ? 3500 : 100;
  const history = Array.from({ length: 24 }, (_, i) => {
    const time = new Date(Date.now() - (23 - i) * 60 * 60 * 1000);
    return {
      time: time.toISOString(),
      price: basePrice + Math.random() * 100,
      volume: Math.floor(Math.random() * 1000),
    };
  });

  return NextResponse.json({
    symbol,
    timeframe,
    source: "test",
    current: { price: history[history.length - 1].price, change: 0, changePercent: 0 },
    history,
  });
}
