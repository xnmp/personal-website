import { expect, test, type Page } from "@playwright/test";
import { RICES, riceLabel, riceMode } from "../src/lib/rice";
import { APP_THEME } from "../src/components/launch/appTheme";

const trigger = (page: Page) => page.getByRole("button", { name: /^Theme:/ });
const chooser = (page: Page) => page.getByRole("menu", { name: "Colour theme" });

test("opening the theme menu keeps the current palette until a choice is made", async ({ page }) => {
  await page.goto("/");
  const before = await page.locator("html").getAttribute("data-rice");
  await trigger(page).click();
  await expect(chooser(page)).toBeVisible();
  await expect(chooser(page).getByRole("menuitemradio")).toHaveCount(RICES.length);
  await expect(page.locator("html")).toHaveAttribute("data-rice", before!);
  const next = before === "paper" ? "horizon" : "paper";
  await chooser(page).getByRole("menuitemradio", { name: next, exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-rice", next);
  await expect(page.locator("html")).toHaveAttribute("data-style", "margin");
  await expect(chooser(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-rice", next);
});

test("the theme menu supports keyboard selection and cancellation", async ({ page, isMobile }) => {
  test.skip(isMobile, "physical keyboard");
  await page.goto("/");
  await expect(trigger(page)).toBeVisible();
  const before = await page.locator("html").getAttribute("data-rice");
  await trigger(page).focus();
  await page.keyboard.press("Enter");
  await expect(chooser(page).getByRole("menuitemradio", { checked: true })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(chooser(page).getByRole("menuitemradio", { name: "paper", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger(page)).toBeFocused();
  await expect(page.locator("html")).toHaveAttribute("data-rice", before!);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-rice", RICES.at(-1)!);
  await expect(trigger(page)).toBeFocused();
});

for (const rice of ["ayu-mirage", "catppuccin-latte", "gruvbox"] as const) {
  test(`${rice} is selectable, persists and displays the matching real product images`, async ({ page }) => {
    await page.goto("/p/tauri-explorer");
    await trigger(page).click();
    await chooser(page).getByRole("menuitemradio", { name: riceLabel(rice), exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-rice", rice);
    await expect(page.locator("html")).toHaveAttribute("data-rice-mode", riceMode(rice));
    const images = page.locator("[data-rice-shot] img:visible");
    await expect(images).toHaveCount(4);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
      expect(await image.evaluate((el: HTMLImageElement) => el.currentSrc)).toContain(`-${APP_THEME[rice]}.webp`);
    }
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-rice", rice);
    await expect(page.locator("html")).toHaveAttribute("data-rice-mode", riceMode(rice));
    await expect(trigger(page)).toHaveAccessibleName(`Theme: ${riceLabel(rice)}. Choose theme`);
    await page.goto("/about");
    const contrasts = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d")!;
      const luminance = (colour: string) => {
        context.fillStyle = colour;
        context.fillRect(0, 0, 1, 1);
        const rgb = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3)
          .map(c => c / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
        return rgb.reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
      };
      const bg = luminance(getComputedStyle(document.querySelector(".about-page")!).backgroundColor);
      return [".about-file-head > span", ".detail-hero p", ".about-contents a"].map(selector => {
        const fg = luminance(getComputedStyle(document.querySelector(selector)!).color);
        return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
      });
    });
    for (const contrast of contrasts) expect(contrast).toBeGreaterThanOrEqual(4.5);
  });
}

test("theme and style menus fit short viewports and close on resize", async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 900, height: 390 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/about");
    await trigger(page).click();
    const bounds = (await chooser(page).boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
    await page.setViewportSize({ ...viewport, width: viewport.width + 1 });
    await expect(chooser(page)).toBeHidden();
  }
});

test("page shortcuts wait while a menu is open and t still cycles outside it", async ({ page, isMobile }) => {
  test.skip(isMobile, "physical keyboard");
  await page.goto("/");
  await trigger(page).click();
  const before = await page.locator("html").getAttribute("data-rice");
  await page.keyboard.press("t");
  await page.keyboard.press("j");
  await expect(page.locator("html")).toHaveAttribute("data-rice", before!);
  await expect(chooser(page).getByRole("menuitemradio", { checked: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await page.keyboard.press("t");
  await expect(page.locator("html")).not.toHaveAttribute("data-rice", before!);
});
