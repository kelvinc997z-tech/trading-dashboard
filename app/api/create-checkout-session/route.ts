import { NextRequest, NextResponse } from "next/server";
import { readUsers } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!, // e.g., "price_xxx"
  yearly: process.env.STRIPE_PRICE_YEARLY!, // e.g., "price_yyy"
};

export async function POST(request: NextRequest) {
  try {
    const { userId, plan } = await request.json();
    if (!userId || !plan) {
      return NextResponse.json({ error: "Missing userId or plan" }, { status: 400 });
    }
    if (!["monthly", "yearly"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const users = await readUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create or find Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await updateUserSubscription(user.id, { stripe_customer_id: customerId });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: PRICES[plan as keyof typeof PRICES],
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/account?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      metadata: { userId: user.id, plan },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error("Error creating checkout session:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Helper to update user (avoid circular import)
async function updateUserSubscription(userId: string, updates: any) {
  const { updateUserSubscription: updateSub } = await import("@/lib/db");
  return updateSub(userId, updates);
}