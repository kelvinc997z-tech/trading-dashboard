'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SentimentHeatmapProps {
  signals: any[];
}

export const SentimentHeatmap = ({ signals: initialSignals }: SentimentHeatmapProps) => {
  const [localSignals, setLocalSignals] = useState(initialSignals);
  const [activeTab, setActiveTab] = useState<'all' | 'crypto' | 'commodities'>('all');

  useEffect(() => {
    setLocalSignals(initialSignals);
  }, [initialSignals]);

  // Simulated "Real-time" pulse
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => p + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!localSignals || localSignals.length === 0) return null;

  const filteredSignals = localSignals.filter(s => {
    if (activeTab === 'crypto') return ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE'].includes(s.symbol);
    if (activeTab === 'commodities') return ['XAUT', 'WTI', 'XAG'].includes(s.symbol);
    return true;
  });

  return (
    <div className="p-6 bg-white dark:bg-[#0a0a0b] border border-gray-200 dark:border-white/5 rounded-[2.5rem] mt-6 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-rose-500/5 opacity-30 pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 rounded-2xl flex items-center justify-center text-xl shadow-inner">🌡️</div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white leading-none">Global Sentiment Heatmap</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Cross-Asset Market Pulse</p>
          </div>
        </div>

        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/5">
          {['all', 'crypto', 'commodities'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
                activeTab === tab 
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        <AnimatePresence mode='popLayout'>
          {filteredSignals.map((s, i) => {
            const isBullish = s.signal === 'buy';
            const isBearish = s.signal === 'sell';
            const intensity = s.confidence / 100;
            
            return (
              <motion.div
                key={s.symbol}
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  y: pulse % 10 === i ? [0, -4, 0] : 0 
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 20,
                  delay: i * 0.03 
                }}
                className={`group relative aspect-square rounded-[2rem] flex flex-col items-center justify-center p-4 border transition-all duration-500 overflow-hidden ${
                  isBullish 
                    ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                    : isBearish
                    ? 'bg-rose-500/10 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                    : 'bg-gray-500/10 border-gray-500/20'
                }`}
              >
                {/* Heat Pulse Effect */}
                {s.confidence > 80 && (
                  <div className={`absolute inset-0 animate-pulse opacity-20 ${isBullish ? 'bg-emerald-500' : isBearish ? 'bg-rose-500' : ''}`} />
                )}

                <div className="relative z-10 flex flex-col items-center text-center">
                  <span className="text-3xl mb-2 group-hover:scale-125 transition-transform duration-500 drop-shadow-sm">
                    {s.emoji}
                  </span>
                  <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1">
                    {s.symbol}
                  </span>
                  
                  <div className={`text-[9px] font-black px-2 py-0.5 rounded-full border shadow-sm ${
                    isBullish 
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500' 
                      : isBearish
                      ? 'bg-rose-500/20 border-rose-500/30 text-rose-500'
                      : 'bg-gray-500/20 border-gray-500/30 text-gray-400'
                  }`}>
                    {Math.round(s.confidence)}%
                  </div>
                </div>

                {/* Micro Chart Indicator */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end gap-0.5 h-3 opacity-30 group-hover:opacity-100 transition-opacity">
                  {[...Array(5)].map((_, j) => (
                    <div 
                      key={j} 
                      className={`flex-1 rounded-full ${isBullish ? 'bg-emerald-500' : isBearish ? 'bg-rose-500' : 'bg-gray-500'}`}
                      style={{ height: `${30 + Math.random() * 70}%` }}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">High Bullish</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">High Bearish</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 italic">
          <svg className="w-3 h-3 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Aggregating global liquidity flow...
        </div>
      </div>
    </div>
  );
};
