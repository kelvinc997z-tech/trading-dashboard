import { Signal } from "@/components/SignalTable";

export const SIGNALS_STORAGE_KEY = "trade-signals";

export function getStoredSignals(): Signal[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(SIGNALS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to parse stored signals:", e);
    return [];
  }
}

export function storeSignals(signals: Signal[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SIGNALS_STORAGE_KEY, JSON.stringify(signals));
  } catch (e) {
    console.error("Failed to store signals:", e);
  }
}

export function clearStoredSignals() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SIGNALS_STORAGE_KEY);
}
