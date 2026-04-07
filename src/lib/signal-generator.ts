/**
 * Simple Trading Signal Generator
 * Uses RSI + MACD indicators to generate BUY/SELL signals
 * Includes Stop Loss and Take Profit based on ATR
 */

import { OHLCData } from "./quant-ai/data-collector";

export interface TradingSignal {
  symbol: string;
  signal: "BUY" | "SELL" | "HOLD";
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number; // 0-100
  reason: string;
  timestamp: Date;
  indicators: {
    rsi: number;
    macd: number;
    macdSignal: number;
    atr: number;
  };
}

/**
 * Calculate RSI (Relative Strength Index)
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? -c : 0);

  const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return rsi;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * Returns { macd, signal, histogram }
 */
function calculateMACD(prices: number[], fast: number = 12, slow: number = 26, signal: number = 9): { macd: number; signal: number; histogram: number } {
  if (prices.length < slow + signal) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  // Simple EMA calculation
  const emaFast = calculateEMA(prices, fast);
  const emaSlow = calculateEMA(prices, slow);

  const macdLine = emaFast - emaSlow;

  // Signal line is EMA of MACD line
  const macdHistory = [];
  for (let i = 0; i < prices.length; i++) {
    const emaF = calculateEMA(prices.slice(0, i + 1), fast);
    const emaS = calculateEMA(prices.slice(0, i + 1), slow);
    macdHistory.push(emaF - emaS);
  }

  const signalLine = calculateEMA(macdHistory.slice(-signal * 2), signal);

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: macdLine - signalLine,
  };
}

/**
 * Calculate EMA (Exponential Moving Average)
 */
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

/**
 * Calculate ATR (Average True Range) for stop loss/take profit
 */
function calculateATR(data: OHLCData[], period: number = 14): number {
  if (data.length < period + 1) {
    // Fallback: use 2% of current price
    const currentPrice = data[data.length - 1].close;
    return currentPrice * 0.02;
  }

  const trueRanges = [];
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

  const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
  return atr;
}

/**
 * Generate trading signal based on RSI + MACD
 */
export function generateSignal(data: OHLCData[], symbol: string): TradingSignal {
  if (data.length < 50) {
    return {
      symbol,
      signal: "HOLD",
      entry: data[data.length - 1].close,
      stopLoss: 0,
      takeProfit: 0,
      confidence: 0,
      reason: "Insufficient data",
      timestamp: new Date(),
      indicators: { rsi: 50, macd: 0, macdSignal: 0, atr: 0 },
    };
  }

  const prices = data.map(d => d.close);
  const rsi = calculateRSI(prices, 14);
  const { macd, signal: macdSignal, histogram } = calculateMACD(prices, 12, 26, 9);
  const atr = calculateATR(data, 14);

  const latestPrice = prices[prices.length - 1];
  const prevMacd = calculateMACD(prices.slice(0, -1), 12, 26, 9).macd;

  // Signal logic
  const isRsiOversold = rsi < 30;
  const isRsiOverbought = rsi > 70;
  const isMacdBullish = macd > macdSignal && prevMacd <= macdSignal;
  const isMacdBearish = macd < macdSignal && prevMacd >= macdSignal;

  let signal: "BUY" | "SELL" | "HOLD" = "HOLD";
  let confidence = 50;
  let reason = "No clear signal";

  if (isRsiOversold && isMacdBullish) {
    signal = "BUY";
    confidence = Math.min(90, 70 + (30 - rsi) + (macd - macdSignal) * 10);
    reason = `RSI oversold (${rsi.toFixed(1)}) + MACD bullish crossover`;
  } else if (isRsiOverbought && isMacdBearish) {
    signal = "SELL";
    confidence = Math.min(90, 70 + (rsi - 70) + (macdSignal - macd) * 10);
    reason = `RSI overbought (${rsi.toFixed(1)}) + MACD bearish crossover`;
  } else {
    confidence = 50;
    reason = `Neutral: RSI=${rsi.toFixed(1)}, MACD=${macd.toFixed(4)}`;
  }

  // Calculate SL/TP based on ATR
  const slDistance = atr * 2;
  const tpDistance = atr * 3;

  const stopLoss = signal === "BUY" ? latestPrice - slDistance : signal === "SELL" ? latestPrice + slDistance : 0;
  const takeProfit = signal === "BUY" ? latestPrice + tpDistance : signal === "SELL" ? latestPrice - tpDistance : 0;

  return {
    symbol,
    signal,
    entry: latestPrice,
    stopLoss,
    takeProfit,
    confidence: Math.round(confidence),
    reason,
    timestamp: new Date(),
    indicators: {
      rsi: Math.round(rsi * 10) / 10,
      macd: Math.round(macd * 1000) / 1000,
      macdSignal: Math.round(macdSignal * 1000) / 1000,
      atr: Math.round(atr * 100) / 100,
    },
  };
}
