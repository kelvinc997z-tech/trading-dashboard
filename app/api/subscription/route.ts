import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserSubscription } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const subscription = await getUserSubscription(session.user!.id);
    return NextResponse.json(subscription || { tier: "free", status: "active" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}