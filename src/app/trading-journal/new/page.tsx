"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewTradePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    symbol: "XAUT/USD",
    side: "buy",
    entry: "",
    size: "1",
    exit: "",
    stopLoss: "",
    takeProfit: "",
    pnl: "",
    pnlPct: "",
    date: new Date().toISOString().slice(0, 16),
    exitDate: "",
    notes: "",
    tags: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        entry: parseFloat(form.entry),
        size: parseFloat(form.size),
        exit: form.exit ? parseFloat(form.exit) : null,
        stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : null,
        takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : null,
        pnl: form.pnl ? parseFloat(form.pnl) : null,
        pnlPct: form.pnlPct ? parseFloat(form.pnlPct) : null,
        date: new Date(form.date).toISOString(),
        exitDate: form.exitDate ? new Date(form.exitDate).toISOString() : null,
      };
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      router.push("/trading-journal");
    } catch (err) {
      alert("Error saving trade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back to Home */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Add New Trade</h1>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Symbol</label>
              <select
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              >
                <option value="XAUT/USD">XAUT/USD (Tether Gold)</option>
                <option value="BTC/USD">BTC/USD</option>
                <option value="ETH/USD">ETH/USD</option>
                <option value="SOL/USD">SOL/USD</option>
                <option value="XRP/USD">XRP/USD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Side</label>
              <select
                value={form.side}
                onChange={(e) => setForm({ ...form, side: e.target.value as "buy" | "sell" })}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Entry Price</label>
              <input
                type="number"
                step="any"
                required
                value={form.entry}
                onChange={(e) => setForm({ ...form, entry: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Size (contracts)</label>
              <input
                type="number"
                step="any"
                required
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Exit Price (optional)</label>
              <input
                type="number"
                step="any"
                value={form.exit}
                onChange={(e) => setForm({ ...form, exit: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stop Loss (optional)</label>
              <input
                type="number"
                step="any"
                value={form.stopLoss}
                onChange={(e) => setForm({ ...form, stopLoss: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Take Profit (optional)</label>
              <input
                type="number"
                step="any"
                value={form.takeProfit}
                onChange={(e) => setForm({ ...form, takeProfit: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">P&L (USD, optional)</label>
              <input
                type="number"
                step="any"
                value={form.pnl}
                onChange={(e) => setForm({ ...form, pnl: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">P&L % (optional)</label>
              <input
                type="number"
                step="any"
                value={form.pnlPct}
                onChange={(e) => setForm({ ...form, pnlPct: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Entry Date</label>
              <input
                type="datetime-local"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Exit Date (optional)</label>
              <input
                type="datetime-local"
                value={form.exitDate}
                onChange={(e) => setForm({ ...form, exitDate: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma separated, optional)</label>
            <input
              type="text"
              placeholder="e.g. scalping, BTC"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Trade"}
            </button>
            <Link href="/trading-journal" className="px-6 py-2 border rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
