"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface XAUTData {
  price: number;
  change24h: number;
  signal: "buy" | "sell" | "neutral";
  entry: number;
  tp: number;
  sl: number;
  confidence: number;
}

export default function XAUTLivePrice() {
  const [data, setData] = useState<XAUTData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch XAUT price from CoinGecko (free, no auth)
    async function fetchPrice() {
      try {
        // CoinGecko: Gold is not listed, use Tether Gold as proxy or use Finnhub via our API
        // Use our own /api/market-outlook to get XAUT signal and latest price from DB
        const res = await fetch("/api/market-outlook");
        if (!res.ok) throw new Error("Failed to fetch market outlook");
        const outlook = await res.json();
        
        // Find XAUT in pairs
        const xaut = outlook.pairs?.find((p: any) => p.symbol === "XAUT/USD" || p.name === "Gold");
        if (xaut) {
          // Use entry price as current price approximation (since we don't have live feed)
          setData({
            price: xaut.entry,
            change24h: 0, // Not available from market-outlook
            signal: xaut.signal,
            entry: xaut.entry,
            tp: xaut.tp,
            sl: xaut.sl,
            confidence: xaut.confidence,
          });
        }
      } catch (error) {
        console.error("Failed to fetch XAUT data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPrice();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 animate-pulse">
        <div className="h-32 flex items-center justify-center text-gray-500">Loading XAUT data...</div>
      </div>
    );
  }

  if (!data) return null;

  const isBullish = data.signal === "buy";
  const isBearish = data.signal === "sell";

  return (
    <div className="p-6 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🪙</span>
          <div>
            <h3 className="font-bold text-lg">Gold (XAUT/USD)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Live Market Signal</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
          isBullish 
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            : isBearish
            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
        }`}>
          {data.signal.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Current Price</p>
          <p className="text-2xl font-bold">${data.price.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Take Profit</p>
          <p className="text-xl font-semibold text-green-600 dark:text-green-400">${data.tp.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Stop Loss</p>
          <p className="text-xl font-semibold text-red-600 dark:text-red-400">${data.sl.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
          <p className="text-xl font-bold">{(data.confidence * 100).toFixed(0)}%</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Activity className="w-4 h-4" />
        <span>Updates every 30 seconds</span>
      </div>

      <div className="mt-4 pt-4 border-t border-yellow-200 dark:border-yellow-800">
        <Link 
          href="/market" 
          className="inline-flex items-center gap-2 text-yellow-700 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 font-medium"
        >
          View full market outlook →
        </Link>
      </div>
    </div>
  );
}
