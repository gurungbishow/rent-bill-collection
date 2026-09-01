import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-devanagari",
});

export const metadata: Metadata = {
  title: "My Rooms - Rent Bill Collection",
  description: "Full-stack rent bill collection and room management system",
  applicationName: "My Rooms",
  appleWebApp: {
    capable: true,
    title: "My Rooms",
    statusBarStyle: "default",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} ${notoDevanagari.variable}`}>
      <body className={`${plusJakartaSans.className} font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-150 antialiased`}>
        <Providers>
          {children}
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
