"use client";

import { useEffect, useRef } from "react";

interface TradingViewWidgetProps {
  symbol: string;
  interval?: string;
  height?: number;
  theme?: "light" | "dark";
}

export default function TradingViewWidget({ symbol, interval = "60", height = 400, theme = "dark" }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const tvSymbol = getTradingViewSymbol(symbol);
    const containerId = `tv-widget-${symbol}-${Math.random().toString(36).substr(2, 9)}`;
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof window !== "undefined" && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${tvSymbol}USDT`,
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
          container_id: containerId,
        });
      }
    };

    const wrapper = document.createElement("div");
    wrapper.id = containerId;
    containerRef.current.appendChild(wrapper);
    containerRef.current.appendChild(script);

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
    "XAUT": "XAU",
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
