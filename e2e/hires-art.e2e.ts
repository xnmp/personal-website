import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import postcss from "postcss";
import { expect, test, type Browser, type Page, type Request } from "@playwright/test";
import { STYLES } from "../src/lib/styles";
import { ART_MAX_DIFFERENCE, compareArtwork, resampleArtwork } from "./hires-art-helpers";

function inventory() {
  // Use the generator's manifest/lock/provenance/group policy, including its
  // repaired CSS, so deleting a twin cannot shrink our coverage obligation.
  // The generator mixes ESM and Next's compiled CJS parser. Load it with
  // native Node; Playwright's transform cannot import that combination.
  const { files, media } = JSON.parse(execFileSync("node", ["--input-type=module", "--eval", `
    import { checkRepo, HIRES_MEDIA } from './scripts/hires/css.mjs';
    const results = await checkRepo();
    console.log(JSON.stringify({ files: results.map(({ path, css }) => ({ path, css })), media: HIRES_MEDIA }));
  `], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 })) as {
    files: { path: string; css: string }[]; media: string;
  };
  const manifest = JSON.parse(readFileSync("art/hires.json", "utf8")) as { assets: { src: string }[] };
  const siblings = new Map(manifest.assets.map(({ src }) => [src.replace(/\.[^.]+$/, "@2x.webp").slice("public".length), src]));
  const twins = new Map<string, string>();
  for (const { css } of files) {
    postcss.parse(css).walkAtRules("media", (rule) => {
      if (rule.params !== media) return;
      rule.walkDecls((decl) => {
        for (const match of decl.value.matchAll(/url\(\s*["']?(\/kit\/[^\s"')]+@2x\.webp)(?:#[^\s"')]*)?["']?\s*\)/g)) {
          twins.set(match[1], siblings.get(match[1])!);
        }
      });
    });
  }
  return twins;
}

// URL-level exceptions only; never waive all assets for a kit/property.
// The sole twinned --k-scene-flat (ligne/hero-night) is also
// painted by --k-hero on .launchpad::before (styles/ligne.css). The other
// consumers are .og-stage (globals.css) and .tier-cut (kit.css); neither adds
// an OG-only URL to today's twin inventory. No /og route is needed for coverage.
// Cyanotype assigns wide-b flat to odd page sheets at >=900px, but the
// launch page's .sheet-flat sections are children 4 and 6, and the flattened
// .sheet-row child is always second: all paint wide-c flat instead. Other
// routes have no .sheet-flat sections. Cyanotype enables neither --tier-cut
// nor --shot-cut; those decorations stay hidden at every viewport. Below
// 900px page sheets use the non-wide variants. No real state paints wide-b flat.
// Non-wide c-flat is also unreachable: it belongs to siblings 4n+3, but
// flattened shelf cards are even, launch .sheet-flat sections are 4 and 6,
// and the flat .sheet-row colophon is second (d/b/b below 900px, respectively).
// The flat gallery shot is the first child of its own .shot-tier, so uses a.
// At >=900px page sheets switch to wide art; the hidden tier/shot cuts add
// no consumer. A narrower capture cannot expose c-flat on any current route.
const unrenderedTwins: Readonly<Record<string, string>> = {
  "/kit/ligne/sheet-day-normal@2x.webp": "Ligne prints every resting panel flat (--k-plate-flat, styles/ligne.css) and its strips repoint --k-plate at --k-strip; the normal sheet is only the state family's reference.",
  "/kit/ligne/sheet-night-normal@2x.webp": "Ligne prints every resting panel flat (--k-plate-flat, styles/ligne.css) and its strips repoint --k-plate at --k-strip; the normal sheet is only the state family's reference.",
  "/kit/cyanotype/sheet-night-w-b-flat@2x.webp": "Odd wide page sheets never use flat art; flat sections are even siblings, and Cyanotype's tier/shot cuts are hidden.",
  "/kit/cyanotype/sheet-day-w-b-flat@2x.webp": "Odd wide page sheets never use flat art; flat sections are even siblings, and Cyanotype's tier/shot cuts are hidden.",
  "/kit/cyanotype/sheet-night-c-flat@2x.webp": "No flat consumer is sibling 4n+3: shelves are even, launch flat sections are 4/6, the colophon is second, and the gallery shot is first; tier/shot cuts are hidden.",
  "/kit/cyanotype/sheet-day-c-flat@2x.webp": "No flat consumer is sibling 4n+3: shelves are even, launch flat sections are 4/6, the colophon is second, and the gallery shot is first; tier/shot cuts are hidden.",
};

const desktop = { width: 1440, height: 900 };
function casesFor(kit: string) {
  const cases = [{ path: "/", viewport: kit === "paper" ? { width: 1440, height: 810 } : desktop }];
  // Separate project/launch scene overrides; no unique twins on /about.
  if (["paper", "solarpunk", "cyanotype"].includes(kit)) {
    cases.push(...["/p/ashen-cathedral", "/p/tauri-explorer"].map((path) => ({ path, viewport: desktop })));
  }
  // Garden's launch gallery adds normal and flat sheet borders at other sizes;
  // the launch page's kickers, inline code and keycaps carry Atlas's tape and
  // chip and Sumi's chip, which the home page never renders.
  if (["garden", "atlas", "sumi"].includes(kit)) cases.push({ path: "/p/tauri-explorer", viewport: desktop });
  if (["paper", "solarpunk", "ligne"].includes(kit)) {
    cases.push({ path: "/", viewport: { width: 390, height: 900 } });
  }
  // Paper's 16:9 home viewport also renders the aspect-gated pine/peak tips.
  return cases;
}

const themes = ["paper", "cosmic-dusk"] as const;
// A serial suite owns at most one context; run with --project=desktop --workers=1.
test.describe.configure({ mode: "serial", timeout: 90_000 });

function watchImages(page: Page, seen: Set<string>) {
  const pending = new Set<Request>();
  let lastActivity = Date.now();
  page.on("request", (request) => {
    if (request.resourceType() !== "image") return;
    pending.add(request);
    lastActivity = Date.now();
    const url = new URL(request.url()).pathname;
    if (url.endsWith("@2x.webp")) seen.add(url);
  });
  const finished = (request: Request) => {
    if (pending.delete(request)) lastActivity = Date.now();
  };
  page.on("requestfinished", finished);
  page.on("requestfailed", finished);

  return async () => {
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    // Track actual image traffic, including CSS backgrounds, without decoding
    // a second copy of every texture. Unrelated network activity is ignored.
    while (pending.size || Date.now() - lastActivity < 300) {
      await page.waitForTimeout(50);
    }
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
  };
}

let twins: Map<string, string>;
const seenInA = new Set<string>();
// Share in-flight work too: concurrent requests for a URL get identical bytes.
const replacements = new Map<string, Promise<Buffer>>();
function replacementFor(url: string) {
  const sibling = twins.get(url);
  if (!sibling) throw new Error(`Uninventoried @2x request: ${url}`);
  let replacement = replacements.get(url);
  if (!replacement) {
    replacement = Promise.all([readFile(sibling), readFile(`public${url}`)])
      .then(([one, two]) => resampleArtwork(one, two));
    replacements.set(url, replacement);
  }
  return replacement;
}
test.beforeAll(() => { twins = inventory(); });

type ArtCase = ReturnType<typeof casesFor>[number];
type Capture = { state: string; png: Buffer };
async function capture(
  browser: Browser, baseURL: string | undefined, id: string, rice: string,
  { path, viewport }: ArtCase, replaceTwins: boolean,
) {
  const context = await browser.newContext({
    baseURL, viewport, deviceScaleFactor: 2, isMobile: false,
    colorScheme: "dark", reducedMotion: "reduce", serviceWorkers: "block",
  });
  try {
    await context.addInitScript(({ style, rice }) => {
      localStorage.setItem("nb-style", style);
      localStorage.setItem("nb-rice", rice);
      localStorage.setItem("nb-scene", "flat");
    }, { style: id, rice });
    if (replaceTwins) {
      // Context routing disables the HTTP cache. Preserve @2x dimensions even
      // for image-set(... 2x), whose density changes the natural image size.
      await context.route("**/*@2x.webp", async (route) => {
        const url = new URL(route.request().url()).pathname;
        await route.fulfill({ contentType: "image/webp", body: await replacementFor(url) });
      });
    }
    const page = await context.newPage();
    const settle = watchImages(page, replaceTwins ? new Set() : seenInA);
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.addStyleTag({ content: `
      *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
      nextjs-portal { display: none !important; }
    ` });
    // Keep launch demos on their static poster while scrolling past them.
    await page.locator(".live-demo").evaluateAll((demos) => {
      for (const demo of demos) (demo as HTMLElement).focus({ preventScroll: true });
    });
    await settle();
    // Visit overlapping viewports to load offscreen artwork, then take one
    // full-page capture. Close A before opening B, retaining only PNG bytes.
    const bottom = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight));
    for (let y = 0; y < bottom; y += Math.round(viewport.height * 0.8)) {
      await page.evaluate((y) => scrollTo(0, y), y);
      await settle();
    }
    await page.evaluate((y) => scrollTo(0, y), bottom);
    await settle();
    await page.evaluate(() => scrollTo(0, 0));
    await settle();
    const captures: Capture[] = [];
    const snapshot = async (state: string, fullPage = false) => {
      await settle();
      captures.push({ state, png: await page.screenshot({ type: "png", fullPage, scale: "css", animations: "disabled", caret: "hide" }) });
    };
    await snapshot("normal", true);
    // One representative per key family on both home and launch pages. Scope
    // to their key groups: the launch signal is named "Join the alpha", unlike
    // the home link's longer accessible name. Absent controls are optional on
    // detail pages, but known home/launch coverage must not silently disappear.
    const keys = page.locator(".launchpad-keys, .launch-keys");
    const sheets = page.locator("a.module.faceplate.is-live");
    const controls = [
      { name: "key", control: keys.locator('a.key:not([data-tone="signal"])').first(), required: path === "/" || path === "/p/tauri-explorer" },
      { name: "signal", control: keys.locator('a.key[data-tone="signal"]').first(), required: path === "/" || path === "/p/tauri-explorer" },
      ...(id === "cyanotype"
        ? ["4n + 1", "4n + 2", "4n + 3", "4n"].map((nth, index) => ({
          name: `sheet-${"abcd"[index]}`,
          // Match actual sibling positions, not the index among live cards.
          control: sheets.and(page.locator(`:nth-child(${nth})`)).first(),
          required: path === "/",
        }))
        : [{ name: "sheet", control: sheets.first(), required: path === "/" }]),
      ...(id === "cyanotype" && path === "/"
        ? ["4n + 1", "4n + 2", "4n + 3", "4n"].map((nth, index) => ({
          name: `card-${"abcd"[index]}`,
          // Showcase card art follows the wrapping li, unlike module plates.
          control: page.locator(`.showcase-row > li:nth-child(${nth}) a.card.faceplate.is-live`).first(),
          required: true,
        }))
        : []),
    ];
    for (const { name, control, required } of controls) {
      if (required) await expect(control, `${id} ${path}: required ${name} coverage`).toHaveCount(1);
      if (await control.count() === 0) continue;
      await control.hover();
      await expect(control).toBeVisible();
      expect(await control.evaluate((element) => element.matches(":hover"))).toBe(true);
      await snapshot(`${name}-hover`);
      await page.mouse.down();
      try {
        expect(await control.evaluate((element) => element.matches(":active"))).toBe(true);
        await snapshot(`${name}-pressed`);
      } finally {
        // Release away from the link so the real press never navigates.
        await page.mouse.move(0, 0);
        await page.mouse.up();
      }
      // Keyboard modality makes focus-visible select the focus-state twin.
      await page.keyboard.press("Tab");
      await control.focus();
      expect(await control.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
      await snapshot(`${name}-focus`);
      await control.evaluate((element) => (element as HTMLElement).blur());
    }
    return captures;
  } finally {
    // Closing the context also closes its page, including on capture failure.
    await context.close();
  }
}

for (const { id } of STYLES) {
  for (const rice of themes) {
    for (const artCase of casesFor(id)) {
      const { path, viewport } = artCase;
      test(`${id}: ${rice} ${path} ${viewport.width}x${viewport.height} @2x geometry`, async ({ browser, baseURL, isMobile }, testInfo) => {
        test.skip(isMobile, "owns a DPR 2 context, including narrow viewports");
        const normal = await capture(browser, baseURL, id, rice, artCase, false);
        const replacement = await capture(browser, baseURL, id, rice, artCase, true);
        expect(replacement.map(({ state }) => state)).toEqual(normal.map(({ state }) => state));
        for (const [index, { state, png }] of normal.entries()) {
          const result = await compareArtwork(png, replacement[index].png);
          if (!result.passes) {
            await testInfo.attach(`${state}-A`, { body: png, contentType: "image/png" });
            await testInfo.attach(`${state}-B`, { body: replacement[index].png, contentType: "image/png" });
            await testInfo.attach(`${state}-diff-4x`, { body: result.diff, contentType: "image/png" });
          }
          expect.soft(result.maxDifference, `${state}: blurred max RGB difference (0–255)`).toBeLessThanOrEqual(ART_MAX_DIFFERENCE);
        }
      });
    }
  }
}

test("A captures request every CSS @2x twin", async ({ isMobile }) => {
  test.skip(isMobile, "coverage comes from the desktop comparison matrix");
  expect([...twins.keys()].filter((url) => !seenInA.has(url) && !unrenderedTwins[url]),
    "Unrequested twins: add a real page/viewport or a URL-level exception with a reason").toEqual([]);
});
