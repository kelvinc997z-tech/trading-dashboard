import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WatchlistProvider } from "@/components/watchlist/WatchlistProvider";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import { ContrastProvider } from "@/components/contrast/ContrastProvider";
import OnboardingProvider from "@/components/onboarding/OnboardingProvider";
import { LanguageProvider } from "@/context/LanguageContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { MarketTicker } from "@/components/MarketTicker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Dashboard Pro",
  description: "Real-time crypto & stock trading dashboard with signals",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  }
};

export const viewport: Viewport = {
  themeColor: "#10b981"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <LanguageProvider>
            <ContrastProvider>
              <NotificationProvider>
                <WatchlistProvider>
                  <OnboardingProvider>
                    <ErrorBoundary>
                      <MarketTicker />
                      {children}
                    </ErrorBoundary>
                  </OnboardingProvider>
                </WatchlistProvider>
              </NotificationProvider>
            </ContrastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
