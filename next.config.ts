import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Prevents double mounting video stream during dev
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      encoding: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
