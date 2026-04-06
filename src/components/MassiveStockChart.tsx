import { useEffect, useState } from "react";
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

interface MassiveStockChartProps {
  symbol: string;
  timeframe?: string;
  height?: number;
}

export default function MassiveStockChart({ symbol, timeframe = "1h", height = 400 }: MassiveStockChartProps) {
  const [data, setData] = useState<OHLCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch from database via API (we'll create this endpoint)
      const res = await fetch(`/api/stocks/ohlc?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=200`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch stock data");
      }
      const json = await res.json();
      setData(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
        {error || "No data available"}
      </div>
    );
  }

  // Transform for Recharts
  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
  }));

  const latest = data[data.length - 1];
  const prev = data[data.length - 2] || latest;
  const change = latest.close - prev.close;
  const changePercent = (change / prev.close) * 100;
  const isPositive = change >= 0;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {symbol}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
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
    </>
  );
}
