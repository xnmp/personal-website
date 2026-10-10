import { test, expect, describe } from "bun:test";
import { drawnBounds } from "../src/lib/drawn-bounds";

/** A w x h RGBA mask with the given pixels opaque. */
function mask(w: number, h: number, opaque: [number, number][]): Uint8Array {
  const px = new Uint8Array(w * h * 4);
  for (const [x, y] of opaque) px[(y * w + x) * 4 + 3] = 255;
  return px;
}

describe("drawnBounds: where the drawing sits in its mask", () => {
  test("a drawing filling the mask is centred and whole", () => {
    const all: [number, number][] = [];
    for (let y = 0; y < 2; y++) for (let x = 0; x < 4; x++) all.push([x, y]);
    expect(drawnBounds(mask(4, 2, all), 4, 2, 4)).toEqual({ x: 0.5, y: 0.5, w: 1, h: 1 });
  });

  test("a drawing in one corner is measured there, by its outermost pixels", () => {
    // pixels (0,0) and (1,1) of a 4x4: the box is the top-left quarter
    expect(drawnBounds(mask(4, 4, [[0, 0], [1, 1]]), 4, 4, 4)).toEqual({ x: 0.25, y: 0.25, w: 0.5, h: 0.5 });
  });

  test("one pixel is a box one pixel wide", () => {
    expect(drawnBounds(mask(10, 10, [[9, 0]]), 10, 10, 4)).toEqual({ x: 0.95, y: 0.05, w: 0.1, h: 0.1 });
  });

  test("faint pixels below the threshold are not drawing", () => {
    const px = mask(4, 4, [[2, 2]]);
    px[3] = 40; // a faint (0,0)
    expect(drawnBounds(px, 4, 4, 4)).toEqual({ x: 0.625, y: 0.625, w: 0.25, h: 0.25 });
    expect(drawnBounds(px, 4, 4, 4, 1)).toEqual({ x: 0.375, y: 0.375, w: 0.75, h: 0.75 });
  });

  test("reads alpha as the last channel of any channel count", () => {
    const ga = new Uint8Array(2 * 1 * 2);
    ga[3] = 255; // grey+alpha, pixel (1,0)
    expect(drawnBounds(ga, 2, 1, 2)).toEqual({ x: 0.75, y: 0.5, w: 0.5, h: 1 });
  });

  test("an empty mask has no drawing", () => {
    expect(drawnBounds(mask(8, 8, []), 8, 8, 4)).toBeNull();
  });

  test("a malformed buffer or size is no drawing, not a crash", () => {
    expect(drawnBounds(new Uint8Array(3), 4, 4, 4)).toBeNull();
    expect(drawnBounds(new Uint8Array(0), 0, 0, 4)).toBeNull();
    expect(drawnBounds(new Uint8Array(16), 2, 2, 0)).toBeNull();
    expect(drawnBounds(new Uint8Array(16), -2, 2, 4)).toBeNull();
  });

  test("a large mask is measured in one pass", () => {
    const w = 4000;
    const h = 3000;
    const px = new Uint8Array(w * h * 4);
    px[((h - 1) * w + (w - 1)) * 4 + 3] = 255;
    px[(1000 * w + 2000) * 4 + 3] = 255;
    const b = drawnBounds(px, w, h, 4)!;
    expect(b.w).toBeCloseTo(2000 / w, 4);
    expect(b.h).toBeCloseTo(2000 / h, 4);
  });
});
