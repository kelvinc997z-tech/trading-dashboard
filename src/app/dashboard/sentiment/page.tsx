import MarketSentiment from "@/components/MarketSentiment";
import Link from "next/link";
import { ArrowLeft, Newspaper } from "lucide-react";

export default function DashboardSentimentPage() {
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full text-sm font-medium text-purple-800 dark:text-purple-200 mb-4">
          <Newspaper className="w-4 h-4" />
          Market Sentiment
        </div>
        <h1 className="text-4xl font-bold mb-4">News & Sentiment Analysis</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Aggregated market sentiment from news sources across major trading pairs.
          Track bullish/bearish trends and stay informed.
        </p>
      </div>

      {/* Sentiment Component */}
      <MarketSentiment />
    </div>
  );
}
