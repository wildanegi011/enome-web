import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ÉNOMÉ - Fashion & Batik Collection 2026",
  description:
    "Discover the finest batik and fashion collections at ÉNOMÉ. Shop the latest 2026 arrivals, deals of the month, and exclusive kain batik panjang.",
};

import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${plusJakartaSans.variable} ${inter.variable} antialiased`}>
        <ReactQueryProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ReactQueryProvider>
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
