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

/**
 * Compact XAUT GoldSignal Card
 * Designed to be placed above Quant AI section
 */
export default function XAUTMiniCard() {
  const [data, setData] = useState<XAUTData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch("/api/market-outlook");
        if (!res.ok) throw new Error("Failed to fetch market outlook");
        const outlook = await res.json();
        const xaut = outlook.pairs?.find((p: any) => p.symbol === "XAUT/USD" || p.name === "Gold");
        if (xaut) {
          setData({
            price: xaut.entry,
            change24h: 0,
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
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 animate-pulse">
        <div className="h-16 flex items-center justify-center text-gray-500 text-sm">Loading Gold signal...</div>
      </div>
    );
  }

  if (!data) return null;

  const isBullish = data.signal === "buy";
  const isBearish = data.signal === "sell";

  return (
    <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🪙</span>
          <div>
            <h3 className="font-bold text-sm">Gold (XAUT/USD)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">AI Signal</p>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          isBullish 
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            : isBearish
            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
        }`}>
          {data.signal.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-2">
        <div>
          <p className="text-[10px] text-gray-500">Price</p>
          <p className="text-sm font-semibold">${data.price.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">TP</p>
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">${data.tp.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">SL</p>
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">${data.sl.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          <span>Conf: {(data.confidence * 100).toFixed(0)}%</span>
        </div>
        <Link href="/market" className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400">
          Details →
        </Link>
      </div>
    </div>
  );
}
