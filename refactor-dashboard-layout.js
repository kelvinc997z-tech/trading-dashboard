#!/usr/bin/env node
/**
 * Dashboard Layout Refactor
 * Creates a clean, balanced layout with consistent spacing
 */

const fs = require('fs');
const path = 'src/app/dashboard/page.tsx';

let code = fs.readFileSync(path, 'utf8');

// Find the return statement and replace the entire structure
const returnMatch = code.match(/return\s*\(([\s\S]*?)^\s*}\);?\s*$/m);
if (!returnMatch) {
  console.error('Could not find return statement');
  process.exit(1);
}

const newStructure = `return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-6">
              <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </Link>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600">
                  Dashboard
                </h1>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3">
              {/* Timeframe */}
              <div className="relative">
                <select 
                  value={timeframe} 
                  onChange={e => setTimeframe(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
                >
                  <option value="1m">1m</option>
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="1h">1h</option>
                  <option value="4h">4h</option>
                  <option value="1d">1d</option>
                </select>
                <svg className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Last Update (hidden on mobile) */}
              <div className="hidden sm:flex flex-col items-end px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Updated</p>
                <p className="text-xs font-mono text-gray-700 dark:text-gray-300">{lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              {/* Live Indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-emerald-200 dark:border-emerald-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Live</span>
              </div>

              {/* Upgrade Button */}
              {user?.role === "pro" ? (
                <Link 
                  href="/pricing" 
                  className="px-3 py-1.5 rounded-md bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold shadow-sm hover:from-yellow-500 hover:to-orange-600 transition-all whitespace-nowrap"
                >
                  Pro
                </Link>
              ) : (
                <button
                  onClick={handleUpgrade}
                  className="px-3 py-1.5 rounded-md bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold shadow-sm hover:from-yellow-500 hover:to-orange-600 transition-all whitespace-nowrap"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            ${[
              {
                label: "Open Positions",
                value: openTradesCount,
                sublabel: "Active trades",
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                label: "Today's P&L",
                value: realizedToday.toFixed(2),
                sublabel: "Net profit",
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                gradient: "from-emerald-500 to-teal-500",
                positive: realizedToday >= 0
              },
              {
                label: "Total Equity",
                value: "$12,450.00",
                sublabel: "Portfolio",
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                gradient: "from-purple-500 to-pink-500"
              },
              {
                label: "Status",
                value: "Online",
                sublabel: "All systems",
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ),
                gradient: "from-emerald-500 to-green-500"
              }
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className={`text-xl font-bold mt-1 ${stat.positive !== undefined ? (stat.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400') : 'text-gray-900 dark:text-white'}`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{stat.sublabel}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} text-white`}>
                    {stat.icon}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Crypto Section */}
          <section>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cryptocurrency</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Real-time analysis</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium self-start sm:self-auto">
                ${CRYPTO_PAIRS.length} pairs
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              ${CRYPTO_PAIRS.map((pair, idx) => (
                <motion.div
                  key={pair.symbol}
                  id={\`chart-\${pair.symbol.toLowerCase()}\`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={\`bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow \${selectedSymbol === pair.symbol ? 'ring-2 ring-emerald-500' : ''}\`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">\${pair.symbol}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">\${pair.name}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {timeframe}
                    </span>
                  </div>
                  <div className="h-40 bg-gray-50 dark:bg-gray-900/50 rounded-lg mb-3">
                    {isLoading ? (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading...</div>
                    ) : (
                      user?.role === "pro" ? 
                        <AdvancedChart symbol={pair.symbol} indicators={["rsi", "macd", "bollinger"]} timeframe={timeframe} /> :
                        <RealTimeChart symbol={pair.symbol} timeframe={timeframe} />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* US Stocks Section */}
          <section className="mt-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">US Stocks</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Major equities</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium self-start sm:self-auto">
                ${US_STOCKS.length} stocks
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              ${US_STOCKS.map((pair, idx) => (
                <motion.div
                  key={pair.symbol}
                  id={\`chart-\${pair.symbol.toLowerCase()}\`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                  className={\`bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow \${selectedSymbol === pair.symbol ? 'ring-2 ring-blue-500' : ''}\`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">\${pair.symbol}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">\${pair.name}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {timeframe}
                    </span>
                  </div>
                  <div className="h-40 bg-gray-50 dark:bg-gray-900/50 rounded-lg mb-3">
                    {isLoading ? (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading...</div>
                    ) : (
                      user?.role === "pro" ? 
                        <AdvancedChart symbol={pair.symbol} indicators={["rsi", "macd", "bollinger"]} timeframe={timeframe} />
                        : <RealTimeChart symbol={pair.symbol} timeframe={timeframe} />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Tabs */}
          <section className="mt-8">
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="flex gap-6 overflow-x-auto">
                ${[
                  { id: "charts", label: "Charts" },
                  { id: "sentiment", label: "Sentiment" },
                  { id: "correlation", label: "Correlations" },
                  { id: "performance", label: "Performance" },
                  { id: "outlook", label: "Outlook" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={\`py-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap \${activeTab === tab.id ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}\`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </section>

          {/* Tab Content */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            {activeTab === "charts" && (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                Chart view active (see charts above)
              </div>
            )}
            {activeTab === "sentiment" && <MarketSentiment />}
            {activeTab === "correlation" && <CorrelationMatrix />}
            {activeTab === "performance" && <PerformanceClient />}
            {activeTab === "outlook" && <MarketOutlookEnhanced />}
          </section>

          {/* Market Outlook Cards */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Market Outlook</h3>
              <MarketOutlook />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Enhanced Analysis</h3>
              <MarketOutlookEnhanced />
            </div>
          </section>

          {/* Trades Table */}
          <section className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Trades</h2>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">
                    {trades.length} total
                  </span>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                    {openTradesCount} open
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Pair</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Side</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Entry</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">TP</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">SL</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {trades.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          No trades yet
                        </td>
                      </tr>
                    ) : (
                      trades.map((trade, idx) => {
                        const isOpen = trade.status === "open";
                        const displayPnl = isOpen ? (trade.unrealizedPnl || 0) : (trade.pnl || 0);
                        const pnlClass = displayPnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
                        return (
                          <tr key={trade.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {trade.time}
                              {isOpen && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  Open
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{trade.pair}</td>
                            <td className="px-4 py-3">
                              <span className={\`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium \${trade.side === "buy" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}\`}>
                                {trade.side === "buy" ? "▲" : "▼"} {trade.side.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">{trade.size.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">{trade.entry.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm font-mono text-cyan-600 dark:text-cyan-400">{trade.takeProfit?.toFixed(2) || "-"}</td>
                            <td className="px-4 py-3 text-sm font-mono text-orange-600 dark:text-orange-400">{trade.stopLoss?.toFixed(2) || "-"}</td>
                            <td className={\`px-4 py-3 text-sm font-mono font-semibold \${pnlClass}\`}>
                              {displayPnl >= 0 ? "+" : ""}{displayPnl.toFixed(2)}
                              {isOpen && <span className="text-xs opacity-75 ml-1">(unreal)</span>}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
`;

// Replace the entire return block
const beforeReturn = code.substring(0, returnMatch.index + 'return ('.length);
const afterClosing = code.substring(returnMatch.index + returnMatch[0].length - 2); // -2 to keep ');'

code = beforeReturn + newStructure + afterClosing;

fs.writeFileSync(path, code);
console.log('✅ Dashboard layout refactored with consistent spacing');
