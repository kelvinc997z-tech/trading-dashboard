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
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string | null;
    const phone = formData.get("phone") as string | null;
    
    if (!email || !password) {
      return { error: "Email and password are required" };
    }
    
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account with this email already exists" };
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: "24h" });
    
    try {
      await db.user.create({
        data: {
          email,
          password: hashed,
          name: name || null,
          phone: phone || null,
          verificationToken,
          verified: false,
        },
      });
    } catch (dbError: any) {
      console.error("Database error during registration:", dbError);
      return { error: "Failed to create account. Please try again." };
    }
    
    // Send verification email (non-blocking, don't fail registration if email fails)
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Still return success - user can be created even if email fails
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

async function sendVerificationEmail(to: string, token: string) {
  const verifyLink = `${RESEND_VERIFY_URL}?token=${token}`;
  const fromEmail = process.env.RESEND_EMAIL_FROM || "noreply@yourdomain.com";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `Trading Dashboard <${fromEmail}>`,
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
    // Pro accounts
    "pro@test.com": { password: "password123", role: "pro" },
    "pro2@test.com": { password: "password123", role: "pro" },
    "vip@test.com": { password: "password123", role: "pro" },
    "gold@test.com": { password: "password123", role: "pro" },
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
