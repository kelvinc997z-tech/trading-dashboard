"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import TradingViewChart from "@/components/TradingViewChart";
import SignalTable, { Signal } from "@/components/SignalTable";
import { Activity } from "lucide-react";
import { generateMarketData, generateSignal, supportedPairs, initialSignals } from "@/lib/mockData";

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function HomePage() {
  const router = useRouter();
  const [markets, setMarkets] = useState<Record<string, MarketData>>({});
  const [signals, setSignals] = useState<Signal[]>(initialSignals);
  const [stats, setStats] = useState({ total: 0, winRate: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    fetch("/api/me")
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.replace("/login");
        } else {
          setUser(data.user);
        }
        setAuthLoading(false);
      })
      .catch(() => setAuthLoading(false));
  }, [router]);

  // Initialize market data
  useEffect(() => {
    if (!user) return; // only load markets after user confirmed
    const initialMarkets: Record<string, MarketData> = {};
    supportedPairs.forEach(symbol => {
      initialMarkets[symbol] = generateMarketData(symbol as any);
    });
    setMarkets(initialMarkets);
    setIsLoaded(true);
  }, [user]);

  // Real-time update every 60 seconds
  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(() => {
      setMarkets(prev => {
        const newMarkets: Record<string, MarketData> = {};
        supportedPairs.forEach(symbol => {
          newMarkets[symbol as any] = generateMarketData(symbol as any);
        });
        return newMarkets;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [isLoaded]);

  // Generate new signal occasionally
  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const symbol = supportedPairs[Math.floor(Math.random() * supportedPairs.length)] as any;
        const currentPrice = markets[symbol]?.price || (basePriceForSymbol(symbol) || 100);
        const newSignal = generateSignal(symbol, currentPrice);
        setSignals(prev => [newSignal, ...prev.slice(0, 19)]);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [markets, isLoaded]);

  // Update stats
  useEffect(() => {
    const total = signals.length;
    const closed = signals.filter(s => s.status === "closed");
    const won = closed.filter(s => {
      if (s.type === "BUY") return s.tp > s.sl;
      return s.tp < s.sl;
    }).length;
    const winRate = closed.length > 0 ? Math.round((won / closed.length) * 100) : 0;
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
      XAUUSD: 4570,
      USOIL: 88,
      "BTC/USD": 68000,
      "SOL/USD": 170,
      "ETH/USD": 3500,
      "XRP/USD": 0.62,
      "KAS/USDT": 0.12,
    };
    return base[symbol] || 100;
  }

  // Symbol metadata for display
  const symbolInfo: Record<string, { name: string; icon: string; color: string }> = {
    XAUUSD: { name: "Gold (XAUUSD)", icon: "🥇", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600" },
    USOIL: { name: "US Oil (WTI)", icon: "🛢️", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
    "BTC/USD": { name: "Bitcoin", icon: "₿", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600" },
    "SOL/USD": { name: "Solana", icon: "◎", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600" },
    "ETH/USD": { name: "Ethereum", icon: "Ξ", color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" },
    "XRP/USD": { name: "Ripple (XRP)", icon: "✕", color: "bg-gray-100 dark:bg-gray-700 text-gray-600" },
    "KAS/USDT": { name: "Kaspa (KAS/USDT)", icon: "Ⓚ", color: "bg-green-100 dark:bg-green-900/30 text-green-600" },
  };

  const currentMarkets = markets;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {supportedPairs.map(symbol => {
            const data = currentMarkets[symbol as keyof typeof currentMarkets];
            if (!data) return null;
            const format = (sym: string) => {
              if (sym === "XRP/USD" || sym === "KAS/USDT") return (val: number) => val.toFixed(4);
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TradingViewChart symbol="FOREXCOM:XAUUSD" height={400} />
          <TradingViewChart symbol="FOREXCOM:USOIL" height={400} />
          <TradingViewChart symbol="BINANCE:BTCUSDT" height={400} />
          <TradingViewChart symbol="BINANCE:ETHUSDT" height={400} />
          <TradingViewChart symbol="BINANCE:SOLUSDT" height={400} />
          <TradingViewChart symbol="BINANCE:XRPUSDT" height={400} />
          <TradingViewChart symbol="MEXC:KASUSDT" height={400} />
        </div>

        {/* Signal Table */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Live Trading Signals (All Pairs)</h2>
          <SignalTable signals={signals} />
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>© 2026 TradeSignal Dashboard. Built with Next.js & Tailwind.</p>
        <p className="mt-1">Charts powered by TradingView | Prices update every 60 seconds</p>
      </footer>
    </div>
  );
}