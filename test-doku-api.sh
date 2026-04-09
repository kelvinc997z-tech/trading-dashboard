#!/bin/bash
export DOKU_MERCHANT_CODE="SK-K3R8qW4IfOVmtjVDgvdY"
export DOKU_SECRET_KEY="doku_key_a7d5a063591a4050978aa8a162036abd"
export DOKU_BASE_URL="https://api.doku.com"

node <<'EOF'
const fetch = require('node-fetch');

const DOKU_BASE_URL = process.env.DOKU_BASE_URL;
const DOKU_MERCHANT_CODE = process.env.DOKU_MERCHANT_CODE;
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY;

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

console.log('Request payload:', JSON.stringify(payload, null, 2));

fetch(`${DOKU_BASE_URL}/v1/invoices/issue`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${DOKU_SECRET_KEY}`,
    "Accept": "application/json",
  },
  body: JSON.stringify(payload),
})
.then(res => res.text())
.then(text => {
  console.log('\nResponse status:', res.status, res.statusText);
  console.log('Response body:', text);
  
  try {
    const data = JSON.parse(text);
    if (res.ok) {
      console.log('\n✅ Success! Invoice URL:', data?.data?.invoiceUrl || data?.invoiceUrl);
    } else {
      console.log('\n❌ Error:');
      console.log('Code:', data?.error?.code || data?.code);
      console.log('Message:', data?.error?.message || data?.message);
    }
  } catch (e) {
    console.log('(Could not parse JSON)');
  }
})
.catch(err => {
  console.error('Fetch error:', err.message);
});
EOF