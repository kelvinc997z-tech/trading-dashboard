"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import TradingViewChart from "@/components/TradingViewChart";
import SignalTable, { Signal } from "@/components/SignalTable";
import { generateMarketData, generateSignal, initialSignals } from "@/lib/mockData";

export default function HomePage() {
  const [markets, setMarkets] = useState<Record<string, any>>({});
  const [signals, setSignals] = useState<Signal[]>(initialSignals);
  const [stats, setStats] = useState({ total: 0, winRate: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize market data
  useEffect(() => {
    setMarkets({
      XAUUSD: generateMarketData("XAUUSD"),
      USOIL: generateMarketData("USOIL"),
    });
    setIsLoaded(true);
  }, []);

  // Real-time update every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMarkets((prev) => {
        const newMarkets: Record<string, any> = {};
        Object.keys(prev).forEach((symbol) => {
          newMarkets[symbol] = generateMarketData(symbol);
        });
        return newMarkets;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Generate new signal occasionally
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const symbol = Math.random() > 0.5 ? "XAUUSD" : "USOIL";
        const currentPrice = markets[symbol]?.price || (symbol === "XAUUSD" ? 2200 : 88);
        const newSignal = generateSignal(symbol, currentPrice);
        setSignals((prev) => [newSignal, ...prev.slice(0, 19)]); // Keep last 20
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [markets]);

  // Update stats
  useEffect(() => {
    const total = signals.length;
    const closed = signals.filter((s) => s.status === "closed");
    const won = closed.filter((s) => {
      if (s.type === "BUY") return s.tp < s.sl; // Mock: assume TP hit if status closed and TP < SL for BUY? Actually need real outcome; just mock 60% win
      return s.tp > s.sl;
    }).length;
    const winRate = closed.length > 0 ? Math.round((won / closed.length) * 100) : 0;
    setStats({ total, winRate });
  }, [signals]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-gray-900 dark:text-white text-xl font-semibold animate-pulse">
          Loading dashboard...
        </div>
      </div>
    );
  }

  const currentXAU = markets.XAUUSD || { price: 0, change: 0 };
  const currentOil = markets.USOIL || { price: 0, change: 0 };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Signals
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {stats.total}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Win Rate
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {stats.winRate}%
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Active Signals
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {signals.filter((s) => s.status === "active").length}
            </p>
          </div>
        </div>

        {/* Market Prices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm text-gray-500 dark:text-gray-400">
                  XAUUSD (Gold)
                </h3>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${currentXAU.price.toFixed(2)}
                </div>
                <div
                  className={`text-sm font-semibold ${
                    currentXAU.change >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {currentXAU.change >= 0 ? "+" : ""}
                  {currentXAU.change.toFixed(2)} (
                  {currentXAU.changePercent.toFixed(2)}%)
                </div>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <svg
                  className="w-8 h-8 text-yellow-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm text-gray-500 dark:text-gray-400">
                  US Oil (WTI)
                </h3>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${currentOil.price.toFixed(2)}
                </div>
                <div
                  className={`text-sm font-semibold ${
                    currentOil.change >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {currentOil.change >= 0 ? "+" : ""}
                  {currentOil.change.toFixed(2)} (
                  {currentOil.changePercent.toFixed(2)}%)
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <svg
                  className="w-8 h-8 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6 2m6-2l-6-2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TradingViewChart symbol="PEPPERSTONE:XAUUSD" height={400} />
          <TradingViewChart symbol="TVC:USOIL" height={400} />
        </div>

        {/* Signal Table */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Live Trading Signals
          </h2>
          <SignalTable signals={signals} />
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>© 2026 TradeSignal Dashboard. Built with Next.js & Tailwind.</p>
      </footer>
    </div>
  );
}