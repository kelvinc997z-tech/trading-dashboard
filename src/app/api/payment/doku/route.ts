import { NextRequest, NextResponse } from "next/server";

// Doku Payment Configuration
const DOKU_MERCHANT_CODE = process.env.DOKU_MERCHANT_CODE || "";
const DOKU_API_KEY = process.env.DOKU_API_KEY || "";
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY || "";
const DOKU_BASE_URL = process.env.DOKU_BASE_URL || "https://api.doku.com";

interface DokuInvoiceResponse {
  invoiceUrl: string;
  invoiceNumber: string;
  orderId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { amount, planId, userEmail, userName } = await request.json();

    if (!amount || !planId || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields: amount, planId, userEmail" },
        { status: 400 }
      );
    }

    // Validate credentials
    if (!DOKU_API_KEY || !DOKU_SECRET_KEY) {
      return NextResponse.json(
        { error: "Doku payment not configured on server" },
        { status: 503 }
      );
    }

    const orderId = `TRD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const amountDecimal = parseFloat(amount).toFixed(2);

    // Prepare Doku invoice request
    const invoiceData = {
      merchantCode: DOKU_MERCHANT_CODE,
      apiKey: DOKU_API_KEY,
      orderId,
      amount: amountDecimal,
      // Optional: item description
      itemDescriptions: [
        {
          name: `Trading Signal ${planId.toUpperCase()} Plan`,
          price: amountDecimal,
          quantity: 1
        }
      ],
      // Customer info
      customer: {
        name: userName || "Customer",
        email: userEmail
      },
      // Expiry: 24 hours from now
      expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      // Payment methods: all
      channel: {
        paymentMethods: ["CREDIT_CARD", "BANK_TRANSFER", "E_WALLET", "QRIS"]
      }
    };

    // Call Doku API to create invoice
    const res = await fetch(`${DOKU_BASE_URL}/v1/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DOKU_SECRET_KEY}`
      },
      body: JSON.stringify(invoiceData)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[Doku] Create invoice failed:", res.status, errorText);
      return NextResponse.json(
        { error: "Failed to create Doku invoice", details: errorText },
        { status: 500 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      success: true,
      invoiceUrl: data.invoiceUrl,
      invoiceNumber: data.invoiceNumber,
      orderId
    });

  } catch (err: any) {
    console.error("[Doku Payment]", err.message);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}
