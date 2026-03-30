"use client";

import Link from "next/link";
import { useTheme } from "./ThemeProvider";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-2xl font-bold text-gray-900 dark:text-white">
          Klepon Market Research
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            Dashboard
          </Link>
          <Link href="/market" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            Market
          </Link>
          <Link href="/quant-ai" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            Quant AI
          </Link>
          <Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            Pro Account
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            Sign In
          </Link>
          <Link href="/login" className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
