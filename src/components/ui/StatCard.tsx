"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: ReactNode;
  gradient?: "blue" | "emerald" | "purple" | "cyan";
  trend?: {
    value: string;
    up: boolean;
  };
  positive?: boolean;
}

export default function StatCard({ 
  label, 
  value, 
  sublabel, 
  icon, 
  gradient = "cyan",
  trend,
  positive
}: StatCardProps) {
  const gradientClasses = {
    blue: "from-blue-500 to-cyan-500",
    emerald: "from-emerald-500 to-teal-500",
    purple: "from-purple-500 to-pink-500",
    cyan: "from-cyan-500 to-blue-500"
  };

  const textColor = positive !== undefined 
    ? (positive ? "text-emerald-400" : "text-rose-400")
    : "text-white";

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-gray-900/50 border border-gray-700/50 shadow-lg hover:shadow-cyan-900/20 hover:border-cyan-500/30 transition-all duration-300 group cursor-pointer"
    >
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses[gradient]} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
      
      {/* Icon glow */}
      {icon && (
        <div className={`absolute top-4 right-4 p-3 rounded-xl bg-gradient-to-br ${gradientClasses[gradient]} text-white opacity-20 group-hover:opacity-100 transition-opacity duration-300`}>
          {icon}
        </div>
      )}
      
      <div className="relative z-10">
        <p className="text-sm font-medium text-gray-400 mb-1">{label}</p>
        <p className={`text-3xl font-bold mb-1 ${textColor}`}>
          {value}
        </p>
        <div className="flex items-center gap-2">
          {sublabel && (
            <span className="text-xs text-gray-500">{sublabel}</span>
          )}
          {trend && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend.up ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
