import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Clear NextAuth cookies
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete("next-auth.session-token");
  response.cookies.delete("next-auth.csrf-token");
  return response;
}
