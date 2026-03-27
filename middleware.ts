import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public routes (no auth required)
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/pricing",
    "/api/me",
    "/api/login",
    "/api/register",
    "/api/logout",
    "/api/forgot-password",
    "/api/reset-password",
    "/api/market-data",
    "/api/technical-indicators",
    "/api/generate-signals",
    "/api/webhooks/stripe",
    "/api/subscription",
  ];

  const isPublic = publicRoutes.some(route => 
    path === route || path.startsWith(route + "/")
  );

  if (isPublic) {
    return NextResponse.next();
  }

  // Protected routes - require auth
  const session = request.cookies.get("session");
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
    "/api/create-checkout-session",
    "/api/cancel-subscription",
    "/api/admin/:path*",
  ],
};
