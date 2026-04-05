import { Montserrat } from "next/font/google";
import React, { Suspense } from "react";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

import type { Metadata } from "next";

import { ConfigService } from "@/lib/services/config-service";
import { siteConfig } from "@/lib/site-config";
import { unstable_cache } from "next/cache";

export const revalidate = 0;

// Cached metadata getter to avoid database calls on every navigation
const getCachedMetadata = unstable_cache(
  async (key: string, defaultValue: string) => ConfigService.get(key, defaultValue),
  ["site-metadata"],
  { revalidate: 3600, tags: ["metadata"] }
);

export async function generateMetadata(): Promise<Metadata> {
  const [dbTitle, dbDescription, dbKeywords, dbFavicon, gaId] = await Promise.all([
    getCachedMetadata("META_TITLE", `${siteConfig.name} - Fashion & Batik Collection 2026`),
    getCachedMetadata("META_DESCRIPTION", siteConfig.description),
    getCachedMetadata("META_KEYWORDS", siteConfig.keywords.join(", ")),
    getCachedMetadata("SITE_FAVICON", siteConfig.assets.favicon),
    getCachedMetadata("ga_google", "")
  ]);

  const faviconUrl = dbFavicon;
  const keywordsArray = dbKeywords.split(",").map((k) => k.trim());

  return {
    title: {
      default: dbTitle,
      template: `%s | ${siteConfig.name}`,
    },
    description: dbDescription,
    keywords: keywordsArray,
    authors: siteConfig.authors,
    creator: siteConfig.creator,
    publisher: siteConfig.publisher,
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: siteConfig.url,
      title: dbTitle,
      description: dbDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: faviconUrl,
          width: 800,
          height: 600,
          alt: `${siteConfig.name} Logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dbTitle,
      description: dbDescription,
      images: [faviconUrl],
      creator: siteConfig.twitter.creator,
    },
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
  };
}

import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import MotionProvider from "@/components/providers/MotionProvider";
import { Toaster } from "sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import ScrollToTop from "@/components/store/shared/ScrollToTop";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = await getCachedMetadata("ga_google", "");

  return (
    <html lang="id" className={`${montserrat.variable} ${montserrat.className}`}>
      <body className="antialiased font-sans">
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <ReactQueryProvider>
          <MotionProvider>
            <TooltipProvider>
              <Suspense fallback={null}>
                <ScrollToTop />
              </Suspense>
              {children}
            </TooltipProvider>
          </MotionProvider>
        </ReactQueryProvider>
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
