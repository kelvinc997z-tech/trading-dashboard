"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import TradingViewChart from "@/components/TradingViewChart";
import SignalTable, { Signal } from "@/components/SignalTable";
import SignalTabs from "@/components/SignalTabs";
import { Activity, Crown, ArrowRight } from "lucide-react";
import { generateSignal, supportedPairs, initialSignals } from "@/lib/mockData";
import { calculateWinRate } from "@/lib/signalUtils";
import { getStoredSignals, storeSignals } from "@/lib/localStorage";

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [markets, setMarkets] = useState<Record<string, MarketData>>({});
  const [signals, setSignals] = useState<Signal[]>(() => getStoredSignals());
  const [stats, setStats] = useState({ total: 0, winRate: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "closed">("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch market data
  const fetchMarketData = async () => {
    try {
      const res = await fetch("/api/market-data");
      if (!res.ok) throw new Error("Failed to fetch market data");
      const data = await res.json();
      setMarkets(data);
    } catch (error) {
      console.error("Error fetching market data:", error);
    }
  };

  // Check authentication
  useEffect(() => {
    Promise.all([
      fetch("/api/me").then(res => res.json()),
      fetch("/api/subscription").then(res => res.json()),
    ]).then(([userData, subData]) => {
      if (!userData.user) {
        router.replace("/login");
        return;
      }
      setUser(userData.user);
      setSubscription(subData);
      setAuthLoading(false);
    }).catch(() => {
      router.replace("/login");
    });
  }, [router]);

  const fetchGenerateSignals = async () => {
    try {
      const res = await fetch("/api/generate-signals");
      if (!res.ok) throw new Error("Failed to fetch signals");
      const data = await res.json();
      const newSignals = data.signals || [];
      setSignals(newSignals);
      storeSignals(newSignals);
    } catch (error) {
      console.error("Error fetching signals:", error);
    }
  };

  // Initialize after auth
  useEffect(() => {
    if (!user) return;
    fetchMarketData();
    fetchGenerateSignals();
    setIsLoaded(true);
  }, [user]);

  // Polling every 60 seconds
  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(() => {
      fetchMarketData();
      fetchGenerateSignals();
    }, 60000);
    return () => clearInterval(interval);
  }, [isLoaded]);

  // Auto-close signals based on current market prices
  useEffect(() => {
    if (!isLoaded) return;
    setSignals(prev => prev.map(signal => {
      if (signal.status !== "active") return signal;
      const price = markets[signal.pair as keyof typeof markets]?.price;
      if (!price) return signal;

      if (signal.type === "BUY") {
        if (price >= signal.tp) {
          return { ...signal, status: "closed", result: "win" };
        } else if (price <= signal.sl) {
          return { ...signal, status: "closed", result: "lose" };
        }
      } else { // SELL
        if (price <= signal.tp) {
          return { ...signal, status: "closed", result: "win" };
        } else if (price >= signal.sl) {
          return { ...signal, status: "closed", result: "lose" };
        }
      }
      return signal;
    }));
  }, [markets, isLoaded]);

  // Update stats
  useEffect(() => {
    const { total, winRate } = calculateWinRate(signals);
    setStats({ total, winRate });
  }, [signals]);

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-gray-900 dark:text-white text-xl font-semibold animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in effect
  }

  // Helper: base prices for fallback
  function basePriceForSymbol(symbol: string): number {
    const base: Record<string, number> = {
      "XAUT/USD": 2350,
      USOIL: 88,
      "BTC/USD": 68000,
      "SOL/USD": 170,
      "ETH/USD": 3500,
      "XRP/USD": 0.62,
      "KAS/USDT": 0.12,
      NASDAQ: 20500,
      SP500: 5230,
      AAPL: 195,
      NVDA: 135,
      AMD: 166,
      GOOGL: 176,
      TSM: 186,
    };
    return base[symbol] || 100;
  }

  // Symbol metadata for display
  const symbolInfo: Record<string, { name: string; icon: string; color: string }> = {
    "XAUT/USD": { name: "Tether Gold (XAUT/USD)", icon: "🥇", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600" },
    USOIL: { name: "US Oil (WTI)", icon: "🛢️", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
    "BTC/USD": { name: "Bitcoin", icon: "₿", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600" },
    "SOL/USD": { name: "Solana", icon: "◎", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600" },
    "ETH/USD": { name: "Ethereum", icon: "Ξ", color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" },
    "XRP/USD": { name: "Ripple (XRP)", icon: "✕", color: "bg-gray-100 dark:bg-gray-700 text-gray-600" },
    "KAS/USDT": { name: "Kaspa (KAS/USDT)", icon: "Ⓚ", color: "bg-green-100 dark:bg-green-900/30 text-green-600" },
    NASDAQ: { name: "NASDAQ Index", icon: "📈", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
    SP500: { name: "S&P 500", icon: "📊", color: "bg-green-100 dark:bg-green-900/30 text-green-600" },
    AAPL: { name: "Apple Inc.", icon: "🍎", color: "bg-gray-100 dark:bg-gray-700 text-gray-600" },
    NVDA: { name: "NVIDIA Corp.", icon: "🎮", color: "bg-green-100 dark:bg-green-900/30 text-green-600" },
    AMD: { name: "AMD Inc.", icon: "💻", color: "bg-red-100 dark:bg-red-900/30 text-red-600" },
    GOOGL: { name: "Alphabet (Google)", icon: "🔍", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
    TSM: { name: "Taiwan Semiconductor", icon: "🔬", color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" },
  };

  const currentMarkets = markets;

  // Filter signals based on active tab
  const filteredSignals = activeTab === "all" ? signals : signals.filter(s => s.status === activeTab);

  const handleCloseSignal = (id: string) => {
    setSignals(prev => {
      const updated = prev.map(sig => sig.id === id ? { ...sig, status: "closed" as const } : sig);
      storeSignals(updated);
      return updated;
    });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Upgrade CTA for Free users */}
        {subscription?.tier === "free" && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Crown className="w-5 h-5" /> Upgrade to Pro
                </h3>
                <p className="text-blue-100 mt-1">Get real-time data, all 14 pairs, advanced indicators, CSV export, and priority support!</p>
              </div>
              <button
                onClick={() => router.push('/pricing')}
                className="px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition flex items-center gap-2 whitespace-nowrap"
              >
                View Plans <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Signals</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Win Rate</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.winRate}%</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Signals</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{signals.filter(s => s.status === "active").length}</p>
          </div>
        </div>

        {/* Market Prices Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Live Market Prices</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {supportedPairs.map(symbol => {
              const data = currentMarkets[symbol as keyof typeof currentMarkets];
              if (!data) return null;
              const format = (sym: string) => {
                if (sym === "XRP/USD" || sym === "KAS/USDT" || sym === "GOOGL" || sym === "AMD" || sym === "NVDA" || sym === "AAPL" || sym === "TSM") return (val: number) => val.toFixed(2);
                return (val: number) => val.toFixed(2);
              };
              const fmt = format(symbol as string);
              const isPositive = data.change >= 0;
              return (
                <div key={symbol} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{symbol}</span>
                    <span className={`text-xs font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{fmt(data.change)}%
                    </span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">${fmt(data.price)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Charts</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TradingViewChart symbol="BITFINEX:XAUTUSD" height={400} />
            <TradingViewChart symbol="FOREXCOM:USOIL" height={400} />
            <TradingViewChart symbol="BINANCE:BTCUSDT" height={400} />
            <TradingViewChart symbol="BINANCE:ETHUSDT" height={400} />
            <TradingViewChart symbol="BINANCE:SOLUSDT" height={400} />
            <TradingViewChart symbol="BINANCE:XRPUSDT" height={400} />
            <TradingViewChart symbol="MEXC:KASUSDT" height={400} />
            <TradingViewChart symbol="NASDAQ:NASDAQ" height={400} />
            <TradingViewChart symbol="SP:SP500" height={400} />
            <TradingViewChart symbol="NASDAQ:AAPL" height={400} />
            <TradingViewChart symbol="NASDAQ:NVDA" height={400} />
            <TradingViewChart symbol="NASDAQ:AMD" height={400} />
            <TradingViewChart symbol="NASDAQ:GOOGL" height={400} />
            <TradingViewChart symbol="NYSE:TSM" height={400} />
          </div>
        </div>

        {/* Signal Table with Tabs */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Live Trading Signals (All Pairs)</h2>
          <SignalTabs signals={signals} activeTab={activeTab} onTabChange={setActiveTab} />
          <SignalTable signals={filteredSignals} onClose={handleCloseSignal} />
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>© 2026 TradeSignal Dashboard. Built with Next.js & Tailwind.</p>
        <p className="mt-1">Charts powered by TradingView | Prices update every 60 seconds</p>
      </footer>
    </div>
  );
}
