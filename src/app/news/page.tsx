"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Newspaper, Search, RefreshCw, ExternalLink, Clock } from "lucide-react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useLanguage } from "@/context/LanguageContext";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export default function NewsPage() {
  const { t } = useLanguage();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news?limit=30");
      const data = await res.json();
      setNews(data.news || []);
    } catch (e) {
      console.error("Failed to fetch news", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const filteredNews = filter === "all" ? news : news.filter(item => item.category === filter);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0b]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight dark:text-white">
                {t("sentiment.news") || "Market News"}
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global Financial Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <button 
              onClick={fetchNews}
              disabled={loading}
              className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {["all", "crypto", "commodities", "macro"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
                filter === cat 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-800 hover:border-primary/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-40 bg-white dark:bg-gray-800 animate-pulse rounded-3xl border border-gray-100 dark:border-gray-800" />
              ))
            ) : filteredNews.length > 0 ? (
              filteredNews.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 p-6 rounded-[2rem] hover:border-primary/30 transition-all shadow-sm hover:shadow-xl"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded">
                          {item.category}
                        </span>
                        <div className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                          item.sentiment === 'bullish' ? 'bg-emerald-500/10 text-emerald-500' : 
                          item.sentiment === 'bearish' ? 'bg-rose-500/10 text-rose-500' : 
                          'bg-gray-500/10 text-gray-500'
                        }`}>
                          {item.sentiment}
                        </div>
                      </div>
                      <Link href={item.url} target="_blank" className="block">
                        <h2 className="text-xl font-bold group-hover:text-primary transition-colors leading-tight mb-3 dark:text-white">
                          {item.title}
                        </h2>
                      </Link>
                      <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                        {item.summary}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-tighter">
                          <span className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-500">{item.source}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(item.publishedAt)}
                          </span>
                        </div>
                        <Link 
                          href={item.url} 
                          target="_blank"
                          className="flex items-center gap-1 text-xs font-black text-primary hover:underline"
                        >
                          READ MORE <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20">
                <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest">No news found for this category</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
