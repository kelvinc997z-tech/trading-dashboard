"use client";

import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

export interface Signal {
  id: string;
  pair: string;
  type: "BUY" | "SELL";
  entry: number;
  tp: number;
  sl: number;
  time: string;
  status: "active" | "closed" | "pending";
  result?: "win" | "lose";
}

interface SignalTableProps {
  signals: Signal[];
  onClose?: (id: string) => void;
  sortBy?: "pair" | "time" | "entry";
  sortDirection?: "asc" | "desc";
  onSort?: (by: "pair" | "time" | "entry") => void;
}

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

function formatNumber(symbol: string, value: number): string {
  if (symbol === "XRP/USD" || symbol === "KAS/USDT") {
    return value.toFixed(4);
  }
  return value.toFixed(2);
}

export default function SignalTable({ signals, onClose, sortBy, sortDirection, onSort }: SignalTableProps) {
  const sortedSignals = [...signals].sort((a, b) => {
    if (!sortBy) return 0;
    let comparison = 0;
    if (sortBy === "pair") {
      comparison = a.pair.localeCompare(b.pair);
    } else if (sortBy === "entry") {
      comparison = a.entry - b.entry;
    } else if (sortBy === "time") {
      const toSeconds = (t: string) => {
        const [h, m, s] = t.split(":").map(Number);
        return h * 3600 + m * 60 + s;
      };
      comparison = toSeconds(a.time) - toSeconds(b.time);
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th 
              className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${sortBy === "pair" ? "text-blue-600 dark:text-blue-400" : ""}`}
              onClick={() => onSort?.("pair")}
            >
              Pair {getSortIcon("pair")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Signal</th>
            <th 
              className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${sortBy === "entry" ? "text-blue-600 dark:text-blue-400" : ""}`}
              onClick={() => onSort?.("entry")}
            >
              Entry {getSortIcon("entry")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">TP</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">SL</th>
            <th 
              className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${sortBy === "time" ? "text-blue-600 dark:text-blue-400" : ""}`}
              onClick={() => onSort?.("time")}
            >
              Time {getSortIcon("time")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            {onClose && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedSignals.map((signal) => (
            <tr key={signal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
              <td className="px-6 py-4 whitespace-nowrap"><div className="font-semibold text-gray-900 dark:text-white">{signal.pair}</div></td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className={`inline-flex items-center gap-1 font-bold ${signal.type === "BUY" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {signal.type === "BUY" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {signal.type}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-200">${formatNumber(signal.pair, signal.entry)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-green-600 dark:text-green-400 font-medium">${formatNumber(signal.pair, signal.tp)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-red-600 dark:text-red-400 font-medium">${formatNumber(signal.pair, signal.sl)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock className="w-4 h-4" />{signal.time}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[signal.status]}`}>{signal.status.toUpperCase()}</span>
              </td>
              {onClose && (
                <td className="px-6 py-4 whitespace-nowrap">
                  {signal.status === "active" && (
                    <button
                      onClick={() => onClose(signal.id)}
                      className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                    >
                      Close
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
