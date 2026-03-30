"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function LiveMarketChart({ symbol = "XAUT/USD" }) {
  const [data, setData] = useState<any[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [change, setChange] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/market-data?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error("Failed");
      const result = await res.json();
      if (result.history) {
        setData(result.history);
      }
      if (result.current) {
        setCurrent(result.current.price);
        setChange(result.current.changePercent || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg">{symbol} Live</h3>
        {current !== null && (
          <div className={`text-lg font-medium ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
            {current.toFixed(2)} ({change >= 0 ? "+" : ""}{change.toFixed(2)}%)
          </div>
        )}
      </div>
      <div className="h-64">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
