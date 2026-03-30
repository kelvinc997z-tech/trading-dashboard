"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content?: string;
  source: string;
  sourceUrl?: string;
  publishedAt: string;
  category: string;
  sentiment: "bullish" | "bearish" | "neutral";
  relatedSymbols: string[];
  impact: "high" | "medium" | "low";
  language: string;
}

interface NewsCardProps {
  news: NewsItem;
}

const categoryLabels: Record<string, string> = {
  crypto: "Crypto",
  macro: "Macro",
  commodities: "Commodities",
  all: "All",
};

const sentimentConfig = {
  bullish: { icon: TrendingUp, color: "text-green-600", bg: "bg-green-100", label: "Bullish" },
  bearish: { icon: TrendingDown, color: "text-red-600", bg: "bg-red-100", label: "Bearish" },
  neutral: { icon: Minus, color: "text-gray-600", bg: "bg-gray-100", label: "Neutral" },
};

const impactColors = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

export default function NewsCard({ news }: NewsCardProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("newsBookmarks") || "[]");
    setBookmarked(stored.includes(news.id));
  }, [news.id]);

  const toggleBookmark = () => {
    const stored = JSON.parse(localStorage.getItem("newsBookmarks") || "[]");
    let updated;
    if (bookmarked) {
      updated = stored.filter((id: string) => id !== news.id);
    } else {
      updated = [...stored, news.id];
    }
    localStorage.setItem("newsBookmarks", JSON.stringify(updated));
    setBookmarked(!bookmarked);
  };

  const dateStr = new Date(news.publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const sentiment = sentimentConfig[news.sentiment];
  const SentimentIcon = sentiment.icon;

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow transition">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">{news.source}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">{dateStr}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${sentiment.bg} ${sentiment.color}`}>
            {sentiment.label}
          </span>
          {news.impact && (
            <span className={`text-xs text-white px-2 py-0.5 rounded-full ${impactColors[news.impact]}`}>
              {news.impact}
            </span>
          )}
        </div>
        <button
          onClick={toggleBookmark}
          className={`p-1 rounded ${bookmarked ? "text-yellow-500" : "text-gray-400"}`}
          title={bookmarked ? "Remove bookmark" : "Bookmark"}
        >
          <Bookmark className="w-5 h-5" fill={bookmarked ? "currentColor" : "none"} />
        </button>
      </div>

      <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{news.title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
        {expanded ? news.content || news.summary : news.summary}
      </p>
      {news.content && news.summary !== news.content && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:underline mb-3"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {news.relatedSymbols.map((sym) => (
          <Link
            key={sym}
            href={`/dashboard?symbol=${encodeURIComponent(sym)}`}
            className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {sym}
          </Link>
        ))}
        {news.sourceUrl && (
          <a
            href={news.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline ml-auto"
          >
            <ExternalLink className="w-3 h-3" />
            Source
          </a>
        )}
      </div>
    </div>
  );
}
