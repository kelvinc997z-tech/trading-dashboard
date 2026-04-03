#!/usr/bin/env node
/**
 * Dashboard Layout Fix Script
 * Replaces the header and improves spacing/alignment
 */

const fs = require('fs');
const path = 'src/app/dashboard/page.tsx';

let content = fs.readFileSync(path, 'utf8');

// Find and replace the header section (from "return (div" to before "main")
const oldHeaderStart = /return\s*\(\s*<div\s+class="space-y-6">\s*\{\/\*\s*Back to Home \*\/\s*<div class="px-4">/s;
const oldHeaderEnd = /<\/div>\s*<\/header>\s*<main class="container mx-auto px-4 md:px-6 py-8">/s;

if (oldHeaderStart.test(content) && oldHeaderEnd.test(content)) {
  // Extract everything after main
  const afterMainMatch = content.match(/<main class="container mx-auto px-4 md:px-6 py-8">(.*)$/s);
  const afterMain = afterMainMatch ? afterMainMatch[1] : '';
  
  // New header
  const newHeader = `return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Left: Title + Back */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Link href="/" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </Link>
              <div className="flex-1 md:flex-none">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600">
                  Trading Dashboard
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Monitor & manage your trades</p>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {/* Timeframe Selector */}
              <div className="relative group">
                <select 
                  value={timeframe} 
                  onChange={e => setTimeframe(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  <option value="1m">1m</option>
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="1h">1h</option>
                  <option value="4h">4h</option>
                  <option value="1d">1d</option>
                </select>
                <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Last Update */}
              <div className="hidden sm:block text-right px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">Updated</p>
                <p className="text-xs font-mono text-gray-700 dark:text-gray-300">{lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              {/* Live Indicator */}
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
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
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-semibold shadow-sm hover:from-yellow-500 hover:to-orange-600 transition-all whitespace-nowrap"
                >
                  Pro
                </Link>
              ) : (
                <button
                  onClick={handleUpgrade}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-semibold shadow-sm hover:from-yellow-500 hover:to-orange-600 transition-all whitespace-nowrap"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="space-y-8">
`;

  // Replace old header with new
  content = content.replace(/return\s*\(\s*<div\s+class="space-y-6">[\s\S]*?(?=<main class="container mx-auto px-4 md:px-6 py-8">)/, newHeader);
  
  console.log('✅ Header updated successfully');
} else {
  console.log('❌ Could not find header pattern - file may have unexpected structure');
  process.exit(1);
}

fs.writeFileSync(path, content);
console.log('✅ Dashboard layout fixed!');
