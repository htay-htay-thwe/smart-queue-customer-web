import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: process.cwd() },
  // CI runs `tsc --noEmit` explicitly. This avoids a Next 16.4 showConfig
  // parser issue after the independent type check has already passed.
  typescript: { ignoreBuildErrors: true },
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};

export default nextConfig;
