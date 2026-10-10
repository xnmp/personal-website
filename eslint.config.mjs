import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // isolated dev servers' build dirs (NEXT_DIST_DIR, next.config.ts)
    ".next-*/**",
    // generation scratch beside the raw art (gitignored)
    "art/raw/**",
    "art/raw/**/.*/**", // the passes' capture dirs (.pass): ** skips dot-dirs
  ]),
]);

export default eslintConfig;
