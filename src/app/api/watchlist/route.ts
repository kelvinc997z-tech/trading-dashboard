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

  // Parse JSON string to array
  let watchlist: string[] = [];
  if (user?.watchlist) {
    try {
      watchlist = typeof user.watchlist === "string" ? JSON.parse(user.watchlist) : [];
    } catch {
      watchlist = [];
    }
  }

  return NextResponse.json({ watchlist });
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

    // Store as JSON string
    const user = await db.user.update({
      where: { id: session.user.id },
      data: { watchlist: JSON.stringify(symbols) },
      select: { watchlist: true },
    });

    // Parse the stored string back to array for response
    let watchlist: string[] = [];
    if (user.watchlist) {
      try {
        watchlist = typeof user.watchlist === "string" ? JSON.parse(user.watchlist) : [];
      } catch {
        watchlist = [];
      }
    }

    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error("Watchlist update error:", error);
    return NextResponse.json({ error: "Failed to update watchlist" }, { status: 500 });
  }
}
