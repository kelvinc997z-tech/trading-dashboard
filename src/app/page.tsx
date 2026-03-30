import Link from "next/link";
import RealTimeChart from "@/components/RealTimeChart";
import MarketOutlook from "@/components/MarketOutlook";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Klepon Market Research
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/market" className="text-gray-600 hover:text-gray-900">
              Market
            </Link>
            <Link href="/quant-ai" className="text-gray-600 hover:text-gray-900">
              Quant AI
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Sign In
            </Link>
            <Link href="/login" className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6 tracking-tight">
            Institutional Quality Analysis
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Built for independent thinkers, not insiders. Real-time trading signals, 
            market outlook, and technical analysis for serious traders.
          </p>
          <div className="flex justify-center gap-4 mb-12">
            <Link href="/login" className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition">
              Start Trading
            </Link>
            <Link href="/market" className="border border-gray-300 px-8 py-3 rounded-lg font-medium hover:border-gray-400 transition">
              View Market
            </Link>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-16 flex-wrap mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">388K</div>
              <div className="text-sm text-gray-500">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">42M</div>
              <div className="text-sm text-gray-500">Organic Views</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">+14%</div>
              <div className="text-sm text-gray-500">MoM Return</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Price Preview */}
      <section className="py-16 bg-gray-50 dark:bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Live Gold Price</h2>
              <p className="text-gray-600">Real-time XAUUSD chart - updates every 30 seconds</p>
            </div>
            <div className="rounded-lg border bg-white dark:bg-gray-800 p-6 shadow-sm">
              <RealTimeChart symbol="XAU/USD" />
            </div>
          </div>
        </div>
      </section>

      {/* Framework / Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">The Framework</h2>
            <p className="text-gray-600">We study markets the way the best funds study equities.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <div className="text-4xl font-bold mb-4">01</div>
              <h3 className="font-bold text-lg mb-3">Find What the Market is Missing</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                The best opportunities come from studying what matters before the market agrees with you. 
                Our AI Agents thesis was published when the idea was deeply unpopular. That was the point.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <div className="text-4xl font-bold mb-4">02</div>
              <h3 className="font-bold text-lg mb-3">Understand the Value, Not Just the Price</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Going up doesn't mean worth buying. Going down doesn't mean broken. 
                We study the actual fundamentals underneath and whether the price makes sense.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <div className="text-4xl font-bold mb-4">03</div>
              <h3 className="font-bold text-lg mb-3">Know When the Thesis is Done</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Every great trade has an exit plan. We help you define your thesis and know exactly when it's no longer valid.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Market Outlook Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Today's Market Outlook</h2>
              <p className="text-gray-600">Latest trading signals and market analysis</p>
            </div>
            <MarketOutlook />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start trading?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Join thousands of traders using our platform for daily market insights and trading signals.
          </p>
          <Link href="/login" className="inline-block bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition">
            Get Started Free
          </Link>
        </div>
      </section>

      <footer className="py-8 text-center text-gray-500 text-sm">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} Trading Dashboard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
