"use client";

import { useEffect, useState } from "react";
import { fetchCoinGeckoPrices, toCoinGeckoId } from "@/lib/coingecko";

interface CryptoPriceCardProps {
  symbol: string;
  refreshInterval?: number;
}

export default function CryptoPriceCard({ symbol, refreshInterval = 30000 }: CryptoPriceCardProps) {
  const [priceData, setPriceData] = useState<{ price: number; change24h: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPrice = async () => {
    try {
      const data = await fetchCoinGeckoPrices([symbol]);
      const coinId = toCoinGeckoId(symbol);
      if (coinId && data[coinId]) {
        setPriceData({
          price: data[coinId].usd,
          change24h: data[coinId].usd_24h_change || 0,
        });
      }
    } catch (error) {
      console.error(`CryptoPriceCard[${symbol}]`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, refreshInterval);
    return () => clearInterval(interval);
  }, [symbol, refreshInterval]);

  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (price >= 1) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    } else {
      return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    }
  };

  if (loading) {
    return (
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 animate-pulse">
        <div className="h-4 w-12 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
        <div className="h-6 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (!priceData) {
    return (
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <p className="text-sm text-gray-500">Unavailable</p>
      </div>
    );
  }

  const isPositive = priceData.change24h >= 0;

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{symbol}</h3>
        <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{priceData.change24h.toFixed(2)}%
        </span>
      </div>
      <div className="text-2xl font-mono text-gray-900 dark:text-white">
        ${formatPrice(priceData.price)}
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        CoinGecko • Real-time
      </div>
    </div>
  );
}
