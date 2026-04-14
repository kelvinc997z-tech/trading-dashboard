import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret-change-me";

export async function POST(request: NextRequest) {
  try {
    const { address, type } = await request.json();

    if (!address) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    console.log(`[Web3 Login] Attempting login for ${type} address: ${address}`);

    // Find user by wallet address
    // We search case-insensitively for EVM, but keep case for Solana if needed (though usually fine)
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
      twoFactorVerified: true,
    }, JWT_SECRET, {
      expiresIn: "7d",
    });

    const response = NextResponse.json({ success: true });
    
    // Set cookie
    const cookie = `auth_token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
    response.headers.append("Set-Cookie", cookie);

    return response;
  } catch (error: any) {
    console.error("Web3 login error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
