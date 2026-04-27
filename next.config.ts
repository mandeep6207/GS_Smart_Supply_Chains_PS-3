import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow importing JSON files
  experimental: {},
  // Suppress React hydration warnings from Leaflet
  reactStrictMode: false,
};

export default nextConfig;
