import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["100.86.123.127"],
  turbopack: { root: __dirname },
};

export default nextConfig;
