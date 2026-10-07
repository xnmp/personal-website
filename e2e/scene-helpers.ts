import type { Page } from "@playwright/test";

/** A data attribute on the root element. */
export const root = (page: Page, key: string) => page.evaluate((k) => document.documentElement.dataset[k], key);

/**
 * What the scene shows on screen behind the page (the page's sheets hidden
 * for the shot): its mean colour and how many distinct colours it has. Read
 * from a screenshot, since a WebGL canvas can't be read back after it's shown.
 */
export async function sceneStats(page: Page) {
  const hide = await page.addStyleTag({ content: ".rack { visibility: hidden !important; }" });
  const png = (await page.screenshot({ type: "png" })).toString("base64");
  await hide.evaluate((el) => (el as Element).remove());
  return page.evaluate(async (b64) => {
    const img = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
    const c = new OffscreenCanvas(48, 27);
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const px = ctx.getImageData(0, 0, c.width, c.height).data;
    const seen = new Set<number>();
    const mean = [0, 0, 0];
    for (let i = 0; i < px.length; i += 4) {
      seen.add((px[i] >> 3) | ((px[i + 1] >> 3) << 5) | ((px[i + 2] >> 3) << 10));
      for (let j = 0; j < 3; j++) mean[j] += px[i + j] / (px.length / 4);
    }
    return { mean, colours: seen.size };
  }, png);
}

/** The CSS layers' own visibility (they are hidden while the canvas draws them). */
export const cssLayersShown = (page: Page) =>
  page.locator('.scene-layer[data-layer="pines-left"]').evaluate((el) => getComputedStyle(el).visibility === "visible");

