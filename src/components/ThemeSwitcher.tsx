"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Palette } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const themes = [
  { id: "pro", label: "Pro", desc: "Dark with neon accents" },
  { id: "bloomberg", label: "Bloomberg", desc: "Terminal green/black" },
  { id: "apple", label: "Apple", desc: "Minimalist light" },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition"
        aria-label="Change theme"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline capitalize">{theme}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl glass-card shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id as any);
                setOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                theme === t.id
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <div className="font-medium">{t.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t.desc}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
