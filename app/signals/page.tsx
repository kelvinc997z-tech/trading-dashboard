"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import SignalTable, { Signal } from "@/components/SignalTable";
import SignalTabs from "@/components/SignalTabs";
import SignalTableSkeleton from "@/components/SignalTableSkeleton";
import { Activity } from "lucide-react";
import { getStoredSignals, storeSignals } from "@/lib/localStorage";
import { calculateWinRate } from "@/lib/signalUtils";
import { useSSE } from "@/hooks/useSSE";

export default function SignalsPage() {
  const router = useRouter();
  const [markets, setMarkets] = useState<Record<string, any>>({});
  const [signals, setSignals] = useState<Signal[]>(() => getStoredSignals());
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "closed">("all");
  const [stats, setStats] = useState({ total: 0, winRate: 0 });
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<"pair" | "time" | "entry">("time");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const fetchMarketData = async () => {
    try {
      setError(null);
      const res = await fetch("/api/market-data");
      if (!res.ok) throw new Error("Failed to fetch market data");
      const data = await res.json();
      setMarkets(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLastUpdated(new Date());
    }
  };

  const fetchGenerateSignals = async () => {
    try {
      setError(null);
      const res = await fetch("/api/generate-signals");
      if (!res.ok) throw new Error("Failed to fetch signals");
      const data = await res.json();
      const newSignals = data.signals || [];
      setSignals(newSignals);
      storeSignals(newSignals);
    } catch (err: any) {
      setError((err as Error).message);
    } finally {
      setLastUpdated(new Date());
    }
  };

  // Check authentication
  useEffect(() => {
    fetch("/api/me")
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.replace("/login");
        } else {
          setUser(data.user);
        }
        setAuthLoading(false);
      })
      .catch(() => setAuthLoading(false));
  }, [router]);

  // Initial fetch (fallback before SSE connects)
  useEffect(() => {
    if (!user) return;
    const init = async () => {
      try {
        const mRes = await fetch("/api/market-data");
        if (mRes.ok) {
          const mData = await mRes.json();
          setMarkets(mData);
        }
        const sRes = await fetch("/api/generate-signals");
        if (sRes.ok) {
          const sData = await sRes.json();
          const newSignals = sData.signals || [];
          setSignals(newSignals);
          storeSignals(newSignals);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoaded(true);
      }
    };
    init();
  }, [user]);

  // SSE for real-time updates
  useEffect(() => {
    if (!user) return;
    const handleSSEMessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as { type: string; data: any };
        if (parsed.type === "markets") {
          setMarkets(parsed.data);
        } else if (parsed.type === "signals") {
          setSignals(parsed.data);
          storeSignals(parsed.data);
        }
      } catch (e) {
        console.error("SSE parse error:", e);
      }
    };

    const eventSource = new EventSource("/api/events");
    eventSource.onopen = () => console.log("SSE connected");
    eventSource.onmessage = handleSSEMessage;
    eventSource.onerror = () => {
      console.error("SSE error, falling back to polling");
      eventSource.close();
      // Fallback polling every 60s
      const interval = setInterval(() => {
        fetch("/api/market-data").then(r => r.json()).then(setMarkets).catch(console.error);
        fetch("/api/generate-signals").then(r => r.json()).then(sData => {
          const newSignals = sData.signals || [];
          setSignals(newSignals);
          storeSignals(newSignals);
        }).catch(console.error);
      }, 60000);
      return () => clearInterval(interval);
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  // Auto-close signals based on current market prices
  useEffect(() => {
    if (!isLoaded) return;
    setSignals(prev => prev.map(signal => {
      if (signal.status !== "active") return signal;
      const price = markets[signal.pair as keyof typeof markets]?.price;
      if (!price) return signal;

      if (signal.type === "BUY") {
        if (price >= signal.tp) return { ...signal, status: "closed", result: "win" as const };
        if (price <= signal.sl) return { ...signal, status: "closed", result: "lose" as const };
      } else {
        if (price <= signal.tp) return { ...signal, status: "closed", result: "win" as const };
        if (price >= signal.sl) return { ...signal, status: "closed", result: "lose" as const };
      }
      return signal;
    }));
  }, [markets, isLoaded]);

  // Update stats
  useEffect(() => {
    const { total, winRate } = calculateWinRate(signals);
    setStats({ total, winRate });
  }, [signals]);

  // Manual close handler
  const handleCloseSignal = (id: string) => {
    setSignals(prev => {
      const updated = prev.map(sig => sig.id === id ? { ...sig, status: "closed" as const } : sig);
      storeSignals(updated);
      return updated;
    });
  };

  // Sort handler
  const handleSort = (by: "pair" | "time" | "entry") => {
    if (sortBy === by) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(by);
      setSortDirection("desc");
    }
  };

  const exportCSV = () => {
    const headers = ["Pair", "Type", "Entry", "TP", "SL", "Time", "Status", "Result"];
    const rows = signals.map(s => [
      s.pair,
      s.type,
      s.entry.toFixed(2),
      s.tp.toFixed(2),
      s.sl.toFixed(2),
      s.time,
      s.status,
      s.result || ""
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signals-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-gray-900 dark:text-white text-xl font-semibold animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-xl font-semibold mb-4">Error: {error}</div>
          <button
            onClick={() => { fetchMarketData(); fetchGenerateSignals(); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filteredSignals = activeTab === "all" ? signals : signals.filter(s => s.status === activeTab);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trading Signals</h1>
            <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
              <span>Total Signals: {stats.total}</span>
              <span>Win Rate: {stats.winRate}%</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
              title="Export signals to CSV"
            >
              Export CSV
            </button>
            <button
              onClick={() => { window.location.reload(); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        <SignalTabs signals={signals} activeTab={activeTab} onTabChange={setActiveTab} />
        {loading ? <SignalTableSkeleton rows={5} /> : (
          <SignalTable 
            signals={filteredSignals} 
            onClose={handleCloseSignal}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )}
      </main>
    </div>
  );
}
