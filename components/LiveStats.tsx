"use client";

import { useEffect, useState } from "react";

// CountUp Animation Component
export function CountUp({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
}

// Live Counter Component (simulate live member count)
export function LiveCounter({ target }: { target: number }) {
  const [count, setCount] = useState(target - 50);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const newCount = prev + change;
        return newCount < target - 100 ? target - 100 : newCount;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [target]);

  return <span>{count.toLocaleString()}</span>;
}
