"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon, LogIn, UserPlus } from "lucide-react";
import XAUTLivePrice from "@/components/XAUTLivePrice";

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
          <Link href="/login?mode=signup" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-white transition">
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Advanced Trading Dashboard
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Professional-grade platform for crypto, forex, and commodities traders. 
          Access real-time data, AI-powered signals, and comprehensive analytics to make informed trading decisions.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/login?mode=signup" className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-white transition">
            Start Free Trial
          </Link>
          <Link href="/pricing" className="px-8 py-3 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg font-semibold transition">
            View Plan
          </Link>
        </div>
      </section>

      {/* Quant AI Highlight Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-br from-emerald-900/20 to-blue-900/20 rounded-2xl my-12">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-4">NEW IN V2</span>
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-400">
            Quant AI: AI-Powered Trading Intelligence
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Harness the power of machine learning with our ensemble of LSTM neural networks, XGBoost, and Random Forest models. Get price predictions with confidence scores and automatically generated risk levels.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              title: "Ensemble Models",
              desc: "Combined predictions from LSTM, XGBoost, and Random Forest for higher accuracy",
              icon: "🧠"
            },
            {
              title: "Confidence Scoring",
              desc: "Each prediction includes a probability score (0–100%) so you know how much to trust it",
              icon: "📊"
            },
            {
              title: "Auto SL/TP",
              desc: "AI suggests entry, take-profit, and stop-loss levels based on predicted volatility",
              icon: "🎯"
            },
            {
              title: "Quick Generate",
              desc: "One-click predictions for any crypto symbol across multiple timeframes (1h, 4h, 1d)",
              icon: "⚡"
            },
            {
              title: "Prediction History",
              desc: "Track past predictions and their accuracy to refine your strategy over time",
              icon: "📈"
            },
            {
              title: "Model Selection",
              desc: "Choose between LSTM, XGBoost, Random Forest, or use the ensemble mode",
              icon: "🔬"
            },
            {
              title: "How It Works",
              desc: "Educational guide explaining the ML pipeline from data collection to model inference",
              icon: "📚"
            },
            {
              title: "Pro Access Only",
              desc: "Quant AI features are available exclusively for Pro subscribers. Upgrade to unlock.",
              icon: "👑",
              pro: true
            },
          ].map((feature, i) => (
            <div key={i} className={`p-6 rounded-xl border ${feature.pro ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30' : 'bg-gray-800/50 border-gray-700'} hover:border-emerald-500/50 transition group`}>
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-emerald-400 transition">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
              {feature.pro && (
                <span className="inline-block mt-3 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold rounded-full">PRO</span>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/quant-ai" className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 rounded-lg font-semibold text-white transition shadow-lg shadow-emerald-500/25">
            Try Quant AI Now
          </Link>
          <p className="text-sm text-gray-400 mt-3">Available for Pro subscribers. Free trial available.</p>
        </div>
      </section>

      {/* XAUT Live Price & Signal */}
      <section className="container mx-auto px-4 py-8">
        <XAUTLivePrice />
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold mb-4 text-center">Powerful Features</h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
          Everything you need to analyze markets, manage trades, and optimize your trading performance.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            ["Live Multi-Timeframe Charts", "Interactive charts with 1-minute to 1-day timeframes. Includes professional indicators: RSI, MACD, Bollinger Bands, and more."],
            ["Smart Alerts", "Set custom alerts for price movements, indicator signals, and candlestick patterns. Receive notifications via email or Telegram."],
            ["Correlation Matrix", "Visualize relationships between crypto and forex pairs to identify hedging opportunities and portfolio risks."],
            ["News Sentiment", "AI-powered sentiment analysis from financial news feeds integrated directly into your dashboard."],
            ["Performance Analytics", "Track key metrics: Sharpe ratio, maximum drawdown, equity curves, win rates, and detailed trade statistics."],
            ["AI Price Predictions", "Machine learning models (LSTM, XGBoost) generate price forecasts with confidence intervals to inform your strategy."],
          ].map(([title, desc], i) => (
            <div key={i} className="p-6 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plan teaser */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Flexible Plan</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Start with our free tier, then upgrade to Pro for advanced features. No hidden fees, cancel anytime.
        </p>
        <Link href="/pricing" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition">
          Compare Plans
        </Link>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-200 dark:border-gray-800 text-center text-gray-600 dark:text-gray-500">
        <p>&copy; {new Date().getFullYear()} Trading Dashboard. All rights reserved.</p>
      </footer>
    </div>
  );
}
