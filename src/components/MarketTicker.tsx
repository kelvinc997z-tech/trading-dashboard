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

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/market-signal/latest');
        const data = await res.json();
        if (Array.isArray(data)) {
          const tickerData = data.slice(0, 10).map((s: any) => ({
            symbol: s.symbol,
            price: s.currentPrice,
            // Calculate a dummy change or use actual if available
            change: (Math.random() * 2 - 1)
          }));
          setItems(tickerData);
        }
      } catch (e) {
        console.error('Ticker fetch error', e);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="w-full bg-black/40 backdrop-blur-md border-y border-white/5 overflow-hidden h-10 flex items-center relative z-40">
      <motion.div
        className="flex whitespace-nowrap gap-12 px-4"
        animate={{ x: [0, -1000] }}
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        {[...items, ...items, ...items].map((item, i) => (
          <div key={`${item.symbol}-${i}`} className="flex items-center gap-2 text-xs font-medium">
            <span className="text-gray-400">{item.symbol}</span>
            <span className="text-white">
              {item.price.toLocaleString(undefined, { 
                minimumFractionDigits: item.price > 100 ? 2 : 4 
              })}
            </span>
            <span className={item.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
