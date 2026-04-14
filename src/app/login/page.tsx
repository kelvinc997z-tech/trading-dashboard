"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wallet, Globe } from "lucide-react";
import { ethers } from "ethers";

export const dynamic = 'force-dynamic';

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<"evm" | "solana" | null>(null);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const verified = searchParams.get("verified");
    if (mode === "signup") {
      setIsLogin(false);
    }
    if (verified === "true") {
      setMessage("Email verified successfully! You can now log in.");
    }
  }, [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    const { ethereum } = window as any;
    if (!ethereum) {
      setMessage("Please install a Web3 wallet like MetaMask");
      return;
    }

    setLoading(true);
    setWalletType("evm");
    try {
      const provider = new ethers.BrowserProvider(ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      setWalletAddress(address);
      
      const res = await fetch("/api/auth/web3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, type: "evm" }),
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = "/dashboard";
        return;
      } else {
        setMessage(data.error || "Wallet not linked to an account.");
      }
    } catch (err: any) {
      console.error("Wallet error:", err);
      setMessage(err.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  const connectSolana = async () => {
    const { solana } = window as any;
    if (!solana || !solana.isSolflare) {
      setMessage("Please install Solflare wallet");
      window.open("https://solflare.com/", "_blank");
      return;
    }

    setLoading(true);
    setWalletType("solana");
    try {
      const resp = await solana.connect();
      const address = resp.publicKey.toString();
      setWalletAddress(address);

      const res = await fetch("/api/auth/web3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, type: "solana" }),
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = "/dashboard";
        return;
      } else {
        setMessage(data.error || "Solana wallet not linked to an account.");
      }
    } catch (err: any) {
      console.error("Solana error:", err);
      setMessage(err.message || "Failed to connect Solana wallet");
    } finally {
      setLoading(false);
    }
  };

  const [resetEmail, setResetEmail] = useState("");
  const [showReset, setShowReset] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      setMessage(data.message || data.error);
      if (res.ok) setShowReset(false);
    } catch (err) {
      setMessage("Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    if (!isLogin) {
      if (name) formData.append("name", name);
      if (phone) formData.append("phone", phone);
    } else {
      formData.append("twoFactorToken", twoFactorToken);
    }
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        window.location.href = "/dashboard";
        return;
      }
      
      if (data.requires2FA) {
        setRequires2FA(true);
        setMessage("Please enter your 2FA code from your authenticator app");
        return;
      }
      
      setMessage(data.error || "Something went wrong");
    } catch (err) {
      setMessage("Network error. Please check your connection and try again.");
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {isLogin ? "Sign in to your account" : "Create new account"}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Trading Dashboard
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={connectWallet}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            <Wallet className="w-5 h-5 text-orange-500" />
            {loading && walletType === "evm" ? "Connecting..." : "Sign in with MetaMask/EVM"}
          </button>

          <button
            onClick={connectSolana}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            <Globe className="w-5 h-5 text-purple-500" />
            {loading && walletType === "solana" ? "Connecting..." : "Sign in with Solflare/Solana"}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Google Login Icon Button */}
          <div className="flex justify-center pt-2">
            <Link 
              href="/api/auth/google"
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm group"
              title="Sign in with Google"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                />
              </svg>
            </Link>
          </div>
        </div>

        <form className="mt-4 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Number (optional)
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>
              </>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:text-white"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:text-white"
                disabled={loading}
              />
            </div>
            {requires2FA && (
              <div>
                <label htmlFor="twoFactorToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Two-Factor Authentication Code
                </label>
                <input
                  id="twoFactorToken"
                  name="twoFactorToken"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="6-digit code"
                  disabled={loading}
                  maxLength={6}
                />
              </div>
            )}
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm ${message.includes("error") || message.includes("Error") || message.includes("not linked") ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200" : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"}`}>
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              ) : (
                isLogin ? "Sign in" : "Register"
              )}
            </button>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => {
                const newMode = isLogin ? "signup" : "login";
                router.push(`/login?mode=${newMode}`);
              }}
              className="text-sm text-primary hover:text-primary/80 block w-full"
              disabled={loading}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
            {isLogin && (
              <button
                type="button"
                onClick={() => setShowReset(!showReset)}
                className="text-xs text-gray-500 hover:text-primary"
              >
                Forgot Password?
              </button>
            )}
          </div>

          {showReset && (
            <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg animate-in fade-in slide-in-from-top-2">
              <h3 className="text-sm font-medium mb-2">Reset Password</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700"
                />
                <button
                  onClick={handleResetPassword}
                  className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary/90"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
