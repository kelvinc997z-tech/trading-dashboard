"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, TrendingUp, TrendingDown, Minus, Brain, Zap, ArrowLeft } from "lucide-react";

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

const CRYPTO_SYMBOLS = ["BTC", "ETH", "XAUT", "SOL", "XRP"];

export default function QuantAIPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quant-ai/predictions?limit=20");
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions || []);
      }
    } catch (err) {
      console.error("Failed to fetch predictions:", err);
    } finally {
      setLoading(false);
    }
  };

  const generatePrediction = async (symbol: string) => {
    try {
      const res = await fetch("/api/quant-ai/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, timeframe: selectedTimeframe }),
      });
      if (res.ok) {
        const newPred = await res.json();
        setPredictions(prev => [newPred, ...prev].slice(0, 20));
      }
    } catch (err) {
      console.error("Failed to generate prediction:", err);
    }
  };

  useEffect(() => {
    fetchPredictions();
    // Refresh predictions every hour
    const interval = setInterval(fetchPredictions, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const formatPrice = (price: number) => {
    return price >= 1 ? price.toFixed(2) : price.toFixed(4);
  };

  const formatPercent = (pct: number) => {
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "buy":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "sell":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case "buy":
        return "text-green-600 dark:text-green-400";
      case "sell":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getCardColor = (direction: string) => {
    switch (direction) {
      case "buy":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "sell":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    }
  };

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Hero Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full text-sm font-medium text-blue-800 dark:text-blue-200 mb-4">
          <Brain className="w-4 h-4" />
          Quant AI Engine
        </div>
        <h1 className="text-4xl font-bold mb-4">AI-Powered Market Predictions</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Advanced machine learning models (LSTM, XGBoost, Ensemble) analyze market data 
          to generate high-probability trading signals with confidence scoring.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
        <div>
          <h2 className="text-lg font-semibold">Prediction Dashboard</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate and view AI-powered price predictions
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="1h">1 Hour</option>
            <option value="4h">4 Hours</option>
            <option value="1d">1 Day</option>
          </select>
          <button
            onClick={fetchPredictions}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Generate Quick Predictions */}
      <section>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" /> Quick Generate
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CRYPTO_SYMBOLS.map((symbol) => (
            <button
              key={symbol}
              onClick={() => generatePrediction(symbol)}
              className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
            >
              <div className="font-semibold">{symbol}</div>
              <div className="text-xs text-gray-500">Generate prediction</div>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Predictions */}
      <section>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" /> Recent Predictions
        </h3>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading predictions...</p>
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">No predictions yet. Click a symbol above to generate.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((pred) => (
              <div
                key={pred.id}
                className={`p-4 rounded-lg border ${getCardColor(pred.direction)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-lg">{pred.symbol}</h4>
                    <span className={`text-sm font-medium ${getDirectionColor(pred.direction)}`}>
                      {pred.direction.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getDirectionColor(pred.direction)}`}>
                      {formatPercent(pred.predictedChange)}
                    </div>
                    <div className="text-xs text-gray-500">{pred.timeframe}</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Entry:</span>
                    <span className="font-mono">{formatPrice(pred.entryPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400">Target:</span>
                    <span className="font-mono text-green-600">{formatPrice(pred.takeProfit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">Stop Loss:</span>
                    <span className="font-mono text-red-600">{formatPrice(pred.stopLoss)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Confidence</span>
                    <span className="font-semibold">{pred.confidence.toFixed(1)}%</span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        pred.confidence > 70
                          ? "bg-green-500"
                          : pred.confidence > 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${pred.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-500 text-right">
                  {new Date(pred.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">1. Data Collection</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time OHLC data from 15+ cryptocurrency pairs. Technical indicators calculated 
              using RSI, MACD, Bollinger Bands, ATR, ADX, and more.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">2. AI Prediction</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ensemble of LSTM neural networks and XGBoost models analyze patterns. 
              Each prediction includes confidence score and risk metrics.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold mb-2">3. Actionable Signals</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Clear entry, take profit, and stop loss levels. Confidence scoring helps you 
              filter high-probability trades and manage risk.
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="border-t pt-6">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 font-medium mb-2">⚠️ Disclaimer</p>
          <p className="text-sm text-red-700 dark:text-red-300">
            Quant AI predictions are experimental and based on historical patterns. 
            Past performance does not guarantee future results. Always conduct your own research 
            and use proper risk management. Trading cryptocurrencies involves significant risk.
          </p>
        </div>
      </div>
    </div>
  );
}
