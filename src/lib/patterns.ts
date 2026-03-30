// Candlestick pattern detection from OHLC data

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}

export function isDoji(candle: Candle, tolerance: number = 0.1): boolean {
  const body = Math.abs(candle.close - candle.open);
  const range = candle.high - candle.low;
  return range > 0 && body / range <= tolerance;
}

export function isHammer(candle: Candle, bodyRatio: number = 0.3, shadowRatio: number = 2): boolean {
  const body = Math.abs(candle.close - candle.open);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  const range = candle.high - candle.low;
  return (
    range > 0 &&
    lowerShadow / range >= shadowRatio * bodyRatio &&
    upperShadow / range <= bodyRatio &&
    body / range <= bodyRatio &&
    candle.close > candle.open // bullish hammer
  );
}

export function isShootingStar(candle: Candle, bodyRatio: number = 0.3, shadowRatio: number = 2): boolean {
  const body = Math.abs(candle.close - candle.open);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  const range = candle.high - candle.low;
  return (
    range > 0 &&
    upperShadow / range >= shadowRatio * bodyRatio &&
    lowerShadow / range <= bodyRatio &&
    body / range <= bodyRatio &&
    candle.close < candle.open // bearish shooting star
  );
}

export function isBullishEngulfing(prev: Candle, curr: Candle): boolean {
  return (
    prev.close < prev.open && // previous bearish
    curr.close > curr.open && // current bullish
    curr.open < prev.close &&
    curr.close > prev.open
  );
}

export function isBearishEngulfing(prev: Candle, curr: Candle): boolean {
  return (
    prev.close > prev.open && // previous bullish
    curr.close < curr.open && // current bearish
    curr.open > prev.close &&
    curr.close < prev.open
  );
}

export function isMorningStar(prev: Candle, curr: Candle, next: Candle): boolean {
  // Simplified: first long bearish, then small body (star), then long bullish
  const prevBody = Math.abs(prev.close - prev.open);
  const currBody = Math.abs(curr.close - curr.open);
  const nextBody = Math.abs(next.close - next.open);
  const prevRange = prev.high - prev.low;
  const nextRange = next.high - next.low;
  return (
    prevBody / prevRange > 0.6 && prev.close < prev.open &&
    currBody / (curr.high - curr.low || 1) < 0.3 && // small body
    nextBody / nextRange > 0.6 && next.close > next.open &&
    curr.low < prev.low && // star gaps down
    next.high > prev.high // next closes into prev body
  );
}

export function isEveningStar(prev: Candle, curr: Candle, next: Candle): boolean {
  const prevBody = Math.abs(prev.close - prev.open);
  const currBody = Math.abs(curr.close - curr.open);
  const nextBody = Math.abs(next.close - next.open);
  const prevRange = prev.high - prev.low;
  const nextRange = next.high - next.low;
  return (
    prevBody / prevRange > 0.6 && prev.close > prev.open &&
    currBody / (curr.high - curr.low || 1) < 0.3 &&
    nextBody / nextRange > 0.6 && next.close < next.open &&
    curr.high > prev.high &&
    next.low < prev.low
  );
}

export function detectPatterns(candles: Candle[]): string[] {
  const patterns: string[] = [];
  if (candles.length < 3) return patterns;

  const latest = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const prev2 = candles[candles.length - 3];

  if (isDoji(latest)) patterns.push('doji');
  if (isHammer(latest)) patterns.push('hammer');
  if (isShootingStar(latest)) patterns.push('shooting_star');
  if (isBullishEngulfing(prev, latest)) patterns.push('bullish_engulfing');
  if (isBearishEngulfing(prev, latest)) patterns.push('bearish_engulfing');
  if (isMorningStar(prev2, prev, latest)) patterns.push('morning_star');
  if (isEveningStar(prev2, prev, latest)) patterns.push('evening_star');

  return patterns;
}
