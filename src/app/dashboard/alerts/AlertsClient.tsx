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

  const indicatorConditions = {
    rsi: ["above", "below"],
    macd: ["above", "below", "cross_above", "cross_below"],
    bollinger: ["above_upper", "below_lower"],
  } as const;

  const patternOptions = [
    { value: "doji", label: "Doji" },
    { value: "hammer", label: "Hammer" },
    { value: "shooting_star", label: "Shooting Star" },
    { value: "bullish_engulfing", label: "Bullish Engulfing" },
    { value: "bearish_engulfing", label: "Bearish Engulfing" },
    { value: "morning_star", label: "Morning Star" },
    { value: "evening_star", label: "Evening Star" },
  ];

  const getPatternLabel = (value: string) => {
    return patternOptions.find(p => p.value === value)?.label || value;
  };

  const isIndicatorType = form.type === "indicator";
  const allowedConditions: string[] = isIndicatorType && form.indicator
    ? [...indicatorConditions[form.indicator as keyof typeof indicatorConditions]]
    : ["above", "below", "cross_above", "cross_below"];

  // Label mappings for display
  const conditionLabels: Record<string, string> = {
    above: "Above",
    below: "Below",
    cross_above: "Cross Above",
    cross_below: "Cross Below",
    above_upper: "Price Above Upper Band",
    below_lower: "Price Below Lower Band",
    detected: "Detected",
  };

  // Reset condition when indicator changes to ensure it's allowed
  const handleIndicatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newIndicator = e.target.value;
    const allowed = newIndicator ? indicatorConditions[newIndicator as keyof typeof indicatorConditions] : ["above", "below", "cross_above", "cross_below"];
    if (!allowed.includes(form.condition)) {
      setForm({ ...form, indicator: newIndicator, condition: allowed[0] });
    } else {
      setForm({ ...form, indicator: newIndicator });
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) setAlerts(await res.json());
    } catch (e) {
      console.error("Failed to load alerts:", e);
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
      const payload = {
        type: form.type,
        symbol: form.symbol || null,
        condition: form.type === "pattern" ? "detected" : form.condition,
        value: form.value ? parseFloat(form.value) : null,
        indicator: (form.type === "indicator" || form.type === "pattern") ? form.indicator || null : null,
        timeframe: form.timeframe,
        notificationChannel: form.notificationChannel,
      };
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("Alert created");
        setShowForm(false);
        setForm({ type: "price", symbol: "", condition: "above", value: "", indicator: "", timeframe: "1h", notificationChannel: "email" });
        fetchAlerts();
      } else {
        alert("Failed to create alert");
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
    console.log(`Alert ${isActive ? "disabled" : "enabled"}`);
  };

  const deleteAlert = async (id: string) => {
    if (!confirm("Delete this alert?")) return;
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    fetchAlerts();
    console.log("Alert deleted");
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
              <label className="block text-sm mb-1">Pattern / Condition</label>
              {isIndicatorType ? (
                <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} className="input w-full">
                  {allowedConditions.map(c => (
                    <option key={c} value={c}>{conditionLabels[c] || c.replace('_', ' ')}</option>
                  ))}
                </select>
              ) : form.type === "pattern" ? (
                <select value={form.indicator} onChange={e => setForm({ ...form, indicator: e.target.value, condition: "detected" })} className="input w-full">
                  <option value="">Select pattern...</option>
                  {patternOptions.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              ) : (
                <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} className="input w-full">
                  {allowedConditions.map(c => (
                    <option key={c} value={c}>{conditionLabels[c] || c.replace('_', ' ')}</option>
                  ))}
                </select>
              )}
            </div>
            {/* Value field - hide for Bollinger Bands and Pattern */}
            {(!isIndicatorType || form.indicator !== 'bollinger') && form.type !== "pattern" && (
              <div>
                <label className="block text-sm mb-1">Value</label>
                <input type="number" step="any" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="input w-full" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Indicator (if type is indicator)</label>
              <select value={form.indicator} onChange={handleIndicatorChange} className="input w-full">
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
                <th>Indicator</th>
                <th>Condition</th>
                <th>Value</th>
                <th>Timeframe</th>
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
                  <td>
                    {alert.type === 'pattern' && alert.indicator ? getPatternLabel(alert.indicator) : (alert.indicator ?? "-")}
                  </td>
                  <td>{conditionLabels[alert.condition] || alert.condition}</td>
                  <td>{alert.value ?? "-"}</td>
                  <td>{alert.timeframe}</td>
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
