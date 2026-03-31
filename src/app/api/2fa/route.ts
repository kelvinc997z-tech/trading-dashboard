import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generate2FASecret, verify2FACode } from "@/lib/2fa";

// Unified POST handler for 2FA actions
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  if (action === "setup") {
    try {
      const { secret, qrCodeDataUrl } = generate2FASecret(session.user.id);
      return NextResponse.json({ qrCode: qrCodeDataUrl, secret });
    } catch (error) {
      console.error("2FA setup error:", error);
      return NextResponse.json({ error: "Failed to generate 2FA secret" }, { status: 500 });
    }
  }

  if (action === "verify") {
    try {
      const { token, secret } = body;
      if (!token || !secret) {
        return NextResponse.json({ error: "Token and secret required" }, { status: 400 });
      }

      const isValid = verify2FACode(secret, token);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
      }

      await db.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret,
        },
      });

      return NextResponse.json({ success: true, message: "2FA enabled successfully" });
    } catch (error) {
      console.error("2FA verify error:", error);
      return NextResponse.json({ error: "Failed to verify 2FA code" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// DELETE /api/2fa - Disable 2FA
export async function DELETE() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return NextResponse.json({ success: true, message: "2FA disabled successfully" });
  } catch (error) {
    console.error("2FA disable error:", error);
    return NextResponse.json({ error: "Failed to disable 2FA" }, { status: 500 });
  }
}

// GET /api/2fa - Check if 2FA is enabled
export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true },
  });

  return NextResponse.json({ enabled: user?.twoFactorEnabled || false });
}
