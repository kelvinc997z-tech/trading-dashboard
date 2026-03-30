import Link from "next/link";
import { Brain, BarChart2, TrendingUp, GitBranch, ListTodo } from "lucide-react";

export default function QuantAIPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Back to Home */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
            Klepon Market Research
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-primary">
              Dashboard
            </Link>
            <Link href="/market" className="text-gray-600 dark:text-gray-300 hover:text-primary">
              Market
            </Link>
            <Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-primary">
              Pricing
            </Link>
            <Link href="/quant-ai" className="text-primary font-medium">
              Quant AI
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-primary">
              Sign In
            </Link>
            <Link href="/login" className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Brain className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-6 tracking-tight text-gray-900 dark:text-white">
            🤖 Quant AI
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Coming Soon: Advanced machine learning-powered market prediction and portfolio optimization engine.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/pricing" className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition">
              Get Early Access
            </Link>
            <Link href="#roadmap" className="border border-gray-300 dark:border-gray-600 px-8 py-3 rounded-lg font-medium hover:border-gray-400 transition text-gray-700 dark:text-gray-300">
              View Roadmap
            </Link>
          </div>
        </div>
      </section>

      {/* Phases */}
      <section id="roadmap" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">Implementation Roadmap</h2>
            <p className="text-gray-600 dark:text-gray-400">We're building Quant AI in phases. Here's what's coming.</p>
          </div>

          <div className="grid gap-8 max-w-5xl mx-auto">
            {/* Phase 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BarChart2 className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Phase 1: Market Prediction Engine</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Core ML models for price forecasting</p>
                </div>
              </div>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li>• Machine Learning models untuk price prediction (1h, 4h, 1d)</li>
                <li>• Probability scores dengan threshold 70% confidence</li>
                <li>• Multiple models: LSTM, XGBoost, Random Forest</li>
                <li>• Feature importance analysis untuk interpretability</li>
              </ul>
            </div>

            {/* Phase 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Phase 2: Smart Signals</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">AI-generated signals with risk management</p>
                </div>
              </div>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li>• AI-generated signals menggabungkan technical + sentiment analysis</li>
                <li>• Confidence scoring untuk setiap signal</li>
                <li>• Risk-adjusted position sizing recommendations</li>
              </ul>
            </div>

            {/* Phase 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <GitBranch className="h-8 w-8 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Phase 3: Portfolio Optimization</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Advanced portfolio theory in practice</p>
                </div>
              </div>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li>• Efficient frontier analysis</li>
                <li>• Risk parity allocation</li>
                <li>• Monte Carlo simulations untuk stress-testing</li>
              </ul>
            </div>

            {/* Phase 4 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <ListTodo className="h-8 w-8 text-orange-600 dark:text-orange-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Phase 4: Backtesting Lab</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Test strategies against historical data</p>
                </div>
              </div>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li>• Strategy backtesting dengan historical data</li>
                <li>• Performance metrics (Sharpe, Sortino, Max Drawdown)</li>
                <li>• Walk-forward optimization untuk out-of-sample testing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Status */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">🛠️ Implementation Status</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: "Economic Calendar (high priority)", status: "done", href: "/economic-calendar" },
                { name: "Trading Journal (track your trades)", status: "done", href: "/trading-journal" },
                { name: "Custom Alerts (price, indicator thresholds)", status: "in-progress" },
                { name: "Multi-Timeframe Analysis (1m, 5m, 15m, 1h, 4h, 1d)", status: "planned" },
                { name: "Correlation Matrix", status: "planned" },
                { name: "Sentiment Analysis (crypto/forex news)", status: "planned" },
                { name: "Performance Analytics", status: "planned" },
                { name: "Quant AI Engine (ML predictions)", status: "planned" },
              ].map((item, idx) => {
                const badge = {
                  done: <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">✅ Done</span>,
                  "in-progress": <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">⏳ In Progress</span>,
                  planned: <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">🔄 Planned</span>,
                }[item.status];
                return (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    {badge}
                    {item.href ? (
                      <Link href={item.href} className="text-gray-700 dark:text-gray-300 hover:underline">
                        {item.name}
                      </Link>
                    ) : (
                      <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to supercharge your trading?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Be the first to access Quant AI when it launches. Early adopters get exclusive perks.
          </p>
          <Link href="/pricing" className="inline-block bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition">
            View Pricing Plans
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm bg-white dark:bg-gray-800 border-t">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} Trading Dashboard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}