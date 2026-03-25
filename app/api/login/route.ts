import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, isValidSession, createSession, deleteSession } from "@/lib/db";
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const bcrypt = (await import('bcryptjs')).default;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create session
    const session = await createSession(user.id);
    const { password: _, ...userWithoutPassword } = user;

    // Set httpOnly cookie
    const response = NextResponse.json({ success: true, user: userWithoutPassword, token: session.token });
    response.headers.set('Set-Cookie', `session=${session.token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return NextResponse.json({ user: null });
  }
  const match = cookieHeader.match(/session=([^;]+)/);
  if (!match) {
    return NextResponse.json({ user: null });
  }
  const token = match[1];
  const session = await isValidSession(token);
  if (!session) {
    return NextResponse.json({ user: null });
  }
  // Return user info (without password)
  const users = await (await import('@/lib/db')).readUsers();
  const user = users.find(u => u.id === session.userId);
  if (!user) {
    return NextResponse.json({ user: null });
  }
  const { password, ...userWithoutPassword } = user;
  return NextResponse.json({ user: userWithoutPassword });
}