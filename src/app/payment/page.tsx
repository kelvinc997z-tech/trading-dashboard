"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Check, CreditCard, Smartphone } from "lucide-react";

export default function PaymentPage() {
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handlePayment = async () => {
    // For now, redirect to WhatsApp for payment confirmation after showing QRIS
    const currentPlan = "PRO";
    const billingPeriod = "monthly";
    const amount = "250.000";
    const whatsappMessage = `Halo Admin, saya ingin konfirmasi pembayaran untuk upgrade ke akun ${currentPlan} (${billingPeriod}) sebesar IDR ${amount}.`;
    const waUrl = `https://wa.me/6281367351643?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(waUrl, "_blank");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-lg w-full mx-auto p-8 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your Pro Account has been activated. Redirecting to dashboard...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back to Home */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Upgrade to Pro Account</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Get access to all features and start trading like a pro
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Order Summary */}
          <div className="rounded-lg border bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <div>
                  <p className="font-medium">Pro Account</p>
                  <p className="text-sm text-gray-500">Monthly subscription</p>
                </div>
                <div className="text-2xl font-bold">IDR 250.000</div>
              </div>
              <div className="flex justify-between items-center">
                <span>Duration</span>
                <span>1 month</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Renewal</span>
                <span>Auto (can cancel anytime)</span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span>IDR 250.000</span>
                </div>
              </div>

              {/* QRIS Section */}
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-semibold mb-4 text-center">Pay with QRIS</h3>
                <div className="bg-white p-4 rounded-xl flex flex-col items-center">
                  <img 
                    src="/qris.jpg" 
                    alt="QRIS Payment" 
                    className="w-full max-w-[250px] aspect-square object-contain"
                  />
                  <p className="text-[10px] text-gray-400 mt-2">Scan with GoPay, OVO, Dana, or Bank App</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="rounded-lg border bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-primary transition">
                <input type="radio" name="payment" value="card" className="text-primary" defaultChecked />
                <CreditCard className="w-5 h-5" />
                <div>
                  <p className="font-medium">Credit/Debit Card</p>
                  <p className="text-sm text-gray-500">Visa, Mastercard, Mandiri, BCA</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-primary transition">
                <input type="radio" name="payment" value="ewallet" className="text-primary" />
                <Smartphone className="w-5 h-5" />
                <div>
                  <p className="font-medium">E-Wallet</p>
                  <p className="text-sm text-gray-500">GoPay, OVO, Dana, LinkAja</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-primary transition">
                <input type="radio" name="payment" value="crypto" className="text-primary" />
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
                <div>
                  <p className="font-medium">Cryptocurrency</p>
                  <p className="text-sm text-gray-500">USDT, BTC, ETH</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-8">
          <h3 className="font-semibold mb-4">What's included:</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              "Real-time price charts (30s updates)",
              "5 crypto/precious metals pairs",
              "Advanced technical indicators",
              "Custom alerts & notifications",
              "Priority support",
              "API access",
              "Historical data export",
              "Market signals & outlook",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handlePayment}
            disabled={processing}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-12 py-4 rounded-lg font-bold text-lg shadow-lg hover:from-yellow-500 hover:to-orange-600 transition disabled:opacity-50 flex items-center gap-3 mx-auto"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <Crown className="w-6 h-6" />
                Pay IDR 250.000 - Upgrade Now
              </>
            )}
          </button>
          <p className="text-sm text-gray-500 mt-4">
            7-day free trial. No hidden fees. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
