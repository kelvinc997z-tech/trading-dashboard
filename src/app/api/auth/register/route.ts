import { NextRequest, NextResponse } from "next/server";
import { register } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const result = await register(formData);
  if (result.success) {
    return NextResponse.json({ success: true, message: "Registration successful. Please verify your email." });
  }
  return NextResponse.json({ error: result.error }, { status: 400 });
}
