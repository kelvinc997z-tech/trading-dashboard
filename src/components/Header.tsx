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
    <header className="sticky top-0 z-50 bg-background/95 border-b backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-2xl font-bold text-foreground">
          Klepon Market Research
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/market" className="text-muted-foreground hover:text-foreground">
            Market
          </Link>
          <Link href="/quant-ai" className="text-muted-foreground hover:text-foreground">
            Quant AI
          </Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
            Pro Account
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(nextTheme)}
            className="px-3 py-1 rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground text-sm"
            aria-label="Toggle theme"
          >
            {theme}
          </button>
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Sign In
          </Link>
          <Link href="/login" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
