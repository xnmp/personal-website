import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CONFIGS, INNER_PAGES, THEMES, TOUCH_CONFIGS, measureCopyInk, measureLayout, openZoomPage } from "../scripts/zoom-layout.mjs";

async function copyWithEvidence(page: Page, style: string, info: TestInfo, label: string, emulateScrollAttachment = false) {
  const captures = new Map<string, Buffer>();
  let failed = true;
  try {
    const regions = await measureCopyInk(page, style, {
      emulateScrollAttachment,
      onCapture: async (name: string, data: Buffer) => { captures.set(name, data); },
    });
    failed = regions.some((r) => r.changedPixels !== 0 || (r.inkPixels ?? 0) !== 0
      || ("attachmentChangedPixels" in r && r.attachmentChangedPixels !== 0));
    return regions;
  } finally {
    if (failed) for (const [name, body] of captures) {
      await info.attach(`${label}-${name}`, { body, contentType: name.endsWith(".png") ? "image/png" : "application/json" });
    }
  }
}

// These jobs create their own audit-matched contexts, including mobile/DPR.
// Run once in the desktop project rather than repeating in the Pixel project.
test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "explicit zoom contexts"));
test.describe.configure({ timeout: 60_000 });

for (const theme of THEMES) {
  test(`zoom ${theme}: phone decorations cannot widen Garden or Solarpunk`, async ({ browser, baseURL }) => {
    for (const [style, paths] of [["garden", ["/"]], ["solarpunk", ["/", ...INNER_PAGES]]] as const) {
      for (const path of paths) {
        const job = { style, path, theme, config: "phone-z100" };
        const { context, page, config } = await openZoomPage(browser, baseURL!, job);
        try {
          const { viewport } = await measureLayout(page, job);
          // Mobile Chromium may widen innerWidth to accommodate overflow:
          // comparing only scrollWidth to innerWidth would miss the defect.
          expect(viewport.innerWidth, `${style} ${path} layout viewport`).toBe(config.viewport.width);
          expect(viewport.scrollWidth, `${style} ${path} scroll width`).toBeLessThanOrEqual(config.viewport.width);
        } finally { await context.close(); }
      }
    }
  });

  test(`zoom ${theme}: Garden monitor rests on books and its mug handle stays attached`, async ({ browser, baseURL }) => {
    for (const zoom of [50, 100, 150, 175, 200]) {
      const job = { style: "garden", path: "/", theme, config: `desktop-z${zoom}` };
      const { context, page } = await openZoomPage(browser, baseURL!, job);
      try {
        const { garden } = await measureLayout(page, job);
        expect(Math.abs(garden!.contactGap), `${zoom}% monitor/books gap`).toBeLessThanOrEqual(2);
        expect(Math.abs(garden!.mugDelta.x), `${zoom}% mug x`).toBeLessThanOrEqual(2);
        expect(Math.abs(garden!.mugDelta.y), `${zoom}% mug y`).toBeLessThanOrEqual(2);
        expect(garden!.copy.bottom, `${zoom}% copy clears cards`).toBeLessThanOrEqual(garden!.cards.y);
      } finally { await context.close(); }
    }
  });

  test(`zoom ${theme}: Atlas headline and pitch contain no constellation ink`, async ({ browser, baseURL }, info) => {
    test.setTimeout(180_000);
    for (const { id: config } of CONFIGS) {
      const job = { style: "atlas", path: "/", theme, config };
      const { context, page, config: dimensions } = await openZoomPage(browser, baseURL!, job);
      try {
        const { viewport } = await measureLayout(page, job);
        expect(viewport.scrollWidth).toBeLessThanOrEqual(dimensions.viewport.width);
        expect(viewport.innerWidth).toBe(dimensions.viewport.width);
        for (const region of await copyWithEvidence(page, "atlas", info, config, dimensions.hasTouch)) {
          expect(region.changedPixels, `${config} ${region.selector}: chart showing through copy`).toBe(0);
          expect(region.inkPixels, `${config} ${region.selector}: residual stars/strokes`).toBe(0);
          if (dimensions.hasTouch) expect(region.attachmentChangedPixels,
            `${config} ${region.selector}: iOS scroll attachment changes sky registration`).toBe(0);
        }
      } finally { await context.close(); }
    }
  });

  test(`zoom ${theme}: Atlas touch copy stays registered after scroll and in tablet orientations`, async ({ browser, baseURL }, info) => {
    test.setTimeout(180_000);
    for (const config of ["phone-z100", ...TOUCH_CONFIGS.map(({ id }) => id)]) {
      const { context, page } = await openZoomPage(browser, baseURL!, { style: "atlas", path: "/", theme, config });
      try {
        for (const y of [0, 32]) {
          await page.evaluate((y: number) => scrollTo(0, y), y);
          for (const region of await copyWithEvidence(page, "atlas", info, `${config}-scroll${y}`, true)) {
            expect(region.changedPixels, `${config} scroll${y}: exposed chart`).toBe(0);
            expect(region.inkPixels, `${config} scroll${y}: residual ink`).toBe(0);
            expect(region.attachmentChangedPixels, `${config} scroll${y}: registration`).toBe(0);
          }
        }
      } finally { await context.close(); }
    }
  });

  test(`zoom ${theme}: iOS attachment emulation rejects the round-3 phone treatment`, async ({ browser, baseURL }) => {
    const { context, page } = await openZoomPage(browser, baseURL!, {
      style: "atlas", path: "/", theme, config: "phone-z100",
    });
    try {
      // Negative control: the old smooth asset can still pass the ink scan
      // at the wrong offset. Registration must detect the iOS downgrade.
      await page.addStyleTag({ content: await readFile(resolve(__dirname, "../tests/fixtures/zoom/atlas-round3.css"), "utf8") });
      const regions = await measureCopyInk(page, "atlas", { emulateScrollAttachment: true });
      expect(regions.some((r) => r.attachmentChangedPixels! > 0), "legacy fixed attachment must change the copy raster").toBe(true);
    } finally { await context.close(); }
  });

  test(`zoom ${theme}: Atlas entrance keeps copy sky in the scene's viewport`, async ({ browser, baseURL }) => {
    for (const config of ["phone-z100", "ipad-portrait-z100"]) {
      const { context, page } = await openZoomPage(browser, baseURL!, { style: "atlas", path: "/", theme, config });
      try {
        await page.emulateMedia({ reducedMotion: "no-preference" });
        // Hold the entrance during its delay, when sheet-down would create
        // a main-relative containing block even before anything moves.
        await page.evaluate(() => {
          for (const animation of document.querySelector(".rack-main")!.getAnimations()) {
            animation.pause();
            animation.currentTime = 0;
          }
        });
        const scene = await page.locator(".scene").boundingBox();
        expect(scene).not.toBeNull();
        for (const sky of await page.locator(".launchpad-sky > span").all()) {
          const copy = await sky.boundingBox();
          expect(copy).not.toBeNull();
          for (const axis of ["x", "y", "width", "height"] as const) {
            expect(copy![axis], `${config} entrance: copy sky ${axis}`).toBeCloseTo(scene![axis], 1);
          }
        }
      } finally { await context.close(); }
    }
  });

  test(`zoom ${theme}: Cyanotype headings stay clear of fern and rule ink`, async ({ browser, baseURL }, info) => {
    for (const path of INNER_PAGES) for (const zoom of [175, 200]) {
      const job = { style: "cyanotype", path, theme, config: `desktop-z${zoom}` };
      const { context, page } = await openZoomPage(browser, baseURL!, job);
      try {
        for (const region of await copyWithEvidence(page, "cyanotype", info, `${path}-${zoom}`)) {
          expect(region.changedPixels, `${path} ${zoom}%: artwork showing through heading`).toBe(0);
        }
      } finally { await context.close(); }
    }
  });
}
