"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditTradePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/trades/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setFormData({
          ...data,
          date: new Date(data.date).toISOString().split("T")[0]
        });
        setLoading(false);
      });
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/trades/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        entry: parseFloat(formData.entry),
        size: parseFloat(formData.size),
        exit: formData.exit ? parseFloat(formData.exit) : undefined,
        pnl: formData.pnl ? parseFloat(formData.pnl) : undefined,
      }),
    });
    if (res.ok) {
      router.push("/trading-journal");
    } else {
      setSaving(false);
      alert("Failed to update trade");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/trading-journal" className="text-gray-500 hover:text-gray-700">Back</Link>
        <h1 className="text-2xl font-bold">Edit Trade</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Symbol</label>
            <input
              required
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
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

        {formData.status === "closed" && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-1">Exit Price</label>
              <input
                type="number"
                step="any"
                value={formData.exit || ""}
                onChange={(e) => setFormData({ ...formData, exit: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Final P&L ($)</label>
              <input
                type="number"
                step="any"
                value={formData.pnl || ""}
                onChange={(e) => setFormData({ ...formData, pnl: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary text-white py-2 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Update Trade"}
        </button>
      </form>
    </div>
  );
}
