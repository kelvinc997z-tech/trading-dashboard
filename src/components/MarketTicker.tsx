'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
}

export const MarketTicker = () => {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/market-signal/latest');
        const data = await res.json();
        let tickerData: TickerItem[] = [];
        
        if (data.signals && Array.isArray(data.signals)) {
          tickerData = data.signals.map((s: any) => ({
            symbol: s.symbol,
            price: s.currentPrice || s.entry || 0,
            change: ((Math.random() * 2) - 0.8) // Simulated for now
          }));
        }

        if (tickerData.length === 0) {
          // Fallback static data
          tickerData = [
            { symbol: 'BTC', price: 69420.50, change: 1.25 },
            { symbol: 'ETH', price: 3450.12, change: -0.42 },
            { symbol: 'SOL', price: 145.67, change: 3.12 },
            { symbol: 'XAUT', price: 2340.50, change: 0.08 },
            { symbol: 'WTI', price: 85.20, change: -1.15 },
            { symbol: 'XRP', price: 0.62, change: 0.45 },
            { symbol: 'DOGE', price: 0.16, change: -2.31 },
          ];
        }
        setItems(tickerData);
      } catch (e) {
        console.error('Ticker fetch error', e);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!visible || items.length === 0) return null;

  return (
    <div className="w-full bg-emerald-600 dark:bg-emerald-950 text-white overflow-hidden h-8 flex items-center fixed top-0 left-0 right-0 z-[9999] border-b border-emerald-500/30 shadow-md">
      <div className="flex w-full overflow-hidden items-center relative h-full">
        {/* Infinite Scroll Wrapper */}
        <motion.div
          className="flex whitespace-nowrap gap-12 px-4 items-center"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            duration: 35, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          {/* Repeat items many times to ensure no gaps */}
          {[...items, ...items, ...items, ...items].map((item, i) => (
            <div key={`${item.symbol}-${i}`} className="flex items-center gap-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest py-1">
              <span className="text-emerald-100/70">{item.symbol}</span>
              <span className="font-mono">
                {item.price.toLocaleString(undefined, { 
                  minimumFractionDigits: item.price > 10 ? 2 : 4,
                  maximumFractionDigits: item.price > 10 ? 2 : 4 
                })}
              </span>
              <span className={`flex items-center gap-0.5 ${item.change >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {item.change >= 0 ? (
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"/></svg>
                ) : (
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                )}
                {Math.abs(item.change).toFixed(2)}%
              </span>
            </div>
          ))}
        </motion.div>
      </div>
      
      {/* Label/Status */}
      <div className="absolute right-0 top-0 bottom-0 px-3 bg-emerald-600 dark:bg-emerald-950 flex items-center border-l border-emerald-500/30 z-10 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.3)]">
        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse mr-2" />
        <span className="text-[9px] font-bold uppercase tracking-tighter opacity-80">Live</span>
      </div>
    </div>
  );
};
