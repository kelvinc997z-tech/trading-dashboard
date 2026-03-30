"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Filter, Edit, Trash2 } from "lucide-react";

interface Trade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  entry: number;
  size: number;
  exit?: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl?: number;
  pnlPct?: number;
  status?: string;
  date: string;
  exitDate?: string;
  notes?: string;
  tags?: string;
}

export default function TradingJournalPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSymbol, setFilterSymbol] = useState<string>("all");

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const res = await fetch("/api/trades");
      if (!res.ok) throw new Error("Failed to fetch trades");
      const data = await res.json();
      setTrades(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteTrade = async (id: string) => {
    if (!confirm("Delete this trade?")) return;
    try {
      const res = await fetch(`/api/trades/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setTrades((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert("Error deleting trade");
    }
  };

  const symbols = [...new Set(trades.map((t) => t.symbol))].sort();

  const filteredTrades = trades.filter((t) =>
    filterSymbol === "all" || t.symbol === filterSymbol
  );

  const exportCSV = () => {
    const headers = [
      "Date",
      "Symbol",
      "Side",
      "Entry",
      "Size",
      "Exit",
      "StopLoss",
      "TakeProfit",
      "P&L",
      "P&L %",
      "Status",
      "Notes",
      "Tags",
    ];
    const rows = trades.map((t) => [
      t.date,
      t.symbol,
      t.side,
      t.entry,
      t.size,
      t.exit || "",
      t.stopLoss || "",
      t.takeProfit || "",
      t.pnl || "",
      t.pnlPct || "",
      t.status || "open",
      (t.notes || "").replace(/"/g, '""'),
      (t.tags || "").replace(/"/g, '""'),
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((field) => `"${field}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trades-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Back to Home */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trading Journal</h1>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Export CSV
            </button>
            <Link
              href="/trading-journal/new"
              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition"
            >
              <Plus className="w-4 h-4" />
              Add Trade
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 flex items-center gap-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filterSymbol}
            onChange={(e) => setFilterSymbol(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
          >
            <option value="all">All Symbols</option>
            {symbols.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Side</th>
                <th className="px-4 py-3">Entry</th>
                <th className="px-4 py-3">Exit</th>
                <th className="px-4 py-3">SL</th>
                <th className="px-4 py-3">TP</th>
                <th className="px-4 py-3">P&L</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No trades found.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade) => (
                  <tr key={trade.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      {new Date(trade.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium">{trade.symbol}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          trade.side === "buy"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {trade.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">{trade.entry}</td>
                    <td className="px-4 py-3">{trade.exit || "-"}</td>
                    <td className="px-4 py-3">{trade.stopLoss || "-"}</td>
                    <td className="px-4 py-3">{trade.takeProfit || "-"}</td>
                    <td className="px-4 py-3">
                      {trade.pnl ? (
                        <span
                          className={`font-medium ${
                            Number(trade.pnl) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {Number(trade.pnl) >= 0 ? "+" : ""}
                          {trade.pnl}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/trading-journal/${trade.id}/edit`}
                          className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteTrade(trade.id)}
                          className="flex items-center gap-1 text-red-600 hover:underline text-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}