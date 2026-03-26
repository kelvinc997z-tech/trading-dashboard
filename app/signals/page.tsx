"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import SignalTable from "@/components/SignalTable";
import SignalTabs from "@/components/SignalTabs";
import { Activity } from "lucide-react";
import { generateMarketData, supportedPairs, initialSignals } from "@/lib/mockData";

export default function SignalsPage() {
  const router = useRouter();
  const [markets, setMarkets] = useState<Record<string, any>>({});
  const [signals, setSignals] = useState(initialSignals);
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "closed">("all");
  const [stats, setStats] = useState({ total: 0, winRate: 0 });

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

  // Initialize market data (needed for auto-close)
  useEffect(() => {
    if (!user) return;
    const initialMarkets: Record<string, any> = {};
    supportedPairs.forEach(symbol => {
      initialMarkets[symbol] = generateMarketData(symbol as any);
    });
    setMarkets(initialMarkets);
    setIsLoaded(true);
  }, [user]);

  // Auto-close signals based on price
  useEffect(() => {
    if (!isLoaded) return;
    setSignals(prev => prev.map(signal => {
      if (signal.status !== "active") return signal;
      const price = markets[signal.pair as keyof typeof markets]?.price;
      if (!price) return signal;

      if (signal.type === "BUY") {
        if (price >= signal.tp) return { ...signal, status: "closed", result: "win" };
        if (price <= signal.sl) return { ...signal, status: "closed", result: "lose" };
      } else {
        if (price <= signal.tp) return { ...signal, status: "closed", result: "win" };
        if (price >= signal.sl) return { ...signal, status: "closed", result: "lose" };
      }
      return signal;
    }));
  }, [markets, isLoaded]);

  // Update stats
  useEffect(() => {
    const total = signals.length;
    const closed = signals.filter(s => s.status === "closed");
    const won = closed.filter(s => s.result === "win").length;
    const winRate = closed.length > 0 ? Math.round((won / closed.length) * 100) : 0;
    setStats({ total, winRate });
  }, [signals]);

  // Filter signals based on tab
  const filteredSignals = activeTab === "all" ? signals : signals.filter(s => s.status === activeTab);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-gray-900 dark:text-white text-xl font-semibold animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Signals</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Win Rate</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.winRate}%</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Signals</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{signals.filter(s => s.status === "active").length}</p>
          </div>
        </div>

        {/* Signal Table with Tabs */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Trading Signals</h2>
          <SignalTabs signals={signals} activeTab={activeTab} onTabChange={setActiveTab} />
          <SignalTable signals={filteredSignals} />
        </div>
      </main>
    </div>
  );
}
