"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";

interface CorrelationData {
  [symbol: string]: {
    [symbol2: string]: number;
  };
}

const COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"];

export default function CorrelationMatrix() {
  const [data, setData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("1d");

  const fetchCorrelations = async (p: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/correlations?period=${p}`);
      const json = await res.json();
      setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrelations(period);
  }, [period]);

  if (loading) return <div className="p-4">Loading correlations...</div>;
  if (!data) return <div className="p-4">No data</div>;

  const symbols = Object.keys(data);
  type HeatmapRow = { pair: string } & Record<string, number>;
  const heatmapData: HeatmapRow[] = symbols.map(s1 => {
    const item = data[s1] as Record<string, number>;
    // Exclude 'pair' from spread to avoid conflict with explicit pair property
    const { pair: _ignore, ...rest } = item;
    return { pair: s1, ...rest } as HeatmapRow;
  });

  // For bar chart of average correlations
  const avgCorrs = symbols.map(s => {
    const values = Object.values(data[s]).filter(v => v !== 1);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { symbol: s, avgCorr: avg };
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Correlation Matrix</h2>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="select select-bordered">
          <option value="1h">1 Hour</option>
          <option value="4h">4 Hours</option>
          <option value="1d">1 Day</option>
          <option value="1w">1 Week</option>
        </select>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th></th>
              {symbols.map(s => <th key={s}>{s.split('/')[0]}</th>)}
            </tr>
          </thead>
          <tbody>
            {heatmapData.map((row, i) => (
              <tr key={row.pair}>
                <td className="font-semibold">{row.pair.split('/')[0]}</td>
                {symbols.map(s2 => {
                  const val = row[s2];
                  const intensity = Math.abs(val);
                  const color = val === 1 ? "#94a3b8" : val > 0 ? `rgba(16, 185, 129, ${intensity})` : `rgba(239, 68, 68, ${intensity})`;
                  return (
                    <td key={s2} style={{ backgroundColor: color, color: intensity > 0.6 ? "white" : "black" }} className="text-center">
                      {val.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-semibold mb-2">Average Correlation (vs others)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={avgCorrs}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="symbol" />
            <YAxis domain={[-1, 1]} />
            <Tooltip formatter={(value: number) => [value.toFixed(3), "Avg Corr"]} />
            <Bar dataKey="avgCorr" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Correlations near 1.0 indicate strong positive co-movement. Near -1.0 indicate inverse relationship. Values based on recent price returns.
      </p>
    </div>
  );
}
