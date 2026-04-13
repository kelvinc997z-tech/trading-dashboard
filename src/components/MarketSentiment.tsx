"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface SentimentData {
  overall: {
    value?: number; // 0-100
    score: number;  // -1..1
    trend: "bullish" | "bearish" | "neutral";
    classification?: string;
    updatedAt: string;
    details?: {
      crypto: number;
      traditional: number;
      vix: number | null;
    };
  };
}

export default function MarketSentiment() {
  const { t } = useLanguage();
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSentiment = async () => {
    try {
      const res = await fetch('/api/market-sentiment');
      const data = await res.json();
      setSentiment(data);
    } catch (err) {
      console.error('[MarketSentiment]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentiment();
    const interval = setInterval(fetchSentiment, 1800000); // 30 mins
    return () => clearInterval(interval);
  }, []);

  if (loading && !sentiment) {
    return (
      <div className="animate-pulse bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 h-48 border border-gray-100 dark:border-gray-800" />
    );
  }

  const overall = sentiment?.overall || { value: 50, score: 0, trend: "neutral", classification: "neutral", updatedAt: new Date().toISOString() };
  const displayValue = overall.value ?? Math.round(((overall.score + 1) / 2) * 100);
  
  const getStatusColor = (val: number) => {
    if (val >= 75) return "text-emerald-500";
    if (val >= 55) return "text-green-400";
    if (val >= 45) return "text-amber-500";
    if (val >= 25) return "text-orange-500";
    return "text-rose-600";
  };

  const getStatusBg = (val: number) => {
    if (val >= 75) return "bg-emerald-500/10 border-emerald-500/20";
    if (val >= 55) return "bg-green-500/10 border-green-500/20";
    if (val >= 45) return "bg-amber-500/10 border-amber-500/20";
    if (val >= 25) return "bg-orange-500/10 border-orange-500/20";
    return "bg-rose-500/10 border-rose-500/20";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-2xl border border-gray-200 dark:border-gray-800/50"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black tracking-tight dark:text-white uppercase">
            {t("sentiment.market_sentiment") || "Market Sentiment"}
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            {t("sentiment.fear_greed") || "Fear & Greed Index"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-gray-400 uppercase">
            {t("common.updated") || "Updated"}
          </div>
          <div className="text-xs font-mono dark:text-gray-300">
            {new Date(overall.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={`text-6xl font-black ${getStatusColor(displayValue)}`}>
              {displayValue}
            </div>
            <div>
              <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border mb-1 ${getStatusBg(displayValue)} ${getStatusColor(displayValue)}`}>
                {overall.classification?.toUpperCase() || "NEUTRAL"}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {displayValue >= 50 ? (t("sentiment.optimistic_msg") || "Optimisme pasar meningkat") : (t("sentiment.pessimistic_msg") || "Kekhawatiran pasar membayangi")}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Crypto</div>
              <div className="text-sm font-bold dark:text-white">{overall.details?.crypto || "--"}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Macro (VIX)</div>
              <div className="text-sm font-bold dark:text-white">{overall.details?.traditional || "--"}</div>
            </div>
          </div>
        </div>

        <div className="relative aspect-[2/1] w-full max-w-[240px] mx-auto">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            {/* Background Arc */}
            <path 
              d="M 10 50 A 40 40 0 0 1 90 50" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="10" 
              className="text-gray-100 dark:text-gray-800" 
            />
            {/* Colored Arc */}
            <path 
              d="M 10 50 A 40 40 0 0 1 90 50" 
              fill="none" 
              stroke="url(#sentiment-grad)" 
              strokeWidth="10" 
              strokeDasharray={`${(displayValue / 100) * 125.66} 125.66`} 
              strokeLinecap="round" 
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="sentiment-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            {/* Needle */}
            <motion.line 
              x1="50" y1="50" 
              x2={50 + 35 * Math.cos(Math.PI - (displayValue / 100) * Math.PI)} 
              y2={50 - 35 * Math.sin(Math.PI - (displayValue / 100) * Math.PI)} 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round"
              className="text-gray-900 dark:text-white transition-all duration-1000 ease-out"
            />
            <circle cx="50" cy="50" r="5" className="fill-gray-900 dark:fill-white" />
          </svg>
          <div className="absolute bottom-0 left-0 w-full flex justify-between px-2 text-[8px] font-black text-gray-400 uppercase tracking-tighter">
            <span>Fear</span>
            <span>Greed</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
