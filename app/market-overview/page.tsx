"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import SignalTable, { Signal } from "@/components/SignalTable";
import SignalTabs from "@/components/SignalTabs";
import SignalTableSkeleton from "@/components/SignalTableSkeleton";
import { getStoredSignals, storeSignals } from "@/lib/localStorage";
import { calculateWinRate } from "@/lib/signalUtils";

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
  const [signals, setSignals] = useState<Signal[]>(() => getStoredSignals());
  const [activeTab, setActiveTab] = useState<"market" | "signals">("market");
  const [signalTab, setSignalTab] = useState<"all" | "active" | "closed">("all");
  const [stats, setStats] = useState({ total: 0, winRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<"pair" | "time" | "entry">("time");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

  const fetchSignals = async () => {
    try {
      const res = await fetch("/api/generate-signals");
      if (!res.ok) throw new Error("Failed to fetch signals");
      const data = await res.json();
      const newSignals = data.signals || [];
      setSignals(newSignals);
      storeSignals(newSignals);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCloseSignal = (id: string) => {
    setSignals(prev => {
      const updated = prev.map(sig => 
        sig.id === id ? { ...sig, status: "closed" as const } : sig
      );
      storeSignals(updated);
      return updated;
    });
  };

  const handleSort = (by: "pair" | "time" | "entry") => {
    if (sortBy === by) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(by);
      setSortDirection("desc");
    }
  };

  useEffect(() => {
    fetchMarketData();
    fetchSignals();
    const interval = setInterval(() => {
      fetchMarketData();
      fetchSignals();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-close signals based on current market prices
  useEffect(() => {
    if (!markets || Object.keys(markets).length === 0) return;
    setSignals(prev => prev.map(signal => {
      if (signal.status !== "active") return signal;
      const price = markets[signal.pair as keyof typeof markets]?.price;
      if (!price) return signal;

      if (signal.type === "BUY") {
        if (price >= signal.tp) return { ...signal, status: "closed", result: "win" as const };
        if (price <= signal.sl) return { ...signal, status: "closed", result: "lose" as const };
      } else {
        if (price <= signal.tp) return { ...signal, status: "closed", result: "win" as const };
        if (price >= signal.sl) return { ...signal, status: "closed", result: "lose" as const };
      }
      return signal;
    }));
  }, [markets]);

  // Calculate stats
  useEffect(() => {
    const { total, winRate } = calculateWinRate(signals);
    setStats({ total, winRate });
  }, [signals]);

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
        <div className="text-gray-900 dark:text-white text-xl font-semibold animate-pulse">Loading market data and signals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-xl font-semibold mb-4">Error: {error}</div>
          <button
            onClick={() => { fetchMarketData(); fetchSignals(); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Market Overview & Signals</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
              <span>Total Signals: {stats.total}</span>
              <span>Win Rate: {stats.winRate}%</span>
            </div>
          </div>
          <button
            onClick={() => { fetchMarketData(); fetchSignals(); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Refresh Now
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("market")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "market"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("signals")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "signals"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            }`}
          >
            Signals
          </button>
        </div>

        {activeTab === "market" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Object.entries(markets)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([symbol, data]) => {
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
        )}

        {activeTab === "signals" && (
          <div>
            <SignalTabs signals={signals} activeTab={signalTab} onTabChange={setSignalTab} />
            {loading || Object.keys(markets).length === 0 ? (
              <SignalTableSkeleton rows={5} />
            ) : (
              <SignalTable 
                signals={signalTab === "all" ? signals : signals.filter(s => s.status === signalTab)} 
                onClose={handleCloseSignal}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            )}
          </div>
        )}

        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <span>Data provided by Alpha Vantage. Signals auto-close based on price.</span>
          {lastUpdated && (
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </main>
    </div>
  );
}
