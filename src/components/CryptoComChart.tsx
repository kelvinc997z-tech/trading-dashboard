"use client";

import { useEffect, useState, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import WatchlistButton from "@/components/watchlist/WatchlistButton";

interface OHLCData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CryptoComChartProps {
  symbol: string;
  timeframe?: string;
  height?: number;
}

export default function CryptoComChart({ symbol, timeframe = "1h", height = 400 }: CryptoComChartProps) {
  const [data, setData] = useState<OHLCData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [changePercent, setChangePercent] = useState<number>(0);
  const [isPositive, setIsPositive] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Use the same market-data API for crypto (Binance, CoinGecko, etc.)
      const res = await fetch(`/api/market-data?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=200`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch data");
      }
      const json = await res.json();
      
      if (json.error) throw new Error(json.error);

      // Transform to our OHLC format
      const history = (json.history || []).map((h: any) => ({
        timestamp: h.time,
        open: h.open,
        high: h.high,
        low: h.low,
        close: h.close,
        volume: h.volume,
      }));

      setData(history);

      // Set current price and change
      if (json.current) {
        setCurrentPrice(json.current.price || json.current.close);
        const changePct = json.current.changePercent || 0;
        setChangePercent(changePct);
        setIsPositive(changePct >= 0);
      }
    } catch (err: any) {
      console.error("[CryptoComChart] Error:", err);
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds for crypto
    const interval = setInterval(fetchData, 30000);
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
          <p className="text-red-600 dark:text-red-400 font-medium">Chart Error</p>
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  // Transform for Recharts line (using close price)
  const chartData = data.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    close: d.close,
  }));

  const latest = data[data.length - 1];
  const prev = data[data.length - 2] || latest;
  const change = latest.close - prev.close;
  const changePct = (change / prev.close) * 100;
  const positive = change >= 0;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{symbol}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ${latest.close.toFixed(2)}
            <span className={`ml-2 ${positive ? 'text-green-500' : 'text-red-500'}`}>
              ({positive ? '+' : ''}{changePct.toFixed(2)}%)
            </span>
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
            stroke={positive ? "#16a34a" : "#dc2626"} 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
