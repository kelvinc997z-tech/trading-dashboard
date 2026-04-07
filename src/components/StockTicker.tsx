"use client";

import { useEffect, useState } from "react";

interface StockPriceData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: number;
}

interface StockTickerProps {
  symbols?: Array<{ symbol: string; name: string }>;
  refreshInterval?: number; // ms
}

export default function StockTicker({
  symbols = [
    { symbol: "AAPL", name: "Apple" },
    { symbol: "AMD", name: "AMD" },
    { symbol: "NVDA", name: "NVIDIA" },
    { symbol: "MSFT", name: "Microsoft" },
    { symbol: "GOOGL", name: "Alphabet" },
    { symbol: "TSM", name: "TSMC" },
  ],
  refreshInterval = 30000 // 30 seconds
}: StockTickerProps) {
  const [prices, setPrices] = useState<StockPriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      const results = await Promise.all(
        symbols.map(async ({ symbol, name }) => {
          try {
            const res = await fetch(`/api/market-data?symbol=${symbol}&timeframe=1h`);
            if (!res.ok) return null;
            const data = await res.json();

            const current = data.current?.price ?? data.current?.close ?? null;
            if (current === null) return null;

            // Get previous close from history if available
            const history = data.history || [];
            let change = 0;
            let changePercent = 0;
            if (history.length >= 2) {
              const prev = history[history.length - 2]?.close || history[0]?.close;
              if (prev) {
                change = current - prev;
                changePercent = (change / prev) * 100;
              }
            }

            return {
              symbol: symbol.toUpperCase(),
              name,
              price: current,
              change,
              changePercent,
              lastUpdated: Date.now(),
            };
          } catch (e) {
            console.error(`[StockTicker] Error fetching ${symbol}:`, e);
            return null;
          }
        })
      );

      const validResults = results.filter((r): r is StockPriceData => r !== null);
      setPrices(validResults);
      setError(null);
    } catch (err: any) {
      console.error('[StockTicker]', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, JSON.stringify(symbols)]);

  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (price >= 1) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    } else {
      return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    }
  };

  const formatChange = (change: number, percent: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
  };

  if (loading && prices.length === 0) {
    return (
      <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm text-gray-500">Loading stock prices...</span>
      </div>
    );
  }

  if (error && prices.length === 0) {
    return (
      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
        <p className="text-xs text-red-600 dark:text-red-400">Failed to load stock prices</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          Live US Stocks
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          (Yahoo Finance)
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {prices.map(({ symbol, name, price, change, changePercent }) => {
          const isPositive = change >= 0;
          const colorClass = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
          return (
            <div key={symbol} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="text-right">
                <div className="text-xs font-bold text-gray-900 dark:text-white">{symbol}</div>
                <div className="text-[10px] text-gray-500">{name}</div>
              </div>
              <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="text-right">
                <div className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                  ${formatPrice(price)}
                </div>
                <div className={`text-xs font-mono ${colorClass}`}>
                  {formatChange(change, changePercent)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
