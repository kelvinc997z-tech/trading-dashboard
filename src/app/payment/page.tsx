"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Check, MessageCircle, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function PaymentPage() {
  const { t } = useLanguage();
  const [userEmail, setUserEmail] = useState<string>("");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem("user_email");
    if (email) {
      setUserEmail(email);
    }
  }, []);

  const monthlyPrice = 250000;
  const yearlyPrice = 2500000;
  const currentPrice = billingPeriod === "monthly" ? monthlyPrice : yearlyPrice;

  const getWhatsAppMessage = () => {
    const periodStr = billingPeriod === "monthly" ? "Bulanan" : "Tahunan";
    if (userEmail) {
      return `Halo Admin, saya ingin upgrade ke PRO Account (${periodStr}).\n\nEmail terdaftar: ${userEmail}\nTotal: Rp ${currentPrice.toLocaleString("id-ID")}`;
    }
    return `Halo Admin, saya ingin upgrade ke PRO Account (${periodStr}).\n\nTotal: Rp ${currentPrice.toLocaleString("id-ID")}`;
  };

  const whatsappUrl = `https://wa.me/6281367351643?text=${encodeURIComponent(getWhatsAppMessage())}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back to Home */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Upgrade ke Akun PRO</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Dapatkan akses ke semua fitur dan mulai trading seperti profesional
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Order Summary */}
          <div className="rounded-2xl border bg-white dark:bg-gray-800 p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Ringkasan Pesanan</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b dark:border-white/5">
                <div>
                  <p className="font-bold text-lg">Pro Account</p>
                  <p className="text-sm text-gray-500">
                    Langganan {billingPeriod === "monthly" ? "Bulanan" : "Tahunan"}
                  </p>
                </div>
                <div className="text-2xl font-black text-primary">
                  IDR {currentPrice.toLocaleString("id-ID")}
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Durasi</span>
                <span className="font-bold">{billingPeriod === "monthly" ? "1 Bulan" : "1 Tahun"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Perpanjangan</span>
                <span className="font-bold">Manual / WhatsApp</span>
              </div>
              <div className="pt-6 border-t dark:border-white/5">
                <div className="flex justify-between items-center text-xl font-black">
                  <span>Total</span>
                  <span>IDR {currentPrice.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
            
            {/* QRIS Image */}
            <div className="mt-8 pt-8 border-t dark:border-white/5">
              <h3 className="text-lg font-bold mb-4 text-center">Bayar dengan QRIS</h3>
              <div className="bg-white p-4 rounded-xl flex flex-col items-center border border-gray-100">
                <img 
                  src="/qris.jpg" 
                  alt="QRIS Pembayaran" 
                  className="w-full max-w-[200px] aspect-square object-contain"
                />
                <p className="text-[10px] text-gray-400 mt-2">Scan dengan GoPay, OVO, Dana, atau Mobile Banking</p>
              </div>
            </div>

            {/* Yearly Plan Toggle Button */}
            <div className="mt-6 pt-6 border-t dark:border-white/5">
              <button
                onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
                className="w-full py-3 px-4 rounded-xl border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex items-center justify-center gap-2"
              >
                {billingPeriod === "monthly" ? (
                  <>Pilih Paket Tahunan (Hemat 17%)</>
                ) : (
                  <>Pilih Paket Bulanan</>
                )}
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="rounded-2xl border bg-white dark:bg-gray-800 p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Konfirmasi via WhatsApp</h2>

            {userEmail && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                  Email terdeteksi: <strong>{userEmail}</strong>
                </p>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Setelah melakukan scan QRIS, silakan klik tombol di bawah untuk mengirim bukti pembayaran ke Admin.
              </p>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-black text-lg shadow-xl shadow-green-500/20 transition flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-6 h-6" />
                Konfirmasi via WhatsApp
              </a>

              <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl">
                <h4 className="font-black text-amber-800 dark:text-amber-400 text-xs uppercase tracking-widest mb-3">
                  Cara Pembayaran:
                </h4>
                <ul className="text-sm text-amber-700 dark:text-amber-300/80 space-y-2 font-medium">
                  <li className="flex gap-2">
                    <span className="text-amber-500 font-black">1.</span>
                    Scan kode QRIS yang tersedia di samping.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-500 font-black">2.</span>
                    Masukkan nominal sesuai total tagihan.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-500 font-black">3.</span>
                    Simpan bukti transfer/screenshot.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-500 font-black">4.</span>
                    Klik tombol WhatsApp di atas untuk konfirmasi.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm mb-8 border border-gray-100 dark:border-white/5">
          <h3 className="font-black text-lg mb-6 uppercase tracking-tight">Apa yang Anda Dapatkan:</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Grafik Harga Real-time (Update 30 detik)",
              "Sinyal Komoditas (GOLD XAUT & Oil WTI)",
              "Prediksi Market Berbasis AI",
              "Alert & Notifikasi Custom",
              "Dukungan Prioritas (WhatsApp)",
              "Akses API untuk Bot",
              "Dashboard Analisis Performa",
              "Market Outlook Lengkap (Crypto & Stocks)",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-500" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
