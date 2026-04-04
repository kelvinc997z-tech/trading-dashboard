"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "pro" | "bloomberg" | "apple";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export type { Theme };

const THEME_STORAGE_KEY = "trading-dashboard-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("pro");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved theme from localStorage
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (saved && ["pro", "bloomberg", "apple"].includes(saved)) {
      setThemeState(saved);
    } else {
      // Default to pro
      setThemeState("pro");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    // Remove all theme classes
    html.classList.remove("theme-pro", "theme-bloomberg", "theme-apple");
    // Add current theme class
    html.classList.add(`theme-${theme}`);
    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  if (!mounted) {
    // Avoid SSR mismatch - render nothing until mounted
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
