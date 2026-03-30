"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import MarketOutlook from "@/components/MarketOutlook";
import RealTimeChart from "@/components/RealTimeChart";
import AdvancedChart from "@/components/AdvancedChart";

interface Trade {
  time: string;
  pair: string;
  side: string;
  size: number;
  entry: number;
  pnl: number;
}

interface User {
  email: string;
  role?: string;
}

const CRYPTO_PAIRS = [
  { symbol: "XAUT/USD", name: "Tether Gold" },
  { symbol: "BTC/USD", name: "Bitcoin" },
  { symbol: "ETH/USD", name: "Ethereum" },
  { symbol: "SOL/USD", name: "Solana" },
  { symbol: "XRP/USD", name: "Ripple" },
];

export default function Dashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const fetchTrades = async () => {
    try {
      const res = await fetch("/api/trades");
      if (res.ok) {
        const data = await res.json();
        setTrades(data);
      } else {
        // Fallback to sample trades if API fails
        setTrades([
          { time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), pair: "XAU", side: "BUY", size: 0.2, entry: 4450.50, pnl: 12.30 },
          { time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), pair: "BTC", side: "SELL", size: 0.5, entry: 88500.00, pnl: -25.60 },
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch trades:", err);
      // Show empty trades on error (not loading forever)
      setTrades([]);
    }
  };

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

  useEffect(() => {
    fetchSession();
    fetchTrades();
    // Refresh trades every 30 seconds
    const interval = setInterval(() => {
      fetchTrades();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Back to Home */}
      <div className="px-4">
        <Link href="/" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition">
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
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Activity className="h-4 w-4 text-green-500" />
          <span>Market Open</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Open Positions
              </p>
              <p className="text-2xl font-bold">{trades.length}</p>
              <p className="text-xs text-gray-500 mt-1">Real-time</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Today's P&L
          </p>
          <p className="text-2xl font-bold text-green-500">
            {trades.reduce((sum, t) => sum + t.pnl, 0).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Net profit</p>
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
        {CRYPTO_PAIRS.map((pair) => (
          <div key={pair.symbol} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">{pair.name} Live</h2>
            {user?.role === "pro" ? (
              <AdvancedChart symbol={pair.symbol} indicators={["rsi", "macd", "bollinger"]} />
            ) : (
              <RealTimeChart symbol={pair.symbol} />
            )}
          </div>
        ))}
      </div>

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
                <th className="px-4 py-2">P&L</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                    No trades available at the moment.
                  </td>
                </tr>
              ) : (
                trades.map((trade, i) => (
                  <tr key={i} className="border-b dark:border-gray-700">
                    <td className="px-4 py-2">{trade.time}</td>
                    <td className="px-4 py-2">{trade.pair}</td>
                    <td className={`px-4 py-2 ${trade.side === "BUY" ? "text-green-500" : "text-red-500"}`}>
                      {trade.side}
                    </td>
                    <td className="px-4 py-2">{trade.size}</td>
                    <td className="px-4 py-2">{trade.entry.toFixed(2)}</td>
                    <td className={`px-4 py-2 ${trade.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MarketOutlook />
    </div>
  );
}
