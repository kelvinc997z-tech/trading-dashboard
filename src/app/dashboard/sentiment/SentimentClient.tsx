"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Article {
  headline: string;
  summary: string;
  source: string;
  datetime: number;
  sentiment: string;
}

export default function SentimentClient() {
  const [symbol, setSymbol] = useState("BTC");
  const [period, setPeriod] = useState("1d");
  const [data, setData] = useState<{ score: number; articles: Article[]; totalArticles: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSentiment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sentiment?symbol=${symbol}&period=${period}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setData(json);
    } catch (e) {
      toast.error("Failed to fetch sentiment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSentiment(); }, [symbol, period]);

  const getScoreLabel = (score: number) => {
    if (score > 0.3) return "🟢 Bullish";
    if (score < -0.3) return "🔴 Bearish";
    return "🟡 Neutral";
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Market Sentiment Analysis</h1>
        <div className="flex gap-2">
          <select value={symbol} onChange={e => setSymbol(e.target.value)} className="select select-bordered">
            <option value="BTC">Bitcoin</option>
            <option value="ETH">Ethereum</option>
            <option value="SOL">Solana</option>
            <option value="XRP">Ripple</option>
          </select>
          <select value={period} onChange={e => setPeriod(e.target.value)} className="select select-bordered">
            <option value="1d">Last 24h</option>
            <option value="1w">Last week</option>
            <option value="1m">Last month</option>
          </select>
          <button onClick={fetchSentiment} className="btn btn-primary" disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {data && (
        <div className="mb-6 p-4 card bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">{getScoreLabel(data.score)}</div>
            <div className="text-2xl">{data.score.toFixed(3)}</div>
            <div className="text-sm text-gray-500">Based on {data.totalArticles} articles</div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">Recent News</h2>
      {loading ? (
        <div>Loading...</div>
      ) : data && data.articles.length > 0 ? (
        <div className="space-y-4">
          {data.articles.map((article, idx) => (
            <div key={idx} className="card p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="flex justify-between">
                <h3 className="font-semibold">{article.headline}</h3>
                <span className={`badge ${article.sentiment === "positive" ? "badge-success" : article.sentiment === "negative" ? "badge-error" : "badge-neutral"}`}>
                  {article.sentiment}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{article.summary}</p>
              <div className="mt-2 text-xs text-gray-500">
                {article.source} • {new Date(article.datetime * 1000).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500">No news articles found.</div>
      )}
    </div>
  );
}
