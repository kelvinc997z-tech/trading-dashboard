"use client";

import { useEffect, useState } from "react";

interface Signal {
  symbol: string;
  name: string;
  signal: "buy" | "sell";
  entry: number;
  tp: number;
  sl: number;
  confidence: number;
  reasoning: string;
}

interface OutlookData {
  generatedAt: string;
  pairs: Signal[];
}

export default function MarketOutlook() {
  const [data, setData] = useState<OutlookData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOutlook = async () => {
    try {
      const res = await fetch("/api/market-outlook");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch market outlook:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlook();
    // Refresh every 30 minutes
    const interval = setInterval(fetchOutlook, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4">Loading market outlook...</div>;
  if (!data) return <div className="p-4 text-red-500">Failed to load outlook</div>;

  const formatPrice = (price: number, decimals: number = 2) => {
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const getSignalColor = (signal: string) => {
    return signal === "buy" ? "bg-green-600" : "bg-red-600";
  };

  return (
    <div className="card p-6 bg-white dark:bg-gray-800 rounded-lg shadow h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Market Outlook</h2>
        <span className="text-xs text-gray-500">
          {new Date(data.generatedAt).toLocaleTimeString()}
        </span>
      </div>
      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]">
        {data.pairs.map((pair, idx) => (
          <div key={idx} className={`p-4 rounded-lg border-l-4 ${pair.signal === 'buy' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg">{pair.name}</h3>
                <p className="text-xs text-gray-500">{pair.symbol}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-white text-sm font-bold ${getSignalColor(pair.signal)}`}>
                {pair.signal.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2 text-sm">
              <div>
                <span className="text-gray-500">Entry</span>
                <p className="font-mono font-semibold">{formatPrice(pair.entry)}</p>
              </div>
              <div>
                <span className="text-gray-500">TP</span>
                <p className="font-mono font-semibold text-green-600">{formatPrice(pair.tp)}</p>
              </div>
              <div>
                <span className="text-gray-500">SL</span>
                <p className="font-mono font-semibold text-red-600">{formatPrice(pair.sl)}</p>
              </div>
            </div>

            <div className="mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Confidence</span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${pair.confidence >= 0.7 ? 'bg-green-500' : pair.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${pair.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold">{(pair.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 italic">{pair.reasoning}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p className="italic">Disclaimer: Signals are recommendations, not profit guarantees. Based on current market analysis.</p>
      </div>
    </div>
  );
}
