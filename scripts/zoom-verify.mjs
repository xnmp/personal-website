#!/usr/bin/env node
// Audit-compatible viewport/DPR emulation; no browser-toolbar zoom.
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "@playwright/test";
import { CONFIGS, INNER_PAGES, THEMES, measureCopyInk, measureLayout, openZoomPage } from "./zoom-layout.mjs";

const { values } = parseArgs({ options: {
  base: { type: "string" }, out: { type: "string" }, help: { type: "boolean" },
  matrix: { type: "string", default: "zoom" },
} });
if (values.help || !values.base || !values.out) {
  console.log("Usage: node scripts/zoom-verify.mjs --base <url> --out <dir> [--matrix zoom|home-all]");
  console.log("  zoom (default): layout-fix evidence and zoom configurations");
  console.log("  home-all: all seven styles, both themes, four sizes at 100% zoom (56 jobs)");
  process.exit(values.help ? 0 : 2);
}
const base = new URL(values.base);
if (!["http:", "https:"].includes(base.protocol)) throw new Error("--base must be an HTTP(S) URL");
if (!["zoom", "home-all"].includes(values.matrix)) throw new Error(`Unknown --matrix: ${values.matrix}`);
const out = resolve(values.out);
await mkdir(out, { recursive: true });

// All evidence configurations, both finishes, plus the unaffected 100% sizes
// and the complete Garden/Atlas zoom matrix for contact and design comparison.
const baselines = ["desktop-z100", "qhd-z100", "ultrawide-z100", "laptop-z100", "phone-z100"];
const cases = values.matrix === "home-all"
  ? ["paper", "solarpunk", "cyanotype", "garden", "sumi", "atlas", "ligne"].flatMap((style) =>
    ["desktop-z100", "ultrawide-z100", "laptop-z100", "phone-z100"]
      .map((config) => ({ style, path: "/", config })))
  : [
  ...["garden", "atlas"].flatMap((style) => CONFIGS.map(({ id }) => ({ style, path: "/", config: id }))),
  ...["/", ...INNER_PAGES].flatMap((path) => baselines.map((config) => ({ style: "solarpunk", path, config }))),
  ...INNER_PAGES.flatMap((path) => [...baselines, "desktop-z150", "desktop-z175", "desktop-z200"]
    .map((config) => ({ style: "cyanotype", path, config }))),
];
const jobs = THEMES.flatMap((theme) => cases.map((job) => ({ ...job, theme })));
const results = [];
const browser = await chromium.launch({ headless: true });
try {
  for (const [i, job] of jobs.entries()) {
    const key = `${job.style}/${job.theme}/${job.path === "/" ? "home" : job.path.slice(1).replaceAll("/", "--")}/${job.config}`;
    console.log(`${i + 1}/${jobs.length} ${key}`);
    let context;
    try {
      const opened = await openZoomPage(browser, base, job);
      context = opened.context;
      const { page, config } = opened;
      const metrics = await measureLayout(page, job);
      const dir = join(out, key);
      await mkdir(dir, { recursive: true });
      await page.screenshot({ path: join(dir, "view.png"), scale: "device", caret: "hide" });
      // Match the audit's four-viewport cap without resizing vw/vh layout.
      await page.screenshot({ path: join(dir, "full.png"), scale: "device", caret: "hide", fullPage: true,
        clip: { x: 0, y: 0, width: config.viewport.width,
          height: Math.max(config.viewport.height, Math.min(metrics.viewport.documentHeight, config.viewport.height * 4)) } });
      const copy = job.style === "atlas" || (job.style === "cyanotype" && job.path !== "/" && config.viewport.width >= 900)
        ? await measureCopyInk(page, job.style, { emulateScrollAttachment: job.style === "atlas" && config.hasTouch,
          onCapture: (name, data) => writeFile(join(dir, name), data) }) : [];
      const checks = [
        ...(config.isMobile ? [{ name: "phone width", pass: metrics.viewport.innerWidth === config.viewport.width
          && metrics.viewport.scrollWidth <= config.viewport.width }] : []),
        ...(metrics.garden ? [
          { name: "monitor rests on books", pass: Math.abs(metrics.garden.contactGap) <= 2 },
          { name: "mug handle attached", pass: Math.abs(metrics.garden.mugDelta.x) <= 2 && Math.abs(metrics.garden.mugDelta.y) <= 2 },
          { name: "copy clears cards", pass: metrics.garden.copy.bottom <= metrics.garden.cards.y },
        ] : []),
        ...copy.map((region) => ({ name: `${region.selector} clear of artwork`,
          pass: region.changedPixels === 0 && (region.inkPixels ?? 0) === 0
            && (region.attachmentChangedPixels ?? 0) === 0 })),
      ];
      if (checks.some(({ pass }) => !pass)) process.exitCode = 1;
      results.push({ ...job, emulation: config, screenshots: { view: `${key}/view.png`, full: `${key}/full.png` },
        ...metrics, copy, checks });
    } catch (error) {
      results.push({ ...job, error: String(error) });
      process.exitCode = 1;
    } finally {
      await context?.close();
      // Preserve completed measurements if a later capture is interrupted.
      await writeFile(join(out, "results.json"), JSON.stringify({ generatedAt: new Date().toISOString(),
        matrix: values.matrix,
        method: "audit viewport/DPR zoom emulation; full capture capped at four viewports", results }, null, 2) + "\n");
    }
  }
} finally { await browser.close(); }
console.log(`Saved ${results.length} results to ${join(out, "results.json")}`);
console.log(`${results.filter((r) => r.error || r.checks.some((c) => !c.pass)).length} failing jobs`);
