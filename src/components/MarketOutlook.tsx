"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface MarketData {
  symbol: string;
  current: {
    close: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
  };
  history: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>;
}

const PAIRS = [
  { symbol: "XAUT/USD", name: "Gold" },
  { symbol: "BTC/USD", name: "Bitcoin" },
  { symbol: "ETH/USD", name: "Ethereum" },
  { symbol: "SOL/USD", name: "Solana" },
  { symbol: "XRP/USD", name: "Ripple" },
];

export default function MarketOutlook() {
  const { theme } = useTheme();
  const [markets, setMarkets] = useState<Record<string, MarketData>>({});

  useEffect(() => {
    async function fetchAll() {
      const data: Record<string, MarketData> = {};
      await Promise.all(
        PAIRS.map(async (pair) => {
          try {
            const res = await fetch(`/api/market-data?symbol=${encodeURIComponent(pair.symbol)}`);
            if (res.ok) {
              const json = await res.json();
              data[pair.symbol] = json;
            }
          } catch (err) {
            console.error(`Failed to fetch ${pair.symbol}`, err);
          }
        })
      );
      setMarkets(data);
    }
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const getChangeClass = (change: number) => {
    return change >= 0 ? "text-green-500" : "text-red-500";
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Market Outlook</h2>
        <Activity className="w-5 h-5 text-gray-400" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {PAIRS.map((pair) => {
          const market = markets[pair.symbol];
          const price = market?.current?.close ?? 0;
          const change = market?.current?.change ?? 0;
          const changePercent = market?.current?.changePercent ?? 0;
          const changeClass = getChangeClass(change);
          const Icon = change >= 0 ? TrendingUp : TrendingDown;

          return (
            <div key={pair.symbol} className="rounded-lg border p-4 bg-white dark:bg-gray-800">
              <div className="text-sm text-gray-500 mb-1">{pair.name}</div>
              <div className="text-xl font-bold mb-1">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className={`flex items-center gap-1 text-sm ${changeClass}`}>
                <Icon className="w-4 h-4" />
                <span>{change >= 0 ? "+" : ""}{change.toFixed(2)} ({changePercent.toFixed(2)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
