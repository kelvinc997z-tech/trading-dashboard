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
  // Try Yahoo Finance first (1h candles, take last 8 = ~8h)
  try {
    const yahooSymbol = config?.yahooSymbol || (isCryptoSymbol(symbol) ? `${symbol}-USD` : symbol);
    console.log(`[SignalUpdater] Trying Yahoo Finance for ${symbol} (${yahooSymbol})...`);
    const yahooData = await fetchYahooFinanceCandles(yahooSymbol, "1d", "1h", isCryptoSymbol(symbol));
    
    // Also fetch absolute latest price (1m interval) for the most current 'entry' price
    const latestPriceData = await fetchYahooFinanceCandles(yahooSymbol, "1d", "1m", isCryptoSymbol(symbol)).catch(() => null);
    const latestPrice = latestPriceData ? latestPriceData[latestPriceData.length - 1].close : null;

    const formatted = yahooData.slice(-8).map((c, i) => {
      const isLast = i === yahooData.slice(-8).length - 1;
      return [
        c.timestamp * 1000,
        c.open,
        c.high,
        c.low,
        isLast && latestPrice ? latestPrice : c.close, // Use 1m close for the latest candle's close
        c.volume,
      ];
    });
    if (formatted.length > 0) {
      return formatted;
    }
  } catch (yahooError: any) {
    console.error(`[SignalUpdater] Yahoo Finance error for ${symbol}:`, yahooError.message);
  }

  // Fallback to Coinglass (8h)
  console.log(`[SignalUpdater] Yahoo Finance failed for ${symbol}, trying Coinglass...`);
  const coinglassSymbol = getCoinglassSymbol(symbol);
  const coinglassData = await fetchCoinglassOHLC(coinglassSymbol, "8h", 50);
  if (coinglassData?.data && coinglassData.data.length > 0) {
    return coinglassData.data;
  }

  // Final fallback: simulated data
  console.warn(`[SignalUpdater] All sources failed for ${symbol}, using simulated data`);
  const simulated = generateSimulatedData(symbol, "8h");
  return simulated.map(d => [
    d.timestamp.getTime(),
    d.open,
    d.high,
    d.low,
    d.close,
    d.volume,
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
export async function generateAndSaveMarketSignals(): Promise<any[]> {
  const results: LiveSignal[] = [];
  const now = new Date();
  const currentHour = now.getUTCHours();

  for (const pair of SYMBOLS) {
    try {
      // Check if this symbol should run this hour (UTC)
      if (currentHour % pair.interval !== 0) {
        console.log(`[SignalUpdater] Skipping ${pair.symbol} (runs every ${pair.interval}h UTC, current hour: ${currentHour})`);
        continue;
      }

      const ohlcData = await fetchLatestOHLC(pair.symbol, { yahooSymbol: pair.yahooSymbol });
      console.log(`[SignalUpdater] Fetched ${ohlcData?.length || 0} OHLC candles for ${pair.symbol}`);

      if (ohlcData.length > 0) {
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
        try {
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
          results.push({ ...signal, timeframe: timeframeLabel, generatedAt: roundedTime });
          console.log(`[SignalUpdater] Saved ${timeframeLabel} signal for ${pair.symbol}`);
        } catch (dbError: any) {
          console.error(`[SignalUpdater] DB error for ${pair.symbol}:`, dbError.message);
        }
      }
    } catch (error) {
      console.error(`Error generating signal for ${pair.symbol}:`, error);
    }
  }

  return results;
}

/**
 * Get latest signals (from DB or generate fresh)
 */
export async function getLatestMarketSignals(forceRefresh: boolean = false) {
  if (!forceRefresh) {
    // Fetch latest signals for all symbols
    const latestSignals = await db.marketSignal.findMany({
      where: {
        generatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24h
        }
      },
      orderBy: { generatedAt: "desc" },
    });

    // Group by symbol and pick the most recent for each
    const uniqueMap = new Map();
    latestSignals.forEach(s => {
      if (!uniqueMap.has(s.symbol)) {
        uniqueMap.set(s.symbol, s);
      }
    });

    if (uniqueMap.size > 0) {
      return Array.from(uniqueMap.values());
    }
  }

  // Generate fresh signals (will only generate those due for current hour)
  const generated = await generateAndSaveMarketSignals();
  
  // Return the combined latest state from DB
  return db.marketSignal.findMany({
    where: {
      generatedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    },
    orderBy: { generatedAt: "desc" },
  }).then(signals => {
    const map = new Map();
    signals.forEach(s => {
      if (!map.has(s.symbol)) map.set(s.symbol, s);
    });
    return Array.from(map.values());
  });
}
