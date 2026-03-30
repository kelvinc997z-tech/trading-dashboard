"use client";

import CandlestickChart from "@/components/CandlestickChart";

interface Pair {
  symbol: string;
  name: string;
}

const PAIRS: Pair[] = [
  { symbol: "XAUT/USD", name: "Gold" },
  { symbol: "BTC/USD", name: "Bitcoin" },
  { symbol: "ETH/USD", name: "Ethereum" },
  { symbol: "SOL/USD", name: "Solana" },
  { symbol: "XRP/USD", name: "Ripple" },
];

export default function MiniChartsBar() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {PAIRS.map((pair) => (
        <div key={pair.symbol} className="rounded-lg border bg-card p-3 shadow-sm">
          <h3 className="text-sm font-semibold mb-1">{pair.name}</h3>
          <div style={{ height: 120 }}>
            <CandlestickChart symbol={pair.symbol} height={120} />
          </div>
        </div>
      ))}
    </div>
  );
}
