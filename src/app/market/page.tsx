"use client";

import { useState } from "react";
import Link from "next/link";
import MarketOutlook from "@/components/MarketOutlook";
import MarketSignals from "@/components/MarketSignals";

const newsData = [
  {
    title: "Gold Prices Surge on Economic Data",
    source: "Bloomberg",
    time: "2 hours ago",
    summary: "XAUUSD reaches new highs as inflation concerns mount. Market sentiment turns bullish as key economic indicators suggest continued upward momentum.",
    category: "Commodities"
  },
  {
    title: "Federal Reserve Minutes Signal Cautious Approach",
    source: "Reuters",
    time: "4 hours ago",
    summary: "Federal Reserve meeting minutes indicate a pause in rate hikes may be coming sooner than expected. Markets react positively to the news.",
    category: "Economy"
  },
  {
    title: "Bitcoin ETF Inflows Reach Record Levels",
    source: "CoinDesk",
    time: "6 hours ago",
    summary: "Institutional investment in Bitcoin ETFs hits all-time high. Analysts predict continued growth as adoption increases.",
    category: "Crypto"
  },
  {
    title: "Oil Prices Volatile Amid Geopolitical Tensions",
    source: "CNBC",
    time: "8 hours ago",
    summary: "OPEC+ production decisions and Middle East tensions create volatility in crude oil markets. Traders brace for further swings.",
    category: "Energy"
  },
  {
    title: "Ethereum 2.0 Upgrade Impacts ETH Price",
    source: "CryptoSlate",
    time: "12 hours ago",
    summary: "Successful implementation of Ethereum's latest upgrade drives positive sentiment. ETH shows strength against USD.",
    category: "Crypto"
  },
  {
    title: "USD Weakens Against Major Currencies",
    source: "FXStreet",
    time: "1 day ago",
    summary: "The US dollar index declines as global central banks maintain hawkish stances. EURUSD and GBPUSD benefit from the weakness.",
    category: "Forex"
  },
];

const categories = ["All", "Forex", "Commodities", "Crypto", "Economy", "Energy"];

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<"outlook" | "signals" | "news">("outlook");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredNews = activeCategory === "All" 
    ? newsData 
    : newsData.filter(news => news.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header with Tabs */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Market Overview
          </h1>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab("outlook")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "outlook"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Daily Outlook
              </button>
              <button
                onClick={() => setActiveTab("signals")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "signals"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Trading Signals
              </button>
              <button
                onClick={() => setActiveTab("news")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "news"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                News
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {activeTab === "outlook" && (
            <>
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Daily Market Outlook
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Manual analysis and trading ideas for today's market session.
                  </p>
                </div>
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
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Outlook Signals</span>
                      <span className="font-bold text-lg">6</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Buy Recommendations</span>
                      <span className="font-bold text-lg text-green-500">3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Sell Recommendations</span>
                      <span className="font-bold text-lg text-red-500">3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                      <span className="font-bold text-sm">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Daily outlook is published every morning before market open. Not financial advice.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "signals" && (
            <div className="lg:col-span-3">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Auto-Generated Trading Signals
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Real-time signals based on technical analysis (SMA 20 crossover). Updates automatically every 5 minutes.
                </p>
              </div>
              <MarketSignals />
            </div>
          )}

          {activeTab === "news" && (
            <div className="lg:col-span-3">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Latest Market News</h2>
                
                {/* Category Filter */}
                <div className="flex flex-wrap gap-3 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        activeCategory === cat
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {filteredNews.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No news available for {activeCategory}.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredNews.map((news, i) => (
                      <article key={i} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                            {news.category}
                          </span>
                          <span className="text-xs text-gray-500">{news.source}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{news.time}</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 hover:text-primary cursor-pointer">
                          {news.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {news.summary}
                        </p>
                      </article>
                    ))}
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Disclaimer: News articles are for informational purposes only and do not constitute financial advice. Always conduct your own research before making trading decisions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
