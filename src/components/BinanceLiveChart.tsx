"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useBinanceWebSocket } from "@/hooks/useBinanceWebSocket";

interface BinanceLiveChartProps {
  symbol: string; // e.g., "BTC", "ETH", "SOL", "XRP", "XAU"
  interval?: string; // default "1h"
  height?: number;
  showArea?: boolean;
}

export default function BinanceLiveChart({ symbol, interval = "1h", height = 400, showArea = false }: BinanceLiveChartProps) {
  const [data, setData] = useState<Array<{ time: string; price: number; volume: number }>>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [change, setChange] = useState<number>(0);
  const [changePercent, setChangePercent] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>("");
  
  const shouldAcceptWsUpdates = useRef(false);
  const wsSymbol = `${symbol.toLowerCase()}usdt`;

  // Fetch initial historical data via REST
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const upperSymbol = symbol.toUpperCase();
      const res = await fetch(`/api/market-data?symbol=${upperSymbol}&timeframe=${interval}`);
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const result = await res.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Transform to chart data
      const history = (result.history || []).map((h: any) => ({
        time: h.time,
        price: h.price || h.close,
        volume: h.volume || 0,
      }));

      setData(history);
      setDataSource(result.source || "binance");
      shouldAcceptWsUpdates.current = true;

      // Compute current price and change from history
      if (history.length > 0) {
        const last = history[history.length - 1].price;
        const prev = history[history.length - 2]?.price || last;
        setCurrentPrice(last);
        setChange(last - prev);
        setChangePercent(((last - prev) / prev) * 100);
      }
    } catch (err: any) {
      console.error("Crypto data fetch error:", err);
      setError(err.message);
      shouldAcceptWsUpdates.current = false;
      // Use fallback synthetic data
      const fallback = generateFallbackData(symbol, 200);
      setData(fallback);
      if (fallback.length > 0) {
        const last = fallback[fallback.length - 1].price;
        const prev = fallback[fallback.length - 2]?.price || last;
        setCurrentPrice(last);
        setChange(last - prev);
        setChangePercent(((last - prev) / prev) * 100);
        setDataSource("synthetic");
      }
    } finally {
      setLoading(false);
    }
  }, [symbol, interval]);

  // Fetch initial data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket onData handler (memoized)
  const handleWsData = useCallback((kline: { time: string; close: number; volume: number }) => {
    if (!shouldAcceptWsUpdates.current) return;

    setData(prev => {
      const prevPrice = prev[prev.length - 1]?.price;
      const newPoint = { time: kline.time, price: kline.close, volume: kline.volume };
      const updated = [...prev, newPoint].slice(-200);
      
      // Update change and current price
      setCurrentPrice(kline.close);
      if (prevPrice !== undefined) {
        const changeVal = kline.close - prevPrice;
        setChange(changeVal);
        setChangePercent((changeVal / prevPrice) * 100);
      }
      
      return updated;
    });
  }, []); // setters are stable

  const handleWsError = useCallback((err: Event) => {
    console.error("WebSocket error:", err);
    // Could trigger fallback to REST polling if needed
  }, []);

  // WebSocket for real-time updates
  useBinanceWebSocket({
    symbol: wsSymbol,
    interval,
    onData: handleWsData,
    onError: handleWsError
  });

  // Calculate min/max for Y-axis domain
  const prices = data.map(d => d.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const pricePadding = (maxPrice - minPrice) * 0.1;

  if (loading) {
    return (
      <div className="w-full" style={{ height }}>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading chart...
        </div>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="w-full border border-red-200 dark:border-red-900 rounded-lg p-4" style={{ height }}>
        <div className="text-red-600 dark:text-red-400 text-sm mb-2">
          {error}
        </div>
        <div className="text-xs text-muted-foreground mb-2">
          Source: {dataSource}
        </div>
        <ResponsiveContainer width="100%" height={height - 60}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="price" stroke="#10b981" fillOpacity={1} fill="url(#colorPrice)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        {showArea ? (
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis 
              dataKey="time" 
              hide 
            />
            <YAxis 
              domain={[minPrice - pricePadding, maxPrice + pricePadding]} 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                background: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))"
              }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
            />
            <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis 
              dataKey="time" 
              hide 
            />
            <YAxis 
              domain={[minPrice - pricePadding, maxPrice + pricePadding]} 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                background: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))"
              }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#10b981" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4, fill: "#10b981" }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
          {dataSource}
        </span>
        {currentPrice && (
          <>
            <span>Current: ${currentPrice.toFixed(2)}</span>
            <span className={change >= 0 ? "text-emerald-500" : "text-rose-500"}>
              {change >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
            </span>
          </>
        )}
        <span className="ml-auto text-xs text-muted-foreground/70">
          {data.length} points
        </span>
      </div>
    </div>
  );
}

// Fallback synthetic data generator
function generateFallbackData(symbol: string, points: number = 50) {
  const basePrices: Record<string, number> = {
    XAUT: 2350,
    BTC: 65000,
    ETH: 3500,
    SOL: 150,
    XRP: 0.6,
    KAS: 0.17,
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
    const time = new Date(now - (points - 1 - i) * 60000);
    const noise = (Math.random() - 0.5) * base * 0.02;
    const price = base + noise + (i * (base * 0.0001));
    data.push({
      time: time.toISOString(),
      price: Number(price.toFixed(2)),
      volume: Math.floor(Math.random() * 1000) + 100,
    });
  }
  return data;
}
