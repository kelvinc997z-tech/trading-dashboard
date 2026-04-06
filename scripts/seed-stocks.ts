/**
 * Seed US Stock data from Massive API
 * 
 * This script fetches OHLC data for all US_STOCKS symbols and stores them in the database.
 * Run: npx tsx scripts/seed-stocks.ts
 */

import { db } from "@/lib/db";

// Match the symbols from dashboard/src/app/dashboard/page.tsx
const US_STOCKS = ["AAPL", "AMD", "NVDA", "MSFT", "GOOGL", "TSM"];

async function fetchStockData(symbol: string, timeframe: string = "1h", count: number = 200) {
  try {
    const res = await fetch(`/api/massive/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, timeframe, count }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error(`[${symbol}] Error:`, error.message);
    throw error;
  }
}

async function seedStocks() {
  console.log("🌱 Starting US Stocks data seeding...\n");
  console.log(`Target symbols: ${US_STOCKS.join(", ")}`);
  console.log(`Timeframe: 1h, Count: 200\n`);

  const results: Array<{ symbol: string; success: boolean; records?: number; error?: string }> = [];

  for (const symbol of US_STOCKS) {
    console.log(`Fetching ${symbol}...`);
    try {
      const result = await fetchStockData(symbol, "1h", 200);
      console.log(`✅ ${symbol}: ${result.recordsAdded} records added, ${result.indicatorsAdded} indicators`);
      results.push({ symbol, success: true, records: result.recordsAdded });
    } catch (error: any) {
      console.error(`❌ ${symbol}: ${error.message}`);
      results.push({ symbol, success: false, error: error.message });
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n📊 Seeding Summary:");
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`Successful: ${successful.length}/${US_STOCKS.length}`);
  successful.forEach(r => console.log(`  ✅ ${r.symbol}: ${r.records} records`));
  
  if (failed.length > 0) {
    console.log(`Failed: ${failed.length}`);
    failed.forEach(r => console.log(`  ❌ ${r.symbol}: ${r.error}`));
  }

  // Check database counts
  console.log("\n📈 Database Summary:");
  for (const symbol of US_STOCKS) {
    const count = await db.oHLCData.count({
      where: { symbol, timeframe: "1h" },
    });
    console.log(`  ${symbol}: ${count} records`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedStocks().catch(console.error);
}

export { seedStocks, US_STOCKS };
