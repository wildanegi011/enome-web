import type { NextConfig } from "next";

const assetUrl = new URL(process.env.NEXT_PUBLIC_ASSET_URL || "http://localhost:3000");

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: assetUrl.protocol.replace(":", "") as "http" | "https",
        hostname: assetUrl.hostname,
      },
    ],
  },
};

export default nextConfig;
