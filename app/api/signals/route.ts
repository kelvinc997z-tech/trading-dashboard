import { NextResponse } from "next/server";

export async function GET() {
  // Demo signals based on current mock prices
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const demoSignals = [
    {
      id: "1",
      pair: "XAUUSD",
      type: "BUY",
      entry: 4570.50,
      tp: 4620.00,
      sl: 4540.00,
      time: timeStr,
      status: "active",
    },
    {
      id: "2",
      pair: "USOIL",
      type: "SELL",
      entry: 88.45,
      tp: 86.50,
      sl: 90.00,
      time: timeStr,
      status: "active",
    },
  ];

  return NextResponse.json({ signals: demoSignals });
}