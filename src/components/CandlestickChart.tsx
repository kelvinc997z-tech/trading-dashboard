"use client";

import { useEffect, useRef, useCallback } from "react";

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CandlestickChartProps {
  symbol: string;
  height?: number;
}

export default function CandlestickChart({ symbol, height = 400 }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/market-data?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const candles: CandlestickData[] = data.history.map((h: any) => ({
        time: Math.floor(new Date(h.time).getTime() / 1000),
        open: h.open,
        high: h.high,
        low: h.low,
        close: h.close,
        volume: h.volume,
      }));
      if (seriesRef.current) {
        seriesRef.current.setData(candles);
      }
    } catch (err) {
      console.error(err);
    }
  }, [symbol]);

  useEffect(() => {
    if (!containerRef.current) return;
    let mounted = true;

    import('lightweight-charts').then((mod: any) => {
      if (!mounted) return;
      const { createChart, ColorType } = mod;
      const chart = createChart(containerRef.current!, {
        width: containerRef.current!.clientWidth,
        height,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
          horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
        },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: 'rgba(197, 203, 206, 0.8)' },
        timeScale: {
          borderColor: 'rgba(197, 203, 206, 0.8)',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      chartRef.current = chart;
      seriesRef.current = candlestickSeries;

      const handleResize = () => {
        if (containerRef.current) {
          chart.applyOptions({ width: containerRef.current.clientWidth, height });
        }
      };
      window.addEventListener('resize', handleResize);

      fetchData();

      return () => {
        mounted = false;
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, height]);

  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}
