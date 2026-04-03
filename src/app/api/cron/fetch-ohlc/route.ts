import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveOHLCData } from "@/lib/quant-ai/data-collector";

// POST /api/cron/fetch-ohlc
// Cron job to fetch OHLC data from Binance public API
export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get("x-vercel-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;
  
  if (expectedSecret && cronSecret !== expectedSecret) {
    const session = await getSession();
    if (!session?.user || session.user.role !== "admin" && session.user.role !== "pro") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (!expectedSecret) {
    console.warn("Fetch-ohlc called without CRON_SECRET and without admin auth");
  }

  const symbols = [
    { symbol: "BTCUSDT", timeframe: "1h" },
    { symbol: "ETHUSDT", timeframe: "1h" },
    { symbol: "SOLUSDT", timeframe: "1h" },
  ];

  const results = [];
  const errors = [];
  const rateLimitDelay = 200; // ms

  for (const { symbol, timeframe } of symbols) {
    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=1000`;
      const res = await fetch(url);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Binance ${res.status}: ${errText}`);
      }
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        results.push({ symbol, timeframe, provider: "binance", status: "no_data" });
        continue;
      }

      const ohlcRecords = data.map((k: any[]) => ({
        symbol,
        timeframe,
        timestamp: new Date(Number(k[0])),
        open: Number(k[1]),
        high: Number(k[2]),
        low: Number(k[3]),
        close: Number(k[4]),
        volume: Number(k[5]),
      }));

      const savedOHLC = await saveOHLCData(ohlcRecords);
      results.push({
        symbol,
        timeframe,
        provider: "binance",
        status: "success",
        ohlcCount: savedOHLC,
      });

      await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
      
    } catch (error: any) {
      console.error(`Fetch failed for ${symbol}:`, error);
      errors.push({ symbol, timeframe, provider: "binance", error: error.message });
      results.push({ symbol, timeframe, provider: "binance", status: "error", error: error.message });
    }
  }

  const successfulCount = results.filter(r => r.status === "success").length;
  const failedCount = results.filter(r => r.status === "failed" || r.status === "error").length;

  return NextResponse.json({ 
    success: true, 
    summary: { total: symbols.length, successful: successfulCount, failed: failedCount },
    results,
    errors,
    timestamp: new Date().toISOString(),
  });
}

export async function GET() {
  return NextResponse.json({
    message: "POST to trigger fetch. Uses Binance public API.",
    usage: "POST /api/cron/fetch-ohlc with admin session or cron secret"
  });
}
