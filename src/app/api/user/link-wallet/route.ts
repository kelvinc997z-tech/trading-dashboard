import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    // Check if wallet is already linked to another account
    const existing = await db.user.findFirst({
      where: {
        walletAddress: {
          equals: address,
          mode: 'insensitive'
        },
        id: { not: session.user.id }
      }
    });

    if (existing) {
      return NextResponse.json({ error: "This wallet is already linked to another account" }, { status: 400 });
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { walletAddress: address }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
