// Shared by the focused E2E suite and zoom-verify.mjs. Zoom follows the audit:
// divide the physical viewport by zoom and multiply its base DPR by zoom.
import sharp from "sharp";

const configs = (name, width, height, baseDPR, zooms, isMobile = false) =>
  zooms.map((zoom) => ({
    id: `${name}-z${zoom}`,
    viewport: { width: Math.round(width * 100 / zoom), height: Math.round(height * 100 / zoom) },
    deviceScaleFactor: baseDPR * zoom / 100,
    isMobile,
    hasTouch: isMobile,
  }));

export const CONFIGS = [
  ...configs("desktop", 1920, 1080, 1, [50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200]),
  ...configs("qhd", 2560, 1440, 1, [100]),
  ...configs("ultrawide", 3440, 1440, 1, [67, 100, 125]),
  ...configs("laptop", 1440, 900, 2, [100, 125]),
  ...configs("phone", 390, 844, 3, [100], true),
];
export const INNER_PAGES = ["/about", "/p/scrivo", "/p/tauri-explorer"];
export const THEMES = ["day", "night"];
export const TOUCH_CONFIGS = [
  ...configs("ipad-portrait", 1024, 1366, 2, [100], true),
  ...configs("ipad-landscape", 1366, 1024, 2, [100], true),
];

export async function openZoomPage(browser, base, job) {
  const config = [...CONFIGS, ...TOUCH_CONFIGS].find((c) => c.id === job.config);
  if (!config) throw new Error(`Unknown configuration: ${job.config}`);
  const context = await browser.newContext({
    viewport: config.viewport,
    deviceScaleFactor: config.deviceScaleFactor,
    isMobile: config.isMobile,
    hasTouch: config.hasTouch,
    screen: config.viewport,
    colorScheme: job.theme === "day" ? "light" : "dark",
    reducedMotion: "reduce",
    locale: "en-AU",
    timezoneId: "Australia/Sydney",
    serviceWorkers: "block",
  });
  try {
    await context.addInitScript(({ style, theme }) => {
      localStorage.setItem("nb-style", style);
      localStorage.setItem("nb-rice", theme === "day" ? "paper" : "cosmic-dusk");
      localStorage.setItem("nb-scene", "flat");
      let seed = 0x97ab2c1;
      Math.random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
    }, job);
    const page = await context.newPage();
    const response = await page.goto(new URL(job.path, base).href, { waitUntil: "networkidle" });
    if (!response?.ok()) throw new Error(`Navigation failed: ${response?.status()}`);
    await page.locator(".rack").waitFor();
    await page.evaluate(async () => {
      await document.fonts.ready;
      const images = [...document.images];
      for (const im of images) im.loading = "eager";
      await Promise.all(images.map(async (im) => {
        const source = im.currentSrc;
        try { await im.decode(); } catch {
          // A responsive picture may replace its source while decoding.
          // Only the currently displayed source determines readiness.
          if (im.currentSrc !== source) await im.decode();
        }
        if (im.currentSrc && (!im.complete || im.naturalWidth === 0)) {
          throw new Error(`Displayed image failed to decode: ${im.currentSrc}`);
        }
      }));
      for (const animation of document.getAnimations()) {
        if (animation.effect?.getComputedTiming().iterations === Infinity) {
          animation.pause();
          animation.currentTime = 0;
        } else {
          animation.finish();
          animation.pause();
        }
      }
      window.scrollTo(0, 0);
    });
    const boot = await page.locator("html").evaluate((root) => ({ style: root.dataset.style, rice: root.dataset.rice }));
    if (boot.style !== job.style || boot.rice !== (job.theme === "day" ? "paper" : "cosmic-dusk")) {
      throw new Error(`Incorrect boot state: ${JSON.stringify(boot)}`);
    }
    return { context, page, config };
  } catch (error) {
    await context.close();
    throw error;
  }
}

export async function measureLayout(page, job) {
  return page.evaluate(({ style, path }) => {
    const box = (selector) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Missing ${selector}`);
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    const pseudo = (selector, name) => {
      const host = document.querySelector(selector);
      const r = box(selector);
      const css = getComputedStyle(host, name);
      return {
        x: r.x + parseFloat(css.left), y: r.y + parseFloat(css.top),
        width: parseFloat(css.width), height: parseFloat(css.height),
      };
    };
    const viewport = { innerWidth, clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth, screenWidth: screen.width,
      documentHeight: document.documentElement.scrollHeight };
    if (style !== "garden" || path !== "/" || innerWidth < 900) return { viewport };
    // Fiducials in the wall bitmap, in mock pixels, from the audit's
    // garden.wall-ledge-under-window contract. Measure against the wall's
    // actual rendered origin/scale, not the stage position it ought to have.
    const wall = pseudo(".showcase", "::before");
    const scale = wall.width / 1672;
    const wallTop = Number(getComputedStyle(document.documentElement).getPropertyValue("--wall-top"));
    const monitor = box(".launchpad-window");
    const booksTop = wall.y + (421.5 - wallTop) * scale;
    const mugFront = pseudo(".launchpad-window", "::after");
    const mugAnchor = { x: wall.x + 686 * scale, y: wall.y + (396 - wallTop) * scale };
    return { viewport, garden: {
      monitor, wall, booksTop, contactGap: monitor.bottom - booksTop,
      mugFront, mugAnchor, mugDelta: { x: mugFront.x - mugAnchor.x, y: mugFront.y - mugAnchor.y },
      copy: box(".launchpad-copy"), cards: box(".showcase-row"),
    } };
  }, job);
}

// Count actual raster changes; callers supply equal-size CSS-pixel crops.
export async function compareCopyPixels(original, probe) {
  const a = await sharp(original).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const b = await sharp(probe).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) {
    throw new Error("Copy probe dimensions changed");
  }
  let changedPixels = 0;
  for (let p = 0; p < a.data.length; p += 3) {
    if ([0, 1, 2].some((c) => Math.abs(a.data[p + c] - b.data[p + c]) > 2)) changedPixels++;
  }
  return { changedPixels, pixels: a.info.width * a.info.height };
}

export async function countCopyInk(ground) {
  const { data, info } = await sharp(ground).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let inkPixels = 0;
  for (let y = 1; y < info.height; y++) for (let x = 1; x < info.width; x++) {
    const p = (y * info.width + x) * 3;
    const step = Math.max(...[0, 1, 2].flatMap((c) => [Math.abs(data[p + c] - data[p - 3 + c]),
      Math.abs(data[p + c] - data[p - info.width * 3 + c])]));
    if (step > 8) inkPixels++;
  }
  return inkPixels;
}

// Capture the real viewport once per state, then crop the same raster. Small
// fullPage+clip screenshots use captureBeyondViewport in Chromium even when
// the clip is on-screen; they are unsuitable for comparing fixed/masked skies.
// Save every probe so an unstable capture can be distinguished from actual ink.
/**
 * @param {import("@playwright/test").Page} page
 * @param {string} style
 * @param {{ onCapture?: (name: string, data: Buffer) => Promise<void>, emulateScrollAttachment?: boolean }} options
 * @returns {Promise<Array<{ selector: string, clip: { left: number, top: number, width: number, height: number }, changedPixels: number, pixels: number, inkPixels?: number, attachmentChangedPixels?: number }>>}
 */
export async function measureCopyInk(page, style, options = {}) {
  if (options.emulateScrollAttachment) {
    let reference;
    let emulated;
    const onCapture = options.onCapture ?? (async () => {});
    await measureCopyInk(page, style, { onCapture: async (name, data) => {
      if (name === "copy-original.png") reference = data;
      await onCapture(`normal-${name}`, data);
    } });
    // Safari iOS downgrades fixed background attachment to scroll. Compare
    // registration too: a wrong but smooth sky crop can pass the ink scan.
    const override = await page.addStyleTag({ content:
      "*, *::before, *::after { background-attachment: scroll !important; }" });
    try {
      const regions = await measureCopyInk(page, style, { onCapture: async (name, data) => {
        if (name === "copy-original.png") emulated = data;
        await onCapture(name, data);
      } });
      if (!reference || !emulated) throw new Error("Missing attachment comparison captures");
      return Promise.all(regions.map(async (region) => ({ ...region,
        attachmentChangedPixels: (await compareCopyPixels(
          await sharp(reference).extract(region.clip).png().toBuffer(),
          await sharp(emulated).extract(region.clip).png().toBuffer(),
        )).changedPixels,
      })));
    } finally { await override.evaluate((el) => el.remove()); }
  }
  const onCapture = options.onCapture ?? (async () => {});
  const selectors = style === "atlas"
    ? [".launchpad-title", ".launchpad-pitch", ".launchpad-call"]
    : [".detail-hero h1, .launch-copy h1"];
  const regions = await page.evaluate((selectors) => selectors.map((selector) => {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Missing ${selector}`);
    const r = element.getBoundingClientRect();
    const clip = { left: Math.ceil(r.x) + 2, top: Math.ceil(r.y) + 2,
      width: Math.floor(r.width) - 4, height: Math.floor(r.height) - 4 };
    if (clip.left < 0 || clip.top < 0 || clip.width <= 0 || clip.height <= 0
      || clip.left + clip.width > innerWidth) {
      throw new Error(`Invalid copy region: ${selector}`);
    }
    return { selector, clip };
  }), selectors);
  // A wrapped Cyanotype heading can extend below the fold. Capture the
  // complete page in that case, never a per-region beyond-viewport surface.
  const viewport = page.viewportSize();
  const fullPage = regions.some(({ clip }) => clip.top + clip.height > viewport.height);
  await onCapture("copy-regions.json", Buffer.from(JSON.stringify(regions, null, 2) + "\n"));
  const capture = async (name) => {
    // Flush the state mutation through a paint, without a time-based delay.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const png = await page.screenshot({ fullPage, scale: "css", animations: "disabled", caret: "hide" });
    await onCapture(name, png);
    return png;
  };
  const crop = (png, clip) => sharp(png).extract(clip).png().toBuffer();
  const original = await capture("copy-original.png");
  const repeat = await capture("copy-repeat.png");
  for (const { selector, clip } of regions) {
    const { changedPixels } = await compareCopyPixels(await crop(original, clip), await crop(repeat, clip));
    if (changedPixels) throw new Error(`Unstable copy capture: ${selector} (${changedPixels} pixels); inspect copy-original/repeat.png`);
  }
  const sky = page.locator('[data-layer="sky"]');
  const originalSky = await sky.getAttribute("style");
  let probe;
  try {
    await sky.evaluate((el) => {
      el.style.setProperty("background-image", "none");
      el.style.setProperty("background-color", "rgb(255, 0, 255)");
    });
    probe = await capture("copy-sky-probe.png");
  } finally {
    await sky.evaluate((el, original) => {
      if (original === null) el.removeAttribute("style"); else el.setAttribute("style", original);
    }, originalSky);
  }
  // Scan the ORIGINAL sky, with glyph paint hidden. Scanning the magenta
  // probe here would count synthetic feather boundaries as constellation ink.
  let ground;
  if (style === "atlas") {
    const originals = await page.evaluate((selectors) => selectors.flatMap((selector) => {
      const host = document.querySelector(selector);
      return [host, ...host.querySelectorAll("*")].map((el) => {
        const original = el.getAttribute("style");
        for (const [key, value] of Object.entries({ color: "transparent", "-webkit-text-fill-color": "transparent",
          "text-shadow": "none", background: "none", filter: "none" })) el.style.setProperty(key, value);
        return original;
      });
    }), selectors);
    try {
      ground = await capture("copy-ground.png");
    } finally {
      await page.evaluate(({ selectors, originals }) => {
        const elements = selectors.flatMap((selector) => {
          const host = document.querySelector(selector);
          return [host, ...host.querySelectorAll("*")];
        });
        elements.forEach((el, i) => {
          if (originals[i] === null) el.removeAttribute("style"); else el.setAttribute("style", originals[i]);
        });
      }, { selectors, originals });
    }
  }
  const results = [];
  for (const region of regions) {
    const diff = await compareCopyPixels(await crop(original, region.clip), await crop(probe, region.clip));
    results.push({ ...region, ...diff,
      ...(ground ? { inkPixels: await countCopyInk(await crop(ground, region.clip)) } : {}),
    });
  }
  return results;
}
