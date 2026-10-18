import { expect, test } from "@playwright/test";

test.use({ channel: "chrome", launchOptions: { args: ["--disable-dev-shm-usage", "--disable-gpu", "--renderer-process-limit=2"] } });

test("About is the landing page, with a navigable project directory and working return links", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".about-page")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hi, I’m Chong");
  await expect(page.locator(".margin-index")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "About me", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/chong\.md\/?$/);
  await page.getByRole("link", { name: "projects", exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator(".margin-index")).toBeVisible();
  await expect(page.getByRole("link", { name: "projects", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "About me", exact: true })).not.toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Scrivo", exact: true }).click();
  await expect(page).toHaveURL(/\/p\/scrivo$/);
  await page.getByRole("link", { name: "← all projects", exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await page.locator('.masthead-brand .brand a[href="/"]').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".about-page")).toBeVisible();
  await page.goto("/about");
  await expect(page.locator(".about-page")).toBeVisible();
  await expect(page.getByRole("link", { name: "About me", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/chong\.md\/?$/);
  await page.getByRole("link", { name: "← all projects", exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
});

test("Tauri Explorer's project page links to its main website", async ({ page }) => {
  await page.goto("/p/tauri-explorer");
  const website = page.getByRole("link", { name: "Website ↗", exact: true });
  await expect(website).toBeVisible();
  await expect(website).toHaveAttribute("href", "https://tauri-explorer.vercel.app");
  await expect(page.getByRole("link", { name: "GitHub ↗", exact: true })).toHaveAttribute("href", "https://github.com/xnmp/tauri-explorer");
  // Observe the actual navigation destination without loading the external app in this suite.
  await page.route("https://tauri-explorer.vercel.app/", route => route.fulfill({ contentType: "text/html", body: "<h1>Tauri Explorer website</h1>" }));
  await website.click();
  await expect(page).toHaveURL("https://tauri-explorer.vercel.app/");
  await expect(page.getByRole("heading", { name: "Tauri Explorer website" })).toBeVisible();
});
