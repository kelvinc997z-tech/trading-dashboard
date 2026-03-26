import { NextResponse } from "next/server";
import { initialSignals } from "@/lib/mockData";

async function getMarketData() {
  // Call internal API (no-cache) or we could reuse market data logic
  // For simplicity, we'll call /api/market-data (with force fetch? we can't from server easily)
  // Instead, we'll just return initial signals; client will auto-close based on its market fetch
  return initialSignals;
}

export async function GET() {
  const signals = initialSignals;
  return NextResponse.json({ signals });
}
