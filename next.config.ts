import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Config for Next.js 15/16+
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
