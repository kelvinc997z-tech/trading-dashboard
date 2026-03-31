"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon, LogIn, UserPlus } from "lucide-react";

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white">
      {/* Header with theme toggle and auth buttons */}
      <header className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          TradingDash
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link href="/login" className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg transition">
            <LogIn className="w-4 h-4" />
            Login
          </Link>
          <Link href="/signup" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-white transition">
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Trading Dashboard Pro
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Real-time crypto, forex & commodities charts with AI-powered signals, 
          alerts, correlation matrix, and performance analytics.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/signup" className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-white transition">
            Get Started Free
          </Link>
          <Link href="/pricing" className="px-8 py-3 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg font-semibold transition">
            View Pricing
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold mb-12 text-center">Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            ["Live Multi-Timeframe Charts", "1m to 1d candles with Pro Indicators (RSI, MACD, Bollinger)"],
            ["Custom Alerts", "Price, indicator, and candlestick pattern alerts via email/Telegram"],
            ["Correlation Matrix", "See how crypto and forex pairs move together"],
            ["Sentiment Analysis", "News sentiment from Finnhub integrated"],
            ["Performance Analytics", "Sharpe ratio, drawdown, equity curve, trade metrics"],
            ["AI Predictions", "Ensemble LSTM/XGBoost forecasts with confidence intervals"],
          ].map(([title, desc], i) => (
            <div key={i} className="p-6 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">Free tier with basic charts. Upgrade to Pro for all features.</p>
        <Link href="/pricing" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition">
          See Plans
        </Link>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-200 dark:border-gray-800 text-center text-gray-600 dark:text-gray-500">
        <p>&copy; {new Date().getFullYear()} Trading Dashboard. All rights reserved.</p>
      </footer>
    </div>
  );
}
