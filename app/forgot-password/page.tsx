"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "If the email exists, a reset link has been sent.");
      } else {
        setError(data.error || "Failed to send reset email");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-4">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Forgot Password</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Enter your email to receive a reset link</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-200 rounded-lg text-sm">{error}</div>}
            {message && <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-200 rounded-lg text-sm">{message}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="you@example.com" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Remember your password? <a href="/login" className="text-blue-600 hover:underline">Sign in</a>
          </p>
        </div>
      </main>
    </div>
  );
}