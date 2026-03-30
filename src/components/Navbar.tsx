import Link from "next/link";
import { logOut } from "@/lib/auth";
import { useState } from "react";
import { LayoutDashboard, BarChart2, Crown, Brain, Calendar, BookOpen, Cpu, LogOut as LogOutIcon, Bell, PieChart, MessageSquare, TrendingUp, Settings } from "lucide-react";

export default function Navbar({ user }: { user: { email: string; role?: string } }) {
  const [proMenuOpen, setProMenuOpen] = useState(false);
  
  const proLinks = [
    { href: "/dashboard/alerts", icon: Bell, label: "Alerts" },
    { href: "/dashboard/correlations", icon: PieChart, label: "Correlations" },
    { href: "/dashboard/sentiment", icon: MessageSquare, label: "Sentiment" },
    { href: "/dashboard/performance", icon: TrendingUp, label: "Performance" },
  ];

  return (
    <nav className="border-b bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-xl">
            <LayoutDashboard className="h-6 w-6" />
            TradingDash
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary">Dashboard</Link>
            <Link href="/market" className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary flex items-center gap-1"><BarChart2 className="h-4 w-4" />Market</Link>
            
            {user.role === "pro" && (
              <>
                <div className="relative">
                  <button 
                    onClick={() => setProMenuOpen(!proMenuOpen)}
                    className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary flex items-center gap-1"
                  >
                    <Crown className="w-4 h-4 text-yellow-500" />
                    Pro
                  </button>
                  {proMenuOpen && (
                    <div className="absolute top-6 left-0 w-48 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50">
                      {proLinks.map(link => (
                        <Link key={link.href} href={link.href} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setProMenuOpen(false)}>
                          <link.icon className="w-4 h-4" />
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <Link href="/quant-ai" className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary flex items-center gap-1"><Brain className="w-4 h-4" />Quant AI</Link>
              </>
            )}
            
            {user.role !== "pro" && (
              <Link href="/pricing" className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary flex items-center gap-1"><Crown className="w-4 h-4" />Pro Account</Link>
            )}

            <Link href="/quant-trading" className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary flex items-center gap-1"><Cpu className="w-4 w-4" />Quant Trading</Link>
            <Link href="/economic-calendar" className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary flex items-center gap-1"><Calendar className="w-4 h-4" />Economic Calendar</Link>
            <Link href="/trading-journal" className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary flex items-center gap-1"><BookOpen className="w-4 h-4" />Trading Journal</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">{user.email}</span>
          <form action={logOut}>
            <button type="submit" className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400">
              <LogOutIcon className="h-4 w-4" />Logout
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}

