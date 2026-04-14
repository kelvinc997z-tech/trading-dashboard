const fetch = require('node-fetch');

const DOKU_BASE_URL = process.env.DOKU_BASE_URL || 'https://api.doku.com';
const DOKU_MERCHANT_CODE = process.env.DOKU_MERCHANT_CODE;
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY;

if (!DOKU_MERCHANT_CODE || !DOKU_SECRET_KEY) {
  console.error('Missing DOKU_MERCHANT_CODE or DOKU_SECRET_KEY');
  process.exit(1);
}

const orderId = `TEST-${Date.now()}`;
const payload = {
  request: {
    merchantCode: DOKU_MERCHANT_CODE,
    amount: "10000.00",
    orderId: orderId,
    itemDescription: "Test Payment - Trading Signal Pro Plan",
    email: "test@example.com",
    name: "Test User",
    expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    returnUrl: "https://trading-dashboard.vercel.app/payment/success",
    cancelUrl: "https://trading-dashboard.vercel.app/payment/cancel",
  }
};

console.log('Testing Doku API with:');
console.log('Base URL:', DOKU_BASE_URL);
console.log('Merchant:', DOKU_MERCHANT_CODE.substring(0, 10) + '...');
console.log('Order ID:', orderId);
console.log('Payload:', JSON.stringify(payload, null, 2));
console.log('---');

(async () => {
  try {
    const res = await fetch(`${DOKU_BASE_URL}/v1/invoices/issue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DOKU_SECRET_KEY}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log('\nResponse Status:', res.status, res.statusText);
    console.log('Response Body:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { raw: text };
    }

    if (res.ok) {
      const invoiceUrl = data?.data?.invoiceUrl || data?.invoiceUrl;
      console.log('\n✅ SUCCESS! Invoice created.');
      console.log('Invoice URL:', invoiceUrl || 'NOT FOUND IN RESPONSE');
    } else {
      console.log('\n❌ FAILED');
      console.log('Error Code:', data?.error?.code || data?.code || 'N/A');
      console.log('Error Message:', data?.error?.message || data?.message || data?.raw || 'No message');
    }
  } catch (err) {
    console.error('\n❌ FETCH ERROR:', err.message);
  }
})();