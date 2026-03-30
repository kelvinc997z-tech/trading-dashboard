"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface NewsItem {
  id: string;
  title: string;
  publishedAt: string;
  impact: "high" | "medium" | "low";
}

export default function BreakingTicker() {
  const [breaking, setBreaking] = useState<NewsItem[]>([]);

  useEffect(() => {
    // Only fetch high-impact news from last 1 hour
    const fetchBreaking = async () => {
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const res = await fetch(`/api/news?timeframe=24h`);
        if (res.ok) {
          const { news } = await res.json();
          const highImpact = news.filter(
            (n: any) => n.impact === "high" && new Date(n.publishedAt) >= new Date(oneHourAgo)
          );
          setBreaking(highImpact.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBreaking();
    const interval = setInterval(fetchBreaking, 60000);
    return () => clearInterval(interval);
  }, []);

  if (breaking.length === 0) return null;

  return (
    <div className="bg-red-600 text-white py-2 overflow-hidden">
      <div className="container mx-auto px-4 flex items-center gap-4">
        <span className="font-bold uppercase tracking-wider text-sm">Breaking</span>
        <div className="overflow-hidden flex-1">
          <div className="animate-marquee whitespace-nowrap">
            {breaking.map((item) => (
              <Link
                key={item.id}
                href={`/market?news=${item.id}`}
                className="inline-block mx-8 hover:underline"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
        <style jsx>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            display: inline-block;
            animation: marquee 20s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
