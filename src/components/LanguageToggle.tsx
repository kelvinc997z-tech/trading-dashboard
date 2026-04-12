"use client";

import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
          language === "en"
            ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("id")}
        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
          language === "id"
            ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        }`}
      >
        ID
      </button>
    </div>
  );
}
