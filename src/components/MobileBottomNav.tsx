'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  BarChart2, 
  Brain, 
  TrendingUp, 
  Settings,
  MessageSquare
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { href: "/market", icon: BarChart2, label: "Market" },
    { href: "/quant-ai", icon: Brain, label: "Quant" },
    { href: "/dashboard/performance", icon: TrendingUp, label: "Stats" },
    { href: "/dashboard/sentiment", icon: MessageSquare, label: "Pulse" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/5 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="relative flex-1">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center justify-center gap-1 py-1"
              >
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? "bg-emerald-500/10 text-emerald-500" 
                    : "text-gray-500 dark:text-gray-400"
                }`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold tracking-tighter uppercase ${
                  isActive ? "text-emerald-500" : "text-gray-500 dark:text-gray-400"
                }`}>
                  {item.label}
                </span>
                
                {isActive && (
                  <motion.div
                    layoutId="activeTabMobile"
                    className="absolute -top-1 w-8 h-1 bg-emerald-500 rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
