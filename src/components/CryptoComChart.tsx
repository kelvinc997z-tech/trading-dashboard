"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createChart, ColorType } from "lightweight-charts";

interface CryptoComChartProps {
  symbol: string;
  timeframe?: string;
  height?: number;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

function toCryptoComSymbol(symbol: string): string {
  const map: Record<string, string> = {
    "XAUT": "XAU_USD",
    "BTC": "BTC_USD",
    "ETH": "ETH_USD",
    "SOL": "SOL_USD",
    "XRP": "XRP_USD",
    "KAS": "KAS_USD",
  };
  return map[symbol] || `${symbol}_USD`;
}

function timeframeToInterval(timeframe: string): string {
  const map: Record<string, string> = {
    "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
    "1h": "1h", "4h": "4h", "1d": "1d", "1w": "1w"
  };
  return map[timeframe] || "1h";
}

export default function CryptoComChart({ symbol, timeframe = "1h", height = 400 }: CryptoComChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [changePercent, setChangePercent] = useState<number>(0);
  const [isPositive, setIsPositive] = useState<boolean>(true);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const symbolCc = toCryptoComSymbol(symbol);
  const interval = timeframeToInterval(timeframe);
  const channel = `candles.${symbolCc}_${interval}`;

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket("wss://stream.crypto.com/v1/market/candles");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`[CryptoCom] Connected for ${symbol} ${interval}`);
        ws.send(JSON.stringify({
          id: 1,
          method: "SUBSCRIBE",
          params: [channel],
          jsonrpc: "2.0",
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.result?.status === "SUCCESS") return;
          
          if (data.result?.channel === channel && Array.isArray(data.result?.data)) {
            const newCandle = data.result.data[0];
            const candle: CandleData = {
              time: Math.floor(newCandle.t / 1000),
              open: newCandle.o,
              high: newCandle.h,
              low: newCandle.l,
              close: newCandle.c,
            };

            setCandles(prev => {
              const filtered = prev.filter(c => c.time !== candle.time);
              const updated = [...filtered, candle].sort((a, b) => a.time - b.time);
              return updated.slice(-500);
            });

            setCurrentPrice(candle.close);
            
            if (seriesRef.current) {
              try {
                seriesRef.current.update(candle);
              } catch (e) {
                console.warn("[CryptoCom] Update error:", e);
              }
            }
          }
        } catch (e) {
          console.error("[CryptoCom] Parse error:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("[CryptoCom] WS error:", err);
        setError("WebSocket connection error");
      };

      ws.onclose = () => {
        console.log("[CryptoCom] WS closed, reconnecting in 3s...");
        setTimeout(connectWebSocket, 3000);
      };
    } catch (e) {
      console.error("[CryptoCom] Connection failed:", e);
      setError("Failed to connect to Crypto.com");
    }
  }, [channel]);

  useEffect(() => {
    let mounted = true;
    
    if (!containerRef.current) return;

    try {
      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height,
        layout: { 
          background: { type: ColorType.Solid, color: "transparent" }, 
          textColor: "#d1d4dc" 
        },
        grid: { 
          vertLines: { color: "rgba(42, 46, 57, 0.5)" }, 
          horzLines: { color: "rgba(42, 46, 57, 0.5)" } 
        },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: "rgba(197, 203, 206, 0.8)" },
        timeScale: { 
          borderColor: "rgba(197, 203, 206, 0.8)", 
          timeVisible: true, 
          secondsVisible: false 
        },
      }) as any;

      const candlestickSeries = (chart as any).addCandlestickSeries({
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderVisible: false,
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
      });

      if (mounted) {
        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

        if (candles.length > 0) {
          candlestickSeries.setData(candles);
        }

        const handleResize = () => {
          if (containerRef.current && chartRef.current) {
            try {
              (chartRef.current as any).applyOptions({
                width: containerRef.current.clientWidth,
                height,
              });
            } catch (e) {
              console.warn("[CryptoCom] Resize error:", e);
            }
          }
        };
        window.addEventListener("resize", handleResize);

        return () => {
          mounted = false;
          window.removeEventListener("resize", handleResize);
          try {
            (chart as any).remove();
          } catch (e) {
            console.warn("[CryptoCom] Chart remove error:", e);
          }
          wsRef.current?.close();
        };
      }
    } catch (e) {
      console.error("[CryptoCom] Chart init error:", e);
      if (mounted) setError("Failed to initialize chart");
    }
  }, [height]);

  useEffect(() => {
    connectWebSocket();
    return () => wsRef.current?.close();
  }, [connectWebSocket]);

  useEffect(() => {
    if (seriesRef.current && candles.length > 0) {
      try {
        seriesRef.current.setData(candles);
      } catch (e) {
        console.warn("[CryptoCom] SetData error:", e);
      }
    }
  }, [candles]);

  useEffect(() => {
    if (candles.length >= 2) {
      const latest = candles[candles.length - 1];
      const prev = candles[candles.length - 2];
      const change = latest.close - prev.close;
      const pct = (change / prev.close) * 100;
      setChangePercent(pct);
      setIsPositive(change >= 0);
    }
  }, [candles]);

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">Chart Error</p>
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <div>
        {currentPrice !== null && (
          <div className="text-center mb-2">
            <span className="font-bold">{symbol}</span>
            <span className={`ml-2 ${isPositive ? "text-green-500" : "text-red-500"}`}>
              ${currentPrice.toFixed(2)} ({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)
            </span>
          </div>
        )}
        <div ref={containerRef} style={{ width: "100%", height }} />
      </div>
    );
  } catch (e) {
    console.error("[CryptoCom] Render error:", e);
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">Chart unavailable</p>
      </div>
    );
  }
}
