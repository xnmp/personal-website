import { expect, test, type Page } from "@playwright/test";

const trigger = (page: Page) => page.getByRole("button", { name: /^Theme:/ });
const chooser = (page: Page) => page.getByRole("menu", { name: "Colour theme" });

test("opening the theme menu keeps the current palette until a choice is made", async ({ page }) => {
  await page.goto("/");
  const before = await page.locator("html").getAttribute("data-rice");
  await trigger(page).click();
  await expect(chooser(page)).toBeVisible();
  await expect(chooser(page).getByRole("menuitemradio")).toHaveCount(4);
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
  await expect(page.locator("html")).toHaveAttribute("data-rice", "rapture");
  await expect(trigger(page)).toBeFocused();
});

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
