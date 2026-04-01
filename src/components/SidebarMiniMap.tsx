"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

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

  const fetchAllData = useCallback(async () => {
    const data: PairData[] = [];
    
    for (const pair of PAIRS) {
      try {
        const res = await fetch(`/api/market-data?symbol=${pair.symbol}&timeframe=5m`);
        if (!res.ok) continue;
        const json = await res.json();
        
        // Generate simple sparkline from last 20 data points
        const history = json.history || [];
        const recent = history.slice(-20);
        const sparkline = recent.map((h: any) => h.close);
        
        // Calculate change from first to last
        const firstPrice = recent[0]?.close || json.current?.close || 0;
        const lastPrice = json.current?.price ?? json.current?.close ?? 0;
        const change = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
        
        // Determine signal (simple SMA crossover)
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
  }, []);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Generate SVG sparkline
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
    
    const color = change >= 0 ? "#22c55e" : "#ef4444";
    const strokeColor = change >= 0 ? "#16a34a" : "#dc2626";
    
    return (
      <svg width={width} height={height} className="overflow-visible">
        {/* Gradient fill */}
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
          fill={`url(#gradient-${color})`}
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Last point */}
        {data.length > 0 && (
          <circle
            cx={width - padding}
            cy={height - padding - ((data[data.length - 1] - min) / range) * (height - 2 * padding)}
            r="2"
            fill={strokeColor}
          />
        )}
      </svg>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-6">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Market Overview
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Last: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      <div className="space-y-3">
        {pairsData.map((pair) => (
          <div
            key={pair.symbol}
            className="rounded-lg border bg-white dark:bg-gray-800 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => {
              // Navigate to the chart section smoothly
              const targetId = `chart-${pair.symbol.toLowerCase()}`;
              const target = document.getElementById(targetId);
              if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Highlight effect
                target.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                setTimeout(() => {
                  target.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                }, 2000);
              }
              // On mobile, close sidebar after selection
              if (window.innerWidth < 1280) {
                const sidebar = document.getElementById('mobile-sidebar');
                if (sidebar) {
                  sidebar.classList.remove('translate-x-0');
                  sidebar.classList.add('-translate-x-full');
                }
              }
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-sm">{pair.name}</h3>
                <p className="text-xs text-gray-500">{pair.symbol}</p>
              </div>
              {pair.signal && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    pair.signal === "Buy"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {pair.signal === "Buy" ? (
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 inline mr-1" />
                  )}
                  {pair.signal}
                </span>
              )}
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-lg font-bold">${pair.price.toFixed(2)}</p>
                <p
                  className={`text-xs ${
                    pair.change >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {pair.change >= 0 ? "+" : ""}{pair.change.toFixed(2)}%
                </p>
              </div>
              <Sparkline data={pair.sparkline} change={pair.change} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          Click any card to open full chart
        </p>
      </div>
    </div>
  );
}
