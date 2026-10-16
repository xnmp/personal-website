import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { ART_MAX_DIFFERENCE, compareArtwork, resampleArtwork } from "../e2e/hires-art-helpers";

describe("B-mode artwork resampling", () => {
  test("preserves exact twin dimensions and deterministic lossless WebP bytes using sibling content", async () => {
    const sibling = await sharp({ create: { width: 7, height: 5, channels: 4, background: "#3678ab" } }).webp({ lossless: true }).toBuffer();
    // Deliberately not a 2x canvas: the served twin is the dimension authority.
    const twin = await sharp({ create: { width: 19, height: 12, channels: 4, background: "red" } }).webp().toBuffer();
    const first = await resampleArtwork(sibling, twin);
    const second = await resampleArtwork(sibling, twin);
    expect(first.equals(second)).toBe(true);
    const metadata = await sharp(first).metadata();
    expect([metadata.width, metadata.height, metadata.format]).toEqual([19, 12, "webp"]);
    const { data, info } = await sharp(first).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect(info.channels).toBe(4);
    for (let i = 0; i < data.length; i += 4) {
      expect([...data.subarray(i, i + 4)]).toEqual([0x36, 0x78, 0xab, 255]);
    }
  });

  test("rejects invalid sibling or twin bytes", async () => {
    const valid = await scene();
    await expect(resampleArtwork(valid, new Uint8Array())).rejects.toThrow();
    await expect(resampleArtwork(new Uint8Array(), valid)).rejects.toThrow();
  });
});

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

  // Real generated detail versus the actual B pipeline, including all current
  // border twins. Separate tests keep each resampling below Bun's timeout.
  for (const [name, width] of [
    ["atlas/sky-quiet-night", 1920],
    ["paper/scene/alpenglow/sky", 1920],
    ["solarpunk/phone-day", 390],
    ["solarpunk/ivy-tuft-day", 232],
    ["garden/mug-front-day", 36],
    ["paper/pin-push", 32],
    ["garden/sheet-day-normal", 600],
    ["garden/sheet-day-hover", 600],
    ["garden/sheet-day-pressed", 600],
    ["garden/sheet-day-focus", 600],
    ["garden/sheet-day-flat", 600],
    ["atlas/tile-day-normal", 200],
    ["atlas/tile-day-hover", 200],
    ["atlas/tile-day-pressed", 200],
    ["atlas/tile-day-focus", 200],
    ["ligne/tape-day", 128],
  ] as const) {
    test(`actual twin versus resampled B stays within tolerance: ${name}`, async () => {
      const [sibling, twin] = await Promise.all(["", "@2x"].map((suffix) => readFile(`public/kit/${name}${suffix}.webp`)));
      const render = (input: Buffer) => sharp(input).resize({ width }).png().toBuffer();
      const [one, two] = await Promise.all([render(await resampleArtwork(sibling, twin)), render(twin)]);
      const result = await compareArtwork(one, two);
      expect(result.maxDifference, name).toBeLessThanOrEqual(ART_MAX_DIFFERENCE);
    });
  }
});
