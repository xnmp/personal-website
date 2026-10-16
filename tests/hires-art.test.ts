import { describe, expect, test } from "bun:test";
import sharp from "sharp";
import { ART_MAX_DIFFERENCE, compareArtwork } from "../e2e/hires-art-helpers";

// A textured asymmetric sprite on a contrasting scene. Coordinates are CSS
// pixels, matching screenshot({ scale: "css" }) at deviceScaleFactor 2.
async function scene({ x = 61, y = 53, scale = 1, sharpen = false, width = 1440 } = {}) {
  const sprite = await sharp(Buffer.from(`<svg width="64" height="48" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="48" fill="#283b51"/>
    <path d="M0 8H64M0 16H64M0 24H64M0 32H64M0 40H64" stroke="#d3ac6c" stroke-width="1"/>
    <path d="M8 0V48M16 0V48M24 0V48M32 0V48M40 0V48M48 0V48M56 0V48" stroke="#10253a"/>
    <circle cx="20" cy="17" r="9" fill="#f5e5b9"/>
  </svg>`)).resize(64 * scale, 48 * scale).png().toBuffer();
  const png = await sharp({ create: { width, height: 900, channels: 3, background: "#ede7d9" } })
    .composite([{ input: sprite, left: x, top: y }]).png().toBuffer();
  return sharpen ? sharp(png).sharpen({ sigma: 1.2, m1: 2, m2: 5 }).png().toBuffer() : png;
}

describe("hires artwork geometry comparison", () => {
  test("identical images pass with zero difference", async () => {
    const image = await scene();
    const result = await compareArtwork(image, image);
    expect(result.passes).toBe(true);
    expect(result.maxDifference).toBe(0);
  });

  test("sharpening passes while a single doubled or 4 CSS px shifted sprite fails", async () => {
    const original = await scene();
    const sharpened = await scene({ sharpen: true });
    expect(Buffer.compare(original, sharpened)).not.toBe(0);
    const results = await Promise.all([sharpened, await scene({ scale: 2 }), await scene({ x: 65 })]
      .map((image) => compareArtwork(original, image)));
    expect(results.map((r) => r.passes)).toEqual([true, false, false]);
    expect(results[0].maxDifference).toBeLessThanOrEqual(ART_MAX_DIFFERENCE);
    // Different downsample phases, plus a vertical displacement.
    for (const x of [56, 59, 64]) {
      expect((await compareArtwork(await scene({ x }), await scene({ x: x + 4 }))).passes).toBe(false);
    }
    expect((await compareArtwork(original, await scene({ y: 57 }))).passes).toBe(false);
  });

  test("returns an inspectable diff and rejects mismatched or invalid captures", async () => {
    const image = await scene();
    const result = await compareArtwork(image, await scene({ scale: 2 }));
    expect((await sharp(result.diff).metadata()).format).toBe("png");
    await expect(compareArtwork(image, await scene({ width: 321 }))).rejects.toThrow(/dimensions differ/);
    await expect(compareArtwork(image, new Uint8Array())).rejects.toThrow();
  });

  test("actual twin detail stays within tolerance at scene and small sprite sizes", async () => {
    // Include the two worst native-size scene pairs observed during offline
    // calibration, plus phone art and transparent foreground sprites. These
    // exercise real upscale/encoding changes rather than only unsharp masks.
    for (const [name, width] of [
      ["atlas/sky-quiet-night", 1920],
      ["paper/scene/alpenglow/sky", 1920],
      ["solarpunk/phone-day", 390],
      ["solarpunk/ivy-tuft-day", 232],
      ["garden/mug-front-day", 36],
      ["paper/pin-push", 32],
    ] as const) {
      const render = (suffix: string) => sharp(`public/kit/${name}${suffix}.webp`).resize({ width }).png().toBuffer();
      const [one, two] = await Promise.all([render(""), render("@2x")]);
      const result = await compareArtwork(one, two);
      expect(result.maxDifference, name).toBeLessThanOrEqual(ART_MAX_DIFFERENCE);
    }
  });
});
