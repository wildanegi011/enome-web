import type { NextConfig } from "next";

// @ts-ignore
import withBundleAnalyzer from '@next/bundle-analyzer';

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
    ignoreBuildErrors: true,
  },
  modularizeImports: {
    lodash: {
      transform: 'lodash/{{member}}',
    },
  },
  images: {
    unoptimized: true,
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "batik-enome.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "batik-enome.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "sys.batik-enome.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "sys.batik-enome.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: assetHostname,
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: assetHostname,
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "graph.facebook.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${rawAssetUrl}/backend/:path*`,
      },
      {
        source: "/frontend/:path*",
        destination: `${rawAssetUrl}/frontend/:path*`,
      },
      {
        source: "/event/:path*",
        destination: `${rawAssetUrl}/event/:path*`,
      },
      {
        source: "/downloads/:path*",
        destination: `${rawAssetUrl}/downloads/:path*`,
      },
    ];
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default bundleAnalyzer(nextConfig);