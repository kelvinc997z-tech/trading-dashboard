"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Newspaper, 
  MessageSquare, 
  Twitter, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Search,
  Zap,
  ChevronRight,
  AlertCircle
} from "lucide-react";

interface Article {
  headline: string;
  summary: string;
  source: string;
  datetime: number;
  sentiment: string;
}

interface SocialMetric {
  score: number;
  mentions: number;
  sentiment: string;
}

interface SentimentData {
  symbol: string;
  period: string;
  score: number;
  articles: Article[];
  totalArticles: number;
  social: {
    reddit: SocialMetric;
    twitter: SocialMetric;
  };
  updatedAt: string;
}

interface MarketSentiment {
  overall: {
    score: number;
    trend: string;
    updatedAt: string;
  };
}

import { useLanguage } from "@/context/LanguageContext";

export default function SentimentClient() {
  const { t } = useLanguage();
  const [symbol, setSymbol] = useState("BTC");
  const [period, setPeriod] = useState("1d");
  const [data, setData] = useState<SentimentData | null>(null);
  const [marketSenti, setMarketSenti] = useState<MarketSentiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sentiRes, marketRes] = await Promise.all([
        fetch(`/api/sentiment?symbol=${symbol}&period=${period}`),
        fetch('/api/market-sentiment')
      ]);

      if (!sentiRes.ok || !marketRes.ok) throw new Error("Gagal mengambil data sentimen");

      const [sentiData, marketData] = await Promise.all([
        sentiRes.json(),
        marketRes.json()
      ]);

      setData(sentiData);
      setMarketSenti(marketData);
    } catch (e: any) {
      console.error("[Sentiment]", e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol, period]);

  const getSentimentColor = (score: number) => {
    if (score > 0.2) return "text-emerald-500";
    if (score < -0.2) return "text-rose-500";
    return "text-amber-500";
  };

  const getSentimentBg = (score: number) => {
    if (score > 0.2) return "bg-emerald-500/10 border-emerald-500/20";
    if (score < -0.2) return "bg-rose-500/10 border-rose-500/20";
    return "bg-amber-500/10 border-amber-500/20";
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.5) return "Strongly Bullish";
    if (score > 0.1) return "Bullish";
    if (score < -0.5) return "Strongly Bearish";
    if (score < -0.1) return "Bearish";
    return "Neutral";
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 glass-card rounded-2xl">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={symbol} 
              onChange={e => setSymbol(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
              <option value="SOL">Solana (SOL)</option>
              <option value="XRP">Ripple (XRP)</option>
              <option value="XAUT">Gold (XAUT)</option>
            </select>
          </div>
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value)}
            className="px-4 py-2 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="1d">{t("sentiment.last_24h") || "Terakhir 24 Jam"}</option>
            <option value="1w">{t("sentiment.last_7d") || "Terakhir 7 Hari"}</option>
            <option value="1m">{t("sentiment.last_30d") || "Terakhir 30 Hari"}</option>
          </select>
        </div>

        <button 
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Sentiment Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Zap className="w-32 h-32" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-primary font-bold mb-4">
                <TrendingUp className="w-5 h-5" />
                AI SENTIMENT ANALYSIS
              </div>
              <h2 className="text-3xl font-black mb-2">{symbol} {t("sentiment.pulse")}</h2>
              <p className="text-gray-500 mb-8">{t("sentiment.based_on") || "Berdasarkan"} {data?.totalArticles || 0} {t("sentiment.articles_msg") || "artikel berita global dan tren media sosial."}</p>

              <div className="flex flex-wrap items-center gap-12">
                <div className="text-center">
                  <div className={`text-6xl font-black mb-2 ${data ? getSentimentColor(data.score) : 'text-gray-300'}`}>
                    {data ? Math.round(((data.score + 1) / 2) * 100) : '--'}
                  </div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("sentiment.score")}</div>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <div className="flex justify-between items-end mb-2">
                    <span className={`text-xl font-bold ${data ? getSentimentColor(data.score) : ''}`}>
                      {data ? getSentimentLabel(data.score) : 'Loading...'}
                    </span>
                    <span className="text-xs text-gray-400">Neutral: 50</span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: data ? `${((data.score + 1) / 2) * 100}%` : '50%' }}
                      className={`h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Sentiment Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reddit */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="font-bold">{t("sentiment.reddit")}</span>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${data ? getSentimentBg(data.social.reddit.score) : ''}`}>
                  {data?.social.reddit.sentiment || '...'}
                </div>
              </div>
              <div className="flex items-end gap-4">
                <div className="text-3xl font-black">{data?.social.reddit.mentions.toLocaleString() || '0'}</div>
                <div className="text-xs text-gray-500 mb-1">Mentions (24h)</div>
              </div>
            </div>

            {/* Twitter / X */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/10 rounded-lg text-sky-500">
                    <Twitter className="w-5 h-5" />
                  </div>
                  <span className="font-bold">{t("sentiment.twitter")}</span>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${data ? getSentimentBg(data.social.twitter.score) : ''}`}>
                  {data?.social.twitter.sentiment || '...'}
                </div>
              </div>
              <div className="flex items-end gap-4">
                <div className="text-3xl font-black">{data?.social.twitter.mentions.toLocaleString() || '0'}</div>
                <div className="text-xs text-gray-500 mb-1">Engagements</div>
              </div>
            </div>
          </div>

          {/* News List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-primary" />
                {t("sentiment.news")}
              </h3>
              <span className="text-xs text-gray-500">Menampilkan 10 teratas</span>
            </div>
            
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-32 w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl" />
                ))
              ) : data?.articles.length ? (
                data.articles.map((article, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group p-5 glass-card rounded-2xl hover:border-primary/30 transition-all cursor-default"
                  >
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h4 className="font-bold group-hover:text-primary transition-colors leading-snug">
                        {article.headline}
                      </h4>
                      <div className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${article.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-500' : article.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-500' : 'bg-gray-500/10 text-gray-500'}`}>
                        {article.sentiment}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {article.summary || "No summary available."}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-medium text-gray-400">
                      <div className="flex items-center gap-2">
                        <span className="bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded uppercase">{article.source}</span>
                        <span>•</span>
                        <span>{new Date(article.datetime * 1000).toLocaleString()}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 glass-card rounded-2xl">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada berita ditemukan.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar: Overall Market */}
        <div className="space-y-8">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-bold mb-6 flex items-center gap-2 text-rose-500 uppercase tracking-wider text-sm">
              <RefreshCw className="w-4 h-4" />
              Global Market Fear & Greed
            </h3>
            
            {marketSenti ? (
              <div className="text-center">
                <div className="relative w-48 h-24 mx-auto mb-4">
                  <svg viewBox="0 0 100 50" className="w-full h-full">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100 dark:text-gray-800" />
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#sidebar-grad)" strokeWidth="10" strokeDasharray={`${((marketSenti.overall.score + 1) / 2) * 125.66} 125.66`} strokeLinecap="round" />
                    <defs>
                      <linearGradient id="sidebar-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-end justify-center pb-2">
                    <span className="text-4xl font-black">{Math.round(((marketSenti.overall.score + 1) / 2) * 100)}</span>
                  </div>
                </div>
                <div className="text-xl font-black uppercase mb-1 tracking-widest">{marketSenti.overall.trend}</div>
                <div className="text-[10px] text-gray-400">UPDATED: {new Date(marketSenti.overall.updatedAt).toLocaleTimeString()}</div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
            )}
          </div>

          <div className="glass-card p-6 rounded-2xl bg-primary/5 border-primary/10">
            <h4 className="font-bold text-sm mb-4">Market Outlook</h4>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Sektor AI menunjukkan pertumbuhan sentimen positif yang stabil di media sosial.
                </p>
              </li>
              <li className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Kebijakan moneter makro menjadi topik diskusi utama di Reddit hari ini.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
