import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret-change-me";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    // Only allow upgrade from free to pro
    if (decoded.role !== "free") {
      return NextResponse.json({ 
        error: "Already pro or invalid account" 
      }, { status: 400 });
    }

    // Generate new token with pro role
    const newToken = jwt.sign(
      { 
        email: decoded.email, 
        id: decoded.id,
        role: "pro",
        upgrade: true 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set new cookie
    const response = NextResponse.json({ 
      success: true, 
      message: "Upgraded to Pro account!" 
    });
    
    response.headers.append(
      "Set-Cookie",
      `auth_token=${newToken}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
    );
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
