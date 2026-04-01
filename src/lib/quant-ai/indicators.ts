/**
 * Technical Indicators Calculation
 * Pure JavaScript implementation for TA indicators
 */

export function calculateRSI(prices: number[], period: number = 14): number[] {
  if (prices.length < period + 1) return [];

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  const rsi: number[] = new Array(prices.length).fill(NaN);
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  if (avgLoss === 0) {
    rsi[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    rsi[period] = 100 - 100 / (1 + rs);
  }

  for (let i = period + 1; i < prices.length; i++) {
    const idx = i - 1;
    avgGain = (avgGain * (period - 1) + gains[idx]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[idx]) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - 100 / (1 + rs);
    }
  }

  return rsi;
}

export function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = new Array(prices.length).fill(NaN);
  if (prices.length < period) return sma;

  let sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
  sma[period - 1] = sum / period;

  for (let i = period; i < prices.length; i++) {
    sum = sum - prices[i - period] + prices[i];
    sma[i] = sum / period;
  }

  return sma;
}

export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = new Array(prices.length).fill(NaN);
  if (prices.length < period) return ema;

  const multiplier = 2 / (period + 1);
  // Start with SMA
  let sum = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema[period - 1] = sum;

  for (let i = period; i < prices.length; i++) {
    ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }

  return ema;
}

export function calculateMACD(
  prices: number[],
  fast: number = 12,
  slow: number = 26,
  signal: number = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const emaFast = calculateEMA(prices, fast);
  const emaSlow = calculateEMA(prices, slow);

  const macd: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (!isNaN(emaFast[i]) && !isNaN(emaSlow[i])) {
      macd[i] = emaFast[i] - emaSlow[i];
    } else {
      macd[i] = NaN;
    }
  }

  // Signal line = EMA of MACD
  const macdSignal = calculateEMA(macd, signal);

  // Histogram = MACD - Signal
  const histogram: number[] = macd.map((val, i) =>
    isNaN(val) || isNaN(macdSignal[i]) ? NaN : val - macdSignal[i]
  );

  return { macd, signal: macdSignal, histogram };
}

export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const sma = calculateSMA(prices, period);
  const upper: number[] = new Array(prices.length).fill(NaN);
  const lower: number[] = new Array(prices.length).fill(NaN);

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = sma[i];
    if (isNaN(mean)) continue;

    const variance = slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / period;
    const std = Math.sqrt(variance);

    upper[i] = mean + stdDev * std;
    lower[i] = mean - stdDev * std;
  }

  return { upper, middle: sma, lower };
}

export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number[] {
  const tr: number[] = [];

  for (let i = 1; i < highs.length; i++) {
    const high = highs[i];
    const low = lows[i];
    const prevClose = closes[i - 1];

    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);

    tr.push(Math.max(tr1, tr2, tr3));
  }

  // Smooth with SMA
  return calculateSMA(tr, period);
}

export function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number[] {
  const tr = calculateATR(highs, lows, closes, 1);
  const atr = calculateATR(highs, lows, closes, period);

  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < highs.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];

    if (upMove > downMove && upMove > 0) {
      plusDM[i] = upMove;
      minusDM[i] = 0;
    } else if (downMove > upMove && downMove > 0) {
      plusDM[i] = 0;
      minusDM[i] = downMove;
    } else {
      plusDM[i] = 0;
      minusDM[i] = 0;
    }
  }

  const plusDI: number[] = new Array(highs.length).fill(NaN);
  const minusDI: number[] = new Array(highs.length).fill(NaN);
  const dx: number[] = new Array(highs.length).fill(NaN);

  for (let i = period; i < highs.length; i++) {
    const sumTR = calculateSMA(tr, period)[i];
    const sumPlusDM = calculateSMA(plusDM, period)[i];
    const sumMinusDM = calculateSMA(minusDM, period)[i];

    if (sumTR && sumTR !== 0) {
      plusDI[i] = 100 * (sumPlusDM / sumTR);
      minusDI[i] = 100 * (sumMinusDM / sumTR);

      const diSum = plusDI[i] + minusDI[i];
      if (diSum && diSum !== 0) {
        dx[i] = 100 * Math.abs(plusDI[i] - minusDI[i]) / diSum;
      }
    }
  }

  // ADX = SMA of DX
  return calculateSMA(dx, period);
}

export function calculateStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod: number = 14,
  dPeriod: number = 3
): { k: number[]; d: number[] } {
  const k: number[] = new Array(highs.length).fill(NaN);
  let d: number[] = new Array(highs.length).fill(NaN);

  for (let i = kPeriod - 1; i < highs.length; i++) {
    const highSlice = highs.slice(i - kPeriod + 1, i + 1);
    const lowSlice = lows.slice(i - kPeriod + 1, i + 1);
    const currentClose = closes[i];

    const highest = Math.max(...highSlice);
    const lowest = Math.min(...lowSlice);

    if (highest !== lowest) {
      k[i] = 100 * (currentClose - lowest) / (highest - lowest);
    }
  }

  // D = SMA of K
  d = calculateSMA(k, dPeriod);

  return { k, d };
}

export function calculateWilliamsR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number[] {
  const williams: number[] = new Array(highs.length).fill(NaN);

  for (let i = period - 1; i < highs.length; i++) {
    const highSlice = highs.slice(i - period + 1, i + 1);
    const lowSlice = lows.slice(i - period + 1, i + 1);
    const currentClose = closes[i];

    const highest = Math.max(...highSlice);
    const lowest = Math.min(...lowSlice);

    if (highest !== lowest) {
      williams[i] = -100 * (highest - currentClose) / (highest - lowest);
    }
  }

  return williams;
}

export function calculateCCI(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 20
): number[] {
  const cci: number[] = new Array(highs.length).fill(NaN);
  const typicalPrices = closes.map((close, i) => (highs[i] + lows[i] + close) / 3);

  for (let i = period - 1; i < closes.length; i++) {
    const tpSlice = typicalPrices.slice(i - period + 1, i + 1);
    const sma = tpSlice.reduce((a, b) => a + b, 0) / period;

    const meanDeviation =
      tpSlice.reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period;

    if (meanDeviation !== 0) {
      cci[i] = (typicalPrices[i] - sma) / (0.015 * meanDeviation);
    }
  }

  return cci;
}

export function calculateMFI(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[],
  period: number = 14
): number[] {
  const typicalPrices = closes.map((close, i) => (highs[i] + lows[i] + close) / 3);
  const mfi: number[] = new Array(highs.length).fill(NaN);

  for (let i = period; i < highs.length; i++) {
    let positiveFlow = 0;
    let negativeFlow = 0;

    for (let j = i - period + 1; j <= i; j++) {
      const change = typicalPrices[j] - typicalPrices[j - 1];
      const flow = volumes[j] * change;

      if (change > 0) {
        positiveFlow += flow;
      } else if (change < 0) {
        negativeFlow += Math.abs(flow);
      }
    }

    if (negativeFlow === 0) {
      mfi[i] = 100;
    } else {
      const moneyRatio = positiveFlow / negativeFlow;
      mfi[i] = 100 - 100 / (1 + moneyRatio);
    }
  }

  return mfi;
}

export function calculateOBV(closes: number[], volumes: number[]): number[] {
  const obv: number[] = new Array(closes.length).fill(0);

  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) {
      obv[i] = obv[i - 1] + volumes[i];
    } else if (closes[i] < closes[i - 1]) {
      obv[i] = obv[i - 1] - volumes[i];
    } else {
      obv[i] = obv[i - 1];
    }
  }

  return obv;
}

// Calculate all indicators for a series of OHLC data
export function calculateAllIndicators(
  ohlc: { high: number; low: number; close: number; volume: number }[]
): Indicators[] {
  if (ohlc.length < 200) return [];

  const highs = ohlc.map(d => d.high);
  const lows = ohlc.map(d => d.low);
  const closes = ohlc.map(d => d.close);
  const volumes = ohlc.map(d => d.volume);

  const rsi = calculateRSI(closes, 14);
  const { macd, signal: macdSignal, histogram: macdHist } = calculateMACD(closes);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const { upper: bollingerUpper, middle: bollingerMiddle, lower: bollingerLower } = calculateBollingerBands(closes);
  const atr = calculateATR(highs, lows, closes, 14);
  const adx = calculateADX(highs, lows, closes, 14);
  const { k: stochK, d: stochD } = calculateStochastic(highs, lows, closes);
  const williamsR = calculateWilliamsR(highs, lows, closes, 14);
  const cci = calculateCCI(highs, lows, closes, 20);
  const mfi = calculateMFI(highs, lows, closes, volumes, 14);
  const obv = calculateOBV(closes, volumes);

  // Build indicator objects
  return closes.map((_, i) => ({
    rsi: rsi[i] || 0,
    macd: macd[i] || 0,
    macdSignal: macdSignal[i] || 0,
    macdHist: macdHist[i] || 0,
    sma20: sma20[i] || 0,
    sma50: sma50[i] || 0,
    sma200: sma200[i] || 0,
    ema12: ema12[i] || 0,
    ema26: ema26[i] || 0,
    bollingerUpper: bollingerUpper[i] || 0,
    bollingerMiddle: bollingerMiddle[i] || 0,
    bollingerLower: bollingerLower[i] || 0,
    atr: atr[i] || 0,
    adx: adx[i] || 0,
    stochK: stochK[i] || 0,
    stochD: stochD[i] || 0,
    williamsR: williamsR[i] || 0,
    cci: cci[i] || 0,
    mfi: mfi[i] || 0,
    obv: obv[i] || 0,
  }));
}
