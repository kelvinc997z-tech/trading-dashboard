import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createResetToken } from "@/lib/db";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // For security, do not reveal that email doesn't exist
      return NextResponse.json({ success: true, message: "If the email exists, a reset link has been sent." });
    }

    // Generate reset token
    const resetToken = await createResetToken(user.id);

    // Build reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;

    // Send email via Resend
    try {
      await resend.emails.send({
        from: 'noreply@trading-dashboard.com',
        to: user.email,
        subject: 'Password Reset - TradeSignal',
        html: `
          <h2>Password Reset</h2>
          <p>Hello ${user.name},</p>
          <p>Click the link below to reset your password:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link expires in 1 hour.</p>
          <p>If you did not request this, please ignore.</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      // Still return success to avoid email enumeration
    }

    return NextResponse.json({ success: true, message: "If the email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}