import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Enable production builds to fail with type/lint errors to surface issues
  typescript: { ignoreBuildErrors: false },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "ansell-assets.codelabs.pro",
      },
      {
        protocol: "https",
        hostname: "www.dmca.com",
      },
    ],
  },
};

export default nextConfig;
