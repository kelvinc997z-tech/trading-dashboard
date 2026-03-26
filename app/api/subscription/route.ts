import { NextRequest, NextResponse } from "next/server";
import { getUserSubscription, readUsers } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const match = cookieHeader.match(/session=([^;]+)/);
    if (!match) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const token = match[1];
    const { isValidSession } = await import("@/lib/db");
    const session = await isValidSession(token);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const subscription = await getUserSubscription(session.userId);
    return NextResponse.json(subscription || { tier: "free", status: "active" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}