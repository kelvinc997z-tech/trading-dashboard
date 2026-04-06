"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, BarChart2, PieChart, Eye, Calendar } from "lucide-react";
import InstallPWAButton from "@/components/InstallPWAButton";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import TradingViewWidget from "@/components/TradingViewWidget";
import BinanceLiveChart from "@/components/BinanceLiveChart";
import RealTimeChart from "@/components/RealTimeChart";
import AdvancedChart from "@/components/AdvancedChart";
import EconomicCalendarWidget from "@/components/EconomicCalendarWidget";
import PerformanceClient from "@/app/dashboard/performance/PerformanceClient";
import CorrelationMatrix from "@/components/CorrelationMatrix";
import WatchlistOutlook from "@/components/WatchlistOutlook";
import StatCard from "@/components/ui/StatCard";
import GlassCard from "@/components/ui/GlassCard";
import ConfidenceBar from "@/components/ConfidenceBar";

interface DbTrade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  entry: number;
  size: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl?: number;
  pnlPct?: number;
  status: "open" | "closed";
  date: Date | string;
  exit?: number;
  exitDate?: Date | string;
}

interface Trade {
  id: string;
  symbol: string;
  time: string;
  pair: string;
  side: "buy" | "sell";
  size: number;
  entry: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl?: number; // realized
  pnlPct?: number;
  unrealizedPnl?: number; // current
  status: "open" | "closed";
  exitDate?: string | Date;
}

interface User {
  email: string;
  role?: string;
}

const CRYPTO_PAIRS = [
  { symbol: "XAUT", name: "Tether Gold" },
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "XRP", name: "Ripple" },
  { symbol: "KAS", name: "Kaspa" },
];

const US_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "AMD", name: "Advanced Micro Devices" },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "TSM", name: "Taiwan Semiconductor Manufacturing" },
];

// Helper: convert symbol to Binance base symbol (without USDT suffix)
function getBinanceBaseSymbol(symbol: string): string {
  if (symbol === "XAUT") return "XAU"; // Binance uses XAUUSDT for gold
  return symbol; // BTC -> BTC, ETH -> ETH, KAS -> KAS, etc.
}

export default function Dashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [markets, setMarkets] = useState<Record<string, { price: number }>>({});
  const [user, setUser] = useState<User | null>(null);
  const [timeframe, setTimeframe] = useState("1h");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"charts" | "outlook" | "economic" | "performance" | "correlation">("charts");

  // Get symbol from query params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const symbol = urlParams.get('symbol');
    if (symbol) {
      setSelectedSymbol(symbol);
      // Scroll to the section with this symbol after a short delay
      setTimeout(() => {
        const element = document.getElementById(`chart-${symbol.toLowerCase()}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight effect
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 2000);
        }
      }, 500);
    }
  }, []);

  // Map DB trade -> UI trade, plus compute unrealized
  const mapTrade = useCallback((dbTrade: DbTrade, currentPrice?: number): Trade => {
    const date = new Date(dbTrade.date);
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const pair = dbTrade.symbol.split('/')[0];
    let unrealized;
    if (dbTrade.status === "open" && currentPrice !== undefined) {
      if (dbTrade.side === "buy") {
        unrealized = (currentPrice - dbTrade.entry) * dbTrade.size;
      } else {
        unrealized = (dbTrade.entry - currentPrice) * dbTrade.size;
      }
    }
    return {
      id: dbTrade.id,
      symbol: dbTrade.symbol,
      time,
      pair,
      side: dbTrade.side,
      size: dbTrade.size,
      entry: dbTrade.entry,
      stopLoss: dbTrade.stopLoss,
      takeProfit: dbTrade.takeProfit,
      pnl: dbTrade.pnl,
      pnlPct: dbTrade.pnlPct,
      unrealizedPnl: unrealized,
      status: dbTrade.status,
      exitDate: dbTrade.exitDate,
    };
  }, []);

  const fetchTrades = async (): Promise<DbTrade[]> => {
    const res = await fetch("/api/trades");
    if (res.ok) {
      return await res.json();
    }
    return [];
  };

  // Auto-refresh trades every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTrades().then(dbTrades => {
        const mappedTrades = dbTrades.map(trade => mapTrade(trade, markets[trade.symbol]?.price));
        setTrades(mappedTrades);
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [markets]);

  const fetchMarketData = useCallback(async () => {
    try {
      // Fetch all symbols we need (from trades and both categories)
      const symbols = [...new Set([...CRYPTO_PAIRS.map(p => p.symbol), ...US_STOCKS.map(p => p.symbol)])];
      const promises = symbols.map(async sym => {
        try {
          const res = await fetch(`/api/market-data?symbol=${encodeURIComponent(sym)}&timeframe=${timeframe}`);
          if (res.ok) {
            const data = await res.json();
            return { symbol: sym, price: data.current?.price ?? data.current?.close ?? null };
          }
        } catch (e) {}
        return null;
      });
      const results = await Promise.all(promises);
      const marketsMap: Record<string, { price: number }> = {};
      results.forEach(r => {
        if (r) marketsMap[r.symbol] = { price: r.price };
      });
      setMarkets(marketsMap);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Failed to fetch market data:", err);
    }
  }, [timeframe]);

  const updateTrade = async (id: string, updates: Partial<DbTrade>) => {
    try {
      const res = await fetch(`/api/trades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setTrades(prev => prev.map(t => t.id === id ? mapTrade(updated, markets[updated.symbol]?.price) : t));
        return updated;
      }
    } catch (err) {
      console.error("Failed to update trade:", err);
    }
    return null;
  };

  // Auto-close logic
  const checkAndCloseTrades = useCallback(async () => {
    const toClose: Trade[] = [];
    trades.forEach(trade => {
      if (trade.status !== "open") return;
      const market = markets[trade.symbol];
      if (!market) return;
      const price = market.price;
      const tp = trade.takeProfit;
      const sl = trade.stopLoss;
      let hit = false;
      let exitPrice = price;
      if (trade.side === "buy") {
        if (tp !== undefined && price >= tp) hit = true;
        if (sl !== undefined && price <= sl) hit = true;
      } else {
        if (tp !== undefined && price <= tp) hit = true;
        if (sl !== undefined && price >= sl) hit = true;
      }
      if (hit) {
        toClose.push(trade);
      }
    });

    // Process each
    for (const trade of toClose) {
      const market = markets[trade.symbol];
      if (!market) continue;
      const exitPrice = market.price;
      // Calculate P&L
      const pnl = trade.side === "buy"
        ? (exitPrice - trade.entry) * trade.size
        : (trade.entry - exitPrice) * trade.size;
      await updateTrade(trade.id, {
        status: "closed",
        exit: exitPrice,
        exitDate: new Date(),
        pnl,
        pnlPct: (pnl / (trade.entry * trade.size)) * 100,
      });
    }
  }, [trades, markets, mapTrade, updateTrade]);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error("Failed to fetch session:", err);
    }
  };

  const handleUpgrade = () => {
    window.location.href = "/payment";
  };

  // Initial load & polling
  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const dbTrades = await fetchTrades();
        await fetchMarketData();
        const mapped: Trade[] = dbTrades.map(db => mapTrade(db, markets[db.symbol]?.price));
        setTrades(mapped);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [fetchMarketData, mapTrade]);

  // Refetch market data when timeframe changes
  useEffect(() => {
    fetchMarketData();
  }, [timeframe, fetchMarketData]);

  // Separate effect for auto-close (runs after markets/trades update)
  useEffect(() => {
    if (Object.keys(markets).length === 0 || trades.length === 0) return;
    checkAndCloseTrades();
  }, [markets, trades, checkAndCloseTrades]);

  // Computed stats
  const openTradesCount = trades.filter(t => t.status === "open").length;
  const realizedToday = trades
    .filter(t => t.status === "closed" && t.pnl !== undefined && t.exitDate && new Date(t.exitDate).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + (t.pnl as number), 0);
  const unrealizedPnl = trades
    .filter(t => t.status === "open")
    .reduce((sum, t) => sum + (t.unrealizedPnl || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Left: Title */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex-1 md:flex-none">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600">
                  Trading Dashboard
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Monitor & manage your trades</p>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {/* Timeframe Selector */}
              <div className="relative group">
                <select 
                  value={timeframe} 
                  onChange={e => setTimeframe(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  <option value="1m">1m</option>
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="1h">1h</option>
                  <option value="4h">4h</option>
                  <option value="1d">1d</option>
                </select>
                <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Last Update */}
              <div className="hidden sm:block text-right px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">Updated</p>
                <p className="text-xs font-mono text-gray-700 dark:text-gray-300">{lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              {/* Theme Switcher */}
              <ThemeSwitcher />

              {/* Live Indicator */}
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Live</span>
              </div>

              {/* Upgrade Button */}
              {user?.role === "pro" ? (
                <Link 
                  href="/pricing" 
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-semibold shadow-sm hover:from-yellow-500 hover:to-orange-600 transition-all whitespace-nowrap"
                >
                  Pro
                </Link>
              ) : (
                <button
                  onClick={handleUpgrade}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-semibold shadow-sm hover:from-yellow-500 hover:to-orange-600 transition-all whitespace-nowrap"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-8">

      {/* Stats Cards - Futuristic */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4 mb-6">
        <StatCard
          label="Open Positions"
          value={openTradesCount}
          sublabel="Active trades"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          gradient="blue"
          trend={{ value: "+2.4%", up: true }}
        />
        <StatCard
          label="Today's P&L"
          value={realizedToday.toFixed(2)}
          sublabel="Net profit"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          gradient="emerald"
          positive={realizedToday >= 0}
          trend={{ value: realizedToday >= 0 ? "+4.2%" : "-1.8%", up: realizedToday >= 0 }}
        />
        <StatCard
          label="AI Confidence"
          value="87%"
          sublabel="Signal accuracy"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          gradient="purple"
          trend={{ value: "+5.3%", up: true }}
        />
        <StatCard
          label="System Status"
          value="Online"
          sublabel="All systems go"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
          gradient="emerald"
        />
      </div>

      {/* Dashboard Tabs - Simplified */}
      <div className="px-4 mb-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <nav className="relative flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { 
                id: "charts", 
                label: "Charts", 
                icon: Activity,
                desc: "Price & signals"
              },
              { 
                id: "outlook", 
                label: "Outlook", 
                icon: Eye,
                desc: "Watchlist signals"
              },
              { 
                id: "correlation", 
                label: "Correlation", 
                icon: BarChart2,
                desc: "Asset relationships"
              },
              { 
                id: "performance", 
                label: "Performance", 
                icon: PieChart,
                desc: "Your stats"
              },
              { 
                id: "economic", 
                label: "Economic", 
                icon: Calendar,
                desc: "Today's events"
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  relative flex flex-col items-center gap-1 py-3 px-4 rounded-t-xl transition-all duration-300 min-w-[100px]
                  ${activeTab === tab.id
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }
                `}
              >
                {/* Active indicator */}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-2 right-2 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-t-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <tab.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:block">{tab.desc}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Multiple Pair Charts - Separate Categories */}
      {activeTab === "charts" && (
        <>
          {/* Crypto Charts */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-cyan-500">
                  Cryptocurrency
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Real-time price analysis with technical indicators
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-500/30 self-start sm:self-auto">
                {CRYPTO_PAIRS.length} pairs
              </span>
            </div>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {CRYPTO_PAIRS.map((pair, idx) => (
                <motion.div
                  key={pair.symbol}
                  id={`chart-${pair.symbol.toLowerCase()}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <GlassCard gradient="cyan" className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{pair.symbol}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{pair.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                          {timeframe}
                        </span>
                        {user?.role === "pro" && (
                          <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-semibold border border-yellow-500/20">
                            PRO
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-h-[200px] chart-container rounded-xl p-1 bg-gradient-to-r from-gray-100/50 to-gray-200/50 dark:from-gray-800/50 dark:to-gray-900/50">
                      {isLoading ? (
                        <div className="h-40 sm:h-48 skeleton rounded-lg" />
                      ) : (
                        <div className="h-40 sm:h-48">
                          <BinanceLiveChart symbol={getBinanceBaseSymbol(pair.symbol)} interval={timeframe} />
                        </div>
                      )}
                    </div>

                    {/* AI Confidence Bar for Pro users */}
                    {user?.role === "pro" && (
                      <div className="mt-4 pt-4 border-t border-gray-700/50">
                        <ConfidenceBar value={78 + Math.random() * 15} label="AI Signal Strength" size="md" />
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* US Stocks Charts } */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mt-10"
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                  US Stocks
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Major equity markets with technical analysis
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium border border-blue-500/30 self-start sm:self-auto">
                {US_STOCKS.length} stocks
              </span>
            </div>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {US_STOCKS.map((pair, idx) => (
                <motion.div
                  key={pair.symbol}
                  id={`chart-${pair.symbol.toLowerCase()}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                >
                  <GlassCard gradient="purple" className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{pair.symbol}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{pair.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-500/20">
                          {timeframe}
                        </span>
                        {user?.role === "pro" && (
                          <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-semibold border border-yellow-500/20">
                            PRO
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-h-[200px] chart-container rounded-xl p-1 bg-gradient-to-r from-gray-100/50 to-gray-200/50 dark:from-gray-800/50 to-gray-900/50">
                      {isLoading ? (
                        <div className="h-40 sm:h-48 skeleton rounded-lg" />
                      ) : (
                        <div className="h-40 sm:h-48">
                          <TradingViewWidget symbol={pair.symbol} interval={timeframe} height={160} />
                        </div>
                      )}
                    </div>

                    {/* AI Confidence Bar for Pro users */}
                    {user?.role === "pro" && (
                      <div className="mt-4 pt-4 border-t border-gray-700/50">
                        <ConfidenceBar value={72 + Math.random() * 15} label="AI Signal Strength" size="md" />
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* Tab Content for other tabs */}
      {activeTab === "outlook" && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <WatchlistOutlook />
        </div>
      )}

      {activeTab === "correlation" && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <CorrelationMatrix />
        </div>
      )}

      {activeTab === "performance" && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <PerformanceClient />
        </div>
      )}

      {activeTab === "economic" && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <EconomicCalendarWidget />
        </div>
      )}

      <GlassCard gradient="cyan" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50 bg-gradient-to-r from-gray-800/80 to-gray-900/80">
                {[
                  "Time", "Pair", "Side", "Size", "Entry", "TP", "SL", "P&L", "AI"
                ].map((header) => (
                  <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">No trades yet</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">Start trading to see your history here</p>
                    </div>
                  </td>
                </tr>
              ) : (
                trades.map((trade, idx) => {
                  const isOpen = trade.status === "open";
                  const displayPnl = isOpen
                    ? trade.unrealizedPnl ?? 0
                    : trade.pnl ?? 0;
                  const pnlClass = displayPnl >= 0 ? "text-emerald-400" : "text-rose-400";
                  const pnlBg = displayPnl >= 0 
                    ? "bg-emerald-500/10 dark:bg-emerald-500/20" 
                    : "bg-rose-500/10 dark:bg-rose-500/20";

                  // AI signal badge color
                  const aiSignalColor = trade.side === "buy" ? "text-cyan-400" : "text-purple-400";
                  const aiSignalBg = trade.side === "buy" ? "bg-cyan-500/10 border-cyan-500/20" : "bg-purple-500/10 border-purple-500/20";

                  return (
                    <motion.tr
                      key={trade.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-gray-800/30 transition-colors group border-b border-gray-800/50 last:border-0"
                    >
                      <td className="px-6 py-4 font-medium text-white">
                        {trade.time}
                        {isOpen && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Open
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white">{trade.pair}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                          trade.side === "buy" 
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}>
                          {trade.side === "buy" ? (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-white">
                        {trade.size.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-white">
                        {trade.entry.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        {trade.takeProfit ? (
                          <span className={`px-2 py-1 rounded text-xs font-mono font-medium border ${aiSignalBg}`}>
                            {trade.takeProfit.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {trade.stopLoss ? (
                          <span className="px-2 py-1 rounded text-xs font-mono text-orange-400 border border-orange-500/30">
                            {trade.stopLoss.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${pnlBg} font-mono font-semibold ${pnlClass}`}>
                          {displayPnl >= 0 ? "+" : ""}{displayPnl.toFixed(2)}
                          {isOpen && (
                            <span className="text-xs opacity-75">(unreal)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {/* AI Prediction badge */}
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${aiSignalBg} ${aiSignalColor}`}>
                          {trade.side === "buy" ? "BULL" : "BEAR"}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Install PWA Prompt */}
      <InstallPWAButton />

    </div>
    </main>
    </div>
  );
}
