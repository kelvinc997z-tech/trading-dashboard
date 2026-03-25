import { NextRequest, NextResponse } from "next/server";

// In-memory signal store (replace with DB in production)
let signals: any[] = [
  {
    id: "1",
    pair: "XAUUSD",
    type: "BUY",
    entry: 4570.50,
    tp: 4620.50,
    sl: 4540.50,
    time: new Date().toISOString(),
    status: "active",
  },
  {
    id: "2",
    pair: "USOIL",
    type: "SELL",
    entry: 88.25,
    tp: 85.25,
    sl: 90.25,
    time: new Date().toISOString(),
    status: "active",
  },
  {
    id: "3",
    pair: "XAUUSD",
    type: "SELL",
    entry: 4580.00,
    tp: 4530.00,
    sl: 4605.00,
    time: new Date().toISOString(),
    status: "active",
  },
];

export async function GET(request: NextRequest) {
  // Simulate realtime by returning current signals
  return NextResponse.json({ signals, timestamp: new Date().toISOString() });
}

export async function POST(request: NextRequest) {
  // Allow updating signals (in production, add API key auth)
  try {
    const body = await request.json();
    if (body.signal) {
      const newSignal = {
        ...body.signal,
        id: `sig_${Date.now()}`,
        time: new Date().toISOString(),
        status: body.signal.status || "active",
      };
      signals.unshift(newSignal);
      // Keep only last 50 signals
      signals = signals.slice(0, 50);
    }
    if (body.clear === true) {
      signals = [];
    }
    return NextResponse.json({ success: true, signals });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}