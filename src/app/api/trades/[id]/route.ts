import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Convert date fields if provided
    const data: any = { ...body };
    if (body.exitDate) {
      data.exitDate = new Date(body.exitDate);
    }
    // If pnlPct not provided, we could recalc, but client sends it

    const trade = await db.trade.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(trade);
  } catch (error) {
    console.error("PATCH /api/trades/[id] error:", error);
    return NextResponse.json({ error: "Failed to update trade" }, { status: 500 });
  }
}

// Also allow GET for individual trade if needed (optional)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trade = await db.trade.findUnique({
      where: { id: params.id },
    });
    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }
    return NextResponse.json(trade);
  } catch (error) {
    console.error("GET /api/trades/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
