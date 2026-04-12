'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
}

export const MarketTicker = () => {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Check if user has closed it before in this session
    const isHidden = localStorage.getItem('ticker_hidden') === 'true';
    if (isHidden) {
      setVisible(false);
    }

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
          tickerData = [
            { symbol: 'BTC', price: 69420.50, change: 1.25 },
            { symbol: 'ETH', price: 3450.12, change: -0.42 },
            { symbol: 'SOL', price: 145.67, change: 3.12 },
            { symbol: 'XAUT', price: 2340.50, change: 0.08 },
            { symbol: 'WTI', price: 85.20, change: -1.15 },
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

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem('ticker_hidden', 'true');
    // Dispatch a custom event to notify other components to adjust padding if needed
    window.dispatchEvent(new Event('ticker_closed'));
  };

  if (!visible || items.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 32, opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="w-full bg-emerald-600 dark:bg-emerald-950 text-white overflow-hidden flex items-center fixed top-0 left-0 right-0 z-[9999] border-b border-emerald-500/30 shadow-md"
      >
        <div className="flex w-full overflow-hidden items-center relative h-full pr-10">
          <motion.div
            className="flex whitespace-nowrap gap-12 px-4 items-center"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ 
              duration: 35, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            {[...items, ...items, ...items, ...items].map((item, i) => (
              <div key={`${item.symbol}-${i}`} className="flex items-center gap-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest py-1">
                <span className="text-emerald-100/70">{item.symbol}</span>
                <span className="font-mono">{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className={`flex items-center gap-0.5 ${item.change >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {Math.abs(item.change).toFixed(2)}%
                </span>
              </div>
            ))}
          </motion.div>
        </div>
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute right-0 top-0 bottom-0 px-3 bg-emerald-600 dark:bg-emerald-950 hover:bg-emerald-500 dark:hover:bg-emerald-900 border-l border-emerald-500/30 flex items-center justify-center transition-colors z-20 group"
          title="Close ticker"
        >
          <X className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
