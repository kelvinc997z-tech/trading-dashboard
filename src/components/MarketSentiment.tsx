"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface SentimentData {
  overall: {
    score: number;
    trend: "bullish" | "bearish" | "neutral";
    updatedAt: string;
  };
  symbols?: Array<{
    symbol: string;
    score: number;
    trend: "bullish" | "bearish" | "neutral";
    source?: string;
  }>;
}

interface MarketSentimentProps {
  refreshInterval?: number; // ms
}

export default function MarketSentiment({
  refreshInterval = 3600000 // 1 hour (Fear & Greed updates hourly)
}: MarketSentimentProps) {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSentiment = async () => {
    try {
      const res = await fetch('/api/market-sentiment');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setSentiment(data);
      setError(null);
    } catch (err: any) {
      console.error('[MarketSentiment]', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentiment();
    const interval = setInterval(fetchSentiment, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getSentimentLabel = (trend: string) => {
    switch (trend) {
      case "bullish": return "BULLISH";
      case "bearish": return "BEARISH";
      default: return "NEUTRAL";
    }
  };

  const getFearGreedLabel = (score: number): string => {
    if (score >= 0.5) return "Extreme Greed";
    if (score >= 0.2) return "Greed";
    if (score >= -0.2) return "Neutral";
    if (score >= -0.5) return "Fear";
    return "Extreme Fear";
  };

  if (loading || !sentiment) {
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm text-gray-500">Loading market sentiment...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
        <p className="text-xs text-red-600 dark:text-red-400">Failed to load market sentiment</p>
      </div>
    );
  }

  const { overall } = sentiment;

  const score = overall.score ?? 0;
  const trend = overall.trend ?? "neutral";

  const getSentimentColor = (score: number, trend: string) => {
    if (trend === "bullish" || score > 0.3) return "text-green-500";
    if (trend === "bearish" || score < -0.3) return "text-red-500";
    return "text-amber-500";
  };

  const getSentimentBg = (score: number, trend: string) => {
    if (trend === "bullish" || score > 0.3) return "bg-green-500/10 border-green-500/20";
    if (trend === "bearish" || score < -0.3) return "bg-red-500/10 border-red-500/20";
    return "bg-amber-500/10 border-amber-500/20";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 dark:text-white">🧠 Market Sentiment</span>
          <span className="text-xs text-gray-500">Fear & Greed Index</span>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(overall.updatedAt).toLocaleTimeString()}
        </span>
      </div>

      <div className="flex items-center gap-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-4">
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Overall Market</div>
          <div className="flex items-baseline gap-3">
            <motion.div
              key={score}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`text-4xl font-bold ${getSentimentColor(score, trend)}`}
            >
              {Math.round(score * 100)}
            </motion.div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getSentimentBg(score, trend).split(' ')[0]}`}>
              {getSentimentLabel(trend)}
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-2">{getFearGreedLabel(score)}</div>
        </div>

        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-300 dark:text-gray-600" />
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#gradient)" strokeWidth="8" strokeDasharray={`${((score + 1) / 2) * 125.66} 125.66`} strokeLinecap="round" />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#e5e7eb" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <line x1="50" y1="50" x2={50 + 40 * Math.cos(Math.PI - (score + 1) * Math.PI / 2)} y2={50 - 40 * Math.sin(Math.PI - (score + 1) * Math.PI / 2)} stroke="currentColor" strokeWidth="2" className="text-gray-900 dark:text-white" />
            <circle cx="50" cy="50" r="4" className="fill-gray-900 dark:fill-white" />
          </svg>
        </div>
      </div>

      {sentiment.symbols && sentiment.symbols.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">By Asset</div>
          {sentiment.symbols.slice(0, 4).map((s, idx) => (
            <div key={s.symbol} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{s.symbol}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${getSentimentBg(s.score, s.trend).split(' ')[0]}`}>
                  {getSentimentLabel(s.trend)}
                </span>
              </div>
              <div className={`font-mono text-sm ${getSentimentColor(s.score, s.trend)}`}>
                {Math.round(s.score * 100)}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
