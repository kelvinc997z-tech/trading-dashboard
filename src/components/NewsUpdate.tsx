"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  summary?: string;
}

interface NewsUpdateProps {
  limit?: number;
  refreshInterval?: number; // ms
}

export default function NewsUpdate({
  limit = 5,
  refreshInterval = 300000 // 5 minutes
}: NewsUpdateProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news?limit=' + limit);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();

      const newsItems: NewsItem[] = (data.news || []).map((item: any) => ({
        id: item.id || item.url,
        title: item.title,
        source: item.source || 'Unknown',
        publishedAt: item.publishedAt || item.published_at,
        url: item.url,
        summary: item.summary || item.description,
      }));

      setNews(newsItems);
      setError(null);
    } catch (err: any) {
      console.error('[NewsUpdate]', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, limit]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading && news.length === 0) {
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm text-gray-500">Loading news...</span>
      </div>
    );
  }

  if (error && news.length === 0) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
        <p className="text-xs text-red-600 dark:text-red-400">Failed to load news</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 dark:text-white">📰 Market News</span>
          <span className="text-xs text-gray-500">Latest updates</span>
        </div>
        <Link href="/news" className="text-xs text-amber-600 dark:text-amber-400 hover:underline">
          View all →
        </Link>
      </div>

      <div className="space-y-3">
        {news.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-amber-500/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Link href={item.url} target="_blank" rel="noopener noreferrer">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug hover:text-amber-600 dark:hover:text-amber-400 transition-colors line-clamp-2">
                    {item.title}
                  </h4>
                </Link>
                {item.summary && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {item.summary}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {item.source}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(item.publishedAt)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {news.length === 0 && !loading && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No news available at the moment
        </div>
      )}
    </motion.div>
  );
}
