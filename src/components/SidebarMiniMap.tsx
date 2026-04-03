"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, TrendingDown, Activity, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface PairData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  signal: "Buy" | "Sell" | null;
  sparkline: number[];
}

const PAIRS = [
  { symbol: "XAUT", name: "Gold" },
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "XRP", name: "Ripple" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "AMD", name: "AMD" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
];

export default function SidebarMiniMap() {
  const [pairsData, setPairsData] = useState<PairData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAllData = useCallback(async () => {
    setIsRefreshing(true);
    const data: PairData[] = [];
    
    for (const pair of PAIRS) {
      try {
        const res = await fetch(`/api/market-data?symbol=${pair.symbol}&timeframe=5m`);
        if (!res.ok) continue;
        const json = await res.json();
        
        const history = json.history || [];
        const recent = history.slice(-20);
        const sparkline = recent.map((h: any) => h.close);
        
        const firstPrice = recent[0]?.close || json.current?.close || 0;
        const lastPrice = json.current?.price ?? json.current?.close ?? 0;
        const change = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
        
        const sma5 = sparkline.slice(-5).reduce((a: number, b: number) => a + b, 0) / 5;
        const sma10 = sparkline.slice(-10).reduce((a: number, b: number) => a + b, 0) / 10;
        const signal = sma5 > sma10 ? "Buy" : sma5 < sma10 ? "Sell" : null;
        
        data.push({
          symbol: pair.symbol,
          name: pair.name,
          price: lastPrice,
          change,
          signal,
          sparkline,
        });
      } catch (err) {
        console.error(`Failed to fetch ${pair.symbol}:`, err);
      }
    }
    
    setPairsData(data);
    setLastUpdate(new Date());
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const Sparkline = ({ data, change }: { data: number[]; change: number }) => {
    if (data.length === 0) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 80;
    const height = 40;
    const padding = 2;
    
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((value - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(" ");
    
    const color = change >= 0 ? "#10b981" : "#ef4444";
    const strokeColor = change >= 0 ? "#059669" : "#dc2626";
    const glowColor = change >= 0 ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)";
    
    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
          fill={`url(#gradient-${color})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 3px ${glowColor})` }}
        />
        {data.length > 0 && (
          <circle
            cx={width - padding}
            cy={height - padding - ((data[data.length - 1] - min) / range) * (height - 2 * padding)}
            r="2.5"
            fill={strokeColor}
            style={{ filter: `drop-shadow(0 0 2px ${glowColor})` }}
          />
        )}
      </svg>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Markets</h2>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`} />
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {isRefreshing ? 'Updating...' : 'Live'}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Last update</p>
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
              {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-xl p-3">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Top Gainer</p>
            <p className="font-bold text-sm text-emerald-500">
              {pairsData
                .filter(p => p.change > 0)
                .sort((a, b) => b.change - a.change)[0]?.symbol || '-'}
            </p>
          </div>
          <div className="glass-card rounded-xl p-3">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Market Mood</p>
            <p className="font-bold text-sm flex items-center gap-1">
              {pairsData.filter(p => p.change > 0).length > pairsData.filter(p => p.change < 0).length ? (
                <>
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500">Bullish</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 text-red-500" />
                  <span className="text-red-500">Bearish</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Market list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {pairsData.map((pair, idx) => {
          const isPositive = pair.change >= 0;
          const signalColor = pair.signal === "Buy" ? "emerald" : pair.signal === "Sell" ? "red" : "gray";
          
          return (
            <motion.div
              key={pair.symbol}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="glass-card rounded-xl p-4 cursor-pointer hover:shadow-soft-lg transition-all duration-300 group sidebar-item active"
              onClick={() => {
                const targetId = `chart-${pair.symbol.toLowerCase()}`;
                const target = document.getElementById(targetId);
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  target.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2', 'dark:ring-offset-gray-900');
                  setTimeout(() => {
                    target.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-2', 'dark:ring-offset-gray-900');
                  }, 2000);
                }
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                      {pair.symbol}
                    </h3>
                    {pair.signal && (
                      <motion.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          signalColor === "emerald"
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : signalColor === "red"
                            ? "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                            : "bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {signalColor === "emerald" ? (
                          <TrendingUp className="w-2.5 h-2.5" />
                        ) : signalColor === "red" ? (
                          <TrendingDown className="w-2.5 h-2.5" />
                        ) : (
                          <Zap className="w-2.5 h-2.5" />
                        )}
                        {pair.signal}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{pair.name}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    ${pair.price.toFixed(2)}
                  </p>
                  <p className={`text-xs font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{pair.change.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="relative">
                <Sparkline data={pair.sparkline} change={pair.change} />
                {/* Pulse indicator for recent signal */}
                {pair.signal && (
                  <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${signalColor === "emerald" ? 'bg-emerald-500' : signalColor === "red" ? 'bg-red-500' : 'bg-gray-500'} ${isPositive ? 'pulse-ring-fast' : ''}`} />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
        <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
          Click to view full chart • Auto-refreshes every 30s
        </p>
      </div>
    </div>
  );
}
