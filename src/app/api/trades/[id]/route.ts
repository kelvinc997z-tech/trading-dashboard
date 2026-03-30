import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trade = await prisma.trade.findUnique({
      where: { id: params.id },
    });
    if (!trade) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(trade);
  } catch (error) {
    console.error("GET /api/trades/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const trade = await prisma.trade.update({
      where: { id: params.id },
      data: {
        symbol: body.symbol,
        side: body.side,
        entry: body.entry,
        exit: body.exit,
        stopLoss: body.stopLoss,
        takeProfit: body.takeProfit,
        pnl: body.pnl,
        pnlPct: body.pnlPct,
        date: body.date ? new Date(body.date) : undefined,
        exitDate: body.exitDate ? new Date(body.exitDate) : null,
        notes: body.notes,
        tags: body.tags,
        screenshotUrl: body.screenshotUrl,
      },
    });
    return NextResponse.json(trade);
  } catch (error) {
    console.error("PUT /api/trades/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.trade.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/trades/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
