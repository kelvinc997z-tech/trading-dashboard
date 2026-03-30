"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brain, BarChart2, GitBranch, TrendingUp, ListChecks } from "lucide-react";

export default function QuantTradingPage() {
  const [selectedModel, setSelectedModel] = useState("LSTM");
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.user?.role !== "pro") {
            router.replace("/pricing");
          }
        } else {
          router.replace("/login");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user?.role !== "pro") {
    return null;
  }

  const models = ["LSTM", "XGBoost", "Random Forest"];
  const signals = [
    { symbol: "XAU", direction: "BUY", confidence: 78, timeframe: "4h" },
    { symbol: "BTC", direction: "SELL", confidence: 65, timeframe: "1h" },
    { symbol: "ETH", direction: "BUY", confidence: 72, timeframe: "1d" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Back to Home */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quant Trading</h1>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-full text-sm font-medium">PRO</span>
        </div>

        {/* Model Selection */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart2 className="h-5 w-5" /> Model Prediksi
          </h2>
          <div className="flex gap-4">
            {models.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedModel(m)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedModel === m
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Model yang aktif: <strong>{selectedModel}</strong>. Model iniMenghasilkan prediksi harga 1h/4h/1d dengan confidence score.
          </p>
        </section>

        {/* Signals */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Sinyal Trading
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {signals.map((sig, i) => (
              <div key={i} className="border dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg">{sig.symbol}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${sig.direction === "BUY" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
                    {sig.direction}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Timeframe: {sig.timeframe}<br />
                  Confidence: <strong>{sig.confidence}%</strong>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Backtesting Lab */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <GitBranch className="h-5 w-5" /> Backtesting Lab
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Symbol</label>
              <select className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <option>XAU</option>
                <option>BTC</option>
                <option>ETH</option>
                <option>SOL</option>
                <option>XRP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Strategy</label>
              <select className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <option>Moving Average Crossover</option>
                <option>RSI Oversold/Overbought</option>
                <option>MACD Signal</option>
                <option>ML Prediction Follow</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
            </div>
          </div>
          <button className="mt-6 bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition">
            Run Backtest
          </button>
        </section>

        {/* Dashboard Quick Access */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ListChecks className="h-5 w-5" /> Integrasi ke Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Akses cepat ke fitur Quant dari dashboard Anda.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition"
          >
            Buka Dashboard
          </Link>
        </section>
      </div>
    </div>
  );
}
