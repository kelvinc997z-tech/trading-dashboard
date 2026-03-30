import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const prisma = db;

export async function GET() {
  try {
    const trades = await prisma.trade.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(trades);
  } catch (error) {
    console.error("GET /api/trades error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Ensure there is a user to associate
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "trading-journal@example.com",
          password: "dummy",
          verified: true,
        },
      });
    }

    const body = await request.json();
    const trade = await prisma.trade.create({
      data: {
        userId: user.id,
        symbol: body.symbol,
        side: body.side,
        entry: body.entry,
        size: body.size || 1, // default 1
        stopLoss: body.stopLoss,
        takeProfit: body.takeProfit,
        pnl: body.pnl || null,
        pnlPct: body.pnlPct || null,
        status: body.status || "open",
        date: body.date ? new Date(body.date) : new Date(),
        exit: body.exit || null,
        exitDate: body.exitDate ? new Date(body.exitDate) : null,
        notes: body.notes,
        tags: body.tags,
        screenshotUrl: body.screenshotUrl,
      },
    });
    return NextResponse.json(trade);
  } catch (error) {
    console.error("POST /api/trades error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
