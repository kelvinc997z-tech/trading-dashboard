import { db } from "./db";
import { isCryptoSymbol } from "./yahoo-finance";
import { fetchCoinglassOHLC } from "./coinglass";

/**
 * Technical analysis helpers
 */
function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateATR(highs: number[], lows: number[], closes: number[], period: number): number {
  if (closes.length < period + 1) {
    const lastHigh = highs[highs.length - 1] || 0;
    const lastLow = lows[lows.length - 1] || 0;
    const lastClose = closes[closes.length - 1] || 1;
    return (lastHigh - lastLow) || (lastClose * 0.01);
  }
  
  const trs = [];
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trs.push(tr);
  }
  
  const slice = trs.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function generateSignalFromOHLC(symbol: string, name: string, emoji: string, candles: any[], timeframe: string) {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const currentPrice = closes[closes.length - 1];
  
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const atr = calculateATR(highs, lows, closes, 14);
  
  const lastClose = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2] || lastClose;
  const percentChange = ((lastClose - prevClose) / prevClose) * 100;

  let signal: "buy" | "sell" | "neutral" = "neutral";
  let reasoning = "";

  // Strategy logic
  if (currentPrice > sma20 && sma20 > sma50 && percentChange > 0.1) {
    signal = "buy";
    reasoning = `Bullish momentum (${percentChange.toFixed(2)}% ${timeframe} gain) | Price > SMA20 > SMA50`;
  } else if (currentPrice < sma20 && sma20 < sma50 && percentChange < -0.1) {
    signal = "sell";
    reasoning = `Bearish momentum (${percentChange.toFixed(2)}% ${timeframe} loss) | Price < SMA20 < SMA50`;
  } else if (percentChange > 0.3) {
    signal = "buy";
    reasoning = `Strong bullish bounce (${percentChange.toFixed(2)}% ${timeframe} gain)`;
  } else if (percentChange < -0.3) {
    signal = "sell";
    reasoning = `Strong bearish dip (${percentChange.toFixed(2)}% ${timeframe} loss)`;
  } else {
    signal = "neutral";
    reasoning = `Market consolidation (${percentChange.toFixed(2)}% ${timeframe} change)`;
  }

  // ATR-based SL/TP
  const slDistance = atr * 2;
  const tpDistance = atr * 4;

  const sl = signal === "buy" ? currentPrice - slDistance : currentPrice + slDistance;
  const tp = signal === "buy" ? currentPrice + tpDistance : currentPrice - tpDistance;

  // Confidence calculation
  const atrPercent = (atr / currentPrice) * 100;
  const momentumStrength = Math.abs(percentChange);
  let confidence = 0.4 + Math.min(momentumStrength / 2, 0.3) + (100 - Math.min(atrPercent * 5, 30)) / 100;
  confidence = Math.max(0.1, Math.min(confidence, 0.99));

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
 * Fetch latest OHLC data
 */
async function fetchLatestOHLC(symbol: string, timeframe: string = "4h", config?: { yahooSymbol?: string }): Promise<any[]> {
  const yahooSymbol = config?.yahooSymbol || (isCryptoSymbol(symbol) ? `${symbol}-USD` : symbol);
  
  try {
    const fetchWithTimeout = (url: string) => 
      fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 300 } });

    // Use range=5d to handle weekends and 60m interval
    const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=5d&interval=60m`;
    const latestUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=1d&interval=1m`;

    const [res1, res2] = await Promise.all([
      fetchWithTimeout(yahooUrl).catch(() => null),
      fetchWithTimeout(latestUrl).catch(() => null)
    ]);

    let yahooData: any[] = [];
    if (res1?.ok) {
      const json = await res1.json();
      const result = json.chart.result?.[0];
      if (result && result.timestamp) {
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
      if (result && result.indicators.quote[0].close) {
        latestPrice = result.indicators.quote[0].close.filter((p: any) => p !== null).pop();
      }
    }

    if (yahooData.length > 0) {
      const count = timeframe === "4h" ? 48 : 24; 
      return yahooData.slice(-count).map((c, i) => {
        const isLast = i === yahooData.slice(-count).length - 1;
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
    console.warn(`[SignalUpdater] Yahoo Finance error for ${symbol}:`, error.message);
  }

  // Fallback to Coinglass (Crypto only)
  if (isCryptoSymbol(symbol)) {
    try {
      const coinglassData = await fetchCoinglassOHLC(symbol, timeframe, 50);
      if (coinglassData?.data && coinglassData.data.length > 0) {
        return coinglassData.data;
      }
    } catch (e: any) {
      console.error(`[SignalUpdater] Coinglass failed for ${symbol}:`, e.message);
    }
  }

  // Final fallback: Simulated data
  return generateSimulatedData(symbol, timeframe).map(d => [
    d.timestamp.getTime(), d.open, d.high, d.low, d.close, d.volume,
  ]);
}

function generateSimulatedData(symbol: string, timeframe: string) {
  const data = [];
  const now = new Date();
  let basePrice = symbol === "BTC" ? 65000 : symbol === "WTI" ? 80 : symbol === "XAUT" ? 2300 : 100;
  
  for (let i = 48; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const change = (Math.random() - 0.5) * (basePrice * 0.005);
    const open = basePrice;
    const close = basePrice + change;
    data.push({ timestamp: time, open, high: open + 1, low: open - 1, close, volume: 100 });
    basePrice = close;
  }
  return data;
}

export async function generateAndSaveMarketSignals(force: boolean = false): Promise<any[]> {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const pairsToProcess = force ? SYMBOLS : SYMBOLS.filter(pair => currentHour % pair.interval === 0);
  
  if (pairsToProcess.length === 0) return [];

  const tasks = pairsToProcess.map(async (pair) => {
    try {
      const timeframeLabel = `${pair.interval}h`;
      const ohlcData = await fetchLatestOHLC(pair.symbol, timeframeLabel, { yahooSymbol: pair.yahooSymbol });
      
      if (!ohlcData || ohlcData.length === 0) return null;

      const transformed = ohlcData.map(candle => ({
        time: new Date(candle[0]).toISOString(),
        open: Number(candle[1]),
        high: Number(candle[2]),
        low: Number(candle[3]),
        close: Number(candle[4]),
        volume: Number(candle[5]),
      }));

      const signalResult = generateSignalFromOHLC(pair.symbol, pair.name, pair.emoji, transformed, timeframeLabel);
      const roundedTime = new Date(new Date().setUTCHours(now.getUTCHours() - (now.getUTCHours() % pair.interval), 0, 0, 0));

      // Explicitly pick fields for DB to avoid Prisma errors with extra fields
      const dbData = {
        symbol: signalResult.symbol,
        name: signalResult.name,
        emoji: signalResult.emoji,
        signal: signalResult.signal,
        entry: signalResult.entry,
        tp: signalResult.tp,
        sl: signalResult.sl,
        confidence: signalResult.confidence,
        reasoning: signalResult.reasoning,
        timeframe: timeframeLabel,
        generatedAt: roundedTime,
      };

      await db.marketSignal.upsert({
        where: { 
          symbol_timeframe_generatedAt: { 
            symbol: pair.symbol, 
            timeframe: timeframeLabel, 
            generatedAt: roundedTime 
          } 
        },
        update: { 
          ...dbData,
          updatedAt: new Date() 
        },
        create: { 
          ...dbData,
          updatedAt: new Date() 
        },
      });
      
      return { ...signalResult, timeframe: timeframeLabel, generatedAt: roundedTime };
    } catch (error: any) {
      console.error(`[SignalUpdater] Error for ${pair.symbol}:`, error);
      return null;
    }
  });

  const results = await Promise.all(tasks);
  return results.filter(r => r !== null);
}

export async function getLatestMarketSignals(forceRefresh: boolean = false) {
  let latestSignals = await db.marketSignal.findMany({
    where: { generatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    orderBy: { generatedAt: "desc" },
  }).catch(() => []);

  if (forceRefresh || latestSignals.length === 0) {
    await generateAndSaveMarketSignals(true);
    latestSignals = await db.marketSignal.findMany({
      where: { generatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      orderBy: { generatedAt: "desc" },
    }).catch(() => []);
  }

  const uniqueMap = new Map();
  latestSignals.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  latestSignals.forEach(s => { if (!uniqueMap.has(s.symbol)) uniqueMap.set(s.symbol, s); });
  
  const result = Array.from(uniqueMap.values());
  const priority = ["BTC", "WTI", "XAUT"];
  
  return result.sort((a, b) => {
    const aIdx = priority.indexOf(a.symbol);
    const bIdx = priority.indexOf(b.symbol);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.symbol.localeCompare(b.symbol);
  });
}
