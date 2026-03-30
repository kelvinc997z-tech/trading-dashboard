"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import MarketOutlook from "@/components/MarketOutlook";
import MarketSignals from "@/components/MarketSignals";
import NewsCard from "@/components/NewsCard";
import SearchBar from "@/components/SearchBar";
import BreakingTicker from "@/components/BreakingTicker";
import { useTheme } from "@/components/ThemeProvider";

const categories = ["all", "crypto", "macro", "commodities", "forex"];
const timeframes = ["24h", "7d", "30d"];
const languages = ["en", "id"];

export default function MarketPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"outlook" | "signals" | "news">("news");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTimeframe, setActiveTimeframe] = useState("24h");
  const [activeLang, setActiveLang] = useState("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarksOnly, setBookmarksOnly] = useState(false);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.append("category", activeCategory);
      params.append("timeframe", activeTimeframe);
      if (searchQuery) params.append("q", searchQuery);
      params.append("lang", activeLang);
      const res = await fetch(`/api/news?${params.toString()}`);
      if (res.ok) {
        const { news: data } = await res.json();
        setNews(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeTimeframe, searchQuery, activeLang]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const displayedNews = bookmarksOnly
    ? news.filter((n) => JSON.parse(localStorage.getItem("newsBookmarks") || "[]").includes(n.id))
    : news;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BreakingTicker />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary mb-2">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Market Overview</h1>
          </div>

          <div className="flex items-center gap-2">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex gap-8">
            {(["outlook", "signals", "news"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab === "outlook" ? "Daily Outlook" : tab === "signals" ? "Trading Signals" : "News"}
              </button>
            ))}
          </nav>
        </div>

        {/* Outlook & Signals */}
        {activeTab !== "news" && (
          <div className="grid lg:grid-cols-3 gap-8">
            {activeTab === "outlook" && (
              <>
                <div className="lg:col-span-2">
                  <MarketOutlook />
                </div>
                <div className="lg:col-span-1">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 sticky top-4">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Quick Stats
                    </h2>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Outlook Signals</span>
                        <span className="font-bold">6</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Buy Recommendations</span>
                        <span className="font-bold text-green-500">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Sell Recommendations</span>
                        <span className="font-bold text-red-500">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                        <span className="font-bold text-sm">{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        Daily outlook published before market open. Not financial advice.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeTab === "signals" && (
              <div className="lg:col-span-3">
                <MarketSignals />
              </div>
            )}
          </div>
        )}

        {/* News Tab */}
        {activeTab === "news" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                      activeCategory === cat
                        ? "bg-primary text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <select
                  value={activeTimeframe}
                  onChange={(e) => setActiveTimeframe(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                >
                  {timeframes.map(tf => (
                    <option key={tf} value={tf}>{tf === "24h" ? "Last 24 Hours" : tf === "7d" ? "Last 7 Days" : "Last 30 Days"}</option>
                  ))}
                </select>
                <select
                  value={activeLang}
                  onChange={(e) => setActiveLang(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                >
                  {languages.map(l => (
                    <option key={l} value={l}>{l === "en" ? "English" : "Indonesia"}</option>
                  ))}
                </select>
                <button
                  onClick={() => setBookmarksOnly(!bookmarksOnly)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    bookmarksOnly
                      ? "bg-primary text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {bookmarksOnly ? "Showing Bookmarks" : "Show Bookmarks"}
                </button>
              </div>
            </div>

            {/* News List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : displayedNews.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {bookmarksOnly ? "No bookmarked news yet." : "No news found for the selected filters."}
              </div>
            ) : (
              <div className="grid gap-6">
                {displayedNews.map((item) => (
                  <NewsCard key={item.id} news={item} />
                ))}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This news feed is curated from various sources. Data is for informational purposes only and does not constitute financial advice.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
