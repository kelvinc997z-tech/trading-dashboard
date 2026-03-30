"use client";

import { useEffect, useState } from "react";

interface Signal {
  pair: string;
  emoji: string;
  signal: string;
  entry: number;
  tp: number;
  sl: number;
}

interface MarketData {
  date: string;
  market: string;
  signals: Signal[];
  disclaimer: string;
}

export default function MarketSignals() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch("/api/market-signals");
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error("Failed to fetch signals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSignals();
    // Refresh every 5 minutes
    const interval = setInterval(fetchSignals, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.signals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No signals available at the moment.
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    if (Number.isInteger(num)) {
      return num.toString();
    }
    return num.toFixed(5).replace(/\.?0+$/, "");
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Market Signals</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{data.date} • {data.market}</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
          Live
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2">Pair</th>
              <th className="px-3 py-2">Signal</th>
              <th className="px-3 py-2">Entry</th>
              <th className="px-3 py-2">TP</th>
              <th className="px-3 py-2">SL</th>
            </tr>
          </thead>
          <tbody>
            {data.signals.map((s, i) => (
              <tr key={i} className="border-b dark:border-gray-700">
                <td className="px-3 py-2 flex items-center gap-2">
                  <span>{s.emoji}</span>
                  <span className="font-medium">{s.pair}</span>
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${s.signal === "Buy" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"}`}>
                    {s.signal}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono">{formatNumber(s.entry)}</td>
                <td className="px-3 py-2 text-green-600 dark:text-green-400 font-mono">{formatNumber(s.tp)}</td>
                <td className="px-3 py-2 text-red-600 dark:text-red-400 font-mono">{formatNumber(s.sl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 italic">
        {data.disclaimer}
      </p>
    </div>
  );
}
