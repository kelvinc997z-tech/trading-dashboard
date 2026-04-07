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
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (tf = timeframe) => {
    try {
      // Try different symbol formats
      const symbolVariants = [
        symbol,
        `${symbol}.US`,
        `NASDAQ:${symbol}`,
        `NYSE:${symbol}`,
        `${symbol}.XNAS`,
      ];
      
      let lastError: Error | null = null;
      
      for (const sym of symbolVariants) {
        const res = await fetch(`/api/massive/ohlc?symbol=${encodeURIComponent(sym)}&timeframe=${tf}&limit=200`);
        if (!res.ok) {
          lastError = new Error(`HTTP ${res.status}`);
          continue;
        }
        const json = await res.json();
        if (json.error || !json.data || json.data.length === 0) {
          lastError = new Error(json.error || "No data");
          continue;
        }
        setData(json.data);
        setHasData(true);
        setError(null);
        return;
      }
      
      // If all variants failed for this timeframe, try with 1d
      if (tf !== "1d") {
        console.log(`[MassiveStockChart] ${symbol} failed with ${tf}, trying 1d`);
        await fetchData("1d");
        return;
      }
      
      setHasData(false);
      setError(lastError?.message || "No data from Massive");
    } catch (err: any) {
      console.error(`[MassiveStockChart] ${err.message}`);
      setHasData(false);
      setError(err.message);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    setHasData(null);
    fetchData();
  }, [fetchData]);

  if (hasData === false) {
    return <TradingViewWidget symbol={symbol} interval={timeframe} height={height} />;
  }

  if (hasData === null || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  const latest = data[data.length - 1];
  const prev = data[data.length - 2] || latest;
  const change = latest.close - prev.close;
  const changePercent = (change / prev.close) * 100;
  const isPositive = change >= 0;

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
      {/* Simple line chart visualization could be added here */}
      <div className="h-48 flex items-center justify-center text-gray-500">
        (Loaded {data.length} data points from Massive)
      </div>
    </div>
  );
}
