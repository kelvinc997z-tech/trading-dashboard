"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface WatchlistContextType {
  watchlist: string[];
  toggleSymbol: (symbol: string) => Promise<void>;
  isInWatchlist: (symbol: string) => boolean;
  refresh: () => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch("/api/watchlist");
      if (res.ok) {
        const data = await res.json();
        // Parse JSON string if needed
        const wl = typeof data.watchlist === "string" ? JSON.parse(data.watchlist) : (data.watchlist || []);
        setWatchlist(Array.isArray(wl) ? wl : []);
      }
    } catch (err) {
      console.error("Failed to fetch watchlist:", err);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const toggleSymbol = async (symbol: string) => {
    const isAdding = !watchlist.includes(symbol);
    const newWatchlist = isAdding
      ? [...watchlist, symbol]
      : watchlist.filter((s) => s !== symbol);

    // Optimistic update
    setWatchlist(newWatchlist);

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: newWatchlist }),
      });

      if (!res.ok) {
        throw new Error("Failed to update watchlist");
      }
      // Silent success
    } catch (err) {
      // Revert on error
      setWatchlist(watchlist);
      console.error("Watchlist update failed:", err);
    }
  };

  const isInWatchlist = (symbol: string) => watchlist.includes(symbol);

  const refresh = () => fetchWatchlist();

  return (
    <WatchlistContext.Provider value={{ watchlist, toggleSymbol, isInWatchlist, refresh }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error("useWatchlist must be used within WatchlistProvider");
  }
  return ctx;
}
