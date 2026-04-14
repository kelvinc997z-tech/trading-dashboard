"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Zap, Crown, Star } from "lucide-react";

type PlanType = "free" | "lite" | "pro";

interface Plan {
  id: PlanType;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyOriginalPrice: number; // before discount
  features: string[];
  highlighted?: boolean;
  icon: React.ReactNode;
}

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("lite");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  const plans: Plan[] = [
    {
      id: "free",
      name: "Free",
      description: "Basic features for getting started",
      monthlyPrice: 0,
      yearlyPrice: 0,
      yearlyOriginalPrice: 0,
      icon: <Star className="w-8 h-8" />,
      features: [
        "1 Active Trade Signal per day",
        "Basic Market Outlook (3 pairs)",
        "Economic Calendar Access",
        "Community Discord Access",
        "Manual Trade Journaling",
      ],
    },
    {
      id: "lite",
      name: "LITE",
      description: "Perfect for casual traders",
      monthlyPrice: 175000,
      yearlyPrice: 1470000, // 30% off (2.1M → 1.47M)
      yearlyOriginalPrice: 2100000,
      icon: <Zap className="w-8 h-8" />,
      features: [
        "Unlimited Trade Signals",
        "Full Market Outlook (6 pairs)",
        "Real-time GOLD XAUT Crypto Signals",
        "Economic Calendar with Alerts",
        "Advanced Charting (1 timeframe)",
        "Email Support",
        "Export Trade History (CSV)",
      ],
      highlighted: true,
    },
    {
      id: "pro",
      name: "PRO",
      description: "For serious traders who want it all",
      monthlyPrice: 250000,
      yearlyPrice: 1800000, // 40% off (3M → 1.8M)
      yearlyOriginalPrice: 3000000,
      icon: <Crown className="w-8 h-8" />,
      features: [
        "Everything in LITE",
        "Advanced Charting (All timeframes)",
        "AI-Powered Market Predictions",
        "Custom Alert Strategies",
        "Priority Support (WhatsApp)",
        "Performance Analytics Dashboard",
        "API Access for Bots",
        "White-label Reports (PDF)",
        "Early Access to New Features",
      ],
    },
  ];

  const getPrice = (plan: Plan) => {
    if (plan.id === "free") return "Free";
    if (billingPeriod === "monthly") {
      return `Rp ${plan.monthlyPrice.toLocaleString("id-ID")}/bulan`;
    }
    return `Rp ${plan.yearlyPrice.toLocaleString("id-ID")}/tahun`;
  };

  const getPeriodLabel = (plan: Plan) => {
    if (plan.id === "free") return "/ forever";
    return ` / ${billingPeriod === "monthly" ? "month" : "year"}`;
  };

  const getSelectedPlan = () => plans.find((p) => p.id === selectedPlan)!;
  const currentPlan = getSelectedPlan();

  const sendWhatsAppUpgrade = async () => {
    if (currentPlan.id === "free") {
      alert("Free plan is already active. No upgrade needed!");
      return;
    }

    // Redirect to payment page instead of WhatsApp directly
    window.location.href = "/payment";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Back to Dashboard */}
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your trading style. All plans include 24/7 platform access and regular updates.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly</span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
            className="relative w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <span
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                billingPeriod === "yearly" ? "left-9" : "left-1"
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Yearly <span className="text-green-600 dark:text-green-400 font-bold">(Save up to 40%)</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 shadow-lg transition-all ${
                plan.highlighted
                  ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-500 scale-105"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  plan.highlighted 
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" 
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}>
                  {plan.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {plan.description}
                </p>
                <div>
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {getPrice(plan)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {getPeriodLabel(plan)}
                  </span>
                  {billingPeriod === "yearly" && plan.yearlyOriginalPrice > 0 && (
                    <p className="text-sm text-gray-400 line-through mt-1">
                      Original: Rp {plan.yearlyOriginalPrice.toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSelectedPlan(plan.id)}
                disabled={plan.id === "free"}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition ${
                  plan.id === "free"
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-800"
                    : selectedPlan === plan.id
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                }`}
              >
                {plan.id === "free" ? "Current Free Plan" : "Select Plan"}
              </button>
            </div>
          ))}
        </div>

        {/* Selected Plan Summary */}
        {selectedPlan !== "free" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              You selected: <span className="text-primary">{currentPlan.name}</span>
            </h3>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  {billingPeriod === "monthly" 
                    ? `Rp ${currentPlan.monthlyPrice.toLocaleString("id-ID")} per month`
                    : `Rp ${currentPlan.yearlyPrice.toLocaleString("id-ID")} per year ( Rp ${Math.round(currentPlan.yearlyPrice/12).toLocaleString("id-ID")}/month )`
                  }
                </p>
              </div>
              <button
                onClick={sendWhatsAppUpgrade}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold transition shadow-lg disabled:opacity-50"
              >
                {loading ? "Processing..." : "Upgrade Now via WhatsApp"}
              </button>
            </div>
          </div>
        )}

        {/* FAQs or Additional Info */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                What's the difference between Free, LITE, and PRO?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                <strong>Free</strong>: Basic access (1 signal/day, 3-pair outlook). 
                <strong>LITE</strong>: Unlimited signals, full 6-pair outlook, real-time XAU, advanced charts, CSV export. 
                <strong>PRO</strong>: AI predictions, custom alerts, API access, priority WhatsApp support, performance analytics, white-label reports.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Can I upgrade or downgrade anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Yes! Upgrades are instant. Downgrades apply at next billing cycle. Prorated refunds available for annual upgrades.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Do you offer team accounts?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                PRO plan includes up to 5 team members. For larger teams, contact us for enterprise pricing.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Is there a refund policy?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                7-day money-back guarantee. If you're not satisfied, contact support within 7 days of purchase for a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
