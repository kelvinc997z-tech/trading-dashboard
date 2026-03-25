"use client";

import { useEffect, useRef } from "react";
import { useId } from "react";

interface TradingViewChartProps {
  symbol: string; // e.g., "FOREXCOM:XAUUSD", "BINANCE:BTCUSDT"
  height?: number;
}

export default function TradingViewChart({ symbol, height = 400 }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useId(); // unique stable ID per component instance

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget content
    containerRef.current.innerHTML = '';

    // Create and inject TradingView script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      try {
        // @ts-ignore
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          backgroundColor: 'rgba(19, 25, 36, 1)',
          gridColor: 'rgba(34, 45, 60, 1)',
          allow_symbol_change: true,
          calendar: false,
          support_host: 'https://www.tradingview.com',
          with_dates: true,
          height: height,
          container_id: widgetId,
        });
      } catch (err) {
        console.error("TradingView widget error:", err);
      }
    };
    containerRef.current.appendChild(script);

    return () => {
      // Cleanup: clear container on unmount
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, height, widgetId]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {symbol.split(':')[1] || symbol}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          TradingView Chart
        </p>
      </div>
      <div
        id={widgetId}
        ref={containerRef}
        style={{ height: `${height}px` }}
      />
    </div>
  );
}