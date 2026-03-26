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
  category: "market" | "economic" | "breaking" | "crypto" | "forex" | "general";
}

type TabType = "all" | "breaking" | "market" | "economic" | "crypto" | "forex";

const categoryMap: Record<string, NewsItem["category"]> = {
  general: "market",
  forex: "forex",
  crypto: "crypto",
  stock: "economic",
};

export default function NewsSection() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [tickerIndex, setTickerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch news from API
  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Determine category to fetch based on activeTab
        let apiCategory = "general";
        if (activeTab === "crypto") apiCategory = "crypto";
        if (activeTab === "forex") apiCategory = "forex";
        if (activeTab === "economic") apiCategory = "stock";

        // Fetch from both Finnhub and World Monitor in parallel
        const [finnhubRes, worldMonitorRes] = await Promise.all([
          fetch(`/api/news?category=${apiCategory}`),
          fetch(`/api/news-world-monitor`),
        ]);

        const finnhubData = await finnhubRes.json();
        const worldMonitorData = await worldMonitorRes.json();

        // Combine and deduplicate by title (simple approach)
        const allNews = Array.isArray(finnhubData) ? [...finnhubData] : [];
        if (Array.isArray(worldMonitorData)) {
          // Avoid duplicates by checking title similarity
          for (const wm of worldMonitorData) {
            const exists = allNews.some(n => 
              n.title.toLowerCase().substring(0, 30) === wm.title.toLowerCase().substring(0, 30)
            );
            if (!exists) allNews.push(wm);
          }
        }

        if (allNews.length > 0) {
          setNews(allNews);
        } else {
          setNews(getMockNews());
        }
      } catch (error) {
        console.error("Failed to fetch news:", error);
        setNews(getMockNews());
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [activeTab]);

  // Breaking news ticker rotation
  useEffect(() => {
    if (isPaused) return;
    const breaking = news.filter(n => n.category === "breaking");
    if (breaking.length === 0) return;

    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % breaking.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [isPaused, news]);

  const filteredNews = activeTab === "all"
    ? news
    : news.filter(n => n.category === activeTab);

  const breakingNews = news.filter(n => n.category === "breaking");

  // Mock fallback news
  function getMockNews(): NewsItem[] {
    return [
      {
        id: "1",
        title: "Gold prices surge to new all-time highs on geopolitical tensions",
        source: "Bloomberg",
        time: "10 min ago",
        summary: "XAUUSD reach $4570 as safe-haven demand increases amid Middle East concerns.",
        url: "#",
        category: "breaking",
      },
      {
        id: "2",
        title: "US Oil jumps 3% on supply disruption fears",
        source: "Reuters",
        time: "25 min ago",
        summary: "WTI crude rises to $88.50 on reports of potential Strait of Hormuz closure.",
        url: "#",
        category: "market",
      },
      {
        id: "3",
        title: "Fed signals possible rate cuts in 2026",
        source: "CNBC",
        time: "1 hour ago",
        summary: "Federal Reserve officials hint at easing monetary policy, boosting gold's appeal.",
        url: "#",
        category: "economic",
      },
      {
        id: "4",
        title: "Bitcoin breaks $68k resistance",
        source: "CoinDesk",
        time: "2 hours ago",
        summary: "BTC rallies past $68,000 amid increased institutional inflows.",
        url: "#",
        category: "crypto",
      },
    ];
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded-xl" />
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded-xl" />
      </div>
    );
  }

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
        <div className="border-b border-gray-200 dark:border-gray-700 flex gap-4 overflow-x-auto">
          {(["all", "breaking", "market", "economic", "crypto", "forex"] as TabType[]).map((tab) => {
            const count = tab === "breaking" ? breakingNews.length : 
                         tab === "all" ? news.length :
                         tab === "crypto" ? news.filter(n => n.category === "crypto").length :
                         tab === "forex" ? news.filter(n => n.category === "forex").length :
                         tab === "market" ? news.filter(n => n.category === "market").length :
                         news.filter(n => n.category === "economic").length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                {count > 0 && (
                  <span className="ml-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* News List */}
        <div className="mt-6 space-y-4">
          {filteredNews.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No news available for this category.</p>
            </div>
          ) : (
            filteredNews.map((news) => (
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
                          : news.category === "crypto"
                          ? "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200"
                          : news.category === "forex"
                          ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200"
                          : "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200"
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}