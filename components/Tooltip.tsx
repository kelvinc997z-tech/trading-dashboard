"use client";

import { useState, ReactNode } from "react";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export default function Tooltip({ content, children, position = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrows = {
    top: "border-t-gray-700 border-l-transparent border-r-transparent border-b-transparent",
    bottom: "border-b-gray-700 border-l-transparent border-r-transparent border-t-transparent",
    left: "border-l-gray-700 border-t-transparent border-b-transparent border-r-transparent",
    right: "border-r-gray-700 border-t-transparent border-b-transparent border-l-transparent",
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={`absolute z-50 ${positions[position]}`}>
          <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 max-w-xs whitespace-normal">
            {content}
          </div>
          <div className={`absolute w-0 h-0 border-4 ${arrows[position]} ${position === "top" ? "bottom-0 left-1/2 -translate-x-1/2 border-t-gray-800" : position === "bottom" ? "top-0 left-1/2 -translate-x-1/2 border-b-gray-800" : position === "left" ? "right-0 top-1/2 -translate-y-1/2 border-l-gray-800" : "left-0 top-1/2 -translate-y-1/2 border-r-gray-800"}`}></div>
        </div>
      )}
    </div>
  );
}
