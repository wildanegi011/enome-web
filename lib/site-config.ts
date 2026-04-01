/**
 * Site Configuration
 * Centralizing SEO and site-wide metadata for easier maintenance.
 */

export const siteConfig = {
    name: "ÉNOMÉ",
    shortName: "ÉNOMÉ",
    url: "https://batik-enome.com",
    ogImage: "https://batik-enome.com/og.jpg", // Fallback OG image
    description: "Discover the finest batik and fashion collections at ÉNOMÉ. Shop the latest 2026 arrivals, deals of the month, and exclusive kain batik panjang.",
    keywords: ["Batik", "Fashion", "ÉNOMÉ", "Koleksi 2026", "Kain Batik", "Pakaian Wanita", "Pakaian Pria"],
    authors: [
        {
            name: "ÉNOMÉ",
            url: "https://batik-enome.com",
        },
    ],
    creator: "ÉNOMÉ",
    publisher: "ÉNOMÉ",
    assets: {
        favicon: "/favicon.ico",
        ogImage: "/logo-enome.png",
    },
    twitter: {
        creator: "@enome",
    }
};

export type SiteConfig = typeof siteConfig;
