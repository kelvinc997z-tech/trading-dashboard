import { NextRequest, NextResponse } from "next/server";
import { verifyUserEmail } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
  }
  
  const user = await verifyUserEmail(token);
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
  }
  
  // Redirect to account page with success
  return NextResponse.redirect(new URL("/account?verified=true", request.url));
}
