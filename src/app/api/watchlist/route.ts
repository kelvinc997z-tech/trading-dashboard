import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/watchlist
export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { watchlist: true },
  });

  return NextResponse.json({ watchlist: user?.watchlist || [] });
}

// POST /api/watchlist - body: { symbols: string[] }
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { symbols } = body;

    if (!Array.isArray(symbols)) {
      return NextResponse.json({ error: "Symbols must be an array" }, { status: 400 });
    }

    // Update watchlist
    const user = await db.user.update({
      where: { id: session.user.id },
      data: { watchlist: symbols },
      select: { watchlist: true },
    });

    return NextResponse.json({ watchlist: user.watchlist });
  } catch (error) {
    console.error("Watchlist update error:", error);
    return NextResponse.json({ error: "Failed to update watchlist" }, { status: 500 });
  }
}
