"use client";

import { useState } from "react";

type TabType = "all" | "active" | "closed";

interface SignalTabsProps {
  signals: any[];
  onTabChange: (tab: TabType) => void;
  activeTab: TabType;
}

export default function SignalTabs({ signals, onTabChange, activeTab }: SignalTabsProps) {
  const counts = {
    all: signals.length,
    active: signals.filter(s => s.status === "active").length,
    closed: signals.filter(s => s.status === "closed").length,
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "closed", label: "Closed" },
  ];

  return (
    <div className="flex gap-2 mb-4">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === tab.key
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          {tab.label} ({counts[tab.key]})
        </button>
      ))}
    </div>
  );
}
