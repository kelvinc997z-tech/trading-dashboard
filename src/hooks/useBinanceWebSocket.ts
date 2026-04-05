"use client";

import { useEffect, useRef, useState } from "react";

interface KlineMessage {
  e: string; // "kline"
  E: number; // event time
  s: string; // symbol
  k: {
    t: number; // start time
    T: number; // close time
    s: string; // symbol
    i: string; // interval
    o: string; // open
    c: string; // close
    h: string; // high
    l: string; // low
    v: string; // volume
    n: number; // number of trades
    x: boolean; // is this kline closed?
    q: string; // quote asset volume
    V: string; // taker buy base asset volume
    Q: string; // taker buy quote asset volume
    b: string; // ignore
    a: string; // ignore
  };
}

interface UseBinanceWebSocketProps {
  symbol: string; // e.g., "btcusdt"
  interval: string; // e.g., "1m", "5m", "15m", "1h", "4h", "1d"
  onData: (data: { time: string; close: number; volume: number; isFinal: boolean }) => void;
  onError?: (error: Event) => void;
}

export function useBinanceWebSocket({ symbol, interval, onData, onError }: UseBinanceWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!symbol || !interval) return;

    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`[Binance WS] Connected to ${symbol} @ ${interval}`);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg: KlineMessage = JSON.parse(event.data);
        if (msg.e === "kline") {
          const k = msg.k;
          onData({
            time: new Date(k.T).toISOString(),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
            isFinal: k.x,
          });
        }
      } catch (e) {
        console.error("[Binance WS] Parse error:", e);
      }
    };

    ws.onerror = (error) => {
      console.error("[Binance WS] Error:", error);
      onError?.(error);
    };

    ws.onclose = () => {
      console.log("[Binance WS] Disconnected");
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [symbol, interval, onData, onError]);

  const send = (payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  return { isConnected, send };
}
