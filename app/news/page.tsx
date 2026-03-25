import Header from "@/components/Header";
import NewsSection from "@/components/NewsSection";

export default function NewsPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Market News
        </h1>
        <NewsSection />
      </main>
    </div>
  );
}