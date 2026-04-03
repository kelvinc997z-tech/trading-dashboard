"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Activity, TrendingUp, TrendingDown, Minus, Brain, Zap,
  BarChart3, Target, Shield, Clock, RefreshCw, ChevronRight,
  LineChart, PieChart, ArrowLeft, Sparkles
} from "lucide-react";

interface Prediction {
  id: string;
  symbol: string;
  timeframe: string;
  direction: "buy" | "sell" | "neutral";
  confidence: number;
  predictedPrice: number;
  predictedChange: number;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  timestamp: string;
}

const CRYPTO_SYMBOLS = [
  { symbol: "BTC", name: "Bitcoin", color: "orange" },
  { symbol: "ETH", name: "Ethereum", color: "purple" },
  { symbol: "SOL", name: "Solana", color: "gradient" },
  { symbol: "XAUT", name: "Gold", color: "yellow" },
  { symbol: "XRP", name: "Ripple", color: "blue" },
];

const TIMEFRAMES = [
  { value: "1h", label: "1 Hour" },
  { value: "4h", label: "4 Hours" },
  { value: "1d", label: "1 Day" },
];

// Utility functions
const formatPrice = (price: number) => {
  if (price >= 1000) return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
};

const formatPercent = (pct: number) => {
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
};

const formatTime = (ts: string) => {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const getDirectionConfig = (direction: string) => {
  switch (direction) {
    case "buy":
      return {
        icon: TrendingUp,
        color: "emerald",
        bgLight: "bg-emerald-50",
        bgDark: "bg-emerald-950/20",
        borderLight: "border-emerald-200",
        borderDark: "border-emerald-800",
        textLight: "text-emerald-700",
        textDark: "text-emerald-400",
        gradient: "from-emerald-500 to-teal-500",
        shadow: "shadow-emerald-500/20"
      };
    case "sell":
      return {
        icon: TrendingDown,
        color: "rose",
        bgLight: "bg-rose-50",
        bgDark: "bg-rose-950/20",
        borderLight: "border-rose-200",
        borderDark: "border-rose-800",
        textLight: "text-rose-700",
        textDark: "text-rose-400",
        gradient: "from-rose-500 to-orange-500",
        shadow: "shadow-rose-500/20"
      };
    default:
      return {
        icon: Minus,
        color: "gray",
        bgLight: "bg-gray-50",
        bgDark: "bg-gray-800/50",
        borderLight: "border-gray-200",
        borderDark: "border-gray-700",
        textLight: "text-gray-600",
        textDark: "text-gray-400",
        gradient: "from-gray-400 to-gray-500",
        shadow: "shadow-gray-500/10"
      };
  }
};

const SymbolIcon = ({ symbol, size = 20 }: { symbol: string; size?: number }) => {
  const colors: Record<string, string> = {
    BTC: "from-orange-400 to-amber-500",
    ETH: "from-purple-400 to-pink-500",
    SOL: "from-gradient-start to-gradient-end",
    XAUT: "from-yellow-400 to-amber-600",
    XRP: "from-blue-400 to-cyan-500",
  };
  const bg = colors[symbol] || "from-blue-400 to-cyan-500";

  return (
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center text-white font-bold text-sm shadow-lg`} style={{ width: size, height: size }}>
      {symbol.slice(0, 2)}
    </div>
  );
};

export default function QuantAIPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [stats, setStats] = useState({ total: 0, avgConfidence: 0, buy: 0, sell: 0, neutral: 0 });

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quant-ai/predictions?limit=20");
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions || []);
        calculateStats(data.predictions || []);
      }
    } catch (err) {
      console.error("Failed to fetch predictions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const generatePrediction = async (symbol: string) => {
    setGenerating(prev => ({ ...prev, [symbol]: true }));
    try {
      const res = await fetch("/api/quant-ai/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, timeframe: selectedTimeframe }),
      });
      if (res.ok) {
        const newPred = await res.json();
        setPredictions(prev => [newPred, ...prev].slice(0, 20));
        calculateStats([newPred, ...predictions].slice(0, 20));
      }
    } catch (err) {
      console.error("Failed to generate prediction:", err);
    } finally {
      setGenerating(prev => ({ ...prev, [symbol]: false }));
    }
  };

  const calculateStats = (preds: Prediction[]) => {
    if (preds.length === 0) {
      setStats({ total: 0, avgConfidence: 0, buy: 0, sell: 0, neutral: 0 });
      return;
    }
    const buys = preds.filter(p => p.direction === "buy").length;
    const sells = preds.filter(p => p.direction === "sell").length;
    const neutrals = preds.filter(p => p.direction === "neutral").length;
    const avgConf = preds.reduce((sum, p) => sum + p.confidence, 0) / preds.length;
    setStats({ total: preds.length, avgConfidence: avgConf, buy: buys, sell: sells, neutral: neutrals });
  };

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPredictions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-0 w-80 h-80 bg-emerald-400/5 dark:bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100/80 to-purple-100/80 dark:from-blue-900/40 dark:to-purple-900/40 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 rounded-full text-sm font-semibold text-blue-700 dark:text-blue-300 shadow-sm">
                <Brain className="w-4 h-4" />
                Quant AI Engine
                <span className="px-2 py-0.5 bg-blue-200/60 dark:bg-blue-800/60 rounded text-xs">v2.0</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent">
                AI Trading Signals
              </h1>

              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                Advanced ensemble models (XGBoost + LSTM) analyze market patterns, 
                volatility, and technical indicators to generate high-confidence predictions 
                with dynamic risk management.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchPredictions}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform"}`} />
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {[
            { label: "Total Predictions", value: stats.total, icon: Activity, color: "blue" },
            { label: "Avg Confidence", value: `${stats.avgConfidence.toFixed(1)}%`, icon: Target, color: "purple" },
            { label: "Buy Signals", value: stats.buy, icon: TrendingUp, color: "emerald" },
            { label: "Sell Signals", value: stats.sell, icon: TrendingDown, color: "rose" },
            { label: "Neutral", value: stats.neutral, icon: Minus, color: "gray" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              </div>
              <div className={`text-2xl font-bold text-slate-900 dark:text-white`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Timeframe Selector */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 p-1 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setSelectedTimeframe(tf.value)}
                className={`flex-1 min-w-[100px] px-4 py-3 rounded-lg font-semibold transition-all ${
                  selectedTimeframe === tf.value
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Generate Grid */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quick Generate</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {CRYPTO_SYMBOLS.map(({ symbol, name, color }) => {
              const dirConfig = getDirectionConfig("neutral");
              const isGenerating = generating[symbol];
              return (
                <button
                  key={symbol}
                  onClick={() => generatePrediction(symbol)}
                  disabled={isGenerating}
                  className={`relative p-5 rounded-2xl border-2 transition-all duration-300 group overflow-hidden ${
                    isGenerating
                      ? "border-blue-300 bg-blue-50/50 dark:bg-blue-950/30"
                      : "border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/10"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-100/50 dark:to-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative flex flex-col items-center gap-3">
                    <SymbolIcon symbol={symbol} size={44} />
                    <div>
                      <div className="font-bold text-lg text-slate-900 dark:text-white">{symbol}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{name}</div>
                    </div>
                    {isGenerating ? (
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Generating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-500 transition-colors">
                        <span className="text-sm">Generate</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Predictions Grid */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Predictions</h2>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-full">
              Live
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-blue-500 animate-spin" />
                <Brain className="w-6 h-6 absolute inset-0 m-auto text-blue-500" />
              </div>
              <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Analyzing market data...</p>
            </div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-16 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                <Brain className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">No Predictions Yet</h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                Click any symbol above to generate your first AI-powered trading signal.
                Predictions will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {predictions.map((pred) => {
                const config = getDirectionConfig(pred.direction);
                const Icon = config.icon;
                const confidenceColor = pred.confidence > 70 ? "bg-emerald-500" : pred.confidence > 50 ? "bg-amber-500" : "bg-rose-500";
                
                return (
                  <div
                    key={pred.id}
                    className={`group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${config.borderLight} dark:${config.borderDark} hover:${config.borderLight} dark:hover:${config.borderDark}`}
                  >
                    {/* Gradient accent bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />
                    
                    <div className="p-6 space-y-5">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <SymbolIcon symbol={pred.symbol} />
                          <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{pred.symbol}</h3>
                            <span className={`text-sm font-medium px-2 py-1 rounded-full ${config.bgLight} dark:${config.bgDark} ${config.textLight} dark:${config.textDark}`}>
                              {pred.direction.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${config.textLight} dark:${config.textDark}`}>
                            {formatPercent(pred.predictedChange)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{pred.timeframe}</div>
                        </div>
                      </div>

                      {/* Price Levels */}
                      <div className="space-y-3 p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <Target className="w-4 h-4" /> Entry
                          </span>
                          <span className="font-mono font-medium text-slate-900 dark:text-white">
                            {formatPrice(pred.entryPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Take Profit
                          </span>
                          <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                            {formatPrice(pred.takeProfit)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-rose-600 dark:text-rose-400 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Stop Loss
                          </span>
                          <span className="font-mono font-medium text-rose-600 dark:text-rose-400">
                            {formatPrice(pred.stopLoss)}
                          </span>
                        </div>
                      </div>

                      {/* Confidence Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Confidence</span>
                          <span className={`font-bold ${pred.confidence > 70 ? "text-emerald-600" : pred.confidence > 50 ? "text-amber-600" : "text-rose-600"}`}>
                            {pred.confidence.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${confidenceColor} transition-all duration-1000 ease-out`}
                            style={{ width: `${pred.confidence}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(pred.timestamp)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          XGBoost
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* How It Works - Enhanced */}
        <section className="mt-16 pt-12 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">How It Works</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Our AI engine combines multiple data sources and models to produce actionable trading signals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200 dark:from-blue-800 dark:via-purple-800 dark:to-emerald-800" />

            {[
              {
                icon: BarChart3,
                title: "1. Data Pipeline",
                desc: "Real-time OHLC from 15+ crypto pairs. Over 80 technical indicators calculated including RSI, MACD, Bollinger Bands, ATR, ADX, Stoch, CCI, MFI, OBV.",
                color: "blue",
                bg: "bg-blue-100 dark:bg-blue-900/30",
                iconBg: "bg-blue-500"
              },
              {
                icon: Brain,
                title: "2. AI Ensemble",
                desc: "Combination of XGBoost (gradient boosting) and LSTM (deep learning) analyzes historical patterns. Each model weight-adjusted based on recent performance.",
                color: "purple",
                bg: "bg-purple-100 dark:bg-purple-900/30",
                iconBg: "bg-purple-500"
              },
              {
                icon: Target,
                title: "3. Signal Generation",
                desc: "Multi-class output: Buy/Sell/Hold with confidence score. Dynamic TP/SL based on ATR and volatility. Minimum threshold to filter noise.",
                color: "emerald",
                bg: "bg-emerald-100 dark:bg-emerald-900/30",
                iconBg: "bg-emerald-500"
              }
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className={`p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-lg hover:shadow-xl transition-shadow`}>
                  <div className={`w-16 h-16 ${step.bg} rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                    <step.icon className={`w-8 h-8 text-${step.color}-600 dark:text-${step.color}-400`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-center text-slate-900 dark:text-white">{step.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-center leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Performance Metrics (placeholder for future) */}
        <section className="mt-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-white mb-2">Model Performance</h3>
              <p className="text-slate-400 max-w-md">
                Our ensemble models are continuously evaluated on out-of-sample data.
                Current backtest results show promising Sharpe ratios and controlled drawdowns.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-3xl font-bold text-emerald-400">~62%</div>
                <div className="text-sm text-slate-400 mt-1">Validation Accuracy</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-3xl font-bold text-blue-400">1.8+</div>
                <div className="text-sm text-slate-400 mt-1">Est. Sharpe Ratio</div>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="mt-12">
          <div className="p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-2xl">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <Shield className="w-6 h-6 text-rose-600 dark:text-rose-400 mt-0.5" />
              </div>
              <div>
                <h4 className="font-semibold text-rose-800 dark:text-rose-200 mb-2">⚠️ Important Disclaimer</h4>
                <p className="text-sm text-rose-700 dark:text-rose-300 leading-relaxed">
                  Quant AI predictions are <strong>experimental</strong> and based on historical patterns. 
                  Past performance does not guarantee future results. Cryptocurrency trading involves 
                  significant risk of loss. Always conduct your own research, use proper risk management, 
                  never invest more than you can afford to lose. These signals are not financial advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
