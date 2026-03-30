import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) {
    return NextResponse.json({ error: "FINNHUB_API_KEY not set" }, { status: 500 });
  }

  try {
    const res = await fetch(`https://finnhub.io/api/v1/calendar/economic?token=${token}`);
    if (!res.ok) {
      throw new Error(`Finnhub error: ${res.status}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}