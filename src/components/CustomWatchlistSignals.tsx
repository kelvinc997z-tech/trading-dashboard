"use client";

import { useEffect, useState } from "react";

interface Signal {
  symbol: string;
  name: string;
  emoji: string;
  signal: "buy" | "sell" | "neutral";
  entry: number;
  tp: number;
  sl: number;
  confidence: number;
  reasoning: string;
  indicators: {
    rsi: number;
    macd: { macd: number; signal: number };
    sma: { fast: number; slow: number };
    trend: "bullish" | "bearish" | "neutral";
  };
}

export default function CustomWatchlistSignals() {
  const [data, setData] = useState<{ pairs: Signal[]; generatedAt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("1h");

  const fetchSignals = async () => {
    try {
      const res = await fetch(`/api/watchlist-signals?timeframe=${timeframe}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch signals:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 60000); // update every minute
    return () => clearInterval(interval);
  }, [timeframe]);

  if (loading) return <div className="p-4">Loading custom signals...</div>;
  if (!data) return <div className="p-4 text-red-500">Failed to load signals</div>;

  const formatPrice = (price: number, decimals: number = 2) => {
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const getSignalColor = (signal: string) => {
    return signal === "buy" ? "bg-green-600" : signal === "sell" ? "bg-red-600" : "bg-gray-600";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "bullish": return "📈";
      case "bearish": return "📉";
      default: return "➡️";
    }
  };

  return (
    <div className="card p-6 bg-white dark:bg-gray-800 rounded-lg shadow h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Custom Watchlist Signals</h2>
        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-sm border rounded px-2 py-1 bg-background"
          >
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="1d">1d</option>
          </select>
          <span className="text-xs text-gray-500">
            {new Date(data.generatedAt).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700/50">
              <th className="px-3 py-2 text-left">Pair</th>
              <th className="px-3 py-2 text-center">Signal</th>
              <th className="px-3 py-2 text-right">Entry</th>
              <th className="px-3 py-2 text-right">TP</th>
              <th className="px-3 py-2 text-right">SL</th>
              <th className="px-3 py-2 text-center">Conf.</th>
              <th className="px-3 py-2 text-center">RSI</th>
              <th className="px-3 py-2 text-center">Trend</th>
            </tr>
          </thead>
          <tbody>
            {data.pairs.map((pair, idx) => (
              <tr key={idx} className={`border-b border-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-900/30 ${pair.signal === 'buy' ? 'bg-green-50/30 dark:bg-green-900/10' : pair.signal === 'sell' ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span>{pair.emoji}</span>
                    <span className="font-medium">{pair.name}</span>
                    <span className="text-xs text-gray-500">{pair.symbol}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`px-2 py-1 rounded text-white text-xs font-bold ${getSignalColor(pair.signal)}`}>
                    {pair.signal.toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-mono">{formatPrice(pair.entry)}</td>
                <td className="px-3 py-3 text-right font-mono text-green-600">{formatPrice(pair.tp)}</td>
                <td className="px-3 py-3 text-right font-mono text-red-600">{formatPrice(pair.sl)}</td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${pair.confidence >= 0.7 ? 'bg-green-500' : pair.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${pair.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs">{(pair.confidence * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center font-mono">{pair.indicators.rsi}</td>
                <td className="px-3 py-3 text-center">
                  <span className="flex items-center justify-center gap-1">
                    {getTrendIcon(pair.indicators.trend)}
                    <span className="text-xs">{pair.indicators.trend}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p className="italic">Auto-generated trading signals based on technical analysis (RSI, MACD, SMA). Updates every minute.</p>
      </div>
    </div>
  );
}
