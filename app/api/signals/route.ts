import { NextResponse } from "next/server";
import { generateSignal } from "@/lib/mockData";

export async function GET() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  // Demo signals using slash format
  const demoSignals = [
    { id: "1", pair: "XAUUSD", type: "BUY", entry: 4570.50, tp: 4620.50, sl: 4540.50, time: timeStr, status: "active" },
    { id: "2", pair: "USOIL", type: "SELL", entry: 88.45, tp: 85.45, sl: 90.45, time: timeStr, status: "active" },
    { id: "3", pair: "BTC/USD", type: "BUY", entry: 68000, tp: 69000, sl: 67200, time: timeStr, status: "active" },
    { id: "4", pair: "SOL/USD", type: "SELL", entry: 170, tp: 162, sl: 176, time: timeStr, status: "active" },
    { id: "5", pair: "ETH/USD", type: "BUY", entry: 3500, tp: 3620, sl: 3420, time: timeStr, status: "active" },
    { id: "6", pair: "XRP/USD", type: "SELL", entry: 0.62, tp: 0.59, sl: 0.64, time: timeStr, status: "pending" },
    { id: "7", pair: "KAS/USD", type: "BUY", entry: 0.12, tp: 0.13, sl: 0.112, time: timeStr, status: "active" },
  ];

  return NextResponse.json({ signals: demoSignals });
}