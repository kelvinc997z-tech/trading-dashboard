"use client";

import { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol: string; // e.g., "PEPPERSTONE:XAUUSD" or "TVC:USOIL"
  height?: number;
}

export default function TradingViewChart({ symbol, height = 500 }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef(`tradingview_widget_${symbol.replace(/[:/]/g, '_')}_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous
    containerRef.current.innerHTML = '';

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
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
        container_id: widgetId.current,
      });
    };
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, height]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {symbol.split(':')[1] || symbol}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Powered by TradingView
        </p>
      </div>
      <div
        id={widgetId.current}
        ref={containerRef}
        style={{ height: `${height}px` }}
      />
    </div>
  );
}