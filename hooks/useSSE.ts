"use client";

import { useEffect, useState, useCallback } from "react";

export function useSSE<T>(url: string, onMessage: (data: T) => void) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setLoading(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as T;
        onMessage(parsed);
      } catch (e) {
        console.error("SSE parse error:", e);
      }
    };

    eventSource.onerror = (err) => {
      setError(err as Error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [url, onMessage]);

  return { loading, error };
}
