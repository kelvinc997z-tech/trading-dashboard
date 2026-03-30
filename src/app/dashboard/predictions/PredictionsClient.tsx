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
  Legend,
} from "recharts";

export default function PredictionsClient() {
  const [symbol, setSymbol] = useState("BTC/USD");
  const [timeframe, setTimeframe] = useState("1h");
  const [model, setModel] = useState("ensemble");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/predictions?symbol=${symbol}&timeframe=${timeframe}&model=${model}`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPredictions(); }, [symbol, timeframe, model]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">AI Price Predictions</h1>
        <div className="flex gap-2">
          <select value={symbol} onChange={e => setSymbol(e.target.value)} className="select select-bordered">
            <option value="BTC/USD">Bitcoin</option>
            <option value="ETH/USD">Ethereum</option>
            <option value="SOL/USD">Solana</option>
            <option value="XRP/USD">Ripple</option>
            <option value="XAUT/USD">Gold</option>
          </select>
          <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="select select-bordered">
            <option value="1h">1 Hour</option>
            <option value="4h">4 Hours</option>
            <option value="1d">1 Day</option>
          </select>
          <select value={model} onChange={e => setModel(e.target.value)} className="select select-bordered">
            <option value="ensemble">Ensemble</option>
            <option value="lstm">LSTM</option>
            <option value="xgboost">XGBoost</option>
          </select>
          <button onClick={fetchPredictions} className="btn btn-primary" disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {data && (
        <div className="mb-6 p-4 card bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-sm text-gray-500">Current {symbol}</div>
              <div className="text-2xl font-bold">${data.currentPrice.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Model</div>
              <div className="font-semibold">{data.modelType}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Confidence</div>
              <div className="font-semibold">{(data.confidence * 100).toFixed(1)}%</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 italic">{data.message}</div>
        </div>
      )}

      {loading ? (
        <div>Loading predictions...</div>
      ) : data && (
        <div className="card p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Predicted Price ({timeframe} ahead)</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.predictions.map((p: any, idx: number) => ({ ...p, period: `+${idx+1}` }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} tickFormatter={(v) => `$${Number(v).toLocaleString()}`} />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Price"]} labelFormatter={(label) => `${timeframe} ${label}`} />
                <Legend />
                <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} name="Predicted" />
                <Line type="monotone" dataKey="upper" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" name="Upper Bound" />
                <Line type="monotone" dataKey="lower" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" name="Lower Bound" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
        <strong className="text-yellow-800 dark:text-yellow-200">⚠️ Disclaimers:</strong>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-yellow-700 dark:text-yellow-300">
          <li>Predictions are probabilistic estimates, not financial advice.</li>
          <li>Current predictions are dummy values; real ML models coming soon.</li>
          <li>Always do your own research before trading.</li>
        </ul>
      </div>
    </div>
  );
}
