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
        const xaut = outlook.pairs?.find((p: any) => p.symbol === "XAU/USD" || p.name === "Gold");
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
      <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 animate-pulse">
        <div className="h-12 flex items-center justify-center text-gray-500 text-xs">Loading Gold price...</div>
      </div>
    );
  }

  if (!data) return null;

  const isBullish = data.signal === "buy";
  const isBearish = data.signal === "sell";

  // Calculate change percentage between TP and entry for quick insight
  const tpChange = ((data.tp - data.price) / data.price * 100).toFixed(1);
  const slChange = ((data.sl - data.price) / data.price * 100).toFixed(1);

  return (
    <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🪙</span>
          <div>
            <h3 className="font-bold text-xs">Gold (XAU)</h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Live Price & AI Signal</p>
          </div>
        </div>
        <div className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
          isBullish 
            ? "bg-green-500 text-white"
            : isBearish
            ? "bg-red-500 text-white"
            : "bg-gray-500 text-white"
        }`}>
          {data.signal.toUpperCase()}
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 mb-2">
        <div className="flex-1">
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Price</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">${data.price.toLocaleString()}</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[9px] text-green-600 dark:text-green-400 uppercase tracking-wider">TP +{tpChange}%</p>
          <p className="text-xs font-semibold text-green-600 dark:text-green-400">${data.tp.toLocaleString()}</p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-[9px] text-red-600 dark:text-red-400 uppercase tracking-wider">SL {slChange}%</p>
          <p className="text-xs font-semibold text-red-600 dark:text-red-400">${data.sl.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          <span>Conf: {(data.confidence * 100).toFixed(0)}%</span>
        </div>
        <span className="text-[9px]">Updates every 30s</span>
      </div>
    </div>
  );
}
