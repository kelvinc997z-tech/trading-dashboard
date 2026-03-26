"use client";

import { Moon, Sun, Activity, User, LogOut, Crown, CreditCard } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react"; // We'll use custom session fetch

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Check if user is logged in via /api/me
    Promise.all([
      fetch("/api/me").then(res => res.json()),
      fetch("/api/subscription").then(res => res.json()),
    ]).then(([userData, subData]) => {
      if (userData.user) {
        setUser(userData.user);
        setSubscription(subData);
      }
      setLoadingUser(false);
    }).catch(() => setLoadingUser(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">TradeSignal</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Live Market Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4 md:space-x-6">
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">Dashboard</Link>
            <Link href="/market-overview" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">Market</Link>
            <Link href="/technical-summary" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">Technical</Link>
            <Link href="/news" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">News</Link>

            {!loadingUser && user && (
              <div className="flex items-center gap-3">
                {/* Subscription Badge */}
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  {subscription?.tier === "pro" ? "Pro" : "Free"}
                </div>
                <div className="relative group">
                  <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <Link href="/account" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <User className="w-4 h-4" /> Account
                      </Link>
                      {subscription?.tier !== "pro" && (
                        <Link href="/pricing" className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <Crown className="w-4 h-4" /> Upgrade to Pro
                        </Link>
                      )}
                      {subscription?.tier === "pro" && (
                        <Link href="/account" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <CreditCard className="w-4 h-4" /> Manage Subscription
                        </Link>
                      )}
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loadingUser && !user && (
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors flex items-center gap-1">
                <User className="w-4 h-4" /> Login
              </Link>
            )}

            {/* Dark Mode Toggle */}
            {mounted && (
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}