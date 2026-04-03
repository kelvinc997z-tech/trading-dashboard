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
    <div className="min-h-screen">
      {/* Main Content - Full width without sidebar */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
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
