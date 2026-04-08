import { NextRequest, NextResponse } from "next/server";

// Doku Payment Configuration
const DOKU_MERCHANT_CODE = process.env.DOKU_MERCHANT_CODE;
const DOKU_API_KEY = process.env.DOKU_API_KEY;
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY;
const DOKU_BASE_URL = process.env.DOKU_BASE_URL || 'https://api-sandbox.doku.com';

export async function POST(request: NextRequest) {
  try {
    const { amount, planId, userEmail, userName } = await request.json();

    if (!amount || !planId || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields: amount, planId, userEmail" },
        { status: 400 }
      );
    }

    if (!DOKU_MERCHANT_CODE || !DOKU_API_KEY || !DOKU_SECRET_KEY) {
      return NextResponse.json(
        { error: "Doku payment not configured. Missing DOKU_MERCHANT_CODE, DOKU_API_KEY, or DOKU_SECRET_KEY environment variables." },
        { status: 503 }
      );
    }

    const orderId = `TRD-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const amountDecimal = parseFloat(amount).toFixed(2);

    // Doku v1 Invoices API
    const payload = {
      request: {
        merchantCode: DOKU_MERCHANT_CODE,
        amount: amountDecimal,
        orderId,
        itemDescription: `Trading Signal ${planId.toUpperCase()} Plan`,
        email: userEmail,
        name: userName || "Customer",
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      }
    };

    console.log('[Doku] Creating invoice:', {
      orderId,
      amount: amountDecimal,
      merchantCode: DOKU_MERCHANT_CODE,
      baseUrl: DOKU_BASE_URL
    });

    const res = await fetch(`${DOKU_BASE_URL}/v1/invoices/issue`, {
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
    console.log('[Doku] API Response:', { status: res.status, body: responseText });

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

    // Parse successful response
    const invoiceUrl = responseData?.data?.invoiceUrl || responseData?.invoiceUrl;
    const invoiceNumber = responseData?.data?.invoiceNumber || responseData?.invoiceNumber;

    if (!invoiceUrl) {
      console.error('[Doku] Invalid response format:', responseData);
      return NextResponse.json(
        { error: "Invalid Doku response: missing invoice URL", details: responseData },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoiceUrl,
      invoiceNumber,
      orderId,
    });

  } catch (err: any) {
    console.error('[Doku Payment Error]:', err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}