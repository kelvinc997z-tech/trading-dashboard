"use server";

import { cookies } from "next/headers";
import { db } from "./db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

const JWT_SECRET = process.env.JWT_SECRET || "secret-change-me";
const RESEND_VERIFY_URL = process.env.RESEND_VERIFY_URL || "http://localhost:3000/api/auth/verify";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return { user: { email: decoded.email, id: decoded.id, role: decoded.role } };
  } catch {
    return null;
  }
}

export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  if (!email || !password) {
    return { error: "Email and password required" };
  }
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "User already exists" };
  }
  const hashed = await bcrypt.hash(password, 10);
  const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: "24h" });
  const user = await db.user.create({
    data: {
      email,
      password: hashed,
      verificationToken,
      verified: false,
    },
  });
  await sendVerificationEmail(email, verificationToken);
  return { success: true };
}

async function sendVerificationEmail(to: string, token: string) {
  const verifyLink = `${RESEND_VERIFY_URL}?token=${token}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Trading Dashboard <noreply@yourdomain.com>",
      to,
      subject: "Verify your email",
      html: `<p>Click <a href="${verifyLink}">here</a> to verify your email.</p>`,
    }),
  });
  if (!res.ok) {
    console.error("Resend error:", await res.text());
  }
}

export async function verifyEmail(token: string) {
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await db.user.findFirst({
      where: { verificationToken: token, verified: false },
    });
    if (!user) {
      return { error: "Invalid or expired token" };
    }
    await db.user.update({
      where: { id: user.id },
      data: { verified: true, verificationToken: null },
    });
    return { success: true };
  } catch (e) {
    return { error: "Invalid token" };
  }
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  // Test accounts with roles
  const testAccounts: Record<string, {password: string, role: string}> = {
    "admin@test.com": { password: "password123", role: "free" },
    "trader@test.com": { password: "password123", role: "free" },
    "test@test.com": { password: "password123", role: "free" },
    "free@test.com": { password: "password123", role: "free" },
    "pro@test.com": { password: "password123", role: "pro" },
  };
  
  const account = testAccounts[email];
  if (account && password === account.password) {
    const token = jwt.sign({ 
      email, 
      id: email,
      role: account.role 
    }, JWT_SECRET, {
      expiresIn: "7d",
    });
    return { success: true, token };
  }
  
  // Normal flow with database
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Invalid credentials" };
  }
  if (!user.verified) {
    return { error: "Please verify your email first" };
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { error: "Invalid credentials" };
  }
  const token = jwt.sign({ 
    email: user.email, 
    id: user.id,
    role: "free" // default role for normal users
  }, JWT_SECRET, {
    expiresIn: "7d",
  });
  return { success: true, token };
}

export async function logOut() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/");
}
