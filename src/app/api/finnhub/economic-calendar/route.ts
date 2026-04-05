import { NextResponse } from "next/server";

// Cache economic calendar data for 30 minutes (1800 seconds)
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
    // Finnhub Economic Calendar: /api/v1/calendar/economic
    // Accepts from/to as unix timestamps (in seconds)
    // We'll fetch today's events (from midnight to midnight)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const from = Math.floor(startOfDay.getTime() / 1000);
    const to = Math.floor(endOfDay.getTime() / 1000);

    const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${token}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Finnhub error: ${res.status}`);
    }

    const data = await res.json();

    // Normalize to our format: { economicCalendar: [...] }
    // Finnhub returns { economicCalendar: [{ date, hour, country, event, impact, actual, forecast, previous }] }
    const normalized = {
      economicCalendar: (data.economicCalendar || []).map((item: any) => {
        // item.date is in YYYY-MM-DD format, item.hour is HH:MM (local timezone? usually UTC?)
        // We'll treat the date as local and convert to timestamp assuming UTC midnight + offset
        const dateTimeStr = `${item.date}T${item.hour || "00:00"}:00`;
        const dateTime = new Date(dateTimeStr);
        const timestamp = Math.floor(dateTime.getTime() / 1000);

        // Convert to Jakarta timezone display (GMT+7)
        const jakartaOffset = 7 * 60; // minutes
        const jakartaTime = new Date(dateTime.getTime() + jakartaOffset * 60 * 1000);

        return {
          timestamp,
          date: jakartaTime.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          time: jakartaTime.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          currency: item.country,
          event: item.event,
          impact: item.impact, // "high", "medium", "low", or undefined
          actual: item.actual,
          forecast: item.forecast,
          previous: item.previous,
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
    console.error("Finnhub economic calendar error:", err);
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
