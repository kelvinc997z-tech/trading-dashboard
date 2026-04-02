/**
 * Real-Time Market Outlook Service
 * Fetches live OHLC from Coinglass and generates trading signals
 * Falls back to static data if Coinglass unavailable
 */

import { fetchCoinglassOHLC } from "@/lib/coinglass";

export interface MarketPair {
  symbol: string;
  name: string;
  emoji: string;
  signal: "buy" | "sell" | "neutral";
  entry: number;
  tp: number;
  sl: number;
  confidence: number;
  reasoning: string;
}

export interface MarketOutlook {
  generatedAt: string;
  market: string;
  pairs: MarketPair[];
  disclaimer: string;
}

/**
 * Fallback static data (if Coinglass API fails)
 * These values are from your earlier market outlook (March 1 data)
 * Updated XAU/USD to realistic current levels (example)
 */
const FALLBACK_DATA: Record<string, MarketPair> = {
  "XAU/USD": {
    symbol: "XAU/USD",
    name: "Gold",
    emoji: "🪙",
    signal: "buy",
    entry: 2350,
    tp: 2380,
    sl: 2330,
    confidence: 0.75,
    reasoning: "Bullish momentum, breaking key resistance (fallback data)"
  },
  "EUR/USD": {
    symbol: "EUR/USD",
    name: "EURUSD",
    emoji: "💶",
    signal: "buy",
    entry: 1.1556,
    tp: 1.1577,
    sl: 1.15308,
    confidence: 0.72,
    reasoning: "Uptrend continuation, ECB hawkish stance (fallback)"
  },
  "USD/JPY": {
    symbol: "USD/JPY",
    name: "USDJPY",
    emoji: "🇯🇵",
    signal: "sell",
    entry: 158.70,
    tp: 158.30,
    sl: 159.20,
    confidence: 0.68,
    reasoning: "Overbought, profit-taking expected (fallback)"
  },
  "GBP/USD": {
    symbol: "GBP/USD",
    name: "GBPUSD",
    emoji: "💷",
    signal: "sell",
    entry: 1.32213,
    tp: 1.32930,
    sl: 1.31790,
    confidence: 0.70,
    reasoning: "Resistance at 1.325, bearish divergence (fallback)"
  },
  "OIL/USD": {
    symbol: "OIL/USD",
    name: "Oil",
    emoji: "🛢",
    signal: "sell",
    entry: 101.50,
    tp: 99.00,
    sl: 102.20,
    confidence: 0.71,
    reasoning: "Demand concerns, inventory build-up (fallback)"
  },
  "XAG/USD": {
    symbol: "XAG/USD",
    name: "Silver",
    emoji: "🥈",
    signal: "buy",
    entry: 75.00,
    tp: 75.50,
    sl: 74.00,
    confidence: 0.69,
    reasoning: "Industrial demand support, technical breakout (fallback)"
  },
};

/**
 * Calculate ATR (Average True Range) from OHLC data
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

  // Simple moving average of TR for the last 'period' values
  const recentTR = trueRanges.slice(-period);
  const sum = recentTR.reduce((acc, val) => acc + val, 0);
  return sum / period;
}

/**
 * Generate signal for a single pair based on OHLC data
 */
function generateSignal(
  symbol: string,
  name: string,
  emoji: string,
  ohlcData: Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }>
): MarketPair {
  if (!ohlcData || ohlcData.length === 0) {
    // Use fallback if no data
    const fallback = FALLBACK_DATA[symbol];
    if (fallback) {
      return { ...fallback, reasoning: `${fallback.reasoning} (no OHLC data)` };
    }
    return {
      symbol,
      name,
      emoji,
      signal: "neutral",
      entry: 0,
      tp: 0,
      sl: 0,
      confidence: 0,
      reasoning: "No data available"
    };
  }

  const latest = ohlcData[ohlcData.length - 1];
  const previous = ohlcData.length > 1 ? ohlcData[ohlcData.length - 2] : latest;
  const currentPrice = latest.close;

  // Calculate ATR for volatility-based SL/TP
  const atr = calculateATR(ohlcData.slice(-50).map(d => ({
    high: d.high,
    low: d.low,
    close: d.close
  })), 14);

  // Simple momentum-based signal
  const priceChange = currentPrice - previous.close;
  const percentChange = (priceChange / previous.close) * 100;

  let signal: "buy" | "sell" | "neutral" = "neutral";
  let reasoning = "";

  if (percentChange > 0.5) {
    signal = "buy";
    reasoning = `Bullish momentum (${percentChange.toFixed(2)}% gain)`;
  } else if (percentChange < -0.5) {
    signal = "sell";
    reasoning = `Bearish momentum (${percentChange.toFixed(2)}% loss)`;
  } else {
    signal = "neutral";
    reasoning = "Sideways/consolidation";
  }

  // Adjust SL/TP based on ATR and signal
  const atrMultiplier = 2;
  const slDistance = atr * 1.5;
  const tpDistance = atr * atrMultiplier;

  const sl = signal === "buy" ? currentPrice - slDistance : currentPrice + slDistance;
  const tp = signal === "buy" ? currentPrice + tpDistance : currentPrice - tpDistance;

  // Confidence based on ATR relative to price
  const atrPercent = (atr / currentPrice) * 100;
  let confidence = 0.5 + (100 - Math.min(atrPercent * 10, 50)) / 100;
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
    reasoning
  };
}

/**
 * Map our symbols to Coinglass format
 */
function getCoinglassSymbol(symbol: string): string {
  const map: Record<string, string> = {
    "XAU/USD": "XAU", // Gold
    "EUR/USD": "EUR",
    "USD/JPY": "JPY",
    "GBP/USD": "GBP",
    "OIL/USD": "WTI",
    "XAG/USD": "XAG", // Silver
  };
  return map[symbol] || symbol.replace("/USD", "");
}

/**
 * Main function to generate real-time market outlook
 */
export async function generateRealTimeOutlook(): Promise<MarketOutlook> {
  const pairsConfig = [
    { symbol: "XAU/USD", name: "Gold", emoji: "🪙" },
    { symbol: "EUR/USD", name: "EURUSD", emoji: "💶" },
    { symbol: "USD/JPY", name: "USDJPY", emoji: "🇯🇵" },
    { symbol: "GBP/USD", name: "GBPUSD", emoji: "💷" },
    { symbol: "OIL/USD", name: "Oil", emoji: "🛢" },
    { symbol: "XAG/USD", name: "Silver", emoji: "🥈" },
  ];

  const results: MarketPair[] = [];

  for (const pair of pairsConfig) {
    try {
      // Check if COINGLASS_API_KEY is set
      if (!process.env.COINGLASS_API_KEY) {
        console.warn(`COINGLASS_API_KEY not set, using fallback for ${pair.symbol}`);
        const fallback = FALLBACK_DATA[pair.symbol];
        if (fallback) {
          results.push({ ...fallback, reasoning: `${fallback.reasoning} (API key not configured)` });
        } else {
          results.push({
            symbol: pair.symbol,
            name: pair.name,
            emoji: pair.emoji,
            signal: "neutral",
            entry: 0,
            tp: 0,
            sl: 0,
            confidence: 0,
            reasoning: "No data available (fallback missing)"
          });
        }
        continue;
      }

      const coinglassSymbol = getCoinglassSymbol(pair.symbol);
      const ohlcData = await fetchCoinglassOHLC(coinglassSymbol, "1h", 100);

      if (ohlcData && ohlcData.data && ohlcData.data.length > 0) {
        // Transform Coinglass data format: [time, open, high, low, close, volume][]
        // to our expected format: {time, open, high, low, close, volume}[]
        const transformedData = ohlcData.data.map(candle => ({
          time: new Date(candle[0]).toISOString(),
          open: Number(candle[1]),
          high: Number(candle[2]),
          low: Number(candle[3]),
          close: Number(candle[4]),
          volume: Number(candle[5]),
        }));
        const signalData = generateSignal(pair.symbol, pair.name, pair.emoji, transformedData);
        results.push(signalData);
      } else {
        // Fallback to static data if Coinglass returns no data
        console.warn(`No data from Coinglass for ${pair.symbol}, using fallback`);
        const fallback = FALLBACK_DATA[pair.symbol];
        if (fallback) {
          results.push({ ...fallback, reasoning: `${fallback.reasoning} (Coinglass no data)` });
        } else {
          results.push({
            symbol: pair.symbol,
            name: pair.name,
            emoji: pair.emoji,
            signal: "neutral",
            entry: 0,
            tp: 0,
            sl: 0,
            confidence: 0,
            reasoning: "Data unavailable"
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching ${pair.symbol}:`, error);
      // Fallback on error
      const fallback = FALLBACK_DATA[pair.symbol];
      if (fallback) {
        results.push({ ...fallback, reasoning: `${fallback.reasoning} (fetch error)` });
      } else {
        results.push({
          symbol: pair.symbol,
          name: pair.name,
          emoji: pair.emoji,
          signal: "neutral",
          entry: 0,
          tp: 0,
          sl: 0,
          confidence: 0,
          reasoning: "Fetch error"
        });
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    market: "Real-time Technical Analysis (Coinglass)",
    pairs: results,
    disclaimer: "Sinyal yang di berikan hanya bersifat rekomendasi bukan jaminan profit , semua di buat berdasarkan analisa dan pergerakan market saat ini"
  };
}
