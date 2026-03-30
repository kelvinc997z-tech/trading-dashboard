"use client";

import { useEffect, useState } from "react";

interface Signal {
  pair: string;
  emoji: string;
  signal: "Buy" | "Sell";
  entry: number;
  tp: number;
  sl: number;
}

export default function SignalsTicker() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch("/api/market-signals");
        if (res.ok) {
          const data = await res.json();
          setSignals(data.signals || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSignals();
    const interval = setInterval(fetchSignals, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || signals.length === 0) return null;

  return (
    <div className="overflow-hidden whitespace-nowrap bg-gray-50 dark:bg-gray-800 border-y py-2">
      <div className="inline-block animate-marquee">
        {signals.map((sig, i) => (
          <span key={i} className="mx-6 inline-flex items-center gap-2 text-sm">
            <span className="font-bold">{sig.emoji} {sig.pair}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${sig.signal === "Buy" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {sig.signal}
            </span>
            <span className="text-gray-600 dark:text-gray-300">
              Entry: {sig.entry.toFixed(2)} | TP: {sig.tp.toFixed(2)} | SL: {sig.sl.toFixed(2)}
            </span>
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
