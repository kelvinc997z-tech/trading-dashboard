"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface ContrastContextType {
  highContrast: boolean;
  toggleHighContrast: () => void;
}

const ContrastContext = createContext<ContrastContextType | undefined>(undefined);

export function ContrastProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    // Check saved preference
    const saved = localStorage.getItem("highContrast") === "true";
    setHighContrast(saved);
    if (saved) {
      document.documentElement.classList.add("high-contrast");
    }
  }, []);

  const toggleHighContrast = () => {
    setHighContrast(prev => {
      const next = !prev;
      localStorage.setItem("highContrast", next.toString());
      if (next) {
        document.documentElement.classList.add("high-contrast");
      } else {
        document.documentElement.classList.remove("high-contrast");
      }
      return next;
    });
  };

  return (
    <ContrastContext.Provider value={{ highContrast, toggleHighContrast }}>
      {children}
    </ContrastContext.Provider>
  );
}

export function useContrast() {
  const ctx = useContext(ContrastContext);
  if (!ctx) {
    throw new Error("useContrast must be used within ContrastProvider");
  }
  return ctx;
}
