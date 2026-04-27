import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { AppShell } from "@/components/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Every Court Vision",
  description: "A film-room growth analytics dashboard for Every.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <TooltipProvider delayDuration={120}>
          <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading court...</div>}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </TooltipProvider>
      </body>
    </html>
  );
}
