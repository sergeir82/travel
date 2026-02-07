import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Next from “guessing” the workspace root when multiple lockfiles exist.
    root: process.cwd(),
  },
};

export default nextConfig;
