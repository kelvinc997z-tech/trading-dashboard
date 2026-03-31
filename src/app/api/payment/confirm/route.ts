import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const ADMIN_EMAILS = ["admin@test.com", "kelvinc997z@gmail.com"]; // Add your admin email(s)

// POST /api/payment/confirm
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  if (!ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { requestId } = body;

  if (!requestId) {
    return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
  }

  // Find payment
  const payment = await db.payment.findUnique({
    where: { id: requestId },
    include: { user: true },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.status !== "pending") {
    return NextResponse.json({ error: "Payment already processed" }, { status: 400 });
  }

  // Calculate subscription expiry
  const now = new Date();
  let endsAt: Date;
  if (payment.plan === "monthly") {
    endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // approx 30 days
  } else if (payment.plan === "lifetime") {
    endsAt = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
  } else {
    endsAt = now;
  }

  // Transaction: confirm payment, upgrade user
  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: requestId },
      data: {
        status: "confirmed",
        confirmedAt: now,
        confirmedBy: session.user.id,
      },
    });

    await tx.user.update({
      where: { id: payment.userId },
      data: {
        role: "pro",
        subscriptionEndsAt: endsAt,
      },
    });
  });

  return NextResponse.json({
    success: true,
    message: `User ${payment.user.email} upgraded to Pro (${payment.plan})`,
    userId: payment.userId,
    role: "pro",
    subscriptionEndsAt: endsAt.toISOString(),
  });
}
