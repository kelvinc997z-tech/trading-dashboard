"use client";

import { useEffect, useState } from "react";

interface CryptoPriceData {
  symbol: string;
  price: number;
  change24h: number;
}

interface CryptoPriceTickerProps {
  symbols?: string[];
  refreshInterval?: number; // ms
}

export default function CryptoPriceTicker({
  symbols = ['BTC', 'ETH', 'SOL', 'XRP'],
  refreshInterval = 30000 // 30 seconds
}: CryptoPriceTickerProps) {
  const [prices, setPrices] = useState<CryptoPriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      // Fetch all symbols in parallel from dedicated crypto quote API (real-time Binance)
      const promises = symbols.map(symbol =>
        fetch(`/api/crypto-quote?symbol=${encodeURIComponent(symbol)}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      );
      const results = await Promise.all(promises);

      const newPrices: CryptoPriceData[] = results
        .filter((data): data is { symbol: string; price: number; changePercent: number } => {
          return data && typeof data.price === 'number' && typeof data.changePercent === 'number';
        })
        .map(data => ({
          symbol: data.symbol,
          price: data.price,
          change24h: data.changePercent,
        }));

      setPrices(newPrices);
      setError(null);
    } catch (err: any) {
      console.error('[CryptoPriceTicker]', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, JSON.stringify(symbols)]); // Re-run if symbols change

  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (price >= 1) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    } else {
      return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    }
  };

  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  if (loading && prices.length === 0) {
    return (
      <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm text-gray-500">Loading crypto prices...</span>
      </div>
    );
  }

  if (error && prices.length === 0) {
    return (
      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
        <p className="text-xs text-red-600 dark:text-red-400">Failed to load live prices</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          Live Crypto
        </span>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {prices.map((crypto) => (
          <div
            key={crypto.symbol}
            className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {crypto.symbol}
            </span>
            <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
              ${formatPrice(crypto.price)}
            </span>
            <span className={`text-xs font-semibold ${
              crypto.change24h >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatChange(crypto.change24h)}
            </span>
          </div>
        ))}
      </div>

      <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
        Updated: {new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  );
}
