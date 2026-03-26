"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface TechnicalSummary {
  symbol: string;
  trend: "bullish" | "bearish" | "neutral";
  rsi?: number;
  macd?: "buy" | "sell" | "neutral";
  support: number;
  resistance: number;
  notes: string;
}

const SYMBOL_LABELS: Record<string, string> = {
  "XAUUSD": "Gold (XAU/USD)",
  "USOIL": "US Oil (WTI)",
  "BTC/USD": "Bitcoin",
  "ETH/USD": "Ethereum",
  "SOL/USD": "Solana",
  "XRP/USD": "Ripple",
  "KAS/USDT": "Kaspa",
};

// Dummy technical indicators (since we only have current quote)
function generateDummyTechnical(symbol: string, price: number, changePercent: number): TechnicalSummary {
  const isBullish = changePercent > 0;
  const rsi = Math.max(20, Math.min(80, 50 + changePercent * 5 + Math.random() * 20));
  const macd = isBullish ? "buy" : "sell";
  const support = price * 0.98;
  const resistance = price * 1.02;
  const trend: "bullish" | "bearish" | "neutral" = isBullish ? "bullish" : changePercent > -1 ? "neutral" : "bearish";
  const notes = `Price ${isBullish ? "above" : "below"} recent average. ${isBullish ? "Momentum positive." : "Momentum negative."}`;

  return { symbol, trend, rsi: Math.round(rsi), macd, support, resistance, notes };
}

export default function TechnicalSummaryPage() {
  const router = useRouter();
  const [markets, setMarkets] = useState<Record<string, MarketData>>({});
  const [techSummaries, setTechSummaries] = useState<TechnicalSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarketData = async () => {
    try {
      const res = await fetch("/api/market-data");
      if (!res.ok) throw new Error("Failed to fetch market data");
      const data = await res.json();
      setMarkets(data);
      // Generate technical summaries
      const summaries = Object.entries(data).map(([symbol, market]) =>
        generateDummyTechnical(symbol, market.price, market.changePercent)
      );
      setTechSummaries(summaries.sort((a, b) => a.symbol.localeCompare(b.symbol)));
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
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

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Technical Summary</h1>
          <button
            onClick={fetchMarketData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Refresh Now
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techSummaries.map(summary => {
            const market = markets[summary.symbol];
            return (
              <div key={summary.symbol} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{SYMBOL_LABELS[summary.symbol] || summary.symbol}</h3>
                    {market && (
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        ${market.price.toFixed(2)}
                      </p>
                    )}
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
                    <span className={`font-semibold ${summary.rsi && summary.rsi > 70 ? 'text-red-500' : summary.rsi && summary.rsi < 30 ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                      {summary.rsi ?? "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">MACD</span>
                    {getMacdBadge(summary.macd || "neutral")}
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
            );
          })}
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Technical indicators are simulated for demonstration. In production, integrate with a market data provider for real indicators.
        </div>
      </main>
    </div>
  );
}
