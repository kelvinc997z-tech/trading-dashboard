export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test connection
    await prisma.$connect();
    
    // Simple query
    const userCount = await prisma.user.count();
    const now = new Date().toISOString();
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      status: "ok",
      message: "Database connection successful",
      timestamp: now,
      userCount,
      env: {
        databaseUrl: process.env.DATABASE_URL ? "SET" : "MISSING",
        jwtSecret: process.env.JWT_SECRET ? "SET" : "MISSING",
        resendKey: process.env.RESEND_API_KEY ? "SET" : "MISSING",
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
        code: error.code,
        meta: error.meta,
      },
      { status: 500 }
    );
  }
}
