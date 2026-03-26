import { NextRequest, NextResponse } from "next/server";
import { isValidSession } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const match = cookieHeader.match(/session=([^;]+)/);
    if (!match) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const token = match[1];
    const session = await isValidSession(token);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Get user's Stripe customer ID
    const { readUsers } = await import("@/lib/db");
    const users = await readUsers();
    const user = users.find(u => u.id === session.userId);
    if (!user || !user.stripe_customer_id) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.NEXTAUTH_URL}/account`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error("Error creating portal session:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}