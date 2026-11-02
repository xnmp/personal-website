import { readAbout } from "../src/data/about";
import { expect, test } from "@playwright/test";

test.use({ channel: "chrome", launchOptions: { args: ["--disable-dev-shm-usage", "--disable-gpu", "--renderer-process-limit=2"] } });

test("About is the landing page, with a navigable project directory and working return links", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".about-page")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(readAbout().headline);
  await expect(page.locator(".margin-index")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "About me", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/chong\.md\/?$/);
  await page.getByRole("link", { name: "projects", exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator(".margin-index")).toBeVisible();
  await expect(page.getByRole("link", { name: "projects", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "About me", exact: true })).not.toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Ballast", exact: true }).click();
  await expect(page).toHaveURL(/\/p\/ballast$/);
  await page.getByRole("link", { name: "← all projects", exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await page.locator('.running-head .brand a[href="/"]').click();
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
  const website = page.locator("main").getByRole("link", { name: "Tauri Explorer website ↗", exact: true });
  await expect(website).toBeVisible();
  await expect(website).toHaveAttribute("href", "https://tauri-explorer.vercel.app");
  await expect(page.getByRole("link", { name: "GitHub ↗", exact: true })).toHaveAttribute("href", "https://github.com/xnmp/tauri-explorer");
  // Observe the actual navigation destination without loading the external app in this suite.
  await page.route("https://tauri-explorer.vercel.app/", route => route.fulfill({ contentType: "text/html", body: "<h1>Tauri Explorer website</h1>" }));
  await website.click();
  await expect(page).toHaveURL("https://tauri-explorer.vercel.app/");
  await expect(page.getByRole("heading", { name: "Tauri Explorer website" })).toBeVisible();
});

test("retired projects are absent from the directory and search, and their routes return 404", async ({ page, request }) => {
  await page.goto("/projects");
  await expect(page.getByRole("button", { name: /^Art direction: / })).toBeVisible();
  for (const name of ["Scrivo", "Zheng Shang You", "Intuition on the Central Limit Theorem"]) {
    await expect(page.getByRole("link", { name, exact: true })).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Open the index of projects", exact: true }).click();
  for (const name of ["Scrivo", "Zheng Shang You", "Central Limit Theorem"]) {
    await page.getByRole("combobox").fill(name);
    await expect(page.getByRole("option")).toHaveCount(0);
  }
  for (const path of ["/p/scrivo", "/p/zheng-shang-you", "/p/zheng-shang-you/play", "/p/clt-interactive", "/clt/index.html"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});
