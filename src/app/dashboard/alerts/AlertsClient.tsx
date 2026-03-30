"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Alert {
  id: string;
  type: string;
  symbol: string | null;
  condition: string;
  value: number | null;
  indicator: string | null;
  timeframe: string | null;
  notificationChannel: string | null;
  isActive: boolean;
  lastTriggered?: string | null;
  createdAt: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "price",
    symbol: "",
    condition: "above",
    value: "",
    indicator: "",
    timeframe: "1h",
    notificationChannel: "email",
  });

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) setAlerts(await res.json());
    } catch (e) {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, value: form.value ? parseFloat(form.value) : null, symbol: form.symbol || null };
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Alert created");
        setShowForm(false);
        setForm({ type: "price", symbol: "", condition: "above", value: "", indicator: "", timeframe: "1h", notificationChannel: "email" });
        fetchAlerts();
      } else {
        toast.error("Failed to create alert");
      }
    } catch (e) {
      toast.error("Error creating alert");
    }
  };

  const toggleAlert = async (id: string, isActive: boolean) => {
    await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchAlerts();
    toast.success(`Alert ${isActive ? "disabled" : "enabled"}`);
  };

  const deleteAlert = async (id: string) => {
    if (!confirm("Delete this alert?")) return;
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    fetchAlerts();
    toast.success("Alert deleted");
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Custom Alerts</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? "Cancel" : "New Alert"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createAlert} className="card p-4 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input w-full">
                <option value="price">Price</option>
                <option value="indicator">Indicator</option>
                <option value="pattern">Pattern</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Symbol (optional, leave empty for all)</label>
              <input type="text" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} placeholder="e.g. BTC/USD" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm mb-1">Condition</label>
              <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} className="input w-full">
                <option value="above">Above</option>
                <option value="below">Below</option>
                <option value="cross_above">Cross Above</option>
                <option value="cross_below">Cross Below</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Value</label>
              <input type="number" step="any" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="input w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Indicator (if type is indicator)</label>
              <select value={form.indicator} onChange={e => setForm({ ...form, indicator: e.target.value })} className="input w-full">
                <option value="">Select...</option>
                <option value="rsi">RSI</option>
                <option value="macd">MACD</option>
                <option value="bollinger">Bollinger Bands</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Timeframe</label>
              <select value={form.timeframe} onChange={e => setForm({ ...form, timeframe: e.target.value })} className="input w-full">
                <option value="1m">1 minute</option>
                <option value="5m">5 minutes</option>
                <option value="15m">15 minutes</option>
                <option value="1h">1 hour</option>
                <option value="4h">4 hours</option>
                <option value="1d">1 day</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Notify via</label>
              <select value={form.notificationChannel} onChange={e => setForm({ ...form, notificationChannel: e.target.value })} className="input w-full">
                <option value="email">Email</option>
                <option value="telegram">Telegram</option>
                <option value="push">Push</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Create Alert</button>
        </form>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : alerts.length === 0 ? (
        <div className="text-gray-500">No alerts configured.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Symbol</th>
                <th>Condition</th>
                <th>Value</th>
                <th>Notify</th>
                <th>Status</th>
                <th>Last Triggered</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(alert => (
                <tr key={alert.id}>
                  <td>{alert.type}</td>
                  <td>{alert.symbol || "All"}</td>
                  <td>{alert.condition}</td>
                  <td>{alert.value ?? "-"}</td>
                  <td>{alert.notificationChannel}</td>
                  <td>
                    <span className={`badge ${alert.isActive ? "badge-success" : "badge-neutral"}`}>
                      {alert.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>{alert.lastTriggered ? new Date(alert.lastTriggered).toLocaleString() : "-"}</td>
                  <td>{new Date(alert.createdAt).toLocaleDateString()}</td>
                  <td className="flex gap-2">
                    <button onClick={() => toggleAlert(alert.id, alert.isActive)} className="btn btn-xs">
                      {alert.isActive ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => deleteAlert(alert.id)} className="btn btn-xs btn-error">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
