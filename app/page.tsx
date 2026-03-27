"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, TrendingUp, Shield, Zap, Mail, Check, Star, MessageSquare, Award, Lock, CreditCard, QrCode } from "lucide-react";
import { CountUp, LiveCounter } from "@/components/LiveStats";
import ShareButtons from "@/components/ShareButtons";
import CountdownTimer from "@/components/CountdownTimer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4ZM0%2028V14h2v4h2v4h2v4h2v4h2v-4h2v-4h2V28H0ZM48%200v4h4v4h4v4h4v4h2v-4h4v-4h4V0h-4V0h-4V0h-4V0h-4V0H48Z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Professional Trading
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Signals & Analysis
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
              Institutional-quality analysis on the largest technological shift in finance.
              Built for independent thinkers, not insiders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-lg font-semibold rounded-full hover:border-blue-600 hover:text-blue-600 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-6 bg-gray-50 dark:bg-gray-800/30 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 flex-wrap">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Lock className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">256-bit SSL</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <CreditCard className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-medium">Stripe Powered</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Mail className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium">Email Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">14+</div>
              <div className="text-gray-600 dark:text-gray-400">Trading Pairs</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Real-time</div>
              <div className="text-gray-600 dark:text-gray-400">Market Data</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">7-Day</div>
              <div className="text-gray-600 dark:text-gray-400">Free Trial</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-400">Signal Alerts</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Trade Smarter
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Comprehensive tools and signals to help you make informed trading decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Live Signals
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time BUY/SELL signals with precise entry, take-profit, and stop-loss levels.
                Generated using advanced technical analysis.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Market Data
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Access to 14+ trading pairs including crypto, forex, commodities, and major indices.
                Updated every 60 seconds.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Risk Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Every signal includes calculated stop-loss levels. Track win rates and performance
                metrics to refine your strategy.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Instant Alerts
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get notified immediately when new signals are generated. Never miss a trading opportunity.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Technical Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Advanced indicators including RSI, MACD, SMAs, and custom algorithms.
                Full charts powered by TradingView.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-6">
                <Mail className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Email Reports
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Daily and weekly digest emails. Trial reminders and subscription updates
                delivered straight to your inbox.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Start free, upgrade when you're ready.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-2 border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                $0<span className="text-lg font-normal text-gray-500">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">3 trading pairs</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">15-minute delayed data</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Basic indicators</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Email support</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full text-center py-3 px-6 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 shadow-xl text-white relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-bold px-4 py-1 rounded-full">
                RECOMMENDED
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-6">
                $29<span className="text-lg font-normal opacity-80">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-300 mt-0.5" />
                  <span>All 14 trading pairs</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-300 mt-0.5" />
                  <span>Real-time market data</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-300 mt-0.5" />
                  <span>Advanced technical indicators</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-300 mt-0.5" />
                  <span>CSV export</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-300 mt-0.5" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-300 mt-0.5" />
                  <span>7-day free trial</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full text-center py-3 px-6 rounded-lg bg-white text-blue-600 font-bold hover:bg-gray-100 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Get started in minutes, not hours.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-blue-600 dark:text-blue-400">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Create Account</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sign up for free in under 2 minutes. No credit card required to start.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-blue-600 dark:text-blue-400">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Explore Dashboard</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Access live market data, signals, and technical analysis for 3 pairs with your free trial.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-blue-600 dark:text-blue-400">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Upgrade for More</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Unlock all 14 pairs, real-time data, and advanced features with Pro plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Performance Stats */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Performance That Speaks for Itself
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Track record of our signals across various market conditions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">68%</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Win Rate</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">1:2.5</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Risk/Reward</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">2,500+</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Signals Generated</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">15+</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Months</p>
            </div>
          </div>

          <div className="mt-12 max-w-3xl mx-auto bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Important Risk Disclosure</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Trading involves significant risk. Past performance does not guarantee future results. 
                  Our signals are educational purposes only and not financial advice. Always do your own 
                  research and never risk more than you can afford to lose. Win rate and returns are 
                  based on historical data and may vary. We are not responsible for any losses incurred.
                </p>
              </div>
            </div>
      {/* Performance Stats */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Performance That Speaks for Itself
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Track record of our signals across various market conditions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                <CountUp end={68} suffix="%" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Win Rate</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">1:2.5</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Risk/Reward</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                <CountUp end={2500} suffix="+" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Signals Generated</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                <CountUp end={15} suffix="+" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Months</p>
            </div>
          </div>

          <div className="mt-12 max-w-3xl mx-auto bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Important Risk Disclosure</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Trading involves significant risk. Past performance does not guarantee future results. 
                  Our signals are for educational purposes only and not financial advice. Always do your own 
                  research and never risk more than you can afford to lose. Win rate and returns are 
                  based on historical data and may vary. We are not responsible for any losses incurred.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live User Counter */}
      <section className="py-12 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg text-purple-100 mb-4">
            <MessageSquare className="w-5 h-5 inline mr-2" />
            Join thousands of traders receiving signals right now
          </p>
          <div className="text-5xl md:text-6xl font-bold text-white mb-2">
            <LiveCounter target={3847} />
          </div>
          <p className="text-purple-200">Active Members Worldwide</p>
        </div>
      </section>

      {/* Email Capture Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Get Notified About New Features & Updates
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join our waitlist and be the first to know when we launch new features, market insights, and exclusive offers.
          </p>
          
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const email = formData.get('email') as string;
              const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
              
              if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Subscribing...';
              }

              try {
                const res = await fetch('/api/email-capture', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, source: 'landing_page_waitlist' }),
                });
                
                if (res.ok) {
                  alert('✅ Thanks! You\'ve been added to our waitlist.');
                  (e.target as HTMLFormElement).reset();
                } else {
                  const data = await res.json();
                  alert(data.error || 'Something went wrong. Please try again.');
                }
              } catch (err) {
                alert('Network error. Please try again.');
              } finally {
                if (submitBtn) {
                  submitBtn.disabled = false;
                  submitBtn.textContent = 'Join Waitlist';
                }
              }
            }}
            className="max-w-md mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                className="flex-1 px-6 py-4 rounded-full border-2 border-transparent focus:border-white focus:ring-2 focus:ring-white/30 outline-none text-gray-900 placeholder-gray-500"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-100 transition-colors shadow-lg whitespace-nowrap"
              >
                Join Waitlist
              </button>
            </div>
            <p className="text-blue-200 text-sm mt-3">
              No spam, ever. Unsubscribe anytime.
            </p>
          </form>

          {/* Social Share */}
          <div className="mt-8 pt-6 border-t border-blue-500/30">
            <ShareButtons 
              url={process.env.NEXTAUTH_URL || "https://trading-dashboard.vercel.app"}
              title="Join Trading Dashboard - Professional Trading Signals & Analysis"
              description="Get real-time trading signals, market data, and technical analysis. Start your free 7-day trial today!"
            />
          </div>
        </div>
      </section>

      {/* Limited Time Offer Countdown */}
      <section className="py-12 bg-gradient-to-r from-red-600 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Limited Time Offer</h3>
          <p className="text-red-100 mb-6">Upgrade now and get 50% OFF the first month!</p>
          <div className="mb-4">
            <CountdownTimer 
              targetDate={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)} // 3 days from now
            />
          </div>
          <p className="text-white/80 text-sm">Offer ends soon. Don't miss out!</p>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Trade On The Go
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                Access your trading dashboard from anywhere with our mobile-optimized interface.
                No app download required - works on any device with a browser.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Fully responsive design</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Real-time push notifications</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Save to home screen</span>
                </li>
              </ul>
              
              {/* QR Code */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg inline-block">
                <div className="w-48 h-48 bg-white mx-auto flex items-center justify-center border-2 border-gray-200">
                  <QrCode className="w-40 h-40 text-gray-800" />
                </div>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-3">
                  Scan to open on mobile
                </p>
              </div>

              <div className="mt-6 flex gap-4 justify-center">
                <button className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  App Store
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.552l2.633-1.533a1.91 1.91 0 000-2.734L22.088 4.71a1.91 1.91 0 00-2.735-.548l-2.602 1.554-2.528-1.554a1.91 1.91 0 00-2.733.548L5.194 8.547a1.91 1.91 0 010 2.735l2.508 1.555 2.509-1.555a1.91 1.91 0 010-2.734l-2.61-1.534z"/>
                  </svg>
                  Google Play
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Powered by Best-in-Class Technology</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">TradingView Charts</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Professional charting</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Alpha Vantage</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Real-time market data</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Stripe</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Secure payments</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Resend</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Transactional emails</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Vercel</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Instant deployments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Traders Say
            </h2>
            <div className="flex justify-center items-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Join thousands of satisfied traders
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                "This signal service has completely changed my trading. The signals are accurate and the entry/exit points are very precise. Highly recommended!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">JK</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">James K.</p>
                  <p className="text-sm text-gray-500">Pro Member</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                "I was skeptical at first, but after trying the free trial I was convinced. The real-time data and accurate signals helped me achieve consistent profits."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 font-bold">SC</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Sarah C.</p>
                  <p className="text-sm text-gray-500">Pro Member</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                "Best trading signals service I've used. Clear entry/exit points, great risk management. The 7-day trial sold me. Worth every penny!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">MR</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Mike R.</p>
                  <p className="text-sm text-gray-500">Yearly Subscriber</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {/* FAQ 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <details className="group">
                <summary className="flex justify-between items-center p-6 cursor-pointer">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">What is a trading signal?</h3>
                  <span className="text-2xl text-gray-500 group-open:rotate-180 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-6 text-gray-600 dark:text-gray-400">
                  A trading signal is a recommendation to buy or sell a specific asset at a particular price and time. Our signals include precise entry, take-profit, and stop-loss levels based on technical analysis.
                </div>
              </details>
            </div>

            {/* FAQ 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <details className="group">
                <summary className="flex justify-between items-center p-6 cursor-pointer">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">How accurate are your signals?</h3>
                  <span className="text-2xl text-gray-500 group-open:rotate-180 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-6 text-gray-600 dark:text-gray-400">
                  Our signals are generated using advanced algorithms and multiple technical indicators. Win rate varies by market conditions but typically ranges between 65-75%. Past performance does not guarantee future results.
                </div>
              </details>
            </div>

            {/* FAQ 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <details className="group">
                <summary className="flex justify-between items-center p-6 cursor-pointer">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Can I cancel anytime?</h3>
                  <span className="text-2xl text-gray-500 group-open:rotate-180 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-6 text-gray-600 dark:text-gray-400">
                  Yes! You can cancel your subscription at any time. Cancelation takes effect at the end of your billing period. No hidden fees or long-term contracts.
                </div>
              </details>
            </div>

            {/* FAQ 4 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <details className="group">
                <summary className="flex justify-between items-center p-6 cursor-pointer">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">What's the difference between Free and Pro?</h3>
                  <span className="text-2xl text-gray-500 group-open:rotate-180 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-6 text-gray-600 dark:text-gray-400">
                  Free plan gives you access to 3 trading pairs with 15-minute delayed data. Pro plan unlocks all 14 pairs, real-time data, advanced indicators, CSV export, priority support, and 90-day signal history.
                </div>
              </details>
            </div>

            {/* FAQ 5 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <details className="group">
                <summary className="flex justify-between items-center p-6 cursor-pointer">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">How do I get started?</h3>
                  <span className="text-2xl text-gray-500 group-open:rotate-180 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-6 text-gray-600 dark:text-gray-400">
                  Simply create a free account, verify your email, and you'll instantly get access to the dashboard with a 7-day Pro trial. No credit card required to sign up.
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Trading Smarter?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of traders using our signals to make better decisions.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-4 bg-white text-blue-600 text-lg font-bold rounded-full hover:bg-gray-100 transition-all shadow-lg"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-2">© 2026 Trading Dashboard. Built with Next.js & Tailwind.</p>
          <p className="text-sm">Charts powered by TradingView. Not financial advice.</p>
        </div>
      </footer>
    </div>
  );
}
