import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "secret-change-me";

// Simple shared secret for admin API access
const ADMIN_SECRET = process.env.ADMIN_SECRET || "change-admin-secret";

export async function POST(request: NextRequest) {
  try {
    // Check admin secret (should be configured in Vercel env)
    const authHeader = request.headers.get("authorization");
    const secret = authHeader?.replace("Bearer ", "");
    
    if (secret !== ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "pro") {
      return NextResponse.json({ error: "User is already pro" }, { status: 400 });
    }

    // Update user role to pro
    await prisma.user.update({
      where: { email },
      data: { role: "pro" },
    });

    // Generate new JWT token for user (pro role)
    const newToken = jwt.sign(
      {
        email: user.email,
        id: user.id,
        role: "pro",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      message: `User ${email} upgraded to Pro`,
      token: newToken, // Admin can provide this to user if needed
    });

  } catch (error: any) {
    console.error("[Admin Upgrade] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}