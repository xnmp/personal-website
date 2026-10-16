import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import postcss from "postcss";
import { expect, test, type Browser, type Page, type Request } from "@playwright/test";
import { STYLES } from "../src/lib/styles";
import { ART_MAX_DIFFERENCE, compareArtwork } from "./hires-art-helpers";

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
// Currently empty: the sole twinned --k-scene-flat (ligne/hero-night) is also
// painted by --k-hero on .launchpad::before (styles/ligne.css). The other
// consumers are .og-stage (globals.css) and .tier-cut (kit.css); neither adds
// an OG-only URL to today's twin inventory. No /og route is needed for coverage.
const unrenderedTwins: Readonly<Record<string, string>> = {};

const desktop = { width: 1440, height: 900 };
function casesFor(kit: string) {
  const cases = [{ path: "/", viewport: kit === "paper" ? { width: 1440, height: 810 } : desktop }];
  // Separate project/launch scene overrides; no unique twins on /about.
  if (["paper", "solarpunk", "cyanotype"].includes(kit)) {
    cases.push(...["/p/ashen-cathedral", "/p/tauri-explorer"].map((path) => ({ path, viewport: desktop })));
  }
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
test.beforeAll(() => { twins = inventory(); });

type ArtCase = ReturnType<typeof casesFor>[number];
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
      // Context routing disables the HTTP cache. B always receives 1x bytes.
      await context.route("**/*@2x.webp", async (route) => {
        const sibling = twins.get(new URL(route.request().url()).pathname);
        if (!sibling) throw new Error(`Uninventoried @2x request: ${route.request().url()}`);
        await route.fulfill({ contentType: "image/webp", body: await readFile(sibling) });
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
    return await page.screenshot({ type: "png", fullPage: true, scale: "css", animations: "disabled", caret: "hide" });
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
        const result = await compareArtwork(normal, replacement);
        if (!result.passes) {
          await testInfo.attach("A", { body: normal, contentType: "image/png" });
          await testInfo.attach("B", { body: replacement, contentType: "image/png" });
          await testInfo.attach("diff-4x", { body: result.diff, contentType: "image/png" });
        }
        expect.soft(result.maxDifference, "blurred max RGB difference (0–255)").toBeLessThanOrEqual(ART_MAX_DIFFERENCE);
      });
    }
  }
}

test("A captures request every CSS @2x twin", async ({ isMobile }) => {
  test.skip(isMobile, "coverage comes from the desktop comparison matrix");
  expect([...twins.keys()].filter((url) => !seenInA.has(url) && !unrenderedTwins[url]),
    "Unrequested twins: add a real page/viewport or a URL-level exception with a reason").toEqual([]);
});
