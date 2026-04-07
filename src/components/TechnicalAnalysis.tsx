"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface PairData {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  currentPrice: number;
  change: number;
  changePercent: number;
  sparklineData: Array<{ time: string; price: number }>;
}

interface TechnicalAnalysisProps {
  refreshInterval?: number; // ms
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
            const res = await fetch(`/api/market-data?symbol=${symbol}&timeframe=1h&limit=24`);
            if (!res.ok) return null;
            const data = await res.json();

            const current = data.current?.price ?? data.current?.close ?? null;
            if (current === null) return null;

            const history = data.history || [];
            let change = 0;
            let changePercent = 0;
            if (history.length >= 2) {
              const prev = history[0]?.close ?? history[history.length - 2]?.close;
              if (prev) {
                change = current - prev;
                changePercent = (change / prev) * 100;
              }
            }

            // Create sparkline data (last 24 points)
            const sparklineData = history.slice(-24).map((h: any, idx: number) => ({
              time: new Date(h.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              price: h.close,
            }));

            return {
              symbol,
              name: symbol, // Could be improved with proper names
              type: cryptoSymbols.includes(symbol) ? 'crypto' : 'stock',
              currentPrice: current,
              change,
              changePercent,
              sparklineData,
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
        <span className="text-xs text-gray-500">All Pairs (24h)</span>
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

              {/* Simple RSI indication (placeholder) */}
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-gray-500">Trend</span>
                <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? 'Bullish' : 'Bearish'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
