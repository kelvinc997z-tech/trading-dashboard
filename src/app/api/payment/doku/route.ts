import { NextRequest, NextResponse } from "next/server";

const DOKU_MERCHANT_CODE = process.env.DOKU_MERCHANT_CODE;
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY;
const DOKU_BASE_URL = process.env.DOKU_BASE_URL || 'https://api.doku.com';

export async function POST(request: NextRequest) {
  try {
    const { amount, planId, userEmail, userName } = await request.json();

    if (!amount || !planId || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields: amount, planId, userEmail" },
        { status: 400 }
      );
    }

    if (!DOKU_MERCHANT_CODE || !DOKU_SECRET_KEY) {
      const missing = [];
      if (!DOKU_MERCHANT_CODE) missing.push('DOKU_MERCHANT_CODE');
      if (!DOKU_SECRET_KEY) missing.push('DOKU_SECRET_KEY');
      return NextResponse.json(
        { error: `Doku payment not configured. Missing: ${missing.join(', ')}` },
        { status: 503 }
      );
    }

    const orderId = `TRD-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const amountDecimal = parseFloat(amount).toFixed(2);

    const payload = {
      request: {
        merchantCode: DOKU_MERCHANT_CODE,
        amount: amountDecimal,
        orderId,
        itemDescription: `Trading Signal ${planId.toUpperCase()} Plan - ${userEmail}`,
        email: userEmail,
        name: userName || "Customer",
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        returnUrl: "https://trading-dashboard.vercel.app/payment/success",
        cancelUrl: "https://trading-dashboard.vercel.app/payment/cancel",
      }
    };

    console.log('[Doku] Creating invoice:', {
      orderId,
      amount: amountDecimal,
      merchantCode: DOKU_MERCHANT_CODE,
      baseUrl: DOKU_BASE_URL,
    });

    const res = await fetch(`${DOKU_BASE_URL}/v1/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DOKU_SECRET_KEY}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
      next: { revalidate: 0 },
    });

    const responseText = await res.text();
    console.log('[Doku] Response:', { status: res.status, body: responseText });

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "Failed to create Doku invoice",
          status: res.status,
          details: responseData,
        },
        { status: 500 }
      );
    }

    const data = responseData?.data || responseData;
    const invoiceUrl = data?.invoiceUrl || data?.paymentUrl || data?.url;

    if (!invoiceUrl) {
      console.error('[Doku] No invoiceUrl in response:', responseData);
      return NextResponse.json(
        { error: "Invalid Doku response: missing invoice URL", details: responseData },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoiceUrl,
      invoiceNumber: data?.invoiceNumber || orderId,
      orderId,
    });

  } catch (err: any) {
    console.error('[Doku Error]:', err.message, err.stack);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}