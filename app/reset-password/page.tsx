"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No reset token provided");
      setTokenValid(false);
    } else {
      // Could validate token via API, but we'll just try reset and see if it works; assume valid for now.
      setTokenValid(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Password has been reset. You can now login.");
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-pulse text-gray-600 dark:text-gray-300">Checking token...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-green-100 dark:bg-green-900/30 rounded-xl mb-4">
              <KeyRound className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Enter a new password for your account</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-200 rounded-lg text-sm">{error}</div>}
            {message && <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-200 rounded-lg text-sm">{message}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="••••••••" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading || !tokenValid} className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}