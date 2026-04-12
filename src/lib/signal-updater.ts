/**
 * Market Signal Generator (8h timeframe)
 * Fetches live price data and generates technical analysis signals
 * Runs every 8 hours via cron
 */

import { db } from "@/lib/db";
import { fetchCoinglassOHLC } from "./coinglass";
import { generateSimulatedData } from "./market-outlook";
import { fetchYahooFinanceCandles, isCryptoSymbol } from "./yahoo-finance";

export interface LiveSignal {
  symbol: string;
  name: string;
  emoji: string;
  signal: "buy" | "sell" | "neutral";
  entry: number;
  tp: number;
  sl: number;
  confidence: number;
  reasoning: string;
  currentPrice: number;
  timeframe?: string;
  generatedAt?: Date;
}

/**
 * Fetch latest OHLC data (8h timeframe) from Yahoo Finance (Primary) or Coinglass (Fallback)
 */
async function fetchLatestOHLC(symbol: string, config?: { yahooSymbol?: string }): Promise<any[]> {
  const yahooSymbol = config?.yahooSymbol || (isCryptoSymbol(symbol) ? `${symbol}-USD` : symbol);
  
  // Try Yahoo Finance with a short timeout per request
  try {
    const fetchWithTimeout = (url: string) => 
      fetch(url, { signal: AbortSignal.timeout(5000), next: { revalidate: 300 } });

    const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=1d&interval=1h`;
    const latestUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=1d&interval=1m`;

    const [res1, res2] = await Promise.all([
      fetchWithTimeout(yahooUrl).catch(() => null),
      fetchWithTimeout(latestUrl).catch(() => null)
    ]);

    let yahooData: any[] = [];
    if (res1?.ok) {
      const json = await res1.json();
      console.log(`[SignalUpdater] ${symbol}: Yahoo 1h res ok`);
      const result = json.chart.result?.[0];
      if (result) {
        yahooData = result.timestamp.map((t: number, i: number) => ({
          timestamp: t,
          close: result.indicators.quote[0].close[i],
          open: result.indicators.quote[0].open[i],
          high: result.indicators.quote[0].high[i],
          low: result.indicators.quote[0].low[i],
          volume: result.indicators.quote[0].volume[i],
        })).filter((c: any) => c.close !== null);
      }
    }

    let latestPrice = null;
    if (res2?.ok) {
      const json = await res2.json();
      const result = json.chart.result?.[0];
      if (result) {
        latestPrice = result.indicators.quote[0].close.filter((p: any) => p !== null).pop();
      }
    }

    if (yahooData.length > 0) {
      return yahooData.slice(-8).map((c, i) => {
        const isLast = i === yahooData.slice(-8).length - 1;
        return [
          c.timestamp * 1000,
          c.open || 0,
          c.high || 0,
          c.low || 0,
          (isLast && latestPrice) ? latestPrice : (c.close || 0),
          c.volume || 0,
        ];
      });
    }
  } catch (error: any) {
    console.warn(`[SignalUpdater] Yahoo Finance failed for ${symbol}:`, error.message);
  }

  // Fallback to Coinglass (8h) - only if Yahoo fails
  console.log(`[SignalUpdater] ${symbol}: Trying Coinglass fallback...`);
  try {
    const coinglassSymbol = getCoinglassSymbol(symbol);
    const coinglassData = await fetchCoinglassOHLC(coinglassSymbol, "8h", 50);
    if (coinglassData?.data && coinglassData.data.length > 0) {
      console.log(`[SignalUpdater] ${symbol}: Coinglass fallback success`);
      return coinglassData.data;
    }
  } catch (e: any) {
    console.error(`[SignalUpdater] Coinglass failed for ${symbol}:`, e.message);
  }

  // Final fallback: simulated data
  return generateSimulatedData(symbol, "8h").map(d => [
    d.timestamp.getTime(), d.open, d.high, d.low, d.close, d.volume,
  ]);
}

/**
 * Map our symbols to Coinglass format
 */
function getCoinglassSymbol(symbol: string): string {
  const map: Record<string, string> = {
    "BTC": "BTC",
    "ETH": "ETH",
    "SOL": "SOL",
    "XRP": "XRP",
    "DOGE": "DOGE",
    "XAUT": "XAUT",
    "EUR": "EUR",
    "JPY": "JPY",
    "GBP": "GBP",
    "WTI": "WTI",
    "XAG": "XAG",
  };
  return map[symbol] || symbol;
}

/**
 * Calculate ATR from OHLC
 */
function calculateATR(
  data: Array<{ high: number; low: number; close: number }>,
  period: number = 14
): number {
  if (data.length < period + 1) return 0;

  const trueRanges: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    trueRanges.push(tr);
  }

  const recentTR = trueRanges.slice(-period);
  const sum = recentTR.reduce((acc, val) => acc + val, 0);
  return sum / period;
}

/**
 * Generate signal based on 8h OHLC data
 */
function generateSignalFromOHLC(
  symbol: string,
  name: string,
  emoji: string,
  ohlcData: Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }>,
  timeframe: string = "8h"
): LiveSignal {
  if (!ohlcData || ohlcData.length === 0) {
    return {
      symbol,
      name,
      emoji,
      signal: "neutral",
      entry: 0,
      tp: 0,
      sl: 0,
      confidence: 0,
      reasoning: "No data available",
      currentPrice: 0,
      timeframe,
      generatedAt: new Date(),
    };
  }

  const latest = ohlcData[ohlcData.length - 1];
  const previous = ohlcData.length > 1 ? ohlcData[ohlcData.length - 2] : latest;
  const currentPrice = latest.close;

  // Calculate ATR
  const atr = calculateATR(
    ohlcData.slice(-50).map(d => ({
      high: d.high,
      low: d.low,
      close: d.close
    })),
    14
  );

  // Momentum signal (timeframe-based gain/loss)
  const priceChange = currentPrice - previous.close;
  const percentChange = (priceChange / previous.close) * 100;

  let signal: "buy" | "sell" | "neutral" = "neutral";
  let reasoning = "";

  if (percentChange > 0.3) { // Lowered threshold for 1h/4h
    signal = "buy";
    reasoning = `Bullish momentum (${percentChange.toFixed(2)}% ${timeframe} gain)`;
  } else if (percentChange < -0.3) {
    signal = "sell";
    reasoning = `Bearish momentum (${percentChange.toFixed(2)}% ${timeframe} loss)`;
  } else {
    signal = "neutral";
    reasoning = `Consolidation (${percentChange.toFixed(2)}% ${timeframe} change)`;
  }

  // ATR-based SL/TP (wider for 8h)
  const slDistance = atr * 2;
  const tpDistance = atr * 4;

  const sl = signal === "buy" ? currentPrice - slDistance : currentPrice + slDistance;
  const tp = signal === "buy" ? currentPrice + tpDistance : currentPrice - tpDistance;

  // Confidence based on ATR and momentum strength
  const atrPercent = (atr / currentPrice) * 100;
  const momentumStrength = Math.abs(percentChange);
  let confidence = 0.4 + Math.min(momentumStrength / 2, 0.3) + (100 - Math.min(atrPercent * 5, 30)) / 100;
  confidence = Math.max(0.1, Math.min(confidence, 0.99));

  reasoning += ` | Source: Yahoo Finance`;

  return {
    symbol,
    name,
    emoji,
    signal,
    entry: currentPrice,
    tp,
    sl,
    confidence,
    reasoning,
    currentPrice,
    timeframe,
    generatedAt: new Date(),
  };
}

/**
 * Symbol configuration
 */
const SYMBOLS = [
  { symbol: "BTC", name: "Bitcoin", emoji: "₿", interval: 4 },
  { symbol: "ETH", name: "Ethereum", emoji: "Ξ", interval: 4 },
  { symbol: "SOL", name: "Solana", emoji: "◎", interval: 4 },
  { symbol: "XRP", name: "Ripple", emoji: "✕", interval: 4 },
  { symbol: "DOGE", name: "Dogecoin", emoji: "Ð", interval: 4 },
  { symbol: "XAUT", name: "Gold", emoji: "🪙", yahooSymbol: "GC=F", interval: 1 }, // Gold futures - 1h
  { symbol: "WTI", name: "Oil WTI", emoji: "🛢", yahooSymbol: "CL=F", interval: 4 }, // Oil futures - 4h
  { symbol: "XAG", name: "Silver", emoji: "🥈", yahooSymbol: "SLV", interval: 4 }, // Silver ETF - 4h
];

/**
 * Generate signals for all symbols and save to DB
 */
export async function generateAndSaveMarketSignals(force: boolean = false): Promise<any[]> {
  const now = new Date();
  const currentHour = now.getUTCHours();

  // Filter pairs that should run this hour (or all if forced)
  const pairsToProcess = force ? SYMBOLS : SYMBOLS.filter(pair => currentHour % pair.interval === 0);
  
  if (pairsToProcess.length === 0) {
    console.log(`[SignalUpdater] No signals to update for hour ${currentHour} UTC`);
    return [];
  }

  console.log(`[SignalUpdater] Updating signals for: ${pairsToProcess.map(p => p.symbol).join(", ")}`);

  // Process pairs in parallel to avoid Vercel timeouts
  const tasks = pairsToProcess.map(async (pair) => {
    try {
      // Internal debug pair
      if (pair.symbol === "DEBUG") {
        return {
          symbol: "DEBUG",
          name: "Debug Pair",
          emoji: "🔍",
          signal: "neutral",
          entry: 100,
          tp: 110,
          sl: 90,
          confidence: 0.99,
          reasoning: "System debug signal",
          currentPrice: 100,
          timeframe: "1h",
          generatedAt: new Date(),
        };
      }

      const ohlcData = await fetchLatestOHLC(pair.symbol, { yahooSymbol: pair.yahooSymbol });
      console.log(`[SignalUpdater] ${pair.symbol}: fetched ${ohlcData?.length || 0} candles`);
      
      if (!ohlcData || ohlcData.length === 0) {
        console.error(`[SignalUpdater] ${pair.symbol}: No data fetched from any source`);
        return null;
      }

      // Transform format
      const transformed = ohlcData.map(candle => ({
        time: new Date(candle[0]).toISOString(),
        open: Number(candle[1]),
        high: Number(candle[2]),
        low: Number(candle[3]),
        close: Number(candle[4]),
        volume: Number(candle[5]),
      }));

      // Use the specific interval as the timeframe name
      const timeframeLabel = `${pair.interval}h`;
      const signal = generateSignalFromOHLC(pair.symbol, pair.name, pair.emoji, transformed, timeframeLabel);
      
      const roundedTime = new Date(new Date().setUTCHours(now.getUTCHours() - (now.getUTCHours() % pair.interval), 0, 0, 0));

      // Save to DB
      await db.marketSignal.upsert({
        where: {
          symbol_timeframe_generatedAt: {
            symbol: pair.symbol,
            timeframe: timeframeLabel,
            generatedAt: roundedTime,
          },
        },
        update: {
          name: signal.name,
          emoji: signal.emoji,
          signal: signal.signal,
          entry: signal.entry,
          tp: signal.tp,
          sl: signal.sl,
          confidence: signal.confidence,
          reasoning: signal.reasoning,
          updatedAt: new Date(),
        },
        create: {
          symbol: signal.symbol,
          name: signal.name,
          emoji: signal.emoji,
          signal: signal.signal,
          entry: signal.entry,
          tp: signal.tp,
          sl: signal.sl,
          confidence: signal.confidence,
          reasoning: signal.reasoning,
          timeframe: timeframeLabel,
          generatedAt: roundedTime,
          updatedAt: new Date(),
        },
      });
      
      console.log(`[SignalUpdater] Successfully saved ${pair.symbol}`);
      return { ...signal, timeframe: timeframeLabel, generatedAt: roundedTime };
    } catch (error: any) {
      console.error(`[SignalUpdater] CRITICAL ERROR for ${pair.symbol}:`, error);
      return null;
    }
  });

  const results = await Promise.all(tasks);
  return results.filter(r => r !== null);
}

/**
 * Get latest signals (from DB or generate fresh)
 */
export async function getLatestMarketSignals(forceRefresh: boolean = false) {
  // Fetch signals from last 24h
  let latestSignals = await db.marketSignal.findMany({
    where: {
      generatedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    },
    orderBy: { generatedAt: "desc" },
  }).catch(() => []);

  // If forceRefresh or no signals in DB, generate fresh ones
  if (forceRefresh || latestSignals.length === 0) {
    console.log(`[SignalUpdater] Triggering generation (Reason: ${forceRefresh ? 'Force' : 'Empty DB'})`);
    // Force generate all if DB is empty
    await generateAndSaveMarketSignals(latestSignals.length === 0);
    
    // Refresh the list from DB
    latestSignals = await db.marketSignal.findMany({
      where: {
        generatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { generatedAt: "desc" },
    }).catch(() => []);
  }

  // Pick the latest unique signal for each symbol
  if (latestSignals.length > 0) {
    const uniqueMap = new Map();
    latestSignals.forEach(s => {
      if (!uniqueMap.has(s.symbol)) {
        uniqueMap.set(s.symbol, s);
      }
    });
    return Array.from(uniqueMap.values());
  }

  // Final emergency fallback if DB is empty and generation failed
  return SYMBOLS.map(s => ({
    id: `fallback-${s.symbol}`,
    symbol: s.symbol,
    name: s.name,
    emoji: s.emoji,
    signal: "neutral" as const,
    entry: 0,
    tp: 0,
    sl: 0,
    confidence: 0,
    reasoning: "Market data synchronization in progress...",
    timeframe: "4h",
    generatedAt: new Date(),
    updatedAt: new Date(),
  }));
}
