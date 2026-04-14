"use client";

import { useState, useEffect } from "react";
import { Wallet, Loader2, CheckCircle2 } from "lucide-react";
import { ethers } from "ethers";

export default function SettingsPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/user/settings");
      if (res.ok) {
        const data = await res.json();
        setWalletAddress(data.walletAddress);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const linkWallet = async () => {
    const { ethereum } = window as any;
    if (!ethereum) {
      setMessage("Please install a Web3 wallet like MetaMask");
      return;
    }

    setActionLoading(true);
    try {
      const provider = new ethers.BrowserProvider(ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];

      const res = await fetch("/api/user/link-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const data = await res.json();
      if (res.ok) {
        setWalletAddress(address);
        setMessage("Wallet linked successfully!");
      } else {
        setMessage(data.error || "Failed to link wallet");
      }
    } catch (err: any) {
      console.error("Wallet error:", err);
      setMessage(err.message || "Failed to connect wallet");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500">Manage your account settings and preferences.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Web3 Wallet
          </h2>
          <p className="text-sm text-gray-500 mt-1">Link your wallet to sign in without a password.</p>
        </div>
        <div className="p-6 space-y-4">
          {walletAddress ? (
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Linked Wallet</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-mono">{walletAddress}</p>
                </div>
              </div>
              <button
                onClick={linkWallet}
                disabled={actionLoading}
                className="text-sm text-primary hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-4">No wallet linked yet.</p>
              <button
                onClick={linkWallet}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                Link Web3 Wallet
              </button>
            </div>
          )}
          
          {message && (
            <p className={`text-sm text-center ${message.includes("success") ? "text-emerald-500" : "text-red-500"}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
