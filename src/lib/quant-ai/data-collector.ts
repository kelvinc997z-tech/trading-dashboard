/**
 * Quant AI - Data Collection Module
 * Fetches OHLC data for symbols and stores in database for model training
 */

import { db } from "@/lib/db";

export interface OHLCData {
  symbol: string;
  timeframe: string; // "1h", "4h", "1d"
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Technical indicators to calculate
export interface Indicators {
  rsi: number;
  macd: number;
  macdSignal: number;
  macdHist: number;
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  atr: number;
  adx: number;
  stochK: number;
  stochD: number;
  williamsR: number;
  cci: number;
  mfi: number;
  obv: number;
  // Price action
  change: number;
  changePercent: number;
  range: number;
  volumeRatio: number;
}

export async function saveOHLCData(data: OHLCData[]) {
  // Upsert OHLC data (avoid duplicates)
  for (const item of data) {
    await db.oHLCData.upsert({
      where: {
        symbol_timeframe_timestamp_unique: {
          symbol: item.symbol,
          timeframe: item.timeframe,
          timestamp: item.timestamp,
        },
      },
      update: {
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
      },
      create: {
        symbol: item.symbol,
        timeframe: item.timeframe,
        timestamp: item.timestamp,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
      },
    });
  }
}

export async function saveIndicators(
  symbol: string,
  timeframe: string,
  timestamp: Date,
  indicators: Indicators
) {
  await db.indicator.upsert({
    where: {
      symbol_timeframe_timestamp_unique: {
        symbol,
        timeframe,
        timestamp,
      },
    },
    update: {
      ...indicators,
    },
    create: {
      symbol,
      timeframe,
      timestamp,
      ...indicators,
    },
  });
}

// Fetch recent OHLC data for a symbol/timeframe
export async function getOHLCHistory(
  symbol: string,
  timeframe: string,
  limit: number = 500
) {
  const data = await db.oHLCData.findMany({
    where: {
      symbol,
      timeframe,
    },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// Fetch indicators for a symbol/timeframe
export async function getIndicators(
  symbol: string,
  timeframe: string,
  limit: number = 500
) {
  const data = await db.indicator.findMany({
    where: {
      symbol,
      timeframe,
    },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// Prepare dataset for ML training
export async function prepareTrainingDataset(
  symbol: string,
  timeframe: string,
  lookback: number = 60, // Use 60 periods to predict next
  horizon: number = 1 // Predict 1 period ahead
) {
  const ohlc = await getOHLCHistory(symbol, timeframe, 2000);
  const indicators = await getIndicators(symbol, timeframe, 2000);

  if (ohlc.length < lookback + horizon) {
    throw new Error("Not enough data for training");
  }

  // Map indicators by timestamp for quick lookup
  const indicatorMap = new Map<string, Indicators>();
  for (const ind of indicators) {
    indicatorMap.set(ind.timestamp.getTime().toString(), {
      rsi: ind.rsi,
      macd: ind.macd,
      macdSignal: ind.macdSignal,
      macdHist: ind.macdHist,
      sma20: ind.sma20,
      sma50: ind.sma50,
      sma200: ind.sma200,
      ema12: ind.ema12,
      ema26: ind.ema26,
      bollingerUpper: ind.bollingerUpper,
      bollingerMiddle: ind.bollingerMiddle,
      bollingerLower: ind.bollingerLower,
      atr: ind.atr,
      adx: ind.adx,
      stochK: ind.stochK,
      stochD: ind.stochD,
      williamsR: ind.williamsR,
      cci: ind.cci,
      mfi: ind.mfi,
      obv: ind.obv,
    });
  }

  const X: number[][] = []; // Features
  const y: number[] = []; // Target: future price change (%)

  for (let i = lookback; i < ohlc.length - horizon; i++) {
    const current = ohlc[i];
    const future = ohlc[i + horizon];
    const indicatorData = indicatorMap.get(current.timestamp.getTime().toString());
    if (!indicatorData) continue;

    // Build feature vector: [close, volume, RSI, MACD, SMAs, etc.]
    const features: number[] = [
      current.close,
      current.volume,
      indicatorData.rsi,
      indicatorData.macd,
      indicatorData.macdSignal,
      indicatorData.macdHist,
      indicatorData.sma20,
      indicatorData.sma50,
      indicatorData.sma200,
      indicatorData.ema12,
      indicatorData.ema26,
      indicatorData.bollingerUpper,
      indicatorData.bollingerMiddle,
      indicatorData.bollingerLower,
      indicatorData.atr,
      indicatorData.adx,
      indicatorData.stochK,
      indicatorData.stochD,
      indicatorData.williamsR,
      indicatorData.cci,
      indicatorData.mfi,
      indicatorData.obv,
      // Past N closes (for LSTM-style features)
      ...ohlc.slice(i - lookback + 1, i + 1).map((d: OHLCData) => d.close),
    ];

    X.push(features);

    // Target: future price change percentage
    const changePct = ((future.close - current.close) / current.close) * 100;
    y.push(changePct);
  }

  return { X, y };
}
