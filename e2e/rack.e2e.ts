import { expect, test } from "@playwright/test";
import { projects } from "../src/data/projects";
import { STYLES } from "../src/lib/styles";
import type { Page } from "@playwright/test";

/** The rice key prints the live theme name only once React has hydrated. */
async function hydrated(page: Page) {
  await expect(page.locator(".rice-name")).not.toHaveText(/^(rice)?$/);
}

test("every project is mounted on the home rack and opens its page", async ({ page }) => {
  await page.goto("/");
  for (const p of projects) {
    await expect(page.locator(`a[href="${p.href}"]`).first()).toBeVisible();
  }
  await page.getByRole("link", { name: "Scrivo", exact: true }).click();
  await expect(page).toHaveURL(/\/p\/scrivo$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("every detail page renders without a server error", async ({ request }) => {
  for (const p of projects) {
    const res = await request.get(p.href);
    expect(res.status(), p.href).toBe(200);
  }
});

test("j moves focus into the rack and Enter opens the focused module", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard navigation is a desktop affordance");
  await page.goto("/");
  await hydrated(page);
  await page.keyboard.press("j");
  await page.keyboard.press("j");
  const href = await page.evaluate(() => (document.activeElement as HTMLAnchorElement).getAttribute("href"));
  expect(href).toMatch(/^\/p\//);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});

test("/ opens the index, filtering narrows it, Enter navigates", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard shortcut");
  await page.goto("/");
  await hydrated(page);
  await page.keyboard.press("/");
  const input = page.getByRole("combobox", { name: "Search projects" });
  await expect(input).toBeFocused();
  await input.fill("starcraft");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/p\/bwai$/);
});

test("the index ranks names first and tells assistive tech which result is selected", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard shortcut");
  await page.goto("/");
  await hydrated(page);
  await page.keyboard.press("/");
  const input = page.getByRole("combobox", { name: "Search projects" });
  await input.fill("esk");
  const first = page.getByRole("option").first();
  await expect(first).toContainText("Eskiv");
  await expect(input).toHaveAttribute("aria-activedescendant", (await first.getAttribute("id"))!);
  await page.keyboard.press("ArrowDown");
  const second = page.getByRole("option").nth(1);
  await expect(input).toHaveAttribute("aria-activedescendant", (await second.getAttribute("id"))!);
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/p\/eskiv$/);
});

test("the rice key reflashes the screens and remembers the choice", async ({ page }) => {
  await page.goto("/");
  await hydrated(page);
  const before = await page.evaluate(() => document.documentElement.dataset.rice);
  const screenBg = () =>
    page.locator(".screen-face").first().evaluate((el) => getComputedStyle(el).backgroundColor);
  const bgBefore = await screenBg();
  await page.getByRole("button", { name: /Switch theme/ }).click();
  const after = await page.evaluate(() => document.documentElement.dataset.rice);
  expect(after).not.toBe(before);
  const label = after!.replace(/-/g, " "); // "cosmic-dusk" reads "cosmic dusk"
  await expect(page.getByRole("button", { name: /Switch theme/ })).toContainText(label);
  await expect(page.locator("[data-theme-status]")).toHaveText(`Theme: ${label}`);
  expect(await screenBg()).not.toBe(bgBefore);
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.rice)).toBe(after);
});

test("closing the index hands focus back to where it was", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard only");
  await page.goto("/");
  await expect(page.locator(".rice-name")).not.toHaveText(/^(rice)?$/);
  await page.keyboard.press("j");
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("href"));
  expect(focused).toBeTruthy();
  await page.keyboard.press("/");
  await expect(page.getByRole("combobox", { name: "Search projects" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute("href"))).toBe(focused);
});

test("Tab and Shift+Tab never reach the page behind the open index", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard only");
  await page.goto("/");
  await hydrated(page);
  await page.keyboard.press("/");
  const index = page.getByRole("dialog", { name: "Index of projects" });
  await expect(index).toBeVisible();
  // focus may pass through the browser's own UI (reported as <body>), never the page
  const outsideIndex = () =>
    page.evaluate(() => {
      const el = document.activeElement;
      return Boolean(el && el !== document.body && !el.closest("dialog[open]"));
    });
  for (const key of ["Tab", "Tab", "Tab", "Tab", "Shift+Tab", "Shift+Tab", "Shift+Tab", "Shift+Tab"]) {
    await page.keyboard.press(key);
    expect(await outsideIndex(), key).toBe(false);
  }
  await page.keyboard.press("Escape");
  await expect(index).toBeHidden();
});

// Next 16.2's SWC drops the space after an inline element when the text that
// follows spans lines and contains an HTML entity (`</em> gave …&rsquo;…` comes
// out as `</em>gave`). Fixed upstream in 16.4; until then, catch it in the HTML.
test("no word is glued to the end of an inline element", async ({ request }) => {
  const routes = ["/", "/about", ...projects.map((p) => p.href), "/p/zheng-shang-you/play", "/tableau-frog"];
  for (const route of routes) {
    const html = await (await request.get(route)).text();
    const body = html.slice(html.indexOf("<body"));
    const glued = body.match(/<\/(em|strong|b|i|code|a)>[A-Za-z]{2,}/g) ?? [];
    expect(glued, route).toEqual([]);
  }
});

// JSX drops a line break next to an element, so prose broken across lines
// around an element loses its space (`…</span>` then `so a file` renders
// `,so a file`; `crates` then `<span>(` renders `crates(`). Checked in the
// rendered prose, with code standing in as a word.
test("prose keeps its spaces around inline elements", async ({ page }) => {
  const routes = ["/", "/about", ...projects.map((p) => p.href)];
  for (const route of routes) {
    await page.goto(route);
    const glued = await page.evaluate(() => {
      const body = document.body.cloneNode(true) as HTMLElement;
      body.querySelectorAll("script, style, svg, pre, code, kbd").forEach((e) => e.replaceWith("X"));
      return [...body.querySelectorAll("p, li, dd, figcaption, h1, h2, h3")]
        .flatMap((e) => (e.textContent ?? "").match(/[a-z]\(|[,;](?=[A-Za-z])/g) ?? []);
    });
    expect(glued, route).toEqual([]);
  }
});

// in every style: each dresses the masthead's strip and keys in its own art,
// with its own insets and its own wordmark face
for (const style of STYLES) {
  test(`on a narrow phone the masthead keeps the brand and its keys on one row (${style.id})`, async ({ page }) => {
    await page.addInitScript((s) => localStorage.setItem("nb-style", s), style.id);
    for (const width of [320, 360]) {
      await page.setViewportSize({ width, height: 700 });
      for (const route of ["/", "/p/tauri-explorer"]) {
        await page.goto(route);
        await page.evaluate(() => document.fonts.ready);
        const brand = await page.locator(":is(.running-head, .masthead) .brand").boundingBox();
        for (const key of await page.locator(":is(.running-head, .masthead) .instruments > .key").all()) {
          const k = (await key.boundingBox())!;
          // the key's box spans the brand's middle: the same row
          expect(k.y, `${route} at ${width}`).toBeLessThan(brand!.y + brand!.height / 2);
          expect(k.y + k.height, `${route} at ${width}`).toBeGreaterThan(brand!.y + brand!.height / 2);
        }
      }
    }
  });
}

test("nothing scrolls sideways at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const route of ["/", "/p/tauri-explorer", "/p/eskiv", "/p/zheng-shang-you"]) {
    await page.goto(route);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width, route).toBeLessThanOrEqual(320);
  }
});

test.describe("the Eskiv heatmap's timeline", () => {
  const heatmap = (page: import("@playwright/test").Page) =>
    page.getByRole("img", { name: "Player position density by score" });
  const bucket = async (page: import("@playwright/test").Page) =>
    ((await heatmap(page).textContent()) ?? "").match(/score \d+[-–]\d+/)?.[0];

  test("plays once it is on screen", async ({ page }) => {
    await page.goto("/p/eskiv");
    await heatmap(page).scrollIntoViewIfNeeded();
    const first = await bucket(page);
    expect(first).toBeTruthy();
    await expect.poll(() => bucket(page), { timeout: 6000 }).not.toBe(first);
  });

  test("holds still under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/p/eskiv");
    await heatmap(page).scrollIntoViewIfNeeded();
    const first = await bucket(page);
    expect(first).toBeTruthy();
    await page.waitForTimeout(3500); // over two of its 1.4s steps
    expect(await bucket(page)).toBe(first);
  });
});

test("the about page is linked from home and prints its facts", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "More about me" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Chong");
  const facts = page.getByRole("region", { name: "Facts" });
  await expect(facts).toContainText("Sydney");
  await expect(facts.getByRole("link", { name: "github/xnmp" })).toHaveAttribute("href", "https://github.com/xnmp");
  // the way back is a tile on the masthead
  await page.getByRole("link", { name: "← all projects" }).click();
  await expect(page).toHaveURL(/\/$/);
});
