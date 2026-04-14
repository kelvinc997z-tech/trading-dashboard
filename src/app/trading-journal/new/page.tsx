"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewTradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    symbol: "",
    side: "buy",
    entry: "",
    size: "",
    status: "open",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        entry: parseFloat(formData.entry),
        size: parseFloat(formData.size),
      }),
    });
    if (res.ok) {
      router.push("/trading-journal");
    } else {
      setLoading(false);
      alert("Failed to save trade");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/trading-journal" className="text-gray-500 hover:text-gray-700">Back</Link>
        <h1 className="text-2xl font-bold">New Trade</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Symbol</label>
            <input
              required
              type="text"
              placeholder="e.g. BTC/USD"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Side</label>
            <select
              value={formData.side}
              onChange={(e) => setFormData({ ...formData, side: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            >
              <option value="buy">Buy (Long)</option>
              <option value="sell">Sell (Short)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Entry Price</label>
            <input
              required
              type="number"
              step="any"
              value={formData.entry}
              onChange={(e) => setFormData({ ...formData, entry: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Size</label>
            <input
              required
              type="number"
              step="any"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            required
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Trade"}
        </button>
      </form>
    </div>
  );
}
