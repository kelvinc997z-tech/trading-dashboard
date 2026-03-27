import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/db";
import { sendEmail, templates } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const user = await createUser(email, name, password);

    // Send verification email
    if (user.verification_token) {
      const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${user.verification_token}`;
      await sendEmail(user.email, templates.emailVerification(user.name, verifyUrl));
    }

    // Also send welcome email (will be sent after verification)
    // await sendEmail(user.email, templates.welcome(user.name, 7));

    return NextResponse.json({ 
      success: true, 
      message: "User created. Please check your email to verify your account.", 
      user: { id: user.id, email: user.email, name: user.name, email_verified: user.email_verified } 
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}