import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/db";

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

    await createUser(email, name, password);
    return NextResponse.json({ success: true, message: "User created" });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}