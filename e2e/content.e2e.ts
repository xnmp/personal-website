import { expect, test, type Locator, type Page } from "@playwright/test";
import { STYLES } from "../src/lib/styles";

// The projects are data (src/data/projects.ts): adding one, removing one or
// featuring another must never need a style redrawn. These tests change how
// many cards the page holds, in the page itself, and check that every style
// still lays them out: the home row as one row of whole cards, the shelves
// without overlap or a sideways scroll.

async function open(page: Page, style: string) {
  await page.emulateMedia({ reducedMotion: "reduce" }); // the sheets' drop would move the boxes
  await page.addInitScript((s) => localStorage.setItem("nb-style", s), style);
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  // hydrated (the rice key names the live theme only then): a list changed
  // before it would be put back by React
  await expect(page.locator(".rice-name")).not.toHaveText(/^(rice)?$/);
}

/** Make the first `list` hold `n` items: drop from its end, or add copies of its own. */
async function resize(page: Page, list: string, n: number) {
  await page.evaluate(
    ([sel, count]) => {
      const el = document.querySelector(sel as string)!;
      const items = [...el.children];
      while (el.children.length > (count as number)) el.lastElementChild!.remove();
      for (let i = 0; el.children.length < (count as number); i++) el.append(items[i % items.length].cloneNode(true));
    },
    [list, n],
  );
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

type Box = { x: number; y: number; w: number; h: number };

const boxes = (l: Locator) =>
  l.evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }),
  );

const overlap = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

for (const s of STYLES) {
  test(`${s.name}: the home row takes three or five projects as it takes four`, async ({ page, isMobile }) => {
    test.skip(isMobile, "the desktop row");
    const [width, height] = [1672, 941];
    await page.setViewportSize({ width, height });
    for (const n of [3, 5]) {
      await open(page, s.id);
      await resize(page, ".showcase-row", n);
      const cards = await boxes(page.locator(".showcase-row > li .card"));
      const titles = await boxes(page.locator(".showcase-row > li .card-title"));
      const screens = await boxes(page.locator(".showcase-row > li .card .screen"));
      const row = (await boxes(page.locator(".showcase-row")))[0];
      expect(cards, `${n} cards`).toHaveLength(n);
      const mid = cards[0].y + cards[0].h / 2;
      for (const [i, c] of cards.entries()) {
        const at = `${n} cards, card ${i + 1}`;
        // one row, in order, each card its share of it, on the first screen
        expect(c.y, at).toBeLessThan(mid);
        expect(c.y + c.h, at).toBeGreaterThan(mid);
        if (i > 0) expect(c.x, at).toBeGreaterThan(cards[i - 1].x + cards[i - 1].w - 1);
        expect(c.w, `${at} is not squeezed`).toBeGreaterThan((row.w / n) * 0.6);
        expect(c.x, at).toBeGreaterThanOrEqual(0);
        expect(c.x + c.w, at).toBeLessThanOrEqual(width);
        expect(c.y + c.h, `${at} on the first screen`).toBeLessThanOrEqual(height + 1);
        // its title and its screen inside it, the screen not collapsed
        expect(titles[i].x, at).toBeGreaterThanOrEqual(c.x - 1);
        expect(titles[i].x + titles[i].w, `${at} title`).toBeLessThanOrEqual(c.x + c.w + 1);
        expect(screens[i].w, `${at} screen`).toBeGreaterThan(c.w * 0.5);
        expect(screens[i].h, `${at} screen`).toBeGreaterThan(40);
      }
    }
  });

  test(`${s.name}: the shelves take a project more or one fewer`, async ({ page }) => {
    for (const delta of [1, -1]) {
      await open(page, s.id);
      const shelf = page.locator(".shelf").first();
      const n = await shelf.locator(":scope > *").count();
      await resize(page, ".shelf", n + delta);
      const mods = await boxes(shelf.locator(":scope > .module"));
      expect(mods, `${n + delta} modules`).toHaveLength(n + delta);
      const vw = page.viewportSize()!.width;
      for (const [i, m] of mods.entries()) {
        expect(m.x + m.w, `module ${i + 1} in the page`).toBeLessThanOrEqual(vw + 1);
        for (const o of mods.slice(i + 1)) expect(overlap(m, o), `module ${i + 1} overlaps another`).toBeLessThan(m.w * m.h * 0.02);
      }
      const sideways = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(sideways, "no sideways scroll").toBeLessThanOrEqual(0);
    }
  });
}
