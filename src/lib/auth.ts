"use server";

import { cookies } from "next/headers";
import { db } from "./db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { verify2FACode } from "./2fa";

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
    
    console.log("Checking existing user for:", email);
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account with this email already exists" };
    }
    
    console.log("Hashing password...");
    const hashed = await bcrypt.hash(password, 10);
    const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: "24h" });
    
    console.log("Creating user in DB...");
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
      return { error: `Database error: ${dbError.message || "Failed to create account"}` };
    }
    
    console.log("Sending verification email...");
    
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
  
  // Beautiful HTML email template
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding: 30px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px 12px 0 0;
          }
          .logo {
            font-size: 28px;
            font-weight: 800;
            color: white;
            letter-spacing: -0.5px;
          }
          .logo span {
            color: #fbbf24;
          }
          .content {
            background: white;
            padding: 40px;
            border-radius: 0 0 12px 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .greeting {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 16px;
          }
          .message {
            font-size: 16px;
            color: #475569;
            margin-bottom: 30px;
          }
          .button-container {
            text-align: center;
            margin: 40px 0;
          }
          .button {
            display: inline-block;
            padding: 16px 48px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.4);
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px 0 rgba(102, 126, 234, 0.5);
          }
          .fallback-link {
            background: #f1f5f9;
            border: 1px dashed #cbd5e1;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            word-break: break-all;
            font-size: 14px;
            color: #64748b;
          }
          .fallback-label {
            font-weight: 600;
            color: #475569;
            margin-bottom: 8px;
            display: block;
          }
          .note {
            font-size: 14px;
            color: #64748b;
            text-align: center;
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          .footer {
            text-align: center;
            padding: 30px 0;
            color: #94a3b8;
            font-size: 14px;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Trading<span>Dashboard</span></div>
          </div>
          
          <div class="content">
            <div class="greeting">Welcome aboard! 👋</div>
            <p class="message">
              You're one step away from accessing your Trading Dashboard. 
              Please verify your email address to activate your account.
            </p>
            
            <div class="button-container">
              <a href="${verifyLink}" class="button">Verify Email Address</a>
            </div>
            
            <div class="fallback-link">
              <span class="fallback-label">Or copy and paste this link into your browser:</span>
              ${verifyLink}
            </div>
            
            <p class="note">
              This verification link will expire in 24 hours for security reasons.<br>
              If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
          
          <div class="footer">
            <p>Need help? Contact our support team</p>
            <p>&copy; ${new Date().getFullYear()} Trading Dashboard. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `Trading Dashboard <${fromEmail}>`,
      to,
      subject: "Verify Your Email - Trading Dashboard",
      html,
    }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Resend error:", errorText);
    throw new Error(`Failed to send verification email: ${errorText}`);
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

export async function googleLogin(code: string) {
  try {
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET;
    const redirect_uri = process.env.GOOGLE_REDIRECT_URI || "https://tradingsignal.cloud/api/auth/google/callback";

    if (!client_id || !client_secret) {
      throw new Error("Missing Google credentials");
    }

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const error = await tokenRes.text();
      console.error("Google token error:", error);
      throw new Error("Failed to exchange Google code");
    }

    const { access_token } = await tokenRes.json();

    // Get user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) throw new Error("Failed to get Google user info");
    const googleUser = await userRes.json();

    const { email, name } = googleUser;

    // Find or create user
    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: name || null,
          password: await bcrypt.hash(Math.random().toString(36), 10), // random password for OAuth users
          verified: true, // Google emails are already verified
          role: "free",
        },
      });
    }

    const token = jwt.sign({ 
      email: user.email, 
      id: user.id,
      role: user.role || "free",
      twoFactorVerified: true,
    }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return { success: true, token };
  } catch (error: any) {
    console.error("Google login error:", error);
    return { error: error.message || "Google authentication failed" };
  }
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const twoFactorToken = formData.get("twoFactorToken") as string | null;
  
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
      role: account.role,
      twoFactorVerified: true, // skip 2FA for test accounts
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
  
  // Check 2FA
  if (user.twoFactorEnabled) {
    if (!twoFactorToken) {
      return { requires2FA: true, userId: user.id };
    }
    const isValid = verify2FACode(user.twoFactorSecret!, twoFactorToken);
    if (!isValid) {
      return { error: "Invalid 2FA code" };
    }
  }
  
  const token = jwt.sign({ 
    email: user.email, 
    id: user.id,
    role: user.role || "free",
    twoFactorVerified: true,
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
