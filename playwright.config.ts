import { defineConfig, devices } from "@playwright/test";

// E2E specs are *.e2e.ts so `bun test` (unit) never picks them up.
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  use: { baseURL: "http://localhost:3000", colorScheme: "dark" },
  webServer: { command: "bun run dev", url: "http://localhost:3000", reuseExistingServer: true },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
