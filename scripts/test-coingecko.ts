/**
 * Test CoinGecko API integration
 * Run: npx tsx scripts/test-coingecko.ts
 */

import { fetchCoinGeckoOHLC, convertCoinGeckoToDatabaseFormat, getCoinGeckoId } from "@/lib/coingecko";

async function testCoinGecko() {
  console.log("=== CoinGecko Integration Test ===\n");

  // Test 1: Symbol mapping
  console.log("1. Testing symbol mapping:");
  const testSymbols = ["BTC", "ETH", "SOL", "XRP", "DOGE"];
  for (const symbol of testSymbols) {
    const id = getCoinGeckoId(symbol);
    console.log(`   ${symbol} -> ${id || "UNMAPPED"}`);
  }

  // Test 2: Fetch OHLC for BTC (1h)
  console.log("\n2. Testing OHLC fetch for BTC (1h, limit=100):");
  try {
    const btcData = await fetchCoinGeckoOHLC("BTC", "1h", 100);
    console.log(`   ✓ Fetched ${btcData.data.length} candles`);
    console.log(`   Latest candle:`, {
      time: new Date(btcData.data[btcData.data.length - 1][0]).toISOString(),
      o: btcData.data[btcData.data.length - 1][1],
      h: btcData.data[btcData.data.length - 1][2],
      l: btcData.data[btcData.data.length - 1][3],
      c: btcData.data[btcData.data.length - 1][4],
    });

    // Convert to database format
    const records = convertCoinGeckoToDatabaseFormat(btcData);
    console.log(`   ✓ Converted to ${records.length} database records`);
    console.log(`   Sample record:`, records[0]);
  } catch (error: any) {
    console.error(`   ✗ Error: ${error.message}`);
  }

  // Test 3: Fetch OHLC for ETH (1h)
  console.log("\n3. Testing OHLC fetch for ETH (1h, limit=50):");
  try {
    const ethData = await fetchCoinGeckoOHLC("ETH", "1h", 50);
    console.log(`   ✓ Fetched ${ethData.data.length} candles`);
  } catch (error: any) {
    console.error(`   ✗ Error: ${error.message}`);
  }

  // Test 4: Fetch OHLC for SOL (4h)
  console.log("\n4. Testing OHLC fetch for SOL (4h, limit=30):");
  try {
    const solData = await fetchCoinGeckoOHLC("SOL", "4h", 30);
    console.log(`   ✓ Fetched ${solData.data.length} candles`);
  } catch (error: any) {
    console.error(`   ✗ Error: ${error.message}`);
  }

  // Test 5: Fetch OHLC for 1d (BTC)
  console.log("\n5. Testing OHLC fetch for BTC (1d, limit=90):");
  try {
    const btcDaily = await fetchCoinGeckoOHLC("BTC", "1d", 90);
    console.log(`   ✓ Fetched ${btcDaily.data.length} daily candles`);
  } catch (error: any) {
    console.error(`   ✗ Error: ${error.message}`);
  }

  // Test 6: Test unmapped symbol (should fail gracefully)
  console.log("\n6. Testing unmapped symbol (XYZ):");
  try {
    await fetchCoinGeckoOHLC("XYZ", "1h", 10);
    console.log("   ✗ Should have thrown error");
  } catch (error: any) {
    console.log(`   ✓ Expected error: ${error.message}`);
  }

  console.log("\n=== Test Complete ===");
}

testCoinGecko().catch(console.error);
