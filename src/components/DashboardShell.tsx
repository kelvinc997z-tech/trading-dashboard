"use client";

import { useState, useEffect } from "react";
import SidebarMiniMap from "./SidebarMiniMap";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  email: string;
  role?: string;
}

interface DashboardShellProps {
  children: React.ReactNode;
  user: User;
}

export default function DashboardShell({ children, user }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      const button = document.getElementById('sidebar-toggle');
      if (sidebar && button && !sidebar.contains(event.target as Node) && !button.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex relative min-h-screen">
      {/* Mobile Sidebar Toggle Button */}
      <motion.button
        id="sidebar-toggle"
        onClick={toggleSidebar}
        className="fixed bottom-8 left-6 z-50 xl:hidden bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white p-4 rounded-full shadow-lg shadow-emerald-500/30 transition-all scale-in"
        aria-label="Toggle market overview"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.aside
          id="mobile-sidebar"
          initial={{ x: '-100%' }}
          animate={{ x: isSidebarOpen ? 0 : '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`fixed left-0 top-16 bottom-0 w-80 overflow-y-auto z-40 glass-card xl:translate-x-0 xl:block xl:static xl:transform-none`}
        >
          <SidebarMiniMap />
        </motion.aside>
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-8 xl:ml-0 px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
