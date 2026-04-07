"use client";

import { useEffect, useState } from "react";

interface SignalData {
  symbol: string;
  signal: "BUY" | "SELL" | "HOLD";
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  reason: string;
  timestamp: string;
  indicators: {
    rsi: number;
    macd: number;
    macdSignal: number;
    atr: number;
  };
  dataPoints: number;
  source: string;
}

interface SignalCardProps {
  symbol: string;
  timeframe?: string;
  refreshInterval?: number;
}

export default function SignalCard({ symbol, timeframe = "1h", refreshInterval = 300000 }: SignalCardProps) {
  const [signal, setSignal] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignal = async () => {
    try {
      const res = await fetch(`/api/signals?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=200`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setSignal(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignal();
    const interval = setInterval(fetchSignal, refreshInterval);
    return () => clearInterval(interval);
  }, [symbol, timeframe, refreshInterval]);

  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (price >= 1) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    } else {
      return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "BUY": return "text-green-600 dark:text-green-400";
      case "SELL": return "text-red-600 dark:text-red-400";
      default: return "text-yellow-600 dark:text-yellow-400";
    }
  };

  const getSignalBg = (signal: string) => {
    switch (signal) {
      case "BUY": return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800";
      case "SELL": return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800";
      default: return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600 dark:text-green-400";
    if (confidence >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (loading) {
    return (
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">Signal unavailable</p>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 bg-white dark:bg-gray-800 ${getSignalBg(signal.signal)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${getSignalColor(signal.signal)}`}>
            {signal.signal}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {signal.confidence}% confidence
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(signal.timestamp).toLocaleTimeString()}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Entry</span>
          <span className="font-mono font-semibold">${formatPrice(signal.entry)}</span>
        </div>
        
        {signal.stopLoss > 0 && (
          <div className="flex justify-between">
            <span className="text-red-600 dark:text-red-400">Stop Loss</span>
            <span className="font-mono text-red-600 dark:text-red-400">${formatPrice(signal.stopLoss)}</span>
          </div>
        )}
        
        {signal.takeProfit > 0 && (
          <div className="flex justify-between">
            <span className="text-green-600 dark:text-green-400">Take Profit</span>
            <span className="font-mono text-green-600 dark:text-green-400">${formatPrice(signal.takeProfit)}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{signal.reason}</p>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">RSI: </span>
            <span className={signal.indicators.rsi < 30 ? "text-green-600" : signal.indicators.rsi > 70 ? "text-red-600" : ""}>
              {signal.indicators.rsi}
            </span>
          </div>
          <div>
            <span className="text-gray-500">MACD: </span>
            <span className={signal.indicators.macd > signal.indicators.macdSignal ? "text-green-600" : "text-red-600"}>
              {signal.indicators.macd.toFixed(4)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">ATR: </span>
            <span className="text-gray-600 dark:text-gray-300">${formatPrice(signal.indicators.atr)}</span>
          </div>
          <div>
            <span className="text-gray-500">Source: </span>
            <span className="text-gray-600 dark:text-gray-300 capitalize">{signal.source}</span>
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Risk: {(signal.stopLoss > 0 && ((signal.entry - signal.stopLoss) / signal.entry * 100).toFixed(2)) || 0}% | 
        Reward: {(signal.takeProfit > 0 && ((signal.takeProfit - signal.entry) / signal.entry * 100).toFixed(2)) || 0}%
      </div>
    </div>
  );
}
