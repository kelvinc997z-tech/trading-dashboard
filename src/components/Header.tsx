"use client";

import Link from "next/link";
import { useTheme } from "./ThemeProvider";

type Theme = "pro" | "bloomberg" | "apple";

export default function Header() {
  const { theme, setTheme } = useTheme();
  
  const themes: Theme[] = ["pro", "bloomberg", "apple"];
  const currentIndex = themes.indexOf(theme);
  const nextTheme = themes[(currentIndex + 1) % themes.length];
  
  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
          Klepon Market Research
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          <Link href="/market" className="text-gray-600 hover:text-gray-900">
            Market
          </Link>
          <Link href="/quant-ai" className="text-gray-600 hover:text-gray-900">
            Quant AI
          </Link>
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
            Pro Account
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(nextTheme)}
            className="px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm"
            aria-label="Toggle theme"
          >
            {theme}
          </button>
          <Link href="/login" className="text-gray-600 hover:text-gray-900">
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
