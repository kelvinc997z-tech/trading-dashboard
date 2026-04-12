"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { TechnicalGauge } from "@/components/TechnicalGauge";
import { SentimentHeatmap } from "@/components/SentimentHeatmap";

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
  limit = 8,
  refreshInterval = 4 * 60 * 60 * 1000 // 4 hours
}: MarketSignalsProps) {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  const fetchSignals = async () => {
    try {
      const res = await fetch('/api/market-signal/latest');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();

      // Priority symbols for user
      const prioritySymbols = ["BTC", "WTI", "XAUT"];

      // Filter and sort
      const sorted = data.signals.sort((a: MarketSignal, b: MarketSignal) => {
        const aPriority = prioritySymbols.includes(a.symbol);
        const bPriority = prioritySymbols.includes(b.symbol);
        
        if (aPriority && !bPriority) return -1;
        if (!aPriority && bPriority) return 1;
        
        if (a.signal !== 'neutral' && b.signal === 'neutral') return -1;
        if (a.signal === 'neutral' && b.signal !== 'neutral') return 1;
        
        return b.confidence - a.confidence;
      });

      setSignals(sorted.slice(0, limit));
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
      case 'buy': return 'from-emerald-500/10 via-emerald-500/5 to-transparent';
      case 'sell': return 'from-rose-500/10 via-rose-500/5 to-transparent';
      case 'neutral': return 'from-gray-500/10 via-gray-500/5 to-transparent';
      default: return 'from-gray-500/5 to-transparent';
    }
  };

  const getBadgeClasses = (signal: string) => {
    switch (signal) {
      case 'buy': return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
      case 'sell': return 'bg-rose-500/20 border-rose-500/30 text-rose-400';
      case 'neutral': return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
      default: return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-emerald-500';
    if (confidence >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  if (loading && signals.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="relative overflow-hidden bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-[2.5rem] p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-200 dark:bg-white/10 rounded-2xl" />
              <div className="space-y-2">
                <div className="w-24 h-6 bg-gray-200 dark:bg-white/10 rounded-lg" />
                <div className="w-16 h-3 bg-gray-200 dark:bg-white/10 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && signals.length === 0) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
        <p className="text-sm font-bold text-rose-400 text-center uppercase tracking-widest">Network Synchronizing...</p>
      </div>
    );
  }

  const firstSignal = signals[0];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden bg-white dark:bg-[#0a0a0b] border border-gray-200 dark:border-white/5 rounded-[2.5rem] p-6 shadow-2xl shadow-black/20`}
    >
      {/* Decorative Gradient Glow */}
      <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full bg-gradient-to-br ${getGradient(firstSignal?.signal)} opacity-50`} />

      <div className="relative flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
            📊
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1">Market Outlook</h3>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live AI Processing</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-blue-500/20">
            PRO Access
          </div>
          {signals[0]?.generatedAt && (
            <div className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-tighter">
              Last Pulse: {new Date(signals[0].generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      <div className="relative space-y-4">
        {signals.map((signal, idx) => {
          const rr = calculateRR(signal.entry, signal.tp, signal.sl);
          const confidenceColor = getConfidenceColor(signal.confidence);
          const isExpanded = expandedSymbol === signal.symbol;

          return (
            <motion.div
              key={signal.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setExpandedSymbol(isExpanded ? null : signal.symbol)}
              className={`group relative cursor-pointer overflow-hidden p-5 bg-gray-50 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.07] border border-transparent hover:border-gray-200 dark:hover:border-white/10 rounded-3xl transition-all duration-500 ${isExpanded ? 'ring-2 ring-primary/30 shadow-2xl scale-[1.02] z-10' : 'hover:shadow-xl'}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                {/* Asset Identity */}
                <div className="flex items-center gap-4 min-w-[140px]">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center text-2xl md:text-3xl shadow-sm group-hover:scale-110 transition-transform duration-500 border border-gray-100 dark:border-white/5">
                    {signal.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">{signal.symbol}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] md:text-[10px] font-black tracking-widest border uppercase shadow-sm ${getBadgeClasses(signal.signal)}`}>
                        {signal.signal === 'neutral' ? 'NOT ACTIVE' : signal.signal}
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{signal.name}</div>
                  </div>
                </div>

                {/* Data Points Grid for Mobile */}
                <div className="grid grid-cols-3 md:flex items-center justify-between md:justify-end gap-2 md:gap-8 flex-1">
                  <div className="text-left md:text-right">
                    <div className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Confidence</div>
                    <div className={`text-sm md:text-lg font-black ${confidenceColor} tabular-nums leading-none`}>
                      {Math.round(signal.confidence)}%
                    </div>
                  </div>
                  <div className="text-center md:text-right">
                    <div className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Target</div>
                    <div className="text-sm md:text-lg font-black text-emerald-500 tabular-nums leading-none">
                      {signal.tp > 1000 ? signal.tp.toLocaleString() : signal.tp.toFixed(signal.entry < 1 ? 4 : 2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Safety</div>
                    <div className="text-sm md:text-lg font-black text-rose-500 tabular-nums leading-none">
                      {signal.sl > 1000 ? signal.sl.toLocaleString() : signal.sl.toFixed(signal.entry < 1 ? 4 : 2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "circOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 mt-6 border-t border-gray-200 dark:border-white/5 grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-2 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Strategic Rationale</h4>
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed italic">
                          "{signal.reasoning}"
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <TechnicalGauge value={signal.confidence} label="Trend Strength" />
                      </div>

                      <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Risk:Reward</div>
                            <div className={`text-xl font-black ${confidenceColor}`}>{rr}</div>
                          </div>
                          <div className="p-2 bg-white dark:bg-white/10 rounded-lg text-xs font-bold">
                            {signal.timeframe || '4H'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                            <span>Market Risk</span>
                            <span className={confidenceColor}>{signal.confidence > 60 ? 'Low' : 'High'}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${signal.confidence}%` }}
                              className={`h-full ${signal.confidence > 70 ? 'bg-emerald-500' : signal.confidence > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {signals.length === 0 && !loading && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center text-4xl mb-6 shadow-inner">
            🌙
          </div>
          <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Market Resting</h4>
          <p className="text-sm font-medium text-gray-500 max-w-[280px] leading-relaxed">
            No high-precision signals detected. Next scanning cycle in progress.
          </p>
        </div>
      )}

      {/* Background Polish */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Heatmap Section */}
      <SentimentHeatmap signals={signals} />
    </motion.div>
  );
}
