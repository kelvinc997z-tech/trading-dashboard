import { NextRequest, NextResponse } from "next/server";
import { isValidSession } from "@/lib/db";

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
