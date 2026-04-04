'use client';

import Link from "next/link";
import { logOut } from "@/lib/auth";
import { useState } from "react";
import {
  LayoutDashboard,
  BarChart2,
  Crown,
  Brain,
  Calendar,
  BookOpen,
  LogOut as LogOutIcon,
  PieChart,
  MessageSquare,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationProvider";
import ContrastToggle from "@/components/contrast/ContrastToggle";

export default function Navbar({ user }: { user: { email: string; role?: string } }) {
  const [proMenuOpen, setProMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const proLinks = [
    { href: "/dashboard/correlations", icon: PieChart, label: "Correlations" },
    { href: "/dashboard/sentiment", icon: MessageSquare, label: "Sentiment" },
    { href: "/dashboard/performance", icon: TrendingUp, label: "Performance" },
  ];

  // Only show these for pro users
  const tradingTools = [
    { href: "/trading-journal", icon: BookOpen, label: "Journal" },
    { href: "/economic-calendar", icon: Calendar, label: "Calendar" },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-gray-900/90 border-b border-gray-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-gray-900 animate-pulse">
                <div className="absolute inset-0.5 bg-emerald-400 rounded-full" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">
                TradeAI
              </h1>
              <p className="text-[10px] text-gray-400 -mt-1">SMART TRADING</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-all"
            >
              Dashboard
            </Link>
            
            <Link
              href="/market"
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              <BarChart2 className="w-4 h-4" />
              Market
            </Link>

            {/* Pro Dropdown */}
            {user?.role === "pro" && (
              <div className="relative">
                <button
                  onClick={() => setProMenuOpen(!proMenuOpen)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-all flex items-center gap-2"
                >
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Pro
                  <ChevronDown className={`w-3 h-3 transition-transform ${proMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {proMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-gray-800/95 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {proLinks.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-3 px-4 py-.text-gray-300 hover:bg-gray-700/50 transition-colors"
                        onClick={() => setProMenuOpen(false)}
                      >
                        <link.icon className="w-4 h-4" />
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quant AI - always show */}
            <Link
              href="/quant-ai"
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              <Brain className="w-4 h-4 text-cyan-400" />
              Quant AI
            </Link>

            {/* Trading Tools - Pro only */}
            {user?.role === "pro" && (
              <div className="relative">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-all flex items-center gap-2"
                >
                  <BarChart2 className="w-4 h-4" />
                  Tools
                  <ChevronDown className={`w-3 h-3 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {mobileMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-gray-800/95 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {tradingTools.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700/50 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <link.icon className="w-4 h-4" />
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upgrade/Pricing */}
            {user?.role !== "pro" ? (
              <Link
                href="/pricing"
                className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg hover:from-yellow-500 hover:to-orange-500 transition-all"
              >
                Upgrade
              </Link>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-600/30">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-semibold text-yellow-500">PRO</span>
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <ContrastToggle />
            <div className="hidden sm:block text-right">
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <form action={logOut} className="ml-2">
              <button
                type="submit"
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                title="Logout"
              >
                <LogOutIcon className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}

