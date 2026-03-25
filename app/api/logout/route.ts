import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/db";

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/session=([^;]+)/);
    if (match) {
      const token = match[1];
      await deleteSession(token);
    }
  }
  const response = NextResponse.json({ success: true });
  response.headers.set('Set-Cookie', `session=; HttpOnly; Path=/; Max-Age=0`);
  return response;
}