import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const isUpgradeRequest = formData.get("isUpgradeRequest") === "true";

  if (isUpgradeRequest && email) {
    try {
      await db.user.update({
        where: { email },
        data: { role: "pro" }
      });
      return NextResponse.json({ success: true, message: "User upgraded to PRO" });
    } catch (error) {
      return NextResponse.json({ error: "Failed to upgrade user" }, { status: 500 });
    }
  }

  const result = await login(formData);
  if (result.success) {
    const response = NextResponse.json({ success: true });
    // Set cookie with the token
    const cookie = `auth_token=${result.token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
    response.headers.append("Set-Cookie", cookie);
    return response;
  }
  return NextResponse.json({ error: result.error }, { status: 400 });
}
