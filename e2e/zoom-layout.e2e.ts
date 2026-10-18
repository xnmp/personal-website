import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { INNER_PAGES, THEMES, measureCopyInk, measureLayout, openZoomPage } from "../scripts/zoom-layout.mjs";

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

// Keep the responsive outcome; the retired promotion-stage geometry is not a contract.
test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "explicit phone contexts"));
test.describe.configure({ timeout: 60_000 });
for (const theme of THEMES) {
  test(`zoom ${theme}: phone decorations cannot widen Garden or Solarpunk`, async ({ browser, baseURL }) => {
    for (const [style, paths] of [["garden", ["/projects"]], ["solarpunk", ["/projects", ...INNER_PAGES]]] as const) {
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
