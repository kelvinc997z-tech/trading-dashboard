"use client";

import Link from "next/link";
import { useState } from "react";

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "lifetime">("monthly");
  const [loading, setLoading] = useState(false);

  const prices = {
    monthly: "Rp 150.000/bulan",
    lifetime: "Rp 1.500.000 (selamanya)",
  };

  const sendWhatsAppUpgrade = async () => {
    setLoading(true);
    try {
      // Create payment request record
      const res = await fetch("/api/payment/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      if (!res.ok) throw new Error("Failed to create request");
      const { requestId, whatsappMessage } = await res.json();

      // Open WhatsApp with pre-filled message
      const waUrl = `https://wa.me/6281367351643?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(waUrl, "_blank");

      alert("Payment request recorded! Complete payment via WhatsApp.");
    } catch (e) {
      alert("Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    "All Free features",
    "Multi-timeframe charts (1m-1d)",
    "Advanced indicators (RSI, MACD, Bollinger)",
    "Custom alerts (price, indicator, patterns)",
    "Email & Telegram notifications",
    "Correlation matrix",
    "Sentiment analysis",
    "Performance analytics",
    "AI predictions",
    "Export data (CSV)",
    "Extended history (up to 30 days)",
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Pricing</h1>
        <p className="text-gray-600 dark:text-gray-300">Simple, transparent pricing. No hidden fees.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free */}
        <div className="border rounded-2xl p-8 bg-white dark:bg-gray-800 shadow-sm">
          <h3 className="text-2xl font-bold mb-2">Free</h3>
          <div className="text-3xl font-bold mb-6">Rp 0 <span className="text-base font-normal">/ month</span></div>
          <ul className="space-y-3 mb-8">
            {features.slice(0, 3).map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                {f}
              </li>
            ))}
            {features.slice(3).map((f, i) => (
              <li key={i+3} className="flex items-center gap-2 text-gray-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                {f}
              </li>
            ))}
          </ul>
          <Link href="/login" className="block w-full py-3 border border-gray-300 rounded-lg text-center font-semibold hover:border-gray-400 transition">
            Continue Free
          </Link>
        </div>

        {/* Pro */}
        <div className="border-2 border-emerald-500 rounded-2xl p-8 bg-white dark:bg-gray-800 shadow-lg relative">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl">
            RECOMMENDED
          </div>
          <h3 className="text-2xl font-bold mb-2">Pro</h3>
          <div className="text-3xl font-bold mb-2">
            {selectedPlan === "monthly" ? "Rp 150.000" : "Rp 1.500.000"}
            <span className="text-base font-normal"> / {selectedPlan === "monthly" ? "month" : "lifetime"}</span>
          </div>
          <p className="text-gray-500 mb-6">Full access to all features</p>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Plan</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                className={`py-2 border rounded-lg ${selectedPlan === "monthly" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-gray-300"}`}
                onClick={() => setSelectedPlan("monthly")}
              >
                Monthly
              </button>
              <button
                className={`py-2 border rounded-lg ${selectedPlan === "lifetime" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-gray-300"}`}
                onClick={() => setSelectedPlan("lifetime")}
              >
                Lifetime
              </button>
            </div>
          </div>

          <ul className="space-y-3 mb-8">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={sendWhatsAppUpgrade}
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? "Processing..." : "Upgrade via WhatsApp"}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.454-.003 6.568-5.333 11.893-11.893 11.893-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.596 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.532-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.609 5.8zm5.973-14.04c-.247-.074-.502-.151-.77-.235-2.486-1.008-4.356-2.652-5.209-4.617-.352-.824-.56-1.722-.56-2.635 0-3.767 3.035-6.835 6.835-6.835 2.375 0 4.534 1.035 6.035 2.714.852.853 1.757 1.716 2.714 2.129-.165.942-.607 2.142-1.175 3.181-.203.37-.408.739-.613 1.105z"/></svg>
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">You will be redirected to WhatsApp to complete payment.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-16 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
        <strong className="text-yellow-800 dark:text-yellow-200">Note:</strong>
        <p className="mt-2 text-yellow-700 dark:text-yellow-300">
          After payment, admin will manually verify and upgrade your account. You will receive a confirmation email shortly.
        </p>
      </div>
    </div>
  );
}
