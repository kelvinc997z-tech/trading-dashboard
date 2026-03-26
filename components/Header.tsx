"use client";

import { Moon, Sun, Activity, User, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react"; // We'll use custom session fetch

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Check if user is logged in via /api/me
    fetch("/api/me").then(res => res.json()).then(data => {
      if (data.user) setUser(data.user);
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
          <nav className="flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">Dashboard</Link>
            <Link href="/market-overview" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">Market</Link>
            <Link href="/technical-summary" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">Technical</Link>
            <Link href="/news" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">News</Link>

            {!loadingUser && (
              user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">{user.name}</span>
                  <button onClick={handleLogout} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-red-500" title="Logout">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors flex items-center gap-1">
                  <User className="w-4 h-4" /> Login
                </Link>
              )
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