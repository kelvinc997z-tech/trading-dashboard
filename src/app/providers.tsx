"use client";

import { DarkModeProvider } from "@/contexts/DarkModeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DarkModeProvider>
      {children}
    </DarkModeProvider>
  );
}
