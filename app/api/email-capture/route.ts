import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

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

    // Optional: Send notification email to admin
    // await fetch('https://api.resend.com/emails', { ... })

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
