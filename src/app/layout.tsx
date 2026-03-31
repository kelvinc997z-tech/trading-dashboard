import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WatchlistProvider } from "@/components/watchlist/WatchlistProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Dashboard",
  description: "Trading dashboard with authentication",
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
          <WatchlistProvider>{children}</WatchlistProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
