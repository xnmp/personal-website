import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
import { STYLES } from "../src/lib/styles";

/** Every kit bitmap the page fetched, with its status. */
function kitRequests(page: Page) {
  const seen: { url: string; status: number }[] = [];
  page.on("response", (r) => {
    const u = new URL(r.url());
    if (u.pathname.startsWith("/kit/")) seen.push({ url: u.pathname, status: r.status() });
  });
  return seen;
}

const asStyle = (page: Page, id: string) =>
  page.addInitScript((s) => {
    // only on the first load: a later choice in the test must survive reload
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("nb-style", s);
      sessionStorage.setItem("seeded", "1");
    }
  }, id);

const styleKey = (page: Page) => page.getByRole("button", { name: /^Art direction/ });
const styleMenu = (page: Page) => page.getByRole("menu", { name: "Art direction" });

test("picking a style from the masthead's menu dresses the page in its kit and survives a reload", async ({ page }) => {
  await page.goto("/");
  await styleKey(page).click();
  await expect(styleMenu(page)).toBeVisible();
  await styleMenu(page).getByRole("menuitemradio", { name: "Solarpunk" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-style", "solarpunk");
  await expect(styleMenu(page)).toBeHidden();
  // the sheets now wear the style's own art, and the key says which
  const plate = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--k-plate"));
  expect(plate).toContain("/kit/solarpunk/");
  await expect(styleKey(page)).toHaveAccessibleName("Art direction: Solarpunk");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-style", "solarpunk");
  await styleKey(page).click();
  await expect(styleMenu(page).getByRole("menuitemradio", { name: "Solarpunk" })).toHaveAttribute("aria-checked", "true");
});

test("the art-direction menu is a menu button the keyboard can drive", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard");
  await page.goto("/");
  const key = styleKey(page);
  await expect(key).toHaveAccessibleName(`Art direction: ${STYLES[0].name}`); // hydrated
  await expect(key).toHaveAttribute("aria-expanded", "false");
  // Enter opens it on the current style
  await key.focus();
  await page.keyboard.press("Enter");
  await expect(styleMenu(page)).toBeVisible();
  await expect(key).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("menuitemradio", { name: STYLES[0].name })).toBeFocused();
  // Escape closes it, back on the key, the style as it was
  await page.keyboard.press("Escape");
  await expect(styleMenu(page)).toBeHidden();
  await expect(key).toBeFocused();
  await expect(page.locator("html")).toHaveAttribute("data-style", STYLES[0].id);
  // the arrows open it too, then move; Enter chooses and closes it
  await page.keyboard.press("ArrowDown");
  await expect(styleMenu(page)).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemradio", { name: STYLES[1].name })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("menuitemradio", { name: STYLES[STYLES.length - 1].name })).toBeFocused();
  await page.keyboard.press("ArrowDown"); // wraps to the first
  await expect(page.getByRole("menuitemradio", { name: STYLES[0].name })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-style", STYLES[1].id);
  await expect(styleMenu(page)).toBeHidden();
  await expect(key).toBeFocused();
  // Tab out of an open menu closes it
  await page.keyboard.press("Enter");
  await expect(styleMenu(page)).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(styleMenu(page)).toBeHidden();
});

test("a click outside the menu closes it, choosing nothing", async ({ page }) => {
  await page.goto("/");
  await styleKey(page).click();
  await expect(styleMenu(page)).toBeVisible();
  await page.mouse.click(8, 400);
  await expect(styleMenu(page)).toBeHidden();
  await expect(page.locator("html")).toHaveAttribute("data-style", STYLES[0].id);
});

test("the menu hangs under its key, inside the screen, on a phone too", async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await styleKey(page).click();
    const k = (await styleKey(page).boundingBox())!;
    const m = (await styleMenu(page).boundingBox())!;
    expect(m.y, `${width}`).toBeGreaterThan(k.y + k.height - 1);
    expect(m.x, `${width}`).toBeGreaterThanOrEqual(0);
    expect(m.x + m.width, `${width}`).toBeLessThanOrEqual(width + 0.5);
    // every style is on it
    await expect(styleMenu(page).getByRole("menuitemradio")).toHaveCount(STYLES.length);
  }
});

test("an unknown stored style falls back to the default", async ({ page }) => {
  await asStyle(page, "retired-style");
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-style", "paper");
});

test("the style is not part of the t cycle", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard shortcut");
  await asStyle(page, "solarpunk");
  await page.goto("/");
  await expect(page.locator(".rice-name")).not.toHaveText(/^(rice)?$/);
  await page.keyboard.press("t");
  await expect(page.locator("html")).toHaveAttribute("data-style", "solarpunk");
});

for (const s of STYLES) {
  test(`${s.name}: every kit asset loads, and only this style's kit is fetched`, async ({ page }) => {
    const seen = kitRequests(page);
    await asStyle(page, s.id);
    await page.goto("/", { waitUntil: "networkidle" });
    // a tile, a mount and a status marker are on the first screen
    expect(seen.length).toBeGreaterThan(5);
    for (const r of seen) expect(r.status, r.url).toBeLessThan(400);
    // the screens' glare map is one neutral bitmap every style shares
    const foreign = seen.filter((r) => !r.url.startsWith(`/kit/${s.id}/`) && r.url !== "/kit/paper/glass-glare.webp");
    expect(foreign.map((r) => r.url)).toEqual([]);
    for (const part of ["sheet-", "tile-", "pin-"]) {
      expect(seen.some((r) => r.url.includes(`/${part}`)), part).toBe(true);
    }
  });
}

// A glass style's panes frost the scene behind them (a backdrop blur). Two
// things have each silently stopped it: a blend inside a sheet (it becomes
// its own backdrop root, so the blur samples nothing), and the entrance's
// fade left applied after it ends (the blur then dies as soon as the pane is
// repainted, as on a change of finish). So, once the entrance has played and
// the visitor has changed the finish: taking the blur away must change what a
// card and a shelf head look like, by more than two shots of the page differ.
test("a glass style's panes frost the scene behind them, after a change of finish too", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("nb-style", "solarpunk");
    localStorage.setItem("nb-scene", "flat");
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-scene", "settled");
  // the sheets' entrance has played (the scene's own layers move on with scroll)
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((a) => !(a instanceof CSSAnimation && a.animationName.startsWith("sheet-")) || a.playState === "finished"),
  );
  const rice = await page.locator("html").getAttribute("data-rice");
  await page.keyboard.press("t");
  await expect(page.locator("html")).not.toHaveAttribute("data-rice", rice!);
  for (const sel of ["a.module", ".divider"]) {
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const box = (await el.boundingBox())!;
    // a band along the sheet's foot, inside the frame, clear of its content
    const clip = { x: box.x + 40, y: box.y + box.height - 36, width: box.width - 80, height: 14 };
    // headless Chrome draws a frame only when asked for one, and the first
    // after a scroll still shows the scroll-driven scene layers where they
    // were before it: that frame is drawn and set aside, or it counts as noise
    await page.screenshot({ clip });
    const frosted = await page.screenshot({ clip });
    const again = await page.screenshot({ clip });
    const off = await page.addStyleTag({ content: `${sel}::before { backdrop-filter: none !important; }` });
    const clear = await page.screenshot({ clip });
    await off.evaluate((n) => (n as HTMLStyleElement).remove());
    // mean change per channel: a working blur moves it by a few levels; a
    // dead one by a hundredth
    const noise = await meanDiff(frosted, again);
    expect(await meanDiff(frosted, clear), sel).toBeGreaterThan(Math.max(1, 5 * noise));
  }
});

async function meanDiff(a: Buffer, b: Buffer) {
  const [x, y] = await Promise.all([sharp(a).raw().toBuffer(), sharp(b).raw().toBuffer()]);
  let d = 0;
  for (let i = 0; i < x.length; i++) d += Math.abs(x[i] - y[i]);
  return d / x.length;
}
