import { NextRequest, NextResponse } from "next/server";
import { googleLogin } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=No code provided", request.url));
  }

  const result = await googleLogin(code);

  if (result.success && result.token) {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    const cookieStore = await cookies();
    cookieStore.set("auth_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    return response;
  }

  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(result.error || "Login failed")}`, request.url));
}
