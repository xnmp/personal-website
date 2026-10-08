import { expect, test, type Locator, type Page } from "@playwright/test";
import { STYLES } from "../src/lib/styles";

const FEATURED = ["Scrivo", "Ashen Cathedral", "Zheng Shang You", "Brood War"];

async function open(page: Page, style: string) {
  await page.emulateMedia({ reducedMotion: "reduce" }); // the sheets' drop would move the boxes
  await page.addInitScript((s) => localStorage.setItem("nb-style", s), style);
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
}

const box = async (l: Locator) => (await l.boundingBox())!;

// The home page's first screen is composed as every style's mock is: the
// flagship's name, pitch and keys with its window beside them, and the row of
// four projects under them, all of it on the first screen of a desktop.
for (const style of STYLES) {
  test(`a desktop's first screen holds the flagship, its window and the four projects (${style.id})`, async ({ page, isMobile }) => {
    test.skip(isMobile, "the desktop composition");
    for (const [width, height] of [
      [1672, 941],
      [1280, 720],
    ]) {
      await page.setViewportSize({ width, height });
      await open(page, style.id);
      const at = `${width}x${height}`;
      await expect(page.getByRole("heading", { level: 1 }), at).toHaveText("chong");
      const title = await box(page.getByRole("heading", { name: "Tauri Explorer" }));
      const join = await box(page.getByRole("link", { name: "Join the Tauri Explorer alpha" }));
      const live = await box(page.getByRole("link", { name: "Try it live" }));
      const win = await box(page.getByRole("link", { name: "Tauri Explorer details" }));
      // the copy stands beside the window, not over it
      for (const b of [title, join, live]) expect(b.x + b.width, at).toBeLessThanOrEqual(win.x + 1);
      const cards = [];
      for (const name of FEATURED) cards.push(await box(page.getByRole("link", { name, exact: true })));
      // one row, in order, under the flagship, and all of it on the first screen
      for (const [i, c] of cards.entries()) {
        expect(Math.abs(c.y - cards[0].y), `${at} ${FEATURED[i]} on the row`).toBeLessThan(2);
        if (i > 0) expect(c.x, at).toBeGreaterThan(cards[i - 1].x + cards[i - 1].width - 1);
        expect(c.y, at).toBeGreaterThan(Math.max(win.y + win.height, live.y + live.height));
        expect(c.y + c.height, `${at} ${FEATURED[i]} on the first screen`).toBeLessThanOrEqual(height + 1);
      }
    }
  });
}

test("the flagship's keys and window lead to its page, and each card to its project", async ({ page }) => {
  await open(page, "paper");
  await expect(page.getByRole("link", { name: "Join the Tauri Explorer alpha" })).toHaveAttribute("href", "/p/tauri-explorer#alpha");
  await expect(page.getByRole("link", { name: "Try it live" })).toHaveAttribute("href", "/p/tauri-explorer#live");
  await page.getByRole("link", { name: "Tauri Explorer details" }).click();
  await expect(page).toHaveURL(/\/p\/tauri-explorer$/);
  await page.goBack();
  await page.getByRole("link", { name: "Zheng Shang You", exact: true }).click();
  await expect(page).toHaveURL(/\/p\/zheng-shang-you$/);
});

test("on a phone the first screen stacks: the flagship, its keys, its window, then the projects two to a row", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "paper");
  const title = await box(page.getByRole("heading", { name: "Tauri Explorer" }));
  const join = await box(page.getByRole("link", { name: "Join the Tauri Explorer alpha" }));
  const win = await box(page.getByRole("link", { name: "Tauri Explorer details" }));
  const cards = [];
  for (const name of FEATURED) cards.push(await box(page.getByRole("link", { name, exact: true })));
  expect(join.y).toBeGreaterThan(title.y + title.height - 1);
  expect(win.y).toBeGreaterThan(join.y + join.height - 1);
  expect(cards[0].y).toBeGreaterThan(win.y + win.height - 1);
  expect(Math.abs(cards[1].y - cards[0].y)).toBeLessThan(2);
  expect(cards[2].y).toBeGreaterThan(cards[0].y + cards[0].height - 1);
  for (const b of [title, join, win, ...cards]) expect(b.x + b.width).toBeLessThanOrEqual(390);
});

test("the projects off the first screen are still on the home page, on their shelves", async ({ page }) => {
  await open(page, "paper");
  for (const name of ["Ballast", "Eskiv"]) {
    await expect(page.locator(".shelf").getByRole("link", { name: new RegExp(`^${name}`) })).toBeAttached();
  }
  // and none twice
  await expect(page.locator('a[href="/p/scrivo"]')).toHaveCount(1);
});
