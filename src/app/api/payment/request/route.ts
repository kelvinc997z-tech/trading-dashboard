import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const ADMIN_WHATSAPP_NUMBER = "6281367351643"; // Admin WhatsApp number for payment processing

// POST /api/payment/request
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { plan, billingPeriod } = body;

  if (plan !== "pro") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const amount = billingPeriod === "monthly" ? 200000 : 1800000;

  // Create payment record
  const payment = await db.payment.create({
    data: {
      userId: session.user.id,
      plan,
      amount,
      method: "whatsapp",
      whatsappMessage: `New ${plan} (${billingPeriod}) subscription request from ${session.user.email}`,
      status: "pending",
    },
  });

  // Build WhatsApp message template for user to send to admin
  const message = `Halo, saya ingin upgrade ke PRO (${billingPeriod}) di Trading Dashboard.\n\nEmail: ${session.user.email}\nPlan: PRO (${billingPeriod})\nAmount: Rp ${amount.toLocaleString()}\nPayment ID: ${payment.id}\n\nMohon konfirmasi setelah transfer. Terima kasih.`;

  const waUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return NextResponse.json({
    requestId: payment.id,
    whatsappMessage: message,
    waUrl,
    amount,
    plan,
  });
}
