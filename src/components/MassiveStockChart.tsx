"use client";

import { useEffect, useState, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import WatchlistButton from "@/components/watchlist/WatchlistButton";
import { isCryptoSymbol } from "@/lib/yahoo-finance";

interface OHLCData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface MassiveStockChartProps {
  symbol: string;
  timeframe?: string;
  height?: number;
}

export default function MassiveStockChart({ symbol, timeframe = "1h", height = 400 }: MassiveStockChartProps) {
  const [data, setData] = useState<OHLCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/massive/ohlc?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=200`);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      const json = await res.json();
      if (json.error || !json.data || json.data.length === 0) {
        throw new Error(json.error || "No data returned");
      }
      // Validate data: filter out NaN/Infinity values
      const validData = json.data.filter((d: any) => {
        const close = Number(d.close);
        return isFinite(close) && close > 0;
      });
      if (validData.length === 0) {
        throw new Error("All price data is invalid");
      }
      setData(validData);
      setSource(json.source || "unknown");
    } catch (err: any) {
      console.error(`[MassiveStockChart] ${symbol}:`, err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes (300000 ms) to avoid rate limiting
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">Data unavailable</p>
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
          {error.includes('429') || error.includes('rate') ? (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              API rate limit exceeded. Data will refresh automatically when available.
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Check symbol or network connection.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">No data available for {symbol}</p>
      </div>
    );
  }

  // Calculate change stats
  const latest = data[data.length - 1];
  const prev = data[data.length - 2] || latest;
  const change = latest.close - prev.close;
  const changePercent = (change / prev.close) * 100;
  const isPositive = change >= 0;

  // Transform for Recharts line chart
  const chartData = data.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    close: d.close,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{symbol}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ${latest.close.toFixed(2)}
            <span className={`ml-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
            </span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Source: {source === 'yahoo' ? 'Yahoo Finance' : source === 'binance' ? 'Binance' : 'Massive'} •
            {' '}{isCryptoSymbol(symbol) ? 'Crypto' : 'US Stock'}
          </p>
        </div>
        <WatchlistButton symbol={symbol} size={24} />
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            className="text-gray-600 dark:text-gray-300"
          />
          <YAxis 
            domain={['auto', 'auto']}
            tick={{ fontSize: 12 }}
            className="text-gray-600 dark:text-gray-300"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--tooltip-bg, white)',
              border: '1px solid var(--tooltip-border, #e5e7eb)',
              borderRadius: '0.5rem',
              color: 'var(--tooltip-color, #111827)'
            }}
            formatter={(value: number, name: string) => [value.toFixed(2), name.toUpperCase()]}
          />
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke={isPositive ? "#16a34a" : "#dc2626"} 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
        <span>Data source: Yahoo Finance {source === 'massive' ? '(fallback)' : ''}</span>
        <span>Last updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}
