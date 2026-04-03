import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WatchlistProvider } from "@/components/watchlist/WatchlistProvider";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import { ContrastProvider } from "@/components/contrast/ContrastProvider";
import OnboardingProvider from "@/components/onboarding/OnboardingProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Dashboard Pro",
  description: "Real-time crypto & stock trading dashboard with signals",
  manifest: "/manifest.json",
  themeColor: "#10b981",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  }
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
          <ContrastProvider>
            <NotificationProvider>
              <WatchlistProvider>
                <OnboardingProvider>{children}</OnboardingProvider>
              </WatchlistProvider>
            </NotificationProvider>
          </ContrastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
