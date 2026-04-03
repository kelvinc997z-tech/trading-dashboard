"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS (no beforeinstallprompt, manual instructions)
    const ua = navigator.userAgent || navigator.vendor;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also show after 5 seconds if not already installed (heuristic)
    const timer = setTimeout(() => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      if (!isStandalone && !deferredPrompt && !isIOSDevice) {
        setShowInstall(true);
      }
    }, 10000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstall(false);
    console.log("PWA install outcome:", outcome);
  };

  const handleDismiss = () => {
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-slide-up">
      <div className="glass-card rounded-xl p-4 shadow-lg border border-emerald-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Download className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">Install App</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {isIOS
                ? "Install Trading Dashboard Pro on your home screen for quick access."
                : "Add to home screen for a better experience, even offline!"}
            </p>
            <div className="flex gap-2">
              {isIOS ? (
                <a
                  href="#install"
                  onClick={(e) => {
                    e.preventDefault();
                    // Show iOS instructions
                    alert("Tap the Share button (square with arrow up) → 'Add to Home Screen'");
                  }}
                  className="flex-1 text-center px-3 py-2 text-xs font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                >
                  How to Install
                </a>
              ) : (
                <button
                  onClick={handleInstall}
                  className="flex-1 px-3 py-2 text-xs font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                >
                  Install
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
