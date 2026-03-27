import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

const dataDir = path.join(process.cwd(), 'data');
const emailFile = path.join(dataDir, 'email_captures.json');

export async function POST(request: NextRequest) {
  try {
    const { email, source } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Ensure data directory exists
    await fs.mkdir(dataDir, { recursive: true });

    // Read existing emails
    let emails: Array<{ email: string; source: string; createdAt: string }> = [];
    try {
      const existing = await fs.readFile(emailFile, 'utf-8');
      emails = JSON.parse(existing);
    } catch {
      // File doesn't exist yet, start with empty array
    }

    // Check if email already exists
    if (emails.some(e => e.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ error: "Email already subscribed" }, { status: 409 });
    }

    // Add new email
    emails.push({
      email: email.toLowerCase(),
      source: source || 'landing_page',
      createdAt: new Date().toISOString(),
    });

    // Save
    await fs.writeFile(emailFile, JSON.stringify(emails, null, 2));

    // Send confirmation email via Resend
    try {
      await sendEmail(email, { 
        subject: "You're on our waitlist!", 
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">You're on the list!</h1>
            <p>Hi there,</p>
            <p>Thank you for joining our waitlist with email: <strong>${email}</strong></p>
            <p>We'll notify you when we launch new features, market insights, and exclusive offers.</p>
            <p>In the meantime, feel free to explore our platform:</p>
            <p>
              <a href="${process.env.NEXTAUTH_URL}" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                Visit Trading Dashboard
              </a>
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="color: #6b7280; font-size: 14px;">
              Want to unsubscribe? <a href="${process.env.NEXTAUTH_URL}/unsubscribe?email=${encodeURIComponent(email)}">Click here</a>
            </p>
          </div>
        `,
        text: `You're on our waitlist! We'll notify you about new features.`
      });
    } catch (emailErr) {
      console.error('Failed to send waitlist email:', emailErr);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true, message: "Email captured!" });
  } catch (error) {
    console.error("Email capture error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Admin endpoint to list captures (requires secret)
  const secret = request.headers.get('x-admin-secret');
  const adminSecret = process.env.ADMIN_SECRET_KEY;

  if (!adminSecret || secret !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await fs.mkdir(dataDir, { recursive: true });
    const data = await fs.readFile(emailFile, 'utf-8');
    const emails = JSON.parse(data);
    return NextResponse.json({ count: emails.length, emails });
  } catch {
    return NextResponse.json({ count: 0, emails: [] });
  }
}
