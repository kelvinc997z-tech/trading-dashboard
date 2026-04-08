"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { isCryptoSymbol } from "@/lib/yahoo-finance";

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PairData {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  currentPrice: number;
  change: number;
  changePercent: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  indicators: {
    rsi: number;
    sma20: number;
    sma50: number;
    sma200: number;
    macd: number;
    volume: number;
  };
  sparklineData: Array<{ time: string; price: number }>;
}

interface TechnicalAnalysisProps {
  refreshInterval?: number; // ms
}

// Calculate RSI
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return Math.round(rsi * 100) / 100;
}

// Calculate SMA
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const slice = prices.slice(-period);
  return slice.reduce((sum, p) => sum + p, 0) / period;
}

// Calculate MACD (simplified)
function calculateMACD(prices: number[]): number {
  if (prices.length < 26) return 0;
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  return ema12 - ema26;
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const slice = prices.slice(-period);
  const multiplier = 2 / (period + 1);
  let ema = slice[0];
  for (let i = 1; i < slice.length; i++) {
    ema = (slice[i] - ema) * multiplier + ema;
  }
  return ema;
}

// Enhance candles with technical indicators
function calculateIndicators(candles: CandleData[]): (CandleData & { rsi: number; sma20: number; sma50: number; sma200: number; macd: number })[] {
  const closes = candles.map(c => c.close);

  return candles.map((candle, idx) => {
    if (idx < 1) {
      return {
        ...candle,
        rsi: 50,
        sma20: candle.close,
        sma50: candle.close,
        sma200: candle.close,
        macd: 0,
      };
    }

    return {
      ...candle,
      rsi: calculateRSI(closes.slice(0, idx + 1)),
      sma20: calculateSMA(closes.slice(0, idx + 1), 20),
      sma50: calculateSMA(closes.slice(0, idx + 1), 50),
      sma200: calculateSMA(closes.slice(0, idx + 1), 200),
      macd: calculateMACD(closes.slice(0, idx + 1)),
    };
  });
}

export default function TechnicalAnalysis({
  refreshInterval = 60000 // 1 minute
}: TechnicalAnalysisProps) {
  const [pairs, setPairs] = useState<PairData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllPairData = async () => {
    try {
      // Get all symbols we need
      const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'XAUT'];
      const stockSymbols = ['AAPL', 'AMD', 'NVDA', 'MSFT', 'GOOGL', 'TSM'];
      const allSymbols = [...cryptoSymbols, ...stockSymbols];

      const results = await Promise.all(
        allSymbols.map(async (symbol) => {
          try {
            const isCrypto = isCryptoSymbol(symbol);
            // Use our Yahoo Finance proxy API
            const res = await fetch(`/api/yahoo-finance?symbol=${encodeURIComponent(symbol)}&range=30d&interval=1h`);
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            const candles: CandleData[] = data.candles?.map((c: any) => ({
              timestamp: c.timestamp,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
              volume: c.volume,
            })).filter((c: CandleData) => c.close > 0) || [];

            if (candles.length < 50) {
              console.warn(`[TechnicalAnalysis] Insufficient data for ${symbol} (got ${candles.length} candles)`);
              return null;
            }

            const candlesWithIndicators = calculateIndicators(candles);
            const latest = candlesWithIndicators[candlesWithIndicators.length - 1];
            const prev = candlesWithIndicators[candlesWithIndicators.length - 2];

            const change = latest.close - prev.close;
            const changePercent = (change / prev.close) * 100;

            // Determine trend based on momentum and recent candles
            const recent = candlesWithIndicators.slice(-5);
            const upCandles = recent.filter(c => c.close > c.open).length;
            const rsiTrend = latest.rsi > 50 ? 'bullish' : 'bearish';
            const trend: 'bullish' | 'bearish' | 'neutral' = 
              upCandles >= 3 && rsiTrend === 'bullish' ? 'bullish' : 
              upCandles <= 2 || rsiTrend === 'bearish' ? 'bearish' : 'neutral';

            return {
              symbol,
              name: symbol,
              type: isCrypto ? 'crypto' : 'stock',
              currentPrice: latest.close,
              change,
              changePercent,
              trend,
              indicators: {
                rsi: latest.rsi,
                sma20: latest.sma20,
                sma50: latest.sma50,
                sma200: latest.sma200,
                macd: latest.macd,
                volume: latest.volume,
              },
              sparklineData: candlesWithIndicators.slice(-24).map(d => ({
                time: new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                price: d.close,
              })),
            };
          } catch (e) {
            console.error(`[TechnicalAnalysis] Error fetching ${symbol}:`, e);
            return null;
          }
        })
      );

      const validResults = results.filter((r): r is PairData => r !== null);
      setPairs(validResults);
    } catch (err) {
      console.error('[TechnicalAnalysis]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPairData();
    const interval = setInterval(fetchAllPairData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatPrice = (price: number): string => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  };

  if (loading && pairs.length === 0) {
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm text-gray-500">Loading technical analysis...</span>
      </div>
    );
  }

  if (pairs.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-600 dark:text-yellow-400">
          No technical analysis data available. Yahoo Finance API might be rate-limited or unavailable.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l4-4 4 4 6-6" />
        </svg>
        <span className="text-sm font-bold text-gray-900 dark:text-white">Real-time Technical Analysis</span>
        <span className="text-xs text-gray-500">All Pairs (Yahoo Finance)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pairs.map((pair, idx) => {
          const isPositive = pair.change >= 0;
          const color = isPositive ? '#22c55e' : '#ef4444';
          
          return (
            <motion.div
              key={pair.symbol}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white">{pair.symbol}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${pair.type === 'crypto' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                      {pair.type === 'crypto' ? 'Crypto' : 'Stock'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">{pair.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    ${formatPrice(pair.currentPrice)}
                  </div>
                  <div className={`text-xs font-mono ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isPositive ? '+' : ''}{pair.change.toFixed(2)} ({isPositive ? '+' : ''}{pair.changePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>

              {/* Sparkline */}
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pair.sparklineData}>
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke={color} 
                      strokeWidth={2} 
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Technical indicators summary */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                  <div className="text-gray-500">RSI</div>
                  <div className={`font-semibold ${pair.indicators.rsi > 70 ? 'text-red-600' : pair.indicators.rsi < 30 ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}`}>
                    {pair.indicators.rsi.toFixed(1)}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                  <div className="text-gray-500">Trend</div>
                  <div className={`font-semibold ${pair.trend === 'bullish' ? 'text-green-600' : pair.trend === 'bearish' ? 'text-red-600' : 'text-gray-600'}`}>
                    {pair.trend.toUpperCase()}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                  <div className="text-gray-500">SMA20</div>
                  <div className="font-mono text-gray-700 dark:text-gray-300">{formatPrice(pair.indicators.sma20)}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                  <div className="text-gray-500">SMA50</div>
                  <div className="font-mono text-gray-700 dark:text-gray-300">{formatPrice(pair.indicators.sma50)}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}