"use client";

import { useContrast } from "@/components/contrast/ContrastProvider";
import { Contrast } from "lucide-react";

export default function ContrastToggle() {
  const { highContrast, toggleHighContrast } = useContrast();

  return (
    <button
      onClick={toggleHighContrast}
      className={`p-2 rounded-lg transition relative ${
        highContrast
          ? "bg-primary text-white"
          : "hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
      title={highContrast ? "Disable High Contrast" : "Enable High Contrast"}
    >
      <Contrast className="w-5 h-5" />
      {highContrast && (
        <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
      )}
    </button>
  );
}
