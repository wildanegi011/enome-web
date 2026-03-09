import { Montserrat } from "next/font/google";
import React, { Suspense } from "react";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

import type { Metadata } from "next";

import { SlideService } from "@/lib/services/slide-service";

export async function generateMetadata(): Promise<Metadata> {
  const logoUrl = await SlideService.getFrontendLogo();
  const faviconUrl = logoUrl || "/favicon.ico"; // Fallback if no logo

  return {
    title: "ÉNOMÉ - Fashion & Batik Collection 2026",
    description: "Discover the finest batik and fashion collections at ÉNOMÉ. Shop the latest 2026 arrivals, deals of the month, and exclusive kain batik panjang.",
    keywords: ["Batik", "Fashion", "ÉNOMÉ", "Koleksi 2026", "Kain Batik", "Pakaian Wanita", "Pakaian Pria"],
    authors: [{ name: "ÉNOMÉ" }],
    creator: "ÉNOMÉ",
    publisher: "ÉNOMÉ",
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: "https://batik-enome.com",
      title: "ÉNOMÉ - Fashion & Batik Collection 2026",
      description: "Discover the finest batik and fashion collections at ÉNOMÉ. Shop the latest 2026 arrivals, deals of the month, and exclusive kain batik panjang.",
      siteName: "ÉNOMÉ",
      images: [
        {
          url: faviconUrl,
          width: 800,
          height: 600,
          alt: "ÉNOMÉ Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "ÉNOMÉ - Fashion & Batik Collection 2026",
      description: "Discover the finest batik and fashion collections at ÉNOMÉ. Shop the latest arrivals and exclusive kain batik panjang.",
      images: [faviconUrl],
      creator: "@enome",
    },
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
  };
}

import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import { Toaster } from "sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import ScrollToTop from "@/components/store/shared/ScrollToTop";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${montserrat.variable} antialiased`}>
        <ReactQueryProvider>
          <TooltipProvider>
            <Suspense fallback={null}>
              <ScrollToTop />
            </Suspense>
            {children}
          </TooltipProvider>
        </ReactQueryProvider>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
