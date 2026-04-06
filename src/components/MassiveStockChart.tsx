import { useEffect, useState, useMemo } from "react";
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
      const res = await fetch(
        `/api/massive/ohlc?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=200`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch stock data from Massive");
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

  // Calculate Change %
  const changeStats = useMemo(() => {
    if (data.length < 2) return { change: 0, changePercent: 0, isPositive: true };
    const latest = data[data.length - 1];
    const prev = data[data.length - 2];
    const change = latest.close - prev.close;
    const changePercent = (change / prev.close) * 100;
    return {
      change,
      changePercent,
      isPositive: change >= 0,
    };
  }, [data]);

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
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">
            Pastikan MASSIVE_API_KEY tersedia dan symbol didukung
          </p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No data available</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Periksa koneksi Massive API
          </p>
        </div>
      </div>
    );
  }

  // Transform for Recharts
  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    close: d.close,
  }));

  const latest = data[data.length - 1];
  const { change, changePercent, isPositive } = changeStats;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {symbol}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ${latest.close.toFixed(2)}
            <span className={`ml-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
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
