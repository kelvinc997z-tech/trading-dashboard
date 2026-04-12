'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SentimentHeatmapProps {
  signals: any[];
}

export const SentimentHeatmap = ({ signals }: SentimentHeatmapProps) => {
  if (!signals || signals.length === 0) return null;

  return (
    <div className="p-6 bg-white dark:bg-[#0a0a0b] border border-gray-200 dark:border-white/5 rounded-[2.5rem] mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center text-lg">🌡️</div>
        <h3 className="text-lg font-black tracking-tight">Sentiment Heatmap</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
        {signals.map((s, i) => (
          <motion.div
            key={s.symbol}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border transition-all duration-300 ${
              s.signal === 'buy' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : s.signal === 'sell'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-gray-500/10 border-gray-500/20 text-gray-400'
            }`}
          >
            <span className="text-lg mb-1">{s.emoji}</span>
            <span className="text-[10px] font-black uppercase tracking-tighter">{s.symbol}</span>
            <div className={`text-[8px] font-bold mt-1 ${s.confidence > 70 ? 'opacity-100' : 'opacity-40'}`}>
              {Math.round(s.confidence)}%
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
