"use client";

import { useState, useEffect } from "react";
import { Wallet, Globe, Loader2, CheckCircle2 } from "lucide-react";
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

  const linkWallet = async (type: "evm" | "solana") => {
    const { ethereum, solana } = window as any;
    
    setActionLoading(true);
    try {
      let address = "";
      if (type === "evm") {
        if (!ethereum) throw new Error("MetaMask not found");
        const provider = new ethers.BrowserProvider(ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        address = accounts[0];
      } else {
        if (!solana || !solana.isSolflare) throw new Error("Solflare not found");
        const resp = await solana.connect();
        address = resp.publicKey.toString();
      }

      const res = await fetch("/api/user/link-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, type }),
      });

      const data = await res.json();
      if (res.ok) {
        setWalletAddress(address);
        setMessage(`${type === "evm" ? "MetaMask" : "Solflare"} wallet linked successfully!`);
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500">Manage your account settings and preferences.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
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
              <div className="flex gap-2">
                <button onClick={() => linkWallet("evm")} disabled={actionLoading} className="text-xs text-primary hover:underline">Change MetaMask</button>
                <button onClick={() => linkWallet("solana")} disabled={actionLoading} className="text-xs text-purple-500 hover:underline">Change Solflare</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => linkWallet("evm")}
                disabled={actionLoading}
                className="flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <Wallet className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-gray-900 dark:text-white">Link MetaMask (EVM)</span>
              </button>
              <button
                onClick={() => linkWallet("solana")}
                disabled={actionLoading}
                className="flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <Globe className="w-5 h-5 text-purple-500" />
                <span className="font-medium text-gray-900 dark:text-white">Link Solflare (Solana)</span>
              </button>
            </div>
          )}
          
          {message && (
            <p className={`text-sm text-center font-medium ${message.includes("success") ? "text-emerald-500" : "text-red-500"}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
