"use client";

import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: "cyan" | "emerald" | "purple" | "none";
}

export default function GlassCard({ 
  children, 
  className = "", 
  hover = true,
  gradient = "none"
}: GlassCardProps) {
  const gradientClasses = {
    cyan: "hover:border-cyan-500/30 hover:shadow-cyan-900/20",
    emerald: "hover:border-emerald-500/30 hover:shadow-emerald-900/20",
    purple: "hover:border-purple-500/30 hover:shadow-purple-900/20",
    none: ""
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-6
        backdrop-blur-xl bg-gray-900/50 border border-gray-700/50
        shadow-lg transition-all duration-300
        ${hover ? `group ${gradientClasses[gradient]}` : ''}
        ${className}
      `}
    >
      {/* Animated gradient background on hover */}
      {hover && gradient !== "none" && (
        <div
          className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${
            gradient === "cyan" ? "from-cyan-500 to-blue-500" :
            gradient === "emerald" ? "from-emerald-500 to-teal-500" :
            "from-purple-500 to-pink-500"
          }`}
        />
      )}
      {children}
    </div>
  );
}
