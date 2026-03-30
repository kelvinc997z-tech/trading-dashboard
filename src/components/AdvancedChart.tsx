"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface IndicatorData {
  time: string;
  price: number;
  rsi?: number;
  macd?: number;
  signal?: number;
  upperBand?: number;
  lowerBand?: number;
}

interface AdvancedChartProps {
  symbol?: string;
  indicators?: string[];
}

// Calculate RSI manually (simplified)
function calculateRSI(prices: number[], period: number = 14): number[] {
  if (prices.length < period + 1) return [];
  
  const changes = prices.slice(1).map((price, i) => price - prices[i]);
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? -change : 0);
  
  const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  const rsi: number[] = [];
  let lastAvgGain = avgGain;
  let lastAvgLoss = avgLoss;
  
  for (let i = period; i < prices.length; i++) {
    const currentGain = gains[i - 1];
    const currentLoss = losses[i - 1];
    
    lastAvgGain = (lastAvgGain * (period - 1) + currentGain) / period;
    lastAvgLoss = (lastAvgLoss * (period - 1) + currentLoss) / period;
    
    if (lastAvgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = lastAvgGain / lastAvgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsi;
}

// Calculate MACD (simplified)
function calculateMACD(prices: number[], fast: number = 12, slow: number = 26, signal: number = 9): { macd: number[], signal: number[] } {
  if (prices.length < slow) return { macd: [], signal: [] };
  
  const ema = (data: number[], period: number): number[] => {
    const multiplier = 2 / (period + 1);
    const result: number[] = [data.slice(0, period).reduce((a, b) => a + b, 0) / period];
    
    for (let i = period; i < data.length; i++) {
      result.push((data[i] - result[result.length - 1]) * multiplier + result[result.length - 1]);
    }
    return result;
  };
  
  const fastEMA = ema(prices, fast);
  const slowEMA = ema(prices, slow);
  
  const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i] || 0);
  
  // Signal line is EMA of MACD
  const signalLine = ema(macdLine, signal);
  
  return { macd: macdLine, signal: signalLine };
}

// Calculate Bollinger Bands
function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number[], lower: number[] } {
  if (prices.length < period) return { upper: [], lower: [] };
  
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    upper.push(mean + stdDev * std);
    lower.push(mean - stdDev * std);
  }
  
  return { upper, lower };
}

export default function AdvancedChart({ symbol = "XAU/USD", indicators = ["rsi", "macd"] }: AdvancedChartProps) {
  const [data, setData] = useState<IndicatorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIndicators, setShowIndicators] = useState<Set<string>>(new Set(indicators));

  const toggleIndicator = (indicator: string) => {
    setShowIndicators(prev => {
      const next = new Set(prev);
      if (next.has(indicator)) {
        next.delete(indicator);
      } else {
        next.add(indicator);
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/market-data?symbol=${encodeURIComponent(symbol)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const result = await res.json();
        
        if (!result.history || result.history.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }
        
        const prices = result.history.map((h: any) => h.price);
        const rsi = calculateRSI(prices, 14);
        const { macd, signal: macdSignal } = calculateMACD(prices, 12, 26, 9);
        const { upper, lower } = calculateBollingerBands(prices, 20, 2);
        
        const enrichedData = result.history.map((h: any, i: number) => {
          const enriched: IndicatorData = {
            time: h.time,
            price: h.price,
          };
          
          // RSI (starts after 14 periods)
          if (i >= 14 && rsi[i - 14] !== undefined) {
            enriched.rsi = rsi[i - 14];
          }
          
          // MACD (starts after 26 periods)
          if (i >= 26 && macd[i - 26] !== undefined) {
            enriched.macd = macd[i - 26];
            enriched.signal = macdSignal[i - 26];
          }
          
          // Bollinger Bands (starts after 20 periods)
          if (i >= 19) {
            enriched.upperBand = upper[i - 19];
            enriched.lowerBand = lower[i - 19];
          }
          
          return enriched;
        });
        
        setData(enrichedData);
      } catch (err) {
        console.error(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  const priceData = data.map(d => ({ time: d.time, price: d.price }));
  const rsiData = data.filter(d => d.rsi !== undefined).map(d => ({ time: d.time, rsi: d.rsi }));
  const macdData = data.filter(d => d.macd !== undefined).map(d => ({ time: d.time, macd: d.macd, signal: d.signal }));

  return (
    <div className="space-y-4">
      {/* Price Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} />
            <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]} />
            <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} />
            
            {/* Bollinger Bands */}
            {showIndicators.has("bollinger") && (
              <>
                <Line type="monotone" dataKey={(d: any) => data.find(x => x.time === d.time)?.upperBand} stroke="#9ca3af" strokeWidth={1} dot={false} strokeDasharray="3 3" name="Upper BB" />
                <Line type="monotone" dataKey={(d: any) => data.find(x => x.time === d.time)?.lowerBand} stroke="#9ca3af" strokeWidth={1} dot={false} strokeDasharray="3 3" name="Lower BB" />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Indicator Toggles */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => toggleIndicator("rsi")}
          className={`px-3 py-1 rounded-full text-xs ${showIndicators.has("rsi") ? "bg-primary text-white" : "bg-gray-200 text-gray-700"}`}
        >
          RSI
        </button>
        <button
          onClick={() => toggleIndicator("macd")}
          className={`px-3 py-1 rounded-full text-xs ${showIndicators.has("macd") ? "bg-primary text-white" : "bg-gray-200 text-gray-700"}`}
        >
          MACD
        </button>
        <button
          onClick={() => toggleIndicator("bollinger")}
          className={`px-3 py-1 rounded-full text-xs ${showIndicators.has("bollinger") ? "bg-primary text-white" : "bg-gray-200 text-gray-700"}`}
        >
          Bollinger Bands
        </button>
      </div>

      {/* RSI Chart */}
      {showIndicators.has("rsi") && rsiData.length > 0 && (
        <div className="h-32 border-t pt-4">
          <div className="text-sm font-medium mb-2">RSI (14)</div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rsiData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
              <referenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
              <referenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MACD Chart */}
      {showIndicators.has("macd") && macdData.length > 0 && (
        <div className="h-32 border-t pt-4">
          <div className="text-sm font-medium mb-2">MACD</div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={macdData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="MACD" />
              <Line type="monotone" dataKey="signal" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Signal" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
