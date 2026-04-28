import type { Metadata } from "next";
import { Anton, Fraunces, Geist, Geist_Mono, Permanent_Marker } from "next/font/google";
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

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const permanentMarker = Permanent_Marker({
  variable: "--font-chalk",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const anton = Anton({
  variable: "--font-gamebreaker",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Every Court Vision · #007",
  description:
    "A film-room reading of Every's distributed publishing. Not a leaderboard — a way to see the shape of the growth you already create.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${permanentMarker.variable} ${anton.variable}`}
      >
        <TooltipProvider delayDuration={120}>
          <Suspense
            fallback={
              <div className="px-8 py-10 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Tipping off…
              </div>
            }
          >
            <AppShell>{children}</AppShell>
          </Suspense>
        </TooltipProvider>
      </body>
    </html>
  );
}
