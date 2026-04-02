/**
 * Real-Time Market Outlook Service
 * Fetches live OHLC from Coinglass and generates trading signals
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

  // Simple momentum-based signal (can be enhanced with more indicators)
  const priceChange = currentPrice - previous.close;
  const percentChange = (priceChange / previous.close) * 100;

  // Determine signal based on recent price action
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
  const atrMultiplier = 2; // 2x ATR for TP, 1x ATR for SL
  const slDistance = atr * 1.5;
  const tpDistance = atr * atrMultiplier;

  const sl = signal === "buy" ? currentPrice - slDistance : currentPrice + slDistance;
  const tp = signal === "buy" ? currentPrice + tpDistance : currentPrice - tpDistance;

  // Confidence based on ATR relative to price (lower ATR = higher confidence)
  const atrPercent = (atr / currentPrice) * 100;
  let confidence = 0.5 + (100 - Math.min(atrPercent * 10, 50)) / 100;
  confidence = Math.max(0.1, Math.min(confidence, 0.99));

  // Adjust reasoning with volatility context
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
    "XAUT/USD": "XAU", // Gold
    "EUR/USD": "EUR",
    "USD/JPY": "JPY",
    "GBP/USD": "GBP",
    "OIL/USD": "WTI", // or Brent
    "XAG/USD": "XAG", // Silver
    "BTC/USD": "BTC",
    "ETH/USD": "ETH",
    "SOL/USD": "SOL",
  };
  return map[symbol] || symbol.replace("/USD", "");
}

/**
 * Main function to generate real-time market outlook
 */
export async function generateRealTimeOutlook(): Promise<MarketOutlook> {
  const pairs = [
    { symbol: "XAUT/USD", name: "Gold", emoji: "🪙" },
    { symbol: "EUR/USD", name: "EURUSD", emoji: "💶" },
    { symbol: "USD/JPY", name: "USDJPY", emoji: "🇯🇵" },
    { symbol: "GBP/USD", name: "GBPUSD", emoji: "💷" },
    { symbol: "OIL/USD", name: "Oil", emoji: "🛢" },
    { symbol: "XAG/USD", name: "Silver", emoji: "🥈" },
  ];

  const results: MarketPair[] = [];

  for (const pair of pairs) {
    try {
      const coinglassSymbol = getCoinglassSymbol(pair.symbol);
      const ohlcData = await fetchCoinglassOHLC(coinglassSymbol, "1h", 100);

      if (ohlcData) {
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
        // Fallback neutral if no data
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
    } catch (error) {
      console.error(`Error fetching ${pair.symbol}:`, error);
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

  return {
    generatedAt: new Date().toISOString(),
    market: "Real-time Technical Analysis (Coinglass)",
    pairs: results,
    disclaimer: "Sinyal yang di berikan hanya bersifat rekomendasi bukan jaminan profit, semua di buat berdasarkan analisa dan pergerakan market saat ini"
  };
}
