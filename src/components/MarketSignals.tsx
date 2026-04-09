"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface MarketSignal {
  symbol: string;
  name: string;
  emoji: string;
  signal: "buy" | "sell" | "neutral";
  entry: number;
  tp: number;
  sl: number;
  confidence: number;
  reasoning: string;
  timeframe?: string;
  generatedAt?: string;
}

interface MarketSignalsProps {
  limit?: number;
  refreshInterval?: number; // ms
}

export default function MarketSignals({
  limit = 5,
  refreshInterval = 4 * 60 * 60 * 1000 // 4 hours
}: MarketSignalsProps) {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = async () => {
    try {
      const res = await fetch('/api/market-signal/latest');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();

      // Filter to top signals by confidence (descending), exclude neutral
      const filtered = data.signals
        .filter((s: MarketSignal) => s.signal !== 'neutral')
        .sort((a: MarketSignal, b: MarketSignal) => b.confidence - a.confidence)
        .slice(0, limit);

      setSignals(filtered);
      setError(null);
    } catch (err: any) {
      console.error('[MarketSignals]', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, limit]);

  // Helper: calculate risk:reward
  const calculateRR = (entry: number, tp: number, sl: number) => {
    const reward = Math.abs(tp - entry);
    const risk = Math.abs(entry - sl);
    if (risk === 0) return "0:1";
    return `${(reward / risk).toFixed(1)}:1`;
  };

  // Helper: get gradient based on signal
  const getGradient = (signal?: string) => {
    switch (signal) {
      case 'buy': return 'from-emerald-500/10 to-cyan-500/10';
      case 'sell': return 'from-rose-500/10 to-orange-500/10';
      default: return 'from-gray-500/10 to-slate-500/10';
    }
  };

  const getBadgeClasses = (signal: string) => {
    switch (signal) {
      case 'buy': return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
      case 'sell': return 'bg-rose-500/20 border-rose-500/30 text-rose-400';
      default: return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-emerald-600 dark:text-emerald-400';
    if (confidence >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  if (loading && signals.length === 0) {
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm text-gray-500">Loading market signals...</span>
      </div>
    );
  }

  if (error && signals.length === 0) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
        <p className="text-xs text-red-600 dark:text-red-400">Failed to load market signals</p>
      </div>
    );
  }

  const firstSignal = signals[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-r ${getGradient(firstSignal?.signal)} border ${firstSignal?.signal ? `border-${firstSignal.signal === 'buy' ? 'emerald' : firstSignal.signal === 'sell' ? 'rose' : 'gray'}-500/20` : 'border-gray-500/20'} rounded-2xl p-4`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 dark:text-white">📊 Market Signals</span>
          <span className="text-xs text-gray-500">(Auto-generated with SL/TP)</span>
        </div>
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          AI Analysis
        </span>
      </div>

      <div className="space-y-3">
        {signals.map((signal, idx) => {
          const rr = calculateRR(signal.entry, signal.tp, signal.sl);
          const confidenceColor = getConfidenceColor(signal.confidence);

          return (
            <motion.div
              key={signal.symbol}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Symbol and details */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-2xl flex-shrink-0">{signal.emoji}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-gray-900 dark:text-white">{signal.symbol}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getBadgeClasses(signal.signal)}`}>
                        {signal.signal.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">{signal.name}</div>
                    {signal.reasoning && (
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {signal.reasoning}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Metrics */}
                <div className="flex items-center gap-4 text-right flex-shrink-0">
                  <div>
                    <div className="text-xs text-gray-500">Confidence</div>
                    <div className={`font-mono font-semibold ${confidenceColor}`}>
                      {Math.round(signal.confidence)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Entry</div>
                    <div className="font-mono text-gray-900 dark:text-white">{signal.entry.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-green-600 dark:text-green-400">TP</div>
                    <div className="font-mono text-green-600 dark:text-green-400">{signal.tp.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-rose-600 dark:text-rose-400">SL</div>
                    <div className="font-mono text-rose-600 dark:text-rose-400">{signal.sl.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">R:R</div>
                    <div className={`font-mono ${confidenceColor}`}>{rr}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {signals.length === 0 && !loading && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No active signals at the moment
        </div>
      )}
    </motion.div>
  );
}