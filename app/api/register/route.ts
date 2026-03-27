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

    // Send welcome email with trial info
    const trialEndDate = user.trial_ends_at ? new Date(user.trial_ends_at).toLocaleDateString() : 'soon';
    await sendEmail(user.email, templates.welcome(user.name, 7));

    return NextResponse.json({ success: true, message: "User created", user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}