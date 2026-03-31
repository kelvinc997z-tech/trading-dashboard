"use client";

import { useWatchlist } from "@/components/watchlist/WatchlistProvider";
import { Star } from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";

interface WatchlistButtonProps {
  symbol: string;
  size?: number;
}

export default function WatchlistButton({ symbol, size = 20 }: WatchlistButtonProps) {
  const { isInWatchlist, toggleSymbol } = useWatchlist();
  const inWatchlist = isInWatchlist(symbol);

  return (
    <Tooltip content={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}>
      <button
        onClick={() => toggleSymbol(symbol)}
        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <Star
          size={size}
          className={inWatchlist ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}
        />
      </button>
    </Tooltip>
  );
}
