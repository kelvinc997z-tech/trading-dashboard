"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TwoFactorPage() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/2fa");
      if (res.ok) {
        const data = await res.json();
        setEnabled(data.enabled);
      } else if (res.status === 401) {
        // Not logged in, redirect to login
        router.push("/login");
      }
    } catch (err) {
      console.error("Failed to check 2FA status:", err);
    }
  };

  const generateSetup = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      if (res.ok) {
        const data = await res.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setMessage("");
      } else {
        const err = await res.json();
        setError(err.error || "Failed to generate QR code");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!secret || !token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", token, secret }),
      });
      if (res.ok) {
        setEnabled(true);
        setQrCode(null);
        setSecret(null);
        setToken("");
        setMessage("2FA enabled successfully!");
        setError("");
      } else {
        const err = await res.json();
        setError(err.error || "Verification failed");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm("Are you sure? This will disable 2FA.")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/2fa", { method: "DELETE" });
      if (res.ok) {
        setEnabled(false);
        setMessage("2FA disabled");
      } else {
        const err = await res.json();
        setError(err.error || "Failed to disable");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Two-Factor Authentication</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Secure your account with TOTP-based 2FA</p>

        {message && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {!enabled ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Use Google Authenticator, Authy, or any TOTP-compatible app to scan the QR code and generate verification codes.
            </p>
            {!qrCode ? (
              <button
                onClick={generateSetup}
                disabled={loading}
                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition"
              >
                {loading ? "Generating..." : "Generate QR Code"}
              </button>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <img src={qrCode} alt="QR Code" className="max-w-full h-auto" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Or manually enter this secret key in your app:
                  </p>
                  <code className="block bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm font-mono break-all select-all">
                    {secret}
                  </code>
                </div>
                <div>
                  <label htmlFor="token" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Enter 6-digit code
                  </label>
                  <input
                    id="token"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-2xl tracking-widest dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="000000"
                    maxLength={6}
                    disabled={loading}
                  />
                </div>
                <button
                  onClick={verifyAndEnable}
                  disabled={loading || token.length !== 6}
                  className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {loading ? "Verifying..." : "Verify & Enable 2FA"}
                </button>
                <button
                  onClick={() => { setQrCode(null); setSecret(null); setError(""); }}
                  className="w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">2FA is active</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your account is protected with two-factor authentication. You can disable it below if needed.
            </p>
            <button
              onClick={disable2FA}
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition"
            >
              {loading ? "Disabling..." : "Disable 2FA"}
            </button>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
          <p className="text-yellow-800 dark:text-yellow-200 font-medium">Important:</p>
          <ul className="mt-2 list-disc list-inside text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>Save your backup codes in a safe place</li>
            <li>You will need to enter a 6-digit code when logging in</li>
            <li>If you lose your device, contact support to reset 2FA</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
