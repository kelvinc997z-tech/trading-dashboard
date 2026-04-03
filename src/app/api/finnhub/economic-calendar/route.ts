import { NextResponse } from "next/server";

// Cache economic calendar data for 30 minutes (1800 seconds)
const CACHE_TTL = 1800; // 30 minutes
let cachedData: { data: any; timestamp: number } | null = null;

export async function GET() {
  const token = process.env.TWELVE_DATA_API_KEY;
  if (!token) {
    return NextResponse.json({ error: "TWELVE_DATA_API_KEY not set" }, { status: 500 });
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
    const res = await fetch(`https://api.twelvedata.com/economic_calendar?apikey=${token}`);
    if (!res.ok) {
      throw new Error(`Twelve Data error: ${res.status}`);
    }
    const data = await res.json();

    // Normalize to our format: { economicCalendar: [...] }
    // Twelve Data returns { values: [...], page, per_page, total_pages, total_records }
    const normalized = {
      economicCalendar: (data.values || []).map((item: any) => {
        const { date: dateStr, time: timeStr, country, event, importance, actual, forecast, previous } = item;
        // Combine date and time to Unix timestamp (seconds) assuming UTC
        const dateTime = new Date(`${dateStr}T${timeStr || "00:00"}:00Z`);
        const timestamp = Math.floor(dateTime.getTime() / 1000);
        return {
          date: timestamp,
          time: timeStr,
          country,
          event,
          impact: importance,
          actual,
          forecast,
          previous,
        };
      }),
    };

    // Update cache
    cachedData = {
      data: normalized,
      timestamp: Date.now(),
    };

    return NextResponse.json(normalized, {
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