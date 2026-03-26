"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import SignalTable, { Signal } from "@/components/SignalTable";
import SignalTabs from "@/components/SignalTabs";
import SignalTableSkeleton from "@/components/SignalTableSkeleton";
import { Activity } from "lucide-react";
import { getStoredSignals, storeSignals } from "@/lib/localStorage";
import { calculateWinRate } from "@/lib/signalUtils";

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

  // Initialize after auth
  useEffect(() => {
    if (!user) return;
    fetchMarketData();
    fetchGenerateSignals();
    setIsLoaded(true);
  }, [user]);

  // Polling every 60 seconds
  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(() => {
      fetchMarketData();
      fetchGenerateSignals();
    }, 60000);
    return () => clearInterval(interval);
  }, [isLoaded]);

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
          <button
            onClick={() => { fetchMarketData(); fetchGenerateSignals(); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Refresh Now
          </button>
        </div>

        <SignalTabs signals={signals} activeTab={activeTab} onTabChange={setActiveTab} />
        {loading ? <SignalTableSkeleton rows={5} /> : <SignalTable signals={filteredSignals} onClose={handleCloseSignal} />}
      </main>
    </div>
  );
}
