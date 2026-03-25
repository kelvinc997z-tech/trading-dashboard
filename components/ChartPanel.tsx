"use client";

import { useEffect, useRef } from "react";
import { createChart, IChartApi, ColorType, CandlestickData } from "lightweight-charts";

interface ChartPanelProps {
  symbol: string;
  price: number;
  change: number;
}

export default function ChartPanel({ symbol, price, change }: ChartPanelProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "rgba(156, 163, 175, 0.1)" },
        horzLines: { color: "rgba(156, 163, 175, 0.1)" },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: "rgba(156, 163, 175, 0.2)",
      },
      timeScale: {
        borderColor: "rgba(156, 163, 175, 0.2)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    // Generate mock data: last 100 candles, 5-min intervals
    const now = Math.floor(Date.now() / 1000);
    const data: CandlestickData<number>[] = [];
    let basePrice = price - 100;
    for (let i = 100; i >= 0; i--) {
      const time = now - i * 300; // 5 minutes in seconds
      const volatility = 5 + Math.random() * 10;
      const direction = Math.random() > 0.5 ? 1 : -1;
      const open = basePrice + Math.random() * volatility;
      const close = open + direction * volatility * (Math.random() * 0.8);
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      data.push({ time, open, high, low, close });
      basePrice = close;
    }
    candlestickSeries.setData(data as any);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [price]);

  const changeColor = change >= 0 ? "text-green-500" : "text-red-500";
  const changeBg = change >= 0 ? "bg-green-500/10" : "bg-red-500/10";

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {symbol}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time Chart
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            ${price.toFixed(2)}
          </div>
          <div
            className={`text-sm font-semibold px-2 py-1 rounded ${changeBg} ${changeColor}`}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)} ({((change / price) * 100).toFixed(2)}%)
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}