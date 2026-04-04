"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

// Fallback data generator when API fails
function generateFallbackData(symbol: string, points: number = 50) {
  const basePrices: Record<string, number> = {
    XAUT: 2350,
    BTC: 65000,
    ETH: 3500,
    SOL: 150,
    XRP: 0.6,
    AAPL: 170,
    AMD: 120,
    NVDA: 240,
    MSFT: 330,
    GOOGL: 140,
  };
  const base = basePrices[symbol] || 100;
  const data: Array<{ time: string; price: number; volume: number }> = [];
  const now = Date.now();
  for (let i = 0; i < points; i++) {
    const time = new Date(now - (points - 1 - i) * 60000); // 1 minute intervals
    const noise = (Math.random() - 0.5) * base * 0.02;
    const price = base + noise + (i * (base * 0.0001)); // slight trend
    data.push({
      time: time.toISOString(),
      price: Number(price.toFixed(2)),
      volume: Math.floor(Math.random() * 1000) + 100,
    });
  }
  return data;
}

export default function LiveMarketChart({ symbol = "XAUT/USD" }) {
  const [data, setData] = useState<any[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [change, setChange] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const res = await fetch(`/api/market-data?symbol=${encodeURIComponent(symbol)}`, {
        next: { revalidate: 5 } // cache for 5 seconds
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const result = await res.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.history && Array.isArray(result.history) && result.history.length > 0) {
        setData(result.history);
      } else {
        throw new Error("No history data returned");
      }
      
      if (result.current) {
        setCurrent(result.current.price);
        setChange(result.current.changePercent || 0);
      }
    } catch (err: any) {
      console.error("[LiveMarketChart] Fetch error:", err);
      setError(err.message || "Failed to load market data");
      // Use fallback data so UI still shows something
      const fallback = generateFallbackData(symbol, 50);
      setData(fallback);
      if (fallback.length > 0) {
        const last = fallback[fallback.length - 1];
        const prev = fallback.length > 1 ? fallback[fallback.length - 2] : last;
        setCurrent(last.price);
        setChange(((last.price - prev.price) / prev.price) * 100);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [symbol]);

  // Format time for X-axis
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  // Determine color based on trend
  const isPositive = change >= 0;
  const lineColor = isPositive ? "#10b981" : "#ef4444";
  const gradientId = `gradient-${symbol.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg p-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div>
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
            {symbol} Live
          </h3>
          <p className="text-xs text-gray-400 mt-1">Real-time price & volume</p>
        </div>
        {current !== null && (
          <div className={`text-right ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
            <div className="text-2xl font-mono font-bold">
              ${current.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-sm font-medium ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
              {isPositive ? "+" : ""}{change.toFixed(2)}% ({isPositive ? "▲" : "▼"})
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-3 p-2 bg-amber-900/30 border border-amber-700/50 rounded text-amber-300 text-xs">
          ⚠️ Using simulated data: {error}
        </div>
      )}

      <div className="h-64 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-cyan-400">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              <span className="text-sm">Loading market data...</span>
            </div>
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="time" 
                tickFormatter={formatTime}
                tick={{ fill: "#9ca3af", fontSize: 10 }}
                axisLine={{ stroke: "#4b5563" }}
                tickLine={{ stroke: "#4b5563" }}
              />
              <YAxis 
                domain={["auto", "auto"]} 
                tick={{ fill: "#9ca3af", fontSize: 10 }}
                axisLine={{ stroke: "#4b5563" }}
                tickLine={{ stroke: "#4b5563" }}
                tickFormatter={(v) => `$${v.toFixed(2)}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#1f2937", 
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#f3f4f6"
                }}
                labelFormatter={formatTime}
                formatter={(value: number) => [`$${value.toFixed(2)}`, symbol]}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={lineColor} 
                strokeWidth={2}
                fill={`url(#${gradientId})`} 
                dot={false}
                activeDot={{ r: 4, fill: lineColor, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📉</div>
              <div className="text-sm">No data available</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
