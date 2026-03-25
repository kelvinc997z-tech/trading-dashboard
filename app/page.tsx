"use client";

import Header from "@/components/Header";
import TradingViewChart from "@/components/TradingViewChart";
import SignalTable, { Signal } from "@/components/SignalTable";
import NewsSection from "@/components/NewsSection";
import { TrendingUp } from "lucide-react";

export default function HomePage() {
  // Mock prices - stable for demo
  const currentXAU = { price: 4570.50, change: 12.30, changePercent: 0.27 };
  const currentOil = { price: 88.45, change: -0.75, changePercent: -0.84 };

  // Demo signals
  const demoSignals: Signal[] = [
    {
      id: "1",
      pair: "XAUUSD",
      type: "BUY",
      entry: 4570,
      tp: 4620,
      sl: 4540,
      time: new Date().toLocaleTimeString(),
      status: "active",
    },
    {
      id: "2",
      pair: "USOIL",
      type: "SELL",
      entry: 88.45,
      tp: 86.50,
      sl: 90.00,
      time: new Date().toLocaleTimeString(),
      status: "active",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breaking News Ticker & News Tab */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-red-500" />
            Market News
          </h2>
          <NewsSection />
        </section>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Signals
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {demoSignals.length}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Win Rate
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              60%
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Active Signals
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {demoSignals.filter((s) => s.status === "active").length}
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
                  {currentXAU.change.toFixed(2)} ({currentXAU.changePercent.toFixed(2)}%)
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Demo price (static)
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
                  {currentOil.change.toFixed(2)} ({currentOil.changePercent.toFixed(2)}%)
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Demo price (static)
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
          <TradingViewChart symbol="FOREXCOM:XAUUSD" height={400} />
          <TradingViewChart symbol="FOREXCOM:USOIL" height={400} />
        </div>

        {/* Signal Table */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Live Trading Signals
          </h2>
          <SignalTable signals={demoSignals} />
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>© 2026 TradeSignal Dashboard. Built with Next.js & Tailwind.</p>
        <p className="mt-1">Charts powered by TradingView | Prices static demo</p>
      </footer>
    </div>
  );
}