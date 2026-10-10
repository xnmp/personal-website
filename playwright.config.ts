import { defineConfig, devices } from "@playwright/test";

// E2E specs are *.e2e.ts so `bun test` (unit) never picks them up.
// E2E_BASE_URL runs them against another dev server (one started on its own port).
const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  use: { baseURL, colorScheme: "dark" },
  webServer: { command: "bun run dev", url: baseURL, reuseExistingServer: true },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
