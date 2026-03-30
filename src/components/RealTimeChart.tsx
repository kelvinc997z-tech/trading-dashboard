"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PriceData {
  time: string;
  price: number;
}

interface MarketData {
  symbol: string;
  current: {
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
  };
  history: PriceData[];
}

interface RealTimeChartProps {
  symbol?: string;
}

export default function RealTimeChart({ symbol = "XAU/USD" }: RealTimeChartProps) {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/market-data?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const result = await res.json();
      
      // Validate: must have current.price
      if (!result.current?.price || isNaN(result.current.price)) {
        throw new Error("Invalid price data");
      }
      
      // Ensure history is array (might be empty)
      if (!Array.isArray(result.history)) {
        result.history = [];
      }
      
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
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
        No data available for {symbol}
      </div>
    );
  }

  const { current, history } = data;
  const isPositive = current.change >= 0;

  // Format price based on symbol
  const formatPrice = (price: number) => {
    if (symbol.includes("XAU") || symbol.includes("Gold")) return price.toFixed(2);
    if (symbol.includes("BTC") || symbol.includes("ETH") || symbol.includes("SOL")) return price.toFixed(2);
    if (symbol.includes("XRP")) return price.toFixed(5);
    return price.toFixed(2);
  };

  // If no history, show only current price without chart
  if (!history || history.length === 0) {
    return (
      <div>
        {/* Current Price Display */}
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{symbol}</div>
            <div className="text-2xl font-bold">${formatPrice(current.price)}</div>
            <div className={`text-xs flex items-center ${isPositive ? "text-green-500" : "text-red-500"}`}>
              {isPositive ? "+" : ""}{current.change.toFixed(2)} ({isPositive ? "+" : ""}{current.changePercent.toFixed(2)}%)
            </div>
          </div>
          <div className="text-right text-xs text-gray-500 dark:text-gray-400">
            <div>High: ${formatPrice(current.high)}</div>
            <div>Low: ${formatPrice(current.low)}</div>
          </div>
        </div>
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          No historical data available
        </div>
        <div className="mt-1 text-[10px] text-gray-400 text-center">
          Updates every 30s
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Current Price Display */}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{symbol}</div>
          <div className="text-2xl font-bold">${formatPrice(current.price)}</div>
          <div className={`text-xs flex items-center ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {isPositive ? "+" : ""}{current.change.toFixed(2)} ({isPositive ? "+" : ""}{current.changePercent.toFixed(2)}%)
          </div>
        </div>
        <div className="text-right text-xs text-gray-500 dark:text-gray-400">
          <div>High: ${formatPrice(current.high)}</div>
          <div>Low: ${formatPrice(current.low)}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              domain={["auto", "auto"]}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
              contentStyle={{ borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "12px" }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 text-[10px] text-gray-400 text-center">
        Updates every 30s
      </div>
    </div>
  );
}
