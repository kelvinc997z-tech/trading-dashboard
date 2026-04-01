"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import MarketOutlook from "@/components/MarketOutlook";
import RealTimeChart from "@/components/RealTimeChart";
import AdvancedChart from "@/components/AdvancedChart";

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
];

const US_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "AMD", name: "Advanced Micro Devices" },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
];

const ALL_PAIRS = [...CRYPTO_PAIRS, ...US_STOCKS];

export default function Dashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [markets, setMarkets] = useState<Record<string, { price: number }>>({});
  const [user, setUser] = useState<User | null>(null);
  const [timeframe, setTimeframe] = useState("1h");

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
      // Fetch all symbols we need (from trades and ALL_PAIRS)
      const symbols = [...new Set([...ALL_PAIRS.map(p => p.symbol)])];
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
      const dbTrades = await fetchTrades();
      await fetchMarketData();
      const mapped: Trade[] = dbTrades.map(db => mapTrade(db, markets[db.symbol]?.price));
      setTrades(mapped);
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
    <div className="space-y-6">
      {/* Back to Home */}
      <div className="px-4">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>

      <div className="flex justify-between items-center px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Trading Dashboard</h1>
          {user?.role === "pro" ? (
            <span className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-4 py-1.5 shadow-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Pro Account
            </span>
          ) : (
            <button
              onClick={handleUpgrade}
              className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-4 py-1.5 shadow-sm hover:from-yellow-500 hover:to-orange-600 transition"
            >
              Start Pro Trial
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="select select-bordered text-sm">
            <option value="1m">1m</option>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="1d">1d</option>
          </select>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Activity className="h-4 w-4 text-green-500" />
            <span>Market Open</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Open Positions
              </p>
              <p className="text-2xl font-bold">{openTradesCount}</p>
              <p className="text-xs text-gray-500 mt-1">Real-time</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Today's P&L
          </p>
          <p className={`text-2xl font-bold ${realizedToday >= 0 ? "text-green-500" : "text-red-500"}`}>
            {realizedToday.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Net profit (closed today)</p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            System Status
          </p>
          <p className="text-2xl font-bold text-green-500">Online</p>
          <p className="text-xs text-gray-500 mt-1">All connections active</p>
        </div>
      </div>

      {/* Multiple Pair Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ALL_PAIRS.map((pair) => (
          <div key={pair.symbol} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">{pair.name}</h2>
              <span className="text-xs text-gray-500">TF: {timeframe}</span>
            </div>
            {user?.role === "pro" ? (
              <AdvancedChart symbol={pair.symbol} indicators={["rsi", "macd", "bollinger"]} timeframe={timeframe} />
            ) : (
              <RealTimeChart symbol={pair.symbol} timeframe={timeframe} />
            )}
          </div>
        ))}
      </div>

      <MarketOutlook />

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Trades</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Pair</th>
                <th className="px-4 py-2">Side</th>
                <th className="px-4 py-2">Size</th>
                <th className="px-4 py-2">Entry</th>
                <th className="px-4 py-2">TP</th>
                <th className="px-4 py-2">SL</th>
                <th className="px-4 py-2">P&L</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                    No trades available at the moment.
                  </td>
                </tr>
              ) : (
                trades.map((trade) => {
                  const isOpen = trade.status === "open";
                  const displayPnl = isOpen
                    ? trade.unrealizedPnl ?? 0
                    : trade.pnl ?? 0;
                  const pnlClass = displayPnl >= 0 ? "text-green-500" : "text-red-500";
                  return (
                    <tr key={trade.id} className="border-b dark:border-gray-700">
                      <td className="px-4 py-2">{trade.time}</td>
                      <td className="px-4 py-2">{trade.pair}</td>
                      <td className={`px-4 py-2 ${trade.side === "buy" ? "text-green-500" : "text-red-500"}`}>
                        {trade.side.toUpperCase()}
                      </td>
                      <td className="px-4 py-2">{trade.size}</td>
                      <td className="px-4 py-2">{trade.entry.toFixed(2)}</td>
                      <td className="px-4 py-2">{trade.takeProfit?.toFixed(2) ?? "-"}</td>
                      <td className="px-4 py-2">{trade.stopLoss?.toFixed(2) ?? "-"}</td>
                      <td className={`px-4 py-2 ${pnlClass}`}>
                        {displayPnl >= 0 ? "+" : ""}{displayPnl.toFixed(2)}
                        {isOpen && <span className="text-xs ml-1">(unreal)</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
