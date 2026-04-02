import { NextRequest, NextResponse } from "next/server";
import { verifyEmail } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }
  const result = await verifyEmail(token);
  if (result.success) {
    // Redirect to login page with success flag
    return NextResponse.redirect(new URL("/login?verified=true", request.url));
  }
  return NextResponse.json({ error: result.error }, { status: 400 });
}
