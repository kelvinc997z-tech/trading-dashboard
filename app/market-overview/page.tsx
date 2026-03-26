"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Activity } from "lucide-react";

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

const SYMBOL_LABELS: Record<string, string> = {
  "XAUUSD": "Gold (XAU/USD)",
  "USOIL": "US Oil (WTI)",
  "BTC/USD": "Bitcoin",
  "ETH/USD": "Ethereum",
  "SOL/USD": "Solana",
  "XRP/USD": "Ripple",
  "KAS/USDT": "Kaspa",
};

export default function MarketOverviewPage() {
  const router = useRouter();
  const [markets, setMarkets] = useState<Record<string, MarketData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = async () => {
    try {
      const res = await fetch("/api/market-data");
      if (!res.ok) throw new Error("Failed to fetch market data");
      const data = await res.json();
      setMarkets(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    // Poll every 60s (matches server cache)
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check auth
  useEffect(() => {
    fetch("/api/me")
      .then(res => res.json())
      .then(data => {
        if (!data.user) router.replace("/login");
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-gray-900 dark:text-white text-xl font-semibold animate-pulse">Loading market data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-red-600 dark:text-red-400 text-xl font-semibold">Error: {error}</div>
      </div>
    );
  }

  const marketEntries = Object.entries(markets).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Market Overview</h1>
          <button
            onClick={fetchMarketData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Refresh Now
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {marketEntries.map(([symbol, data]) => {
            const isPositive = data.change >= 0;
            const format = (sym: string) => {
              if (sym === "KAS/USDT" || sym === "XRP/USD") return (val: number) => val.toFixed(4);
              return (val: number) => val.toFixed(2);
            };
            const fmt = format(symbol);
            return (
              <div key={symbol} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{SYMBOL_LABELS[symbol] || symbol}</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">${fmt(data.price)}</div>
                <div className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{fmt(data.change)} ({data.changePercent.toFixed(2)}%)
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Data provided by Alpha Vantage. Updates every 60 seconds.
        </div>
      </main>
    </div>
  );
}
