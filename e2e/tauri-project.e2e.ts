import { expect, test } from "@playwright/test";
import { appThemeFor } from "../src/components/launch/appTheme";

test.use({ channel: "chrome", launchOptions: { args: ["--disable-dev-shm-usage", "--disable-gpu", "--renderer-process-limit=2"] } });

test("a screenshot opens at full size, contains page shortcuts and returns focus on close", async ({ page, isMobile }) => {
  await page.goto("/p/tauri-explorer");
  const shot = page.getByRole("link", { name: "Content search: full window" });
  await shot.click();
  const viewer = page.getByRole("dialog", { name: "Content search, full window" });
  await expect(viewer).toBeVisible();
  const rice = await page.locator("html").getAttribute("data-rice");
  await expect(viewer.locator("img")).toHaveAttribute("src", `/tauri/live-content-search-${appThemeFor(rice)}.webp`);
  if (!isMobile) {
    for (const key of ["t", "/", "Control+k"]) await page.keyboard.press(key);
    await expect(page.locator("dialog[open]")).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("data-rice", rice!);
  }
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  await expect(shot).toBeFocused();
});
