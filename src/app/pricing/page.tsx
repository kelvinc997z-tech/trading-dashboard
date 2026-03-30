import Link from "next/link";
import { Crown } from "lucide-react";

const features = {
  free: [
    "Market signals (auto-updated)",
    "Market outlook & news",
    "Basic technical analysis",
    "5 currency pairs (XAU, BTC, ETH, SOL, XRP)",
    "Email support",
  ],
  pro: [
    "Everything in Free",
    "Real-time price charts (30s updates)",
    "All 5 crypto/precious metals pairs",
    "Advanced technical indicators",
    "Custom alerts & notifications",
    "Priority support",
    "API access",
    "Historical data export",
    "Quant AI Engine (ML predictions, signals, backtesting lab)",
  ],
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Pro Account
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Mulai gratis, upgrade ke Pro saat Anda butuh lebih banyak. Tidak ada biaya tersembunyi, batalkan kapan saja.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="rounded-lg border bg-white dark:bg-gray-800 shadow-sm p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">Akun Free</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Untuk pemula yang ingin belajar
              </p>
              <div className="text-4xl font-bold mb-2">
                Gratis
                <span className="text-lg font-normal text-gray-500">/bulan</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {features.free.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="block w-full text-center py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 transition"
            >
              Daftar Gratis
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="rounded-lg border-2 border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 shadow-lg p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Paling Populer
              </span>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">Akun Pro</h2>
                <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Untuk trader serius
              </p>
              <div className="text-4xl font-bold mb-2">
                Rp 450.000
                <span className="text-lg font-normal text-gray-500">/bulan</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {features.pro.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="block w-full text-center py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
            >
              Mulai Pro Trial
            </Link>
          </div>
        </div>

        {/* FAQ / Info */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-center">Pertanyaan Umum</h3>
          <div className="space-y-4">
            {[
              {
                q: "Apa perbedaan antara Free dan Pro?",
                a: "Free termasuk market signals dan analisis dasar. Pro menambahkan real-time charts, indikator lanjutan, custom alerts, API access, dan priority support."
              },
              {
                q: "Bisakah saya berhenti kapan saja?",
                a: "Ya, Anda dapat upgrade atau downgrade kapan saja. Billing akan diprorata."
              },
              {
                q: "Apakah ada free trial untuk Pro?",
                a: "Ya, semua langganan Pro baru mendapatkan 7 hari free trial. Tidak diperlukan kartu kredit."
              },
              {
                q: "Metode pembayaran apa yang diterima?",
                a: "Kami menerima semua kartu kredit utama, PayPal, dan cryptocurrency (USDT, BTC)."
              },
            ].map((faq, i) => (
              <div key={i} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="font-semibold mb-2">{faq.q}</h4>
                <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Trading Dashboard. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
