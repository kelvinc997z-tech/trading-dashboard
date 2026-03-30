import Link from "next/link";
import { logOut } from "@/lib/auth";
import { useDarkMode } from "@/contexts/DarkModeContext";
import { LayoutDashboard, BarChart2, Crown, Brain, Calendar, BookOpen, Cpu, LogOut as LogOutIcon, Moon, Sun } from "lucide-react";

export default function Navbar({ user }: { user: { email: string } }) {
  const { dark, toggle } = useDarkMode();

  return (
    <nav className="border-b bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-xl">
            <LayoutDashboard className="h-6 w-6" />
            TradingDash
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary"
            >
              Dashboard
            </Link>
            <Link 
              href="/market" 
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary flex items-center gap-1"
            >
              <BarChart2 className="h-4 w-4" />
              Market
            </Link>
            <Link 
              href="/pricing" 
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary flex items-center gap-1"
            >
              <Crown className="w-4 h-4" />
              Pro Account
            </Link>
            <Link 
              href="/quant-ai" 
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary flex items-center gap-1"
            >
              <Brain className="w-4 h-4" />
              Quant AI
            </Link>
            <Link 
              href="/quant-trading" 
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary flex items-center gap-1"
            >
              <Cpu className="w-4 h-4" />
              Quant Trading
            </Link>
            <Link 
              href="/economic-calendar" 
              className="text-sm text-gray-600 dark:text-gray-300 hover:*transition flex items-center gap-1"
            >
              <Calendar className="w-4 h-4" />
              Economic Calendar
            </Link>
            <Link 
              href="/trading-journal" 
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary flex items-center gap-1"
            >
              <BookOpen className="w-4 h-4" />
              Trading Journal
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
            {user.email}
          </span>
          <form action={logOut}>
            <button
              type="submit"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
            >
              <LogOutIcon className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
