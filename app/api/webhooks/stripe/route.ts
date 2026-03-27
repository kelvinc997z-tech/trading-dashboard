import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { updateUserSubscription, readUsers } from "@/lib/db";
import { sendEmail, templates } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId) break;

        // Get user email for receipt
        const users = await readUsers();
        const user = users.find(u => u.id === userId);
        
        // Subscription created, update user to pro
        const subscription = session.subscription as string;
        await updateUserSubscription(userId, {
          subscription_tier: "pro",
          subscription_status: "active",
          stripe_subscription_id: subscription,
          current_period_end: new Date(session.expires_at * 1000).toISOString(),
          trial_ends_at: undefined, // Clear trial if exists
        });

        // Send subscription activated email
        if (user) {
          const nextBillDate = new Date(session.expires_at * 1000).toLocaleDateString();
          const amount = session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : '$29.00';
          const planType = session.metadata?.plan === 'yearly' ? 'Pro Plan (Yearly $290)' : 'Pro Plan (Monthly $29)';
          await sendEmail(user.email, templates.subscriptionActivated(user.name, planType, nextBillDate, amount));
        }

        console.log(`User ${userId} upgraded to pro`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Find user by Stripe customer ID
        const users = await readUsers();
        const user = users.find(u => u.stripe_customer_id === customerId);
        if (!user) break;

        const status = subscription.status as "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "incomplete_expired";
        const currentPeriodEnd = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : undefined;

        await updateUserSubscription(user.id, {
          subscription_status: status,
          current_period_end: currentPeriodEnd,
          stripe_subscription_id: subscription.id,
        });

        // Send email for past_due or canceled
        if (status === 'past_due') {
          await sendEmail(user.email, templates.paymentFailed(user.name, `$${(subscription.amount_total / 100).toFixed(2)}`));
        }

        console.log(`User ${user.id} subscription updated: ${status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        const users = await readUsers();
        const user = users.find(u => u.stripe_customer_id === customerId);
        if (!user) break;

        const endDate = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
          : 'immediately';

        await updateUserSubscription(user.id, {
          subscription_tier: 'free',
          subscription_status: 'canceled',
          stripe_subscription_id: undefined,
          current_period_end: undefined,
        });

        // Send cancellation email
        await sendEmail(user.email, templates.subscriptionCancelled(user.name, endDate));

        console.log(`User ${user.id} subscription cancelled, downgraded to free`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Error handling webhook:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}