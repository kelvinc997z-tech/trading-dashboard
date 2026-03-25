import { NextResponse } from "next/server";
import { generateMarketData } from "@/lib/mockData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "XAUUSD";

  // Return mock data for any supported symbol
  return NextResponse.json(generateMarketData(symbol));
}