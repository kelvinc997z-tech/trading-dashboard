import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const ADMIN_EMAILS = ["admin@test.com", "kelvinc997z@gmail.com", "pro@test.com", "hsbbdo13@gmail.com"];

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("[Admin User API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
