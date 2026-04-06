"use client";

import { useEffect, useState, useCallback } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";

interface MassiveStockChartProps {
  symbol: string;
  timeframe?: string;
  height?: number;
}

export default function MassiveStockChart({ symbol, timeframe = "1h", height = 400 }: MassiveStockChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [hasData, setHasData] = useState<boolean | null>(null); // null = checking, false = fallback
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/massive/ohlc?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=200`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.error || !json.data || json.data.length === 0) {
        setHasData(false);
        return;
      }
      setData(json.data);
      setHasData(true);
    } catch (err: any) {
      console.warn(`[MassiveStockChart] ${symbol} fallback to TradingView:`, err.message);
      setHasData(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // If still checking or data exists, show line chart
  if (hasData === false) {
    // Fallback to TradingViewWidget
    return <TradingViewWidget symbol={symbol} interval={timeframe} height={height} />;
  }

  if (hasData === null || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate change stats
  const latest = data[data.length - 1];
  const prev = data[data.length - 2] || latest;
  const change = latest.close - prev.close;
  const changePercent = (change / prev.close) * 100;
  const isPositive = change >= 0;

  // Transform for simple line chart using recharts
  const chartData = data.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    close: d.close,
  }));

  return (
    <div>
      <div className="text-center mb-2">
        <span className="font-bold">{symbol}</span>
        <span className={`ml-2 ${isPositive ? "text-green-500" : "text-red-500"}`}>
          ${latest.close.toFixed(2)} ({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)
        </span>
      </div>
      {/* Simple line chart could be added here */}
      <div className="h-48 flex items-center justify-center text-gray-500">
        (Line chart from Massive API)
      </div>
    </div>
  );
}
