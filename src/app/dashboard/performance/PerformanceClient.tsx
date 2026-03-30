"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface PerformanceData {
  period: string;
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalPnL: number;
  avgTradePnL: number;
  bestTrade: number;
  worstTrade: number;
  avgHoldingMs: number;
}

export default function PerformanceClient() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = async () => {
    try {
      const res = await fetch("/api/performance?period=all-time");
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPerformance(); }, []);

  const formatMs = (ms: number) => {
    const hours = ms / (1000 * 60 * 60);
    return `${hours.toFixed(1)} h`;
  };

  if (loading) return <div className="p-6">Loading performance...</div>;
  if (!data) return <div className="p-6">No performance data available. Close some trades first.</div>;

  const equityCurve = [];
  let equity = 1000;
  for (let i = 0; i < data.totalTrades; i++) {
    equity += data.avgTradePnL;
    equityCurve.push({ trade: i + 1, equity: Number(equity.toFixed(2)) });
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Performance Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-4">
          <div className="text-sm text-gray-500">Total P&L</div>
          <div className={`text-2xl font-bold ${data.totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
            ${data.totalPnL.toFixed(2)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Win Rate</div>
          <div className="text-2xl font-bold">{data.winRate.toFixed(1)}%</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Sharpe Ratio</div>
          <div className="text-2xl font-bold">{data.sharpeRatio.toFixed(3)}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Profit Factor</div>
          <div className="text-2xl font-bold">{data.profitFactor.toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Max Drawdown</div>
          <div className="text-2xl font-bold text-red-600">-{data.maxDrawdown.toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Avg Trade</div>
          <div className={`text-2xl font-bold ${data.avgTradePnL >= 0 ? "text-green-600" : "text-red-600"}`}>
            ${data.avgTradePnL.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-2">Equity Curve (Simulated)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityCurve}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trade" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Equity"]} />
                <Line type="monotone" dataKey="equity" stroke="#16a34a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-2">Win/Loss Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: "Avg Win", value: data.avgWin },
                { name: "Avg Loss", value: -Math.abs(data.avgLoss) },
                { name: "Best", value: data.bestTrade },
                { name: "Worst", value: -Math.abs(data.worstTrade) },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, ""]} />
                <Bar dataKey="value" fill={data.avgWin >= 0 ? "#16a34a" : "#dc2626"} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-2">Detailed Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Total Trades</div>
            <div className="font-semibold">{data.totalTrades}</div>
          </div>
          <div>
            <div className="text-gray-500">Avg Holding Time</div>
            <div className="font-semibold">{formatMs(data.avgHoldingMs)}</div>
          </div>
          <div>
            <div className="text-gray-500">Avg Win</div>
            <div className="font-semibold text-green-600">${data.avgWin.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-gray-500">Avg Loss</div>
            <div className="font-semibold text-red-600">${data.avgLoss.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Note: Sharpe ratio calculated using per-trade P&L% as returns. Equity curve is simulated assuming equal trade size and starting capital of $1,000.
      </p>
    </div>
  );
}
