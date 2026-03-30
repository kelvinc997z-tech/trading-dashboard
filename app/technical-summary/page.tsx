"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TechnicalSummary {
  symbol: string;
  currentPrice: number;
  rsi: number;
  macd: "buy" | "sell" | "neutral";
  sma20: number;
  sma50: number;
  trend: "bullish" | "bearish" | "neutral";
  support: number;
  resistance: number;
  notes: string;
}

const SYMBOL_LABELS: Record<string, string> = {
  "XAUT/USD": "Tether Gold (XAUT)",
  "USOIL": "US Oil (WTI)",
  "BTC/USD": "Bitcoin",
  "ETH/USD": "Ethereum",
  "SOL/USD": "Solana",
  "XRP/USD": "Ripple",
  "KAS/USDT": "Kaspa",
};

export default function TechnicalSummaryPage() {
  const router = useRouter();
  const [techSummaries, setTechSummaries] = useState<TechnicalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTechnicalData = async () => {
    try {
      setError(null);
      const res = await fetch("/api/technical-indicators");
      if (!res.ok) throw new Error("Failed to fetch technical indicators");
      const data = await res.json();
      const summariesArray = Object.entries(data).map(([symbol, indicator]: [string, any]) => ({
        symbol,
        ...indicator,
      })) as TechnicalSummary[];
      summariesArray.sort((a, b) => a.symbol.localeCompare(b.symbol));
      setTechSummaries(summariesArray);
    } catch (err: any) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchTechnicalData();
    const interval = setInterval(fetchTechnicalData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auth check
  useEffect(() => {
    fetch("/api/me")
      .then(res => res.json())
      .then(data => {
        if (!data.user) router.replace("/login");
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "bullish": return <TrendingUp className="w-5 h-5 text-green-500" />;
      case "bearish": return <TrendingDown className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "bullish": return "text-green-600 dark:text-green-400";
      case "bearish": return "text-red-600 dark:text-red-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  const getMacdBadge = (macd: string) => {
    const styles = {
      buy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      sell: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      neutral: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[macd as keyof typeof styles]}`}>
        {macd.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-gray-900 dark:text-white text-xl font-semibold animate-pulse">Loading technical summary...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-xl font-semibold mb-4">Error: {error}</div>
          <button
            onClick={fetchTechnicalData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Technical Summary</h1>
          <button
            onClick={fetchTechnicalData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Refresh Now
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techSummaries.map(summary => (
            <div key={summary.symbol} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{SYMBOL_LABELS[summary.symbol] || summary.symbol}</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    ${summary.currentPrice.toFixed(2)}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${summary.trend === "bullish" ? "bg-green-100 dark:bg-green-900" : summary.trend === "bearish" ? "bg-red-100 dark:bg-red-900" : "bg-gray-100 dark:bg-gray-700"}`}>
                  {getTrendIcon(summary.trend)}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Trend</span>
                  <span className={`font-semibold ${getTrendColor(summary.trend)}`}>{summary.trend.toUpperCase()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">RSI (14)</span>
                  <span className={`font-semibold ${summary.rsi > 70 ? 'text-red-500' : summary.rsi < 30 ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                    {summary.rsi}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">MACD</span>
                  {getMacdBadge(summary.macd)}
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">SMA 20</span>
                  <span className="font-semibold text-gray-900 dark:text-white">${summary.sma20.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">SMA 50</span>
                  <span className="font-semibold text-gray-900 dark:text-white">${summary.sma50.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Support</span>
                  <span className="font-semibold text-gray-900 dark:text-white">${summary.support.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Resistance</span>
                  <span className="font-semibold text-gray-900 dark:text-white">${summary.resistance.toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
                    {summary.notes}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <span>Technical indicators computed from Alpha Vantage daily time series.</span>
          {lastUpdated && <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>}
        </div>
      </main>
    </div>
  );
}
