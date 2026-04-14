import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret-change-me";

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    // Find user by wallet address
    const user = await db.user.findFirst({
      where: {
        walletAddress: {
          equals: address,
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: "Wallet not linked to any account. Please sign in with email/password first and link your wallet in settings." 
      }, { status: 404 });
    }

    // Generate token
    const token = jwt.sign({ 
      email: user.email, 
      id: user.id,
      role: user.role || "free",
      twoFactorVerified: true, // Wallet login bypasses 2FA as it's a second factor itself
    }, JWT_SECRET, {
      expiresIn: "7d",
    });

    const response = NextResponse.json({ success: true });
    
    // Set cookie
    const cookie = `auth_token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
    response.headers.append("Set-Cookie", cookie);

    return response;
  } catch (error) {
    console.error("Web3 login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
