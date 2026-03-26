"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap, Shield, BarChart3, TrendingUp, MessageSquare, Mail } from "lucide-react";

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
    } catch (err) {
      router.push("/login");
    }
  };

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout session");
        setLoading(false);
      }
    } catch (err: any) {
      alert(err.message || "Error occurred");
      setLoading(false);
    }
  };

  // Pricing calculations
  const monthlyPrice = 29;
  const yearlyPrice = 290; // 2 months free
  const savePercent = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);

  const features = {
    free: [
      "Live signals for 3 pairs only",
      "15-minute delayed data",
      "Basic RSI & MACD",
      "Email support",
      "Signal history (7 days)",
    ],
    pro: [
      "All 7 trading pairs",
      "Real-time market data",
      "Advanced technical indicators",
      "Export signals as CSV",
      "Priority support",
      "Signal history (90 days)",
      "Custom alerts",
      "API access",
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Trading Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Unlock professional-grade trading signals and analysis. Start free and upgrade anytime.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <span className={`text-sm font-medium ${selectedPlan === "monthly" ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
            Monthly
          </span>
          <button
            onClick={() => setSelectedPlan(s => s === "monthly" ? "yearly" : "monthly")}
            className="relative w-16 h-8 bg-blue-600 rounded-full transition-colors"
          >
            <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${selectedPlan === "yearly" ? "translate-x-8" : "translate-x-0"}`} />
          </button>
          <span className={`text-sm font-medium ${selectedPlan === "yearly" ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
            Yearly <span className="text-green-600 font-semibold">(Save {savePercent}%)</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className={`rounded-2xl border-2 ${user?.subscription_tier === "free" ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 dark:border-gray-700"} bg-white dark:bg-gray-800 p-8 shadow-xl relative`}>
            {user?.subscription_tier === "free" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                Current Plan
              </div>
            )}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">$0<span className="text-lg font-normal text-gray-500">/month</span></div>
              <p className="text-gray-500 dark:text-gray-400">Perfect for trying out</p>
            </div>

            <ul className="space-y-4 mb-8">
              {features.free.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled
              className="w-full py-3 px-6 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className={`rounded-2xl border-2 ${user?.subscription_tier === "pro" ? "border-blue-500 ring-2 ring-blue-200" : "border-blue-500"} bg-gradient-to-br from-blue-600 to-blue-700 p-8 shadow-xl relative transform md:scale-105`}>
            {user?.subscription_tier === "pro" ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                Current Plan
              </div>
            ) : (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                RECOMMENDED
              </div>
            )}
            <div className="text-center mb-8 text-white">
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-2">
                ${selectedPlan === "monthly" ? monthlyPrice : yearlyPrice}
                <span className="text-lg font-normal opacity-80">/{selectedPlan === "monthly" ? "mo" : "yr"}</span>
              </div>
              <p className="opacity-90">For serious traders</p>
            </div>

            <ul className="space-y-4 mb-8">
              {features.pro.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-white">
                  <Check className="w-5 h-5 text-green-300 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(selectedPlan)}
              disabled={loading || user?.subscription_tier === "pro"}
              className="w-full py-3 px-6 rounded-lg bg-white text-blue-600 font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Processing..." : user?.subscription_tier === "pro" ? "Already Subscribed" : "Upgrade to Pro"}
            </button>

            <p className="text-center text-white/70 text-xs mt-4">
              7-day free trial. Cancel anytime.
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Real-Time Data</h3>
            <p className="text-sm text-gray-500">No delays. Get signals as soon as they're generated.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Advanced Analysis</h3>
            <p className="text-sm text-gray-500">Comprehensive technical indicators for informed decisions.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Priority Support</h3>
            <p className="text-sm text-gray-500">Direct access to our team for any questions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}