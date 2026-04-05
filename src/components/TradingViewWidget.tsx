"use client";

import { useEffect, useRef } from "react";

interface TradingViewWidgetProps {
  symbol: string; // e.g., "BTC", "ETH", "XAUT"
  interval?: string; // "1", "5", "15", "60", "D", "W", "M"
  height?: number;
  theme?: "light" | "dark";
}

export default function TradingViewWidget({ symbol, interval = "60", height = 400, theme = "dark" }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing widget
    containerRef.current.innerHTML = "";

    // Map our symbols to TradingView format
    const tvSymbol = getTradingViewSymbol(symbol);
    
    // Create script container
    const scriptContainer = document.createElement("div");
    scriptContainer.id = `tradingview_widget_${symbol}_${Math.random().toString(36).substr(2, 9)}`;
    containerRef.current.appendChild(scriptContainer);

    // Create widget script
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${tvSymbol}USDT`, // Use Binance pair
          interval: interval,
          timezone: "Asia/Jakarta",
          theme: theme,
          style: "1",
          backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
          gridColor: theme === "dark" ? "#1e293b" : "#e5e7eb",
          allow_symbol_change: false,
          calendar: false,
          support_host: "https://www.tradingview.com",
          width: "100%",
          height: `${height}`,
          studies: [],
          hide_top_toolbar: false,
          withdateranges: true,
          save_image: false,
          container_id: scriptContainer.id,
        });
      }
    };
    scriptContainer.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [symbol, interval, height, theme]);

  return <div ref={containerRef} className="w-full" style={{ height: `${height}px` }} />;
}

function getTradingViewSymbol(symbol: string): string {
  const map: Record<string, string> = {
    "XAUT": "XAU", // Gold uses XAU on TradingView
    "BTC": "BTC",
    "ETH": "ETH",
    "SOL": "SOL",
    "XRP": "XRP",
    "KAS": "KAS",
    "AAPL": "AAPL",
    "AMD": "AMD",
    "NVDA": "NVDA",
    "MSFT": "MSF",
    "GOOGL": "GOOG",
    "TSM": "TSM",
  };
  return map[symbol] || symbol;
}

// Extend window interface for TradingView
declare global {
  interface Window {
    TradingView: any;
  }
}
