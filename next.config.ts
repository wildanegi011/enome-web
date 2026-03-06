import type { NextConfig } from "next";

const rawAssetUrl =
  process.env.NEXT_PUBLIC_ASSET_URL || "http://localhost:3000";

let assetProtocol: "http" | "https" = "http";
let assetHostname = "localhost";

try {
  const parsed = new URL(rawAssetUrl);
  assetProtocol = parsed.protocol.replace(":", "") as "http" | "https";
  assetHostname = parsed.hostname;
} catch (err) {
  console.warn("Invalid NEXT_PUBLIC_ASSET_URL, fallback to localhost");
}

const nextConfig: NextConfig = {
  typescript: {
    // 🔥 ini penting kalau VPS RAM kecil
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: assetProtocol,
        hostname: assetHostname,
      },
    ],
  },
};

export default nextConfig;