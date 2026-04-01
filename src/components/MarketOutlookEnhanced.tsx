"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Calendar, AlertCircle } from "lucide-react";

interface Signal {
  pair: string;
  signal: "Buy" | "Sell";
  entry: number;
  tp: number;
  sl: number;
}

interface EconomicEvent {
  time: string;
  event: string;
  impact: "high" | "medium" | "low";
}

export default function MarketOutlookEnhanced() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [economicCalendar, setEconomicCalendar] = useState<EconomicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Static data for now (matches your email format)
  const staticSignals: Signal[] = [
    { pair: "Gold (XAUT)", signal: "Buy", entry: 4760, tp: 4820, sl: 4720 },
    { pair: "EURUSD", signal: "Sell", entry: 1.15860, tp: 1.15570, sl: 1.16308 },
    { pair: "USDJPY", signal: "Sell", entry: 158.70, tp: 158.30, sl: 159.20 },
    { pair: "GBPUSD", signal: "Sell", entry: 1.32913, tp: 1.32430, sl: 1.33790 },
    { pair: "Oil (WTI)", signal: "Sell", entry: 98.50, tp: 96.00, sl: 101.20 },
    { pair: "Silver (XAG)", signal: "Buy", entry: 75.00, tp: 76.50, sl: 74.00 },
  ];

  const staticEvents: EconomicEvent[] = [
    { time: "14:00 WIB", event: "US Non-Farm Payrolls", impact: "high" },
    { time: "16:30 WIB", event: "Crude Oil Inventory", impact: "medium" },
    { time: "20:00 WIB", event: "FOMC Minutes", impact: "high" },
  ];

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setSignals(staticSignals);
      setEconomicCalendar(staticEvents);
      setIsLoading(false);
    }, 500);
  }, []);

  const calculatePnL = (entry: number, tp: number, sl: number, signal: "Buy" | "Sell") => {
    const tpChange = signal === "Buy" ? ((tp - entry) / entry) * 100 : ((entry - tp) / entry) * 100;
    const slChange = signal === "Buy" ? ((entry - sl) / entry) * 100 : ((entry - sl) / entry) * 100;
    return { tp: tpChange.toFixed(2), sl: slChange.toFixed(2) };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            📈 Market Outlook
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Trading Signals for {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Disclaimer Active</span>
        </div>
      </div>

      {/* Trading Signals Table */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 bg-muted/50 p-4 font-semibold text-sm border-b">
          <div className="col-span-3">Pair</div>
          <div className="col-span-2 text-center">Signal</div>
          <div className="col-span-2 text-right">Entry</div>
          <div className="col-span-2 text-right">TP</div>
          <div className="col-span-2 text-right">SL</div>
          <div className="col-span-1 text-right">%</div>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading signals...</div>
        ) : (
          signals.map((signal, idx) => {
            const pnl = calculatePnL(signal.entry, signal.tp, signal.sl, signal.signal);
            const isBuy = signal.signal === "Buy";
            return (
              <div key={idx} className="grid grid-cols-12 p-4 border-b last:border-b-0 hover:bg-muted/30 transition">
                <div className="col-span-3 font-medium">{signal.pair}</div>
                <div className={`col-span-2 flex items-center justify-center font-bold ${isBuy ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {isBuy ? <TrendingUp className="w-4 h-4 mr-2" /> : <TrendingDown className="w-4 h-4 mr-2" />}
                  {signal.signal}
                </div>
                <div className="col-span-2 text-right font-mono">{typeof signal.entry === 'number' && signal.entry < 1000 ? signal.entry.toFixed(5) : signal.entry.toFixed(2)}</div>
                <div className={`col-span-2 text-right font-mono ${isBuy ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {typeof signal.tp === 'number' && signal.tp < 100 ? signal.tp.toFixed(5) : signal.tp.toFixed(2)}
                  <span className="text-xs ml-1">+{pnl.tp}%</span>
                </div>
                <div className={`col-span-2 text-right font-mono ${isBuy ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                  {typeof signal.sl === 'number' && signal.sl < 100 ? signal.sl.toFixed(5) : signal.sl.toFixed(2)}
                  <span className="text-xs ml-1">-{pnl.sl}%</span>
                </div>
                <div className="col-span-1 text-right text-xs text-gray-500">
                  R/R 1:{(Math.abs(parseFloat(pnl.tp)) / Math.abs(parseFloat(pnl.sl))).toFixed(1)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Economic Calendar */}
      {!isLoading && economicCalendar.length > 0 && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Today's Economic Calendar
          </h3>
          <div className="space-y-2">
            {economicCalendar.map((event, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-gray-500">{event.time}</span>
                  <span>{event.event}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  event.impact === "high" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  event.impact === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                }`}>
                  {event.impact.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1">Disclaimer</p>
            <p>Sinyal yang diberikan hanya bersifat rekomendasi, bukan jaminan profit. Semua dibuat berdasarkan analisa dan pergerakan market saat itu. Trading always involves risk.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
