"use client";

import { useState, useEffect } from "react";
import { Newspaper, TrendingUp, AlertCircle } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  summary: string;
  url: string;
  category: "market" | "economic" | "breaking";
}

// Mock news data – ganti dengan real API (TradingView News, Finnhub, dll)
const mockNews: NewsItem[] = [
  {
    id: "1",
    title: "Gold prices surge to new all-time highs on geopolitical tensions",
    source: "Bloomberg",
    time: "10 min ago",
    summary: "XAUUSD reach $4570 as safe-haven demand increases amid Middle East concerns.",
    url: "#",
    category: "breaking"
  },
  {
    id: "2",
    title: "US Oil jumps 3% on supply disruption fears",
    source: "Reuters",
    time: "25 min ago",
    summary: "WTI crude rises to $88.50 on reports of potential Strait of Hormuz closure.",
    url: "#",
    category: "market"
  },
  {
    id: "3",
    title: "Fed signals possible rate cuts in 2026",
    source: "CNBC",
    time: "1 hour ago",
    summary: "Federal Reserve officials hint at easing monetary policy, boosting gold's appeal.",
    url: "#",
    category: "economic"
  },
  {
    id: "4",
    title: "Central banks continue gold buying spree",
    source: "Financial Times",
    time: "2 hours ago",
    summary: "China and India expand gold reserves, adding 585 tonnes in Q1 2026.",
    url: "#",
    category: "market"
  },
];

export default function NewsSection() {
  const [activeTab, setActiveTab] = useState<"all" | "breaking" | "market" | "economic">("all");
  const [tickerIndex, setTickerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Breaking news ticker rotation
  useEffect(() => {
    if (isPaused) return;
    const breaking = mockNews.filter(n => n.category === "breaking");
    if (breaking.length === 0) return;

    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % breaking.length);
    }, 8000); // rotate every 8 seconds

    return () => clearInterval(interval);
  }, [isPaused]);

  const filteredNews = activeTab === "all"
    ? mockNews
    : mockNews.filter(n => n.category === activeTab);

  const breakingNews = mockNews.filter(n => n.category === "breaking");

  return (
    <div className="space-y-6">
      {/* Breaking News Ticker */}
      {breakingNews.length > 0 && (
        <div
          className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg overflow-hidden cursor-pointer"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-red-700 px-2 py-1 rounded text-xs font-bold shrink-0">
              <AlertCircle className="w-4 h-4" />
              BREAKING
            </div>
            <div className="overflow-hidden flex-1">
              <div
                className="whitespace-nowrap transition-transform duration-500"
                style={{ transform: `translateX(-${tickerIndex * 100}%)` }}
              >
                {breakingNews.map((news, idx) => (
                  <span key={news.id} className="inline-block mx-8">
                    {news.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* News Tabs */}
      <div>
        <div className="border-b border-gray-200 dark:border-gray-700 flex gap-4">
          {(["all", "breaking", "market", "economic"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {tab === "all" ? "All News" : tab}
              {tab === "breaking" && (
                <span className="ml-1 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200 text-xs px-2 py-0.5 rounded-full">
                  {breakingNews.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* News List */}
        <div className="mt-6 space-y-4">
          {filteredNews.map((news) => (
            <article
              key={news.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      news.category === "breaking"
                        ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200"
                        : news.category === "market"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200"
                    }`}>
                      {news.category.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {news.source}
                    </span>
                    <span className="text-xs text-gray-400">• {news.time}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg leading-tight">
                    {news.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {news.summary}
                  </p>
                </div>
                <Newspaper className="w-8 h-8 text-gray-400 shrink-0 mt-1" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}