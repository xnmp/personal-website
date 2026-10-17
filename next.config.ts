import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // a second dev server (another port) needs its own build dir: NEXT_DIST_DIR=.next-<name>
  devIndicators: process.env.CONTENT_STUDIO === "1" ? false : undefined,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
  outputFileTracingIncludes: {
    "/*": ["./content/**/*.md"],
  },
};

export default nextConfig;
