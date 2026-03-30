// Shared indicator calculations used by charts and alerts

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
