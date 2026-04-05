// Technical indicators calculations (shared between client and server)

export function calculateRSI(prices: number[], period: number = 14): number[] {
  if (prices.length < period + 1) return [];
  
  const changes = prices.slice(1).map((price, i) => price - prices[i]);
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? -change : 0);
  
  const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  const rsi: number[] = [];
  let lastAvgGain = avgGain;
  let lastAvgLoss = avgLoss;
  
  for (let i = period; i < prices.length; i++) {
    const currentGain = gains[i - 1];
    const currentLoss = losses[i - 1];
    
    lastAvgGain = (lastAvgGain * (period - 1) + currentGain) / period;
    lastAvgLoss = (lastAvgLoss * (period - 1) + currentLoss) / period;
    
    if (lastAvgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = lastAvgGain / lastAvgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsi;
}

export function calculateMACD(prices: number[], fast: number = 12, slow: number = 26, signal: number = 9): { macd: number[], signal: number[] } {
  if (prices.length < slow) return { macd: [], signal: [] };
  
  const ema = (data: number[], period: number): number[] => {
    const multiplier = 2 / (period + 1);
    const result: number[] = [data.slice(0, period).reduce((a, b) => a + b, 0) / period];
    
    for (let i = period; i < data.length; i++) {
      result.push((data[i] - result[result.length - 1]) * multiplier + result[result.length - 1]);
    }
    return result;
  };
  
  const fastEMA = ema(prices, fast);
  const slowEMA = ema(prices, slow);
  
  const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i] || 0);
  const signalLine = ema(macdLine, signal);
  
  return { macd: macdLine, signal: signalLine };
}

export function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number[], lower: number[] } {
  if (prices.length < period) return { upper: [], lower: [] };
  
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    upper.push(mean + stdDev * std);
    lower.push(mean - stdDev * std);
  }
  
  return { upper, lower };
}

// Calculate AI confidence score based on indicators
export function calculateConfidence(prices: number[]): { confidence: number; recommendation: 'BUY' | 'SELL' | 'NEUTRAL'; details: any } {
  if (prices.length < 26) {
    return { confidence: 50, recommendation: 'NEUTRAL', details: { rsi: 50, macd: 0, bollinger: { position: 50 } } };
  }

  const rsi = calculateRSI(prices, 14);
  const { macd, signal } = calculateMACD(prices, 12, 26, 9);
  const { upper, lower } = calculateBollingerBands(prices, 20, 2);

  const latestRSI = rsi[rsi.length - 1] || 50;
  const latestMACD = macd[macd.length - 1] || 0;
  const latestSignal = signal[signal.length - 1] || 0;
  const latestPrice = prices[prices.length - 1];
  const latestUpper = upper[upper.length - 1] || latestPrice * 1.02;
  const latestLower = lower[lower.length - 1] || latestPrice * 0.98;

  // Normalize RSI to 0-100 score contribution
  // RSI < 30: bullish (oversold) -> add up to 30 points
  // RSI > 70: bearish (overbought) -> subtract up to 30 points
  let score = 50; // start neutral
  if (latestRSI < 30) {
    score += 30 * (1 - latestRSI / 30); // stronger signal as RSI goes lower
  } else if (latestRSI > 70) {
    score -= 30 * ((latestRSI - 70) / 30);
  }

  // MACD: bullish if MACD > signal
  if (latestMACD > latestSignal) {
    score += 20;
  } else {
    score -= 20;
  }

  // Bollinger Bands: position relative to bands
  const bbPosition = (latestPrice - latestLower) / (latestUpper - latestLower); // 0=lower, 1=upper
  if (bbPosition < 0.2) {
    score += 30; // near lower band -> bullish
  } else if (bbPosition > 0.8) {
    score -= 30; // near upper band -> bearish
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  let recommendation: 'BUY' | 'SELL' | 'NEUTRAL';
  if (score >= 65) recommendation = 'BUY';
  else if (score <= 35) recommendation = 'SELL';
  else recommendation = 'NEUTRAL';

  return {
    confidence: Math.round(score),
    recommendation,
    details: {
      rsi: Math.round(latestRSI),
      macd: latestMACD.toFixed(2),
      signal: latestSignal.toFixed(2),
      bollinger: {
        upper: latestUpper.toFixed(2),
        lower: latestLower.toFixed(2),
        position: Math.round(bbPosition * 100)
      }
    }
  };
}
