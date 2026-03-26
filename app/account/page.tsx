"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Calendar, CreditCard, crown, logout } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    loadData();
    // Check for success query param
    if (typeof window !== 'undefined' && window.location.search.includes('success')) {
      setSuccessMessage(true);
      // Clear query param
      window.history.replaceState({}, '', '/account');
      setTimeout(() => setSuccessMessage(false), 5000);
    }
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
      const subRes = await fetch("/api/subscription");
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll lose Pro access at the end of the billing period.")) return;
    setCancelLoading(true);
    try {
      const res = await fetch("/api/cancel-subscription", { method: "POST" });
      if (res.ok) {
        alert("Subscription cancelled successfully. You'll remain on Pro until the end of your billing period.");
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel subscription");
      }
    } catch (err: any) {
      alert(err.message || "Error cancelling subscription");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-gray-900 dark:text-white text-xl font-semibold animate-pulse">Loading...</div>
      </div>
    );
  }

  const isPro = subscription?.tier === "pro" && subscription?.status === "active";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition"
          >
            <logout className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* User Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Profile</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
              <p className="font-semibold text-gray-900 dark:text-white">{formatDate(user?.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">User ID</p>
              <p className="font-mono text-sm text-gray-900 dark:text-white">{user?.id}</p>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
          {successMessage && (
            <div className="mb-4 p-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Subscription activated! Welcome to Pro.</span>
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Subscription</h2>
            {isPro && (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full text-sm font-semibold">
                <crown className="w-4 h-4" /> Pro
              </span>
            )}
            {!isPro && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 rounded-full text-sm font-semibold">
                Free
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">{subscription?.tier || "Free"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle className={`w-5 h-5 ${subscription?.status === "active" ? "text-green-500" : "text-gray-400"}`} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">{subscription?.status || "Active"}</p>
              </div>
            </div>

            {subscription?.current_period_end && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current Period Ends</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatDate(subscription.current_period_end)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {!isPro ? (
              <button
                onClick={() => router.push("/pricing")}
                className="w-full py-3 px-6 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
              >
                Upgrade to Pro
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/pricing")}
                  className="w-full py-3 px-6 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Manage Plan
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                  className="w-full py-3 px-6 rounded-lg border-2 border-red-500 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition"
                >
                  {cancelLoading ? "Cancelling..." : "Cancel Subscription"}
                </button>
                <p className="text-xs text-center text-gray-500">
                  Cancelling will downgrade you to Free at the end of your billing period.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subscription API Endpoints */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Developer</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-gray-500">GET /api/subscription</span>
              <span className="text-gray-400"> - Get current subscription status</span>
            </div>
            <div>
              <span className="text-gray-500">POST /api/cancel-subscription</span>
              <span className="text-gray-400"> - Cancel subscription via Stripe portal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}