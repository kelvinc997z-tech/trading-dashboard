import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveOHLCData } from "@/lib/quant-ai/data-collector";
import { fetchCoinGeckoOHLC, convertCoinGeckoToDatabaseFormat } from "@/lib/coingecko";

// POST /api/cron/fetch-ohlc
// Cron job to fetch OHLC data with provider fallback (Binance -> CoinGecko)
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

  // Provider configuration (env var: FETCH_PROVIDER=binance|coingecko|auto)
  const preferredProvider = process.env.FETCH_PROVIDER || "auto";
  const limit = 1000;

  // Symbol list (use base symbol for CoinGecko, full pair for Binance)
  const symbols = [
    { symbol: "BTC", timeframe: "1h", binanceSymbol: "BTCUSDT" },
    { symbol: "ETH", timeframe: "1h", binanceSymbol: "ETHUSDT" },
    { symbol: "SOL", timeframe: "1h", binanceSymbol: "SOLUSDT" },
  ];

  const results = [];
  const errors = [];
  const rateLimitDelay = 200; // ms between Binance calls

  for (const { symbol, timeframe, binanceSymbol } of symbols) {
    let providerUsed: string | null = null;

    // Try Binance first if configured
    if (preferredProvider === "binance" || preferredProvider === "auto") {
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${timeframe}&limit=${limit}`;
        const res = await fetch(url, { next: { revalidate: 0 } });

        if (res.ok) {
          const data = await res.json();

          if (!Array.isArray(data) || data.length === 0) {
            results.push({ symbol, timeframe, provider: "binance", status: "no_data" });
            providerUsed = "binance";
            continue;
          }

          const ohlcRecords = data.map((k: any[]) => ({
            symbol: binanceSymbol,
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
          providerUsed = "binance";
        } else {
          const errText = await res.text();
          const errorMsg = `Binance ${res.status}: ${errText}`;
          console.warn(`Binance not available for ${symbol}:`, errorMsg);

          // If not auto-fallback, record error
          if (preferredProvider === "binance") {
            errors.push({ symbol, timeframe, provider: "binance", error: errorMsg });
            results.push({ symbol, timeframe, provider: "binance", status: "error", error: errorMsg });
            providerUsed = "binance";
          }
        }
      } catch (error: any) {
        console.warn(`Binance fetch error for ${symbol}:`, error.message);
        if (preferredProvider === "binance") {
          errors.push({ symbol, timeframe, provider: "binance", error: error.message });
          results.push({ symbol, timeframe, provider: "binance", status: "error", error: error.message });
          providerUsed = "binance";
        }
      }
    }

    // If Binance failed or we should use CoinGecko, try CoinGecko
    if ((preferredProvider === "auto" && !providerUsed) || preferredProvider === "coingecko") {
      try {
        const cgData = await fetchCoinGeckoOHLC(symbol, timeframe, limit);
        const ohlcRecords = convertCoinGeckoToDatabaseFormat(cgData, false);

        if (ohlcRecords.length === 0) {
          results.push({ symbol, timeframe, provider: "coingecko", status: "no_data" });
        } else {
          const savedOHLC = await saveOHLCData(ohlcRecords);
          results.push({
            symbol,
            timeframe,
            provider: "coingecko",
            status: "success",
            ohlcCount: savedOHLC,
          });
        }
        providerUsed = "coingecko";
      } catch (error: any) {
        console.error(`CoinGecko fetch failed for ${symbol}:`, error);
        errors.push({ symbol, timeframe, provider: "coingecko", error: error.message });
        results.push({ symbol, timeframe, provider: "coingecko", status: "error", error: error.message });
      }
    }

    // Rate limit delay for Binance (skip if we only used CoinGecko)
    if (rateLimitDelay > 0 && (providerUsed === "binance" || preferredProvider === "auto")) {
      await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
    }
  }

  const successfulCount = results.filter(r => r.status === "success").length;
  const failedCount = results.filter(r => r.status === "failed" || r.status === "error").length;

  return NextResponse.json({
    success: true,
    summary: { total: symbols.length, successful: successfulCount, failed: failedCount },
    results,
    errors,
    config: { provider: preferredProvider },
    timestamp: new Date().toISOString(),
  });
}

export async function GET() {
  return NextResponse.json({
    message: "POST to trigger fetch. Supports Binance with CoinGecko fallback.",
    usage: "POST /api/cron/fetch-ohlc with admin session or cron secret",
    config: {
      provider: process.env.FETCH_PROVIDER || "auto",
      description: "auto = try Binance, fallback to CoinGecko on error; coingecko = use CoinGecko only",
    },
  });
}
