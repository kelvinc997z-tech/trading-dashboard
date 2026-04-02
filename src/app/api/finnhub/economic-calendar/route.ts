import { NextResponse } from "next/server";

// Cache economic calendar data for 30 minutes (1800 seconds)
// Finnhub free tier has rate limits; caching reduces calls
const CACHE_TTL = 1800; // 30 minutes
let cachedData: { data: any; timestamp: number } | null = null;

export async function GET() {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) {
    return NextResponse.json({ error: "FINNHUB_API_KEY not set" }, { status: 500 });
  }

  // Return cached data if still valid
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL * 1000) {
    return NextResponse.json(cachedData.data, {
      headers: {
        "Cache-Control": `public, max-age=${CACHE_TTL}`,
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const res = await fetch(`https://finnhub.io/api/v1/calendar/economic?token=${token}`, {
      next: { revalidate: CACHE_TTL }, // ISR cache
    });
    if (!res.ok) {
      throw new Error(`Finnhub error: ${res.status}`);
    }
    const data = await res.json();

    // Update cache
    cachedData = {
      data,
      timestamp: Date.now(),
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, max-age=${CACHE_TTL}`,
        "X-Cache": "MISS",
      },
    });
  } catch (err: any) {
    // If cache exists, return stale data on error (better than nothing)
    if (cachedData) {
      return NextResponse.json(cachedData.data, {
        headers: {
          "Cache-Control": `public, max-age=${CACHE_TTL}`,
          "X-Cache": "STALE",
        },
      });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}