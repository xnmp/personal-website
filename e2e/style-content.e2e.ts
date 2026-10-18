import { expect, test } from "@playwright/test";
import { STYLES } from "../src/lib/styles";
import { readProjectCatalog } from "../src/data/projects";
import { interceptSaves, openField } from "./studio-fixture";

test.use({ channel: "chrome", launchOptions: { args: ["--disable-dev-shm-usage", "--disable-gpu", "--renderer-process-limit=2"] } });
test.skip(!process.env.STUDIO_E2E, "Run against the local editor with one worker");

test("changing art direction preserves authored groups, live edits and navigation", async ({ page }) => {
  const saves = await interceptSaves(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("nb-style", "margin"));
  // This is a content/interaction contract; avoid decoding eight raster kits.
  await page.route("**/*", route => route.request().resourceType() === "image" ? route.abort() : route.fallback());
  await page.goto("/projects");
  const toggle = page.getByRole("button", { name: "Editing off", exact: true });
  await expect(toggle).toBeEnabled(); await toggle.click();
  const marker = "My current directory copy, shared by every style.";
  const input = await openField(page, "margin intro");
  await input.fill(marker); await input.press("Tab");
  const brand = await openField(page, "brand");
  await brand.fill("My edited garden"); await brand.press("Tab");
  const directory = page.locator(".project-directory");
  const expectedText = await directory.textContent();
  for (const style of STYLES) {
    const trigger = page.getByRole("button", { name: /^Art direction/ });
    await trigger.click();
    await page.getByRole("menuitemradio", { name: style.name, exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-style", style.id);
    await expect(directory.getByText(marker, { exact: true })).toBeVisible();
    await expect(page.locator("header .brand")).toContainText("My edited garden");
    // These two styles formerly painted fixed words over the editable brand.
    if (["sumi", "ligne"].includes(style.id)) expect(await page.locator("header .brand [data-studio-link]").evaluate(e => getComputedStyle(e).color)).not.toBe("rgba(0, 0, 0, 0)");
    expect(await directory.textContent()).toBe(expectedText);
    for (const group of readProjectCatalog().groups) {
      const section = directory.locator(`[id="${group.id}"]`);
      await expect(section.getByRole("heading", { level: 2 })).toContainText(group.heading);
      await expect(section.locator(".margin-project")).toHaveCount(group.projects.length);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  await page.getByRole("button", { name: "Editing on", exact: true }).click();
  await page.getByRole("link", { name: "About me", exact: true }).click();
  await expect(page.locator(".about-contents")).toBeVisible();
  await expect(page.getByRole("link", { name: /about\.md/ })).toBeVisible();
  const groupId = readProjectCatalog().groups[0].id;
  await page.locator(`.about-page h2 a[href="/projects#${groupId}"]`).click();
  await expect(page).toHaveURL(new RegExp(`/projects#${groupId}$`));
  await expect(page.locator(`.project-directory #${groupId}`)).toBeInViewport();
  await expect(page.getByRole("link", { name: "projects", exact: true })).toBeVisible();
  expect(saves.requests).toHaveLength(0);
});
