"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Newspaper, Lock } from "lucide-react";
import SentimentClient from "./SentimentClient";
import ThemeSwitcher from "@/components/ThemeSwitcher";

interface User {
  role?: string;
}

export default function DashboardSentimentPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isPro = user?.role === "pro";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                  Sentiment Analysis
                </h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">News & Social Pulse</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              {isPro && (
                <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold shadow-sm">
                  PRO
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isPro ? (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="glass-card p-12 rounded-3xl text-center border-2 border-dashed border-gray-200 dark:border-gray-800">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black mb-4">Fitur Khusus PRO</h2>
              <p className="text-gray-500 mb-8 text-lg">
                Dapatkan akses ke analisis sentimen mendalam dari berita global, tren Reddit, dan X (Twitter) untuk membantu keputusan trading Anda.
              </p>
              <Link
                href="/payment"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-xl shadow-orange-500/20"
              >
                Upgrade ke PRO Sekarang
              </Link>
            </div>
          </div>
        ) : (
          <SentimentClient />
        )}
      </main>
    </div>
  );
}
