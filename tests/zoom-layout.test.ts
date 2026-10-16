import { expect, test } from "bun:test";
import sharp from "sharp";
import { compareCopyPixels, countCopyInk } from "../scripts/zoom-layout.mjs";

const fixture = (name: string) => new URL(`./fixtures/zoom/${name}.png`, import.meta.url).pathname;

test("ink probe rejects the original production chart and accepts the cleared sky", async () => {
  // Unretouched 8×6 CSS-pixel crops at (134,167), inside the phone pitch,
  // from zoomverify/{before,after}/atlas/day/home/phone-z100/view.png.
  // No glyphs fall in this crop: the diagonal is the original defect.
  expect(await countCopyInk(fixture("atlas-phone-day-chart"))).toBeGreaterThan(0);
  expect(await countCopyInk(fixture("atlas-phone-day-clear"))).toBe(0);
});

test("a smooth sky gradient is not constellation ink", async () => {
  const data = Buffer.from(Array.from({ length: 30 * 20 * 3 }, (_, p) => 100 + Math.floor(p / 90)));
  const sky = await sharp(data, { raw: { width: 30, height: 20, channels: 3 } }).png().toBuffer();
  expect(await countCopyInk(sky)).toBe(0);
  expect((await compareCopyPixels(sky, sky)).changedPixels).toBe(0);
  const exposed = await sharp({ create: { width: 30, height: 20, channels: 3, background: "#ff00ff" } }).png().toBuffer();
  expect((await compareCopyPixels(sky, exposed)).changedPixels).toBe(600);
});

test("copy comparison rejects mismatched capture dimensions", async () => {
  const png = (width: number) => sharp({ create: { width, height: 6, channels: 3, background: "#abcdef" } }).png().toBuffer();
  await expect(compareCopyPixels(await png(8), await png(9))).rejects.toThrow("dimensions changed");
});
