"use client";

import { useEffect, useState } from "react";

interface Signal {
  pair: string;
  emoji: string;
  signal: string;
  entry: number;
  tp: number;
  sl: number;
}

interface MarketData {
  date: string;
  market: string;
  signals: Signal[];
  disclaimer: string;
}

export default function MarketOutlook() {
  // Static data for daily manual outlook
  const staticData: MarketData = {
    date: "2026-03-30",
    market: "Forex And Commodities",
    signals: [
      {
        pair: "Gold",
        emoji: "🪙",
        signal: "Sell",
        entry: 4555,
        tp: 4500,
        sl: 4600,
      },
      {
        pair: "EURUSD",
        emoji: "💶",
        signal: "Sell",
        entry: 1.1506,
        tp: 1.1447,
        sl: 1.1548,
      },
      {
        pair: "USDJPY",
        emoji: "🇯🇵",
        signal: "Buy",
        entry: 160.50,
        tp: 161.10,
        sl: 159.00,
      },
      {
        pair: "GBPUSD",
        emoji: "💷",
        signal: "Sell",
        entry: 1.32513,
        tp: 1.32030,
        sl: 1.33790,
      },
      {
        pair: "OIL",
        emoji: "🛢",
        signal: "Buy",
        entry: 101.00,
        tp: 105.80,
        sl: 98.20,
      },
      {
        pair: "Silver",
        emoji: "🥈",
        signal: "Buy",
        entry: 69.90,
        tp: 71.20,
        sl: 67.00,
      },
    ],
    disclaimer: "Sinyal yang di berikan hanya bersifat rekomendasi bukan jaminan profit , semua di buat berdasarkan analisa dan pergerakan market saat itu",
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    if (Number.isInteger(num)) {
      return num.toString();
    }
    return num.toFixed(5).replace(/\.?0+$/, "");
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Market Outlook</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{staticData.date} • {staticData.market}</p>
        </div>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Daily</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2">Pair</th>
              <th className="px-3 py-2">Signal</th>
              <th className="px-3 py-2">Entry</th>
              <th className="px-3 py-2">TP</th>
              <th className="px-3 py-2">SL</th>
            </tr>
          </thead>
          <tbody>
            {staticData.signals.map((s, i) => (
              <tr key={i} className="border-b dark:border-gray-700">
                <td className="px-3 py-2 flex items-center gap-2">
                  <span>{s.emoji}</span>
                  <span className="font-medium">{s.pair}</span>
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${s.signal === "Buy" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"}`}>
                    {s.signal}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono">{formatNumber(s.entry)}</td>
                <td className="px-3 py-2 text-green-600 dark:text-green-400 font-mono">{formatNumber(s.tp)}</td>
                <td className="px-3 py-2 text-red-600 dark:text-red-400 font-mono">{formatNumber(s.sl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 italic">
        {staticData.disclaimer}
      </p>
    </div>
  );
}
