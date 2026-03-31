"use client";

import { useEffect, useState } from "react";
import { Activity, TrendingUp, TrendingDown, Minus, Newspaper } from "lucide-react";

interface SentimentData {
  symbol: string;
  score: number;
  confidence: number;
  trend: "bullish" | "bearish" | "neutral";
  newsCount: number;
  positiveNews: number;
  negativeNews: number;
  sources: string[];
  lastUpdated: string;
}

interface MarketSentimentProps {
  symbols?: string[];
}

export default function MarketSentiment({ symbols = ["BTC", "ETH", "XAUT", "SOL", "XRP"] }: MarketSentimentProps) {
  const [sentiments, setSentiments] = useState<SentimentData[]>([]);
  const [overall, setOverall] = useState<{ score: number; trend: string; updatedAt: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSentiment = async () => {
    try {
      const res = await fetch("/api/market-sentiment");
      if (res.ok) {
        const data = await res.json();
        setOverall(data.overall);
        setSentiments(data.symbols || []);
      }
    } catch (err) {
      console.error("Failed to fetch sentiment:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentiment();
    // Refresh every 15 minutes
    const interval = setInterval(fetchSentiment, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getSentimentColor = (score: number) => {
    if (score > 0.2) return "text-green-600 dark:text-green-400";
    if (score < -0.2) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getSentimentBg = (score: number) => {
    if (score > 0.2) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    if (score < -0.2) return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    return "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "bullish":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "bearish":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border">
        <div className="animate-pulse flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Market Sentiment</h3>
        </div>
        {overall && (
          <div className="flex items-center gap-2 text-sm">
            <span className={`font-medium ${getSentimentColor(overall.score)}`}>
              {overall.trend.toUpperCase()}
            </span>
            {getTrendIcon(overall.trend)}
          </div>
        )}
      </div>

      {/* Overall Sentiment Score */}
      {overall && (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Score</span>
            <span className="text-xs text-gray-500">
              {new Date(overall.updatedAt).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${getSentimentColor(overall.score)}`}>
              {(overall.score * 100).toFixed(1)}
            </span>
            <span className="text-sm text-gray-500">/ 100</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                overall.score > 0.1
                  ? "bg-gradient-to-r from-green-400 to-green-600"
                  : overall.score < -0.1
                  ? "bg-gradient-to-r from-red-400 to-red-600"
                  : "bg-gradient-to-r from-gray-400 to-gray-600"
              }`}
              style={{ width: `${(overall.score + 1) * 50}%` }}
            />
          </div>
        </div>
      )}

      {/* Per-Symbol Sentiment */}
      <div className="space-y-2">
        {sentiments
          .filter(s => symbols.includes(s.symbol))
          .map((sentiment) => (
            <div
              key={sentiment.symbol}
              className={`p-3 rounded-lg border ${getSentimentBg(sentiment.score)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{sentiment.symbol}</span>
                  {getTrendIcon(sentiment.trend)}
                </div>
                <span className={`text-sm font-bold ${getSentimentColor(sentiment.score)}`}>
                  {(sentiment.score * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                <span>Confidence: {(sentiment.confidence * 100).toFixed(0)}%</span>
                <span>{sentiment.newsCount} news</span>
              </div>

              <div className="flex gap-2 text-xs">
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded">
                  +{sentiment.positiveNews}
                </span>
                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded">
                  -{sentiment.negativeNews}
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 border-t pt-2">
        <div className="flex items-center justify-between">
          <span>Updates every 15 min</span>
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:underline"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
