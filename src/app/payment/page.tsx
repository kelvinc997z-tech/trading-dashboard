"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Check, MessageCircle } from "lucide-react";

export default function PaymentPage() {
  const [userEmail, setUserEmail] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    // Try to get user email from session or localStorage
    const email = localStorage.getItem("user_email");
    if (email) {
      setUserEmail(email);
    }
  }, []);

  const getWhatsAppMessage = () => {
    if (userEmail) {
      return `Hi, I want to upgrade to Pro Account. My registered email: ${userEmail}`;
    }
    return "Hi, I want to upgrade to Pro Account. Please provide my registered email.";
  };

  const whatsappUrl = `https://wa.me/6281367351643?text=${encodeURIComponent(getWhatsAppMessage())}`;

  if (false) { // Keep success state for future use
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-lg w-full mx-auto p-8 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Payment Request Sent!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We've received your WhatsApp request. We'll process your upgrade shortly.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
          >
            Go to Dashboard
          </button>
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
            <h2 className="text-xl font-semibold mb-4">Payment via WhatsApp</h2>

            {userEmail && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400">
                  Email detected: <strong>{userEmail}</strong>
                </p>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Click the button below to send your payment request via WhatsApp to our admin.
              </p>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-lg font-bold text-lg shadow-lg transition flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-6 h-6" />
                Chat to Pay via WhatsApp
              </a>

              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-400 text-sm mb-2">
                  How it works:
                </h4>
                <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-decimal list-inside">
                  <li>Click the button above to open WhatsApp</li>
                  <li>Send the pre-filled message</li>
                  <li>We'll reply with bank details or crypto address</li>
                  <li>After payment, we'll upgrade your account within 24 hours</li>
                </ol>
              </div>

              {!userEmail && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Your Email (optional but helpful)</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Including your email helps us process faster.
                  </p>
                </div>
              )}
            </div>

            {/* Other payment methods (disabled for now) */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-500 text-center">
                Other payment methods (Doku, cards, e-wallets) coming soon.
              </p>
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
      </div>
    </div>
  );
}