import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // a second dev server (another port) needs its own build dir: NEXT_DIST_DIR=.next-<name>
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
