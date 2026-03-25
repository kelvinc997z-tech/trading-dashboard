import { NextRequest, NextResponse } from "next/server";
import { consumeResetToken, readUsers, writeUsers } from "@/lib/db";
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password required" }, { status: 400 });
    }

    const resetToken = await consumeResetToken(token);
    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    const users = await readUsers();
    const userIndex = users.findIndex(u => u.id === resetToken.userId);
    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    users[userIndex].password = hashedPassword;
    await writeUsers(users);

    return NextResponse.json({ success: true, message: "Password has been reset" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}