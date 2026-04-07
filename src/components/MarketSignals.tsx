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
}

interface MarketSignalsProps {
  limit?: number;
  refreshInterval?: number; // ms
}

export default function MarketSignals({
  limit = 5,
  refreshInterval = 60000 // 1 minute
}: MarketSignalsProps) {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = async () => {
    try {
      const res = await fetch('/api/market-outlook?format=list');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();

      // Filter to top signals by confidence (descending), exclude neutral
      const filtered = data
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

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "buy": return "bg-green-500";
      case "sell": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getSignalText = (signal: string) => {
    switch (signal) {
      case "buy": return "BUY";
      case "sell": return "SELL";
      default: return "NEUTRAL";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-bold text-gray-900 dark:text-white">📊 Market Signals</span>
        <span className="text-xs text-gray-500">(Top by confidence)</span>
      </div>

      <div className="space-y-3">
        {signals.map((signal, idx) => (
          <motion.div
            key={signal.symbol}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">{signal.emoji}</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-white">{signal.symbol}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${getSignalColor(signal.signal)}`}>
                    {getSignalText(signal.signal)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">{signal.name}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-500">Confidence</div>
              <div className="font-mono font-semibold text-gray-900 dark:text-white">
                {Math.round(signal.confidence)}%
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <div className="text-xs text-gray-500">Entry/TP/SL</div>
              <div className="font-mono text-sm text-gray-900 dark:text-white">
                {signal.entry.toFixed(2)} / {signal.tp.toFixed(2)} / {signal.sl.toFixed(2)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {signals.length === 0 && !loading && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No active signals at the moment
        </div>
      )}
    </motion.div>
  );
}
