import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
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
