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
 * Fetch latest OHLC data (8h timeframe) from Coinglass or Yahoo Finance fallback
 */
async function fetchLatestOHLC(symbol: string, config?: { yahooSymbol?: string }): Promise<any[]> {
  const coinglassSymbol = getCoinglassSymbol(symbol);
  // Try Coinglass first (8h)
  const coinglassData = await fetchCoinglassOHLC(coinglassSymbol, "8h", 50);
  if (coinglassData?.data && coinglassData.data.length > 0) {
    return coinglassData.data;
  }

  // Fallback to Yahoo Finance (1h candles, take last 8 = ~8h)
  console.log(`[SignalUpdater] Coinglass failed for ${symbol}, trying Yahoo Finance...`);
  try {
    const yahooSymbol = config?.yahooSymbol || (isCryptoSymbol(symbol) ? `${symbol}-USD` : symbol);
    const yahooData = await fetchYahooFinanceCandles(yahooSymbol, "1d", "1h", isCryptoSymbol(symbol));
    const formatted = yahooData.slice(-8).map(c => [
      c.timestamp * 1000,
      c.open,
      c.high,
      c.low,
      c.close,
      c.volume,
    ]);
    if (formatted.length > 0) {
      return formatted;
    }
  } catch (yahooError: any) {
    console.error(`[SignalUpdater] Yahoo Finance error for ${symbol}:`, yahooError.message);
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
  ohlcData: Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }>
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
      timeframe: "8h",
      generatedAt: new Date(new Date().setHours(new Date().getHours() - (new Date().getHours() % 8))),
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

  // Momentum signal (8h gain/loss)
  const priceChange = currentPrice - previous.close;
  const percentChange = (priceChange / previous.close) * 100;

  let signal: "buy" | "sell" | "neutral" = "neutral";
  let reasoning = "";

  if (percentChange > 0.5) {
    signal = "buy";
    reasoning = `Bullish momentum (${percentChange.toFixed(2)}% 8h gain)`;
  } else if (percentChange < -0.5) {
    signal = "sell";
    reasoning = `Bearish momentum (${percentChange.toFixed(2)}% 8h loss)`;
  } else {
    signal = "neutral";
    reasoning = `Consolidation (${percentChange.toFixed(2)}% 8h change)`;
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

  reasoning += ` | ATR: ${atr.toFixed(2)} (${atrPercent.toFixed(2)}%)`;

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
    timeframe: "8h",
    generatedAt: new Date(new Date().setHours(new Date().getHours() - (new Date().getHours() % 8))),
  };
}

/**
 * Symbol configuration
 */
const SYMBOLS = [
  { symbol: "BTC", name: "Bitcoin", emoji: "₿" },
  { symbol: "ETH", name: "Ethereum", emoji: "Ξ" },
  { symbol: "SOL", name: "Solana", emoji: "◎" },
  { symbol: "XRP", name: "Ripple", emoji: "✕" },
  { symbol: "DOGE", name: "Dogecoin", emoji: "Ð" },
  { symbol: "XAUT", name: "Gold", emoji: "🪙", yahooSymbol: "GC=F" }, // Gold futures
  // Removed forex pairs (EUR/USD, USD/JPY, GBP/USD)
  { symbol: "WTI", name: "Oil WTI", emoji: "🛢", yahooSymbol: "CL=F" }, // Yahoo Finance WTI futures
  { symbol: "XAG", name: "Silver", emoji: "🥈", yahooSymbol: "SLV" }, // SLV ETF
];

/**
 * Generate signals for all symbols and save to DB
 */
export async function generateAndSaveMarketSignals(): Promise<any[]> {
  const results: LiveSignal[] = [];

  for (const pair of SYMBOLS) {
    try {
      const ohlcData = await fetchLatestOHLC(pair.symbol, { yahooSymbol: pair.yahooSymbol });
      console.log(`[SignalUpdater] Fetched ${ohlcData?.length || 0} OHLC candles for ${pair.symbol}`);

      if (ohlcData.length > 0) {
        // Transform Coinglass format to our format
        const transformed = ohlcData.map(candle => ({
          time: new Date(candle[0]).toISOString(),
          open: Number(candle[1]),
          high: Number(candle[2]),
          low: Number(candle[3]),
          close: Number(candle[4]),
          volume: Number(candle[5]),
        }));

        const signal = generateSignalFromOHLC(pair.symbol, pair.name, pair.emoji, transformed);
        results.push(signal);

        // Save to DB
        try {
          await db.marketSignal.upsert({
            where: {
              symbol_timeframe_generatedAt: {
                symbol: pair.symbol,
                timeframe: "8h",
                generatedAt: new Date(new Date().setHours(new Date().getHours() - (new Date().getHours() % 8))),
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
              timeframe: "8h",
              generatedAt: new Date(new Date().setHours(new Date().getHours() - (new Date().getHours() % 8))),
              updatedAt: new Date(),
            },
          });
          console.log(`[SignalUpdater] Saved signal for ${pair.symbol}`);
        } catch (dbError: any) {
          console.error(`[SignalUpdater] DB error for ${pair.symbol}:`, dbError.message, dbError);
        }
      } else {
        // Fallback: use simulated data if Coinglass returns no data
        console.warn(`No OHLC data from Coinglass for ${pair.symbol}, using fallback simulated data`);
        const simulatedOHLC = generateSimulatedData(pair.symbol, "8h");
        // Transform OHLCData[] to expected format {time:string, ...}
        const transformedSimulated = simulatedOHLC.map(d => ({
          time: d.timestamp.toISOString(),
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume,
        }));
        const fallbackSignal = generateSignalFromOHLC(pair.symbol, pair.name, pair.emoji, transformedSimulated);
        results.push(fallbackSignal);

        // Save fallback to DB
        const roundedTime = new Date(new Date().setHours(new Date().getHours() - (new Date().getHours() % 8)));
        await db.marketSignal.upsert({
          where: {
            symbol_timeframe_generatedAt: {
              symbol: pair.symbol,
              timeframe: "8h",
              generatedAt: roundedTime,
            },
          },
          update: {
            name: fallbackSignal.name,
            emoji: fallbackSignal.emoji,
            signal: fallbackSignal.signal,
            entry: fallbackSignal.entry,
            tp: fallbackSignal.tp,
            sl: fallbackSignal.sl,
            confidence: fallbackSignal.confidence,
            reasoning: fallbackSignal.reasoning,
            updatedAt: new Date(),
          },
          create: {
            symbol: fallbackSignal.symbol,
            name: fallbackSignal.name,
            emoji: fallbackSignal.emoji,
            signal: fallbackSignal.signal,
            entry: fallbackSignal.entry,
            tp: fallbackSignal.tp,
            sl: fallbackSignal.sl,
            confidence: fallbackSignal.confidence,
            reasoning: fallbackSignal.reasoning,
            timeframe: "8h",
            generatedAt: roundedTime,
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error(`Error generating signal for ${pair.symbol}:`, error);
    }
  }

  console.log(`Generated ${results.length} market signals at ${new Date().toISOString()}`);

  // Try to fetch from DB; if fails or empty, return in-memory results
  try {
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
    const savedSignals = await db.marketSignal.findMany({
      where: { generatedAt: { gte: eightHoursAgo } },
      orderBy: { generatedAt: "desc" },
    });
    if (savedSignals.length > 0) {
      return savedSignals;
    }
  } catch (dbError: any) {
    console.error('[SignalUpdater] DB fetch error, using in-memory results:', dbError.message);
  }

  // Fallback: return in-memory results (convert to DB-like shape)
  const roundedTime = new Date(new Date().setHours(new Date().getHours() - (new Date().getHours() % 8)));
  return results.map(s => ({
    ...s,
    id: crypto.randomUUID(),
    timeframe: s.timeframe || "8h",
    generatedAt: s.generatedAt || roundedTime,
    updatedAt: new Date(),
  }));
}

/**
 * Get latest signals (from DB or generate fresh)
 */
export async function getLatestMarketSignals(forceRefresh: boolean = false) {
  if (!forceRefresh) {
    // Check if we have recent signals (< 8 hours old)
    const latest = await db.marketSignal.findMany({
      orderBy: { generatedAt: "desc" },
      take: 20,
    });

    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
    const recentSignals = latest.filter(s => new Date(s.generatedAt) > eightHoursAgo);

    if (recentSignals.length > 0) {
      return recentSignals;
    }
  }

  // Generate fresh signals
  const signals = await generateAndSaveMarketSignals();
  return signals;
}
