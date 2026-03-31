"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MarketData {
  symbol: string;
  current: {
    close: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
  };
  history: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>;
}

interface RealTimeChartProps {
  symbol?: string;
  timeframe?: string;
}

export default function RealTimeChart({ symbol = "XAUT", timeframe = "1h" }: RealTimeChartProps) {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/market-data?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: MarketData = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
        {error || "No data"}
      </div>
    );
  }

  // Transform history for Recharts (use close price)
  const chartData = data.history.map((h) => ({
    time: new Date(h.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    price: h.close,
  }));

  const isPositive = data.current.change >= 0;

  return (
    <ResponsiveContainer width="100%" height={400}>
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
        />
        <Line 
          type="monotone" 
          dataKey="price" 
          stroke={isPositive ? "#16a34a" : "#dc2626"} 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
