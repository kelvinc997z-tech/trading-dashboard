"use client";

import { useState, useEffect } from "react";
import SidebarMiniMap from "./SidebarMiniMap";

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
    <div className="flex relative">
      {/* Mobile Sidebar Toggle Button */}
      <button
        id="sidebar-toggle"
        onClick={toggleSidebar}
        className="fixed bottom-6 left-6 z-50 xl:hidden bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg transition-all"
        aria-label="Toggle market overview"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        id="mobile-sidebar"
        className={`fixed left-0 top-16 bottom-0 w-72 overflow-y-auto transform transition-transform duration-300 z-40 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } xl:translate-x-0 xl:block`}
      >
        <SidebarMiniMap />
      </aside>

      {/* Main Content */}
      <main className="container mx-auto py-8 xl:ml-72 w-full">
        {children}
      </main>
    </div>
  );
}
