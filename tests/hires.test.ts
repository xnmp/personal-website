import { describe, expect, test } from "bun:test";
import sharp from "sharp";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { API_LIMITS, planTiles } from "../scripts/hires/tiles.mjs";
import { blendTiles, composeFlow, conformanceStats, estimateFlow, gaussianBlur, padTransparent, toneMatch, warp } from "../scripts/hires/merge.mjs";
import { cacheKey, validateManifest } from "../scripts/hires/manifest.mjs";
import { acceptanceReasons, alignTile, cliOptions, main, mapJobs } from "../scripts/hires/upscale.mjs";
import { outputPath } from "../scripts/hires/lock.mjs";

const rgb = (width: number, height: number, pixel: (x: number, y: number, c: number) => number) => ({
  width, height, channels: 3,
  data: Float32Array.from({ length: width * height * 3 }, (_, i) => pixel(Math.floor(i / 3) % width, Math.floor(i / 3 / width), i % 3)),
});
const manifest = (assets: unknown[]) => ({ version: 1, defaults: {}, assets });

describe("hires tile planning", () => {
  for (const [width, height] of [[64, 64], [927, 1697], [1920, 1080], [2654, 1447], [6000, 400], [400, 6000], [8000, 8000]]) {
    for (const factor of [1.5, 2, 2.3]) {
      test(`${width}x${height} at ${factor} covers both canvases within API limits`, () => {
        const { outW, outH, tiles } = planTiles({ width, height, factor });
        expect([outW, outH]).toEqual([Math.round(width * factor), Math.round(height * factor)]);
        for (const t of tiles) {
          expect(t.apiW % 16).toBe(0); expect(t.apiH % 16).toBe(0);
          expect(Math.max(t.apiW, t.apiH)).toBeLessThanOrEqual(API_LIMITS.maxEdge);
          expect(t.apiW * t.apiH).toBeGreaterThanOrEqual(API_LIMITS.minPixels);
          expect(t.apiW * t.apiH).toBeLessThanOrEqual(API_LIMITS.maxPixels);
          expect(t.apiW / t.apiH).toBeGreaterThanOrEqual(1 / 3);
          expect(t.apiW / t.apiH).toBeLessThanOrEqual(3);
          expect(t.apiW).toBeGreaterThanOrEqual(t.ow); expect(t.apiH).toBeGreaterThanOrEqual(t.oh);
          expect(t.ox).toBe(Math.round(t.x * outW / width));
          expect(t.oy).toBe(Math.round(t.y * outH / height));
          expect(t.ox + t.ow).toBe(Math.round((t.x + t.w) * outW / width));
          expect(t.oy + t.oh).toBe(Math.round((t.y + t.h) * outH / height));
        }
        for (const [startKey, sizeKey, extent, otherKey, overlap] of [
          ['x', 'w', width, 'y', 64], ['y', 'h', height, 'x', 64],
          ['ox', 'ow', outW, 'oy', Math.floor(64 * outW / width)], ['oy', 'oh', outH, 'ox', Math.floor(64 * outH / height)],
        ] as const) {
          const lines = new Map<number, typeof tiles>();
          for (const t of tiles) lines.set(t[otherKey], [...(lines.get(t[otherKey]) ?? []), t]);
          for (const line of lines.values()) {
            const sorted = line.toSorted((a, b) => a[startKey] - b[startKey]);
            expect(sorted[0][startKey]).toBe(0);
            expect(sorted.at(-1)![startKey] + sorted.at(-1)![sizeKey]).toBe(extent);
            expect(Math.max(...line.map((t) => t[sizeKey])) - Math.min(...line.map((t) => t[sizeKey]))).toBeLessThanOrEqual(startKey === "x" || startKey === "y" ? 1 : Math.ceil(factor) + 1);
            for (let i = 1; i < sorted.length; i++) expect(sorted[i - 1][startKey] + sorted[i - 1][sizeKey] - sorted[i][startKey]).toBeGreaterThanOrEqual(overlap);
          }
        }
      });
    }
  }
  test("uses one tile when it fits, including small images scaled to the API minimum", () => {
    expect(planTiles({ width: 1920, height: 630, factor: 2 }).tiles).toHaveLength(1);
    expect(planTiles({ width: 6000, height: 400, factor: 2 }).tiles).toHaveLength(4);
    expect(planTiles({ width: 3840, height: 1280, factor: 1.00001 }).tiles).toHaveLength(1);
    expect(planTiles({ width: 64, height: 64, factor: 2 }).tiles).toHaveLength(1);
    expect(planTiles({ width: 1920, height: 1080, factor: 1.5 }).tiles).toHaveLength(1);
    expect(planTiles({ width: 2654, height: 1447, factor: 2 }).tiles).toHaveLength(2);
  });
  test("invalid and unsafe inputs fail clearly", () => {
    for (const width of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) expect(() => planTiles({ width, height: 1080, factor: 2 })).toThrow();
    for (const factor of [0, -1, 8.01, NaN, Infinity]) expect(() => planTiles({ width: 1920, height: 1080, factor })).toThrow(/factor/);
    expect(() => planTiles({ width: 1, height: 1, factor: 0.1 })).toThrow();
    expect(() => planTiles({ width: 100, height: 100, factor: 2, overlap: -1 })).toThrow(/overlap/);
    expect(() => planTiles({ width: 8000, height: 8000, factor: 8, overlap: 400 })).toThrow(/Cannot plan/);
    expect(() => planTiles({ width: 100, height: 100, factor: 2, limits: { maxPixels: 1 } })).toThrow(/limits/);
  });
});

describe("hires merge maths", () => {
  test("tone matching is identity on an unchanged image", () => {
    const a = rgb(31, 25, (x, y, c) => (x * 19 + y * 11 + c * 51) % 256);
    expect(toneMatch(a, a, 4).data).toEqual(a.data);
  });
  test("removes a constant offset and retains fine texture", () => {
    const base = rgb(64, 32, () => 100);
    const up = rgb(64, 32, (x, y) => 120 + ((x + y) % 2 ? 15 : -15));
    const matched = toneMatch(up, base, 4);
    for (let y = 12; y < 20; y++) for (let x = 12; x < 52; x++) expect(matched.data[(y * 64 + x) * 3]).toBeCloseTo(100 + ((x + y) % 2 ? 15 : -15), 1);
  });
  test("blur is normalised, edge-clamped, and handles a single pixel", () => {
    expect(gaussianBlur(rgb(1, 1, () => 123), 1.5).data).toEqual(new Float32Array([123, 123, 123]));
    const a = rgb(9, 7, () => 91);
    expect(gaussianBlur(a, 4).data).toEqual(a.data);
    expect(() => gaussianBlur(a, -1)).toThrow();
  });
  test("overlapping copies reproduce every pixel, including edges and four-way intersections", () => {
    const full = rgb(12, 12, (x, y, c) => x * 7 + y * 3 + c);
    const tiles = [0, 4].flatMap((oy) => [0, 4].map((ox) => ({ ox, oy, ow: 8, oh: 8, image: rgb(8, 8, (x, y, c) => full.data[((y + oy) * 12 + x + ox) * 3 + c]) })));
    const result = blendTiles(12, 12, tiles);
    expect(result.data).toEqual(full.data);
    expect([...result.data].every(Number.isFinite)).toBe(true);
    expect(() => blendTiles(13, 12, tiles)).toThrow(/uncovered/);
  });
  test("feathers differing tiles instead of picking one side", () => {
    const result = blendTiles(6, 2, [{ ox: 0, oy: 0, ow: 4, oh: 2, image: rgb(4, 2, () => 0) }, { ox: 2, oy: 0, ow: 4, oh: 2, image: rgb(4, 2, () => 100) }]);
    expect(Array.from({ length: 6 }, (_, x) => result.data[x * 3])).toEqual([0, 0, 25, 75, 100, 100]);
  });
  test("alpha-weighted padding preserves opaque paint and fills a large transparent margin", () => {
    const width = 33, height = 17;
    const data = new Uint8Array(width * height * 4);
    const centre = (8 * width + 16) * 4;
    data.set([180, 90, 45, 255], centre);
    data.set([180, 90, 45, 128], centre + 4);
    const original = data.slice();
    const padded = padTransparent({ data, width, height, channels: 4 });
    if (!padded) throw new Error('Expected a padded image');
    expect(data).toEqual(original);
    expect(padded.channels).toBe(3);
    for (let i = 0; i < padded.data.length; i++) expect(padded.data[i]).toBeCloseTo([180, 90, 45][i % 3], 3);
    expect(padded.data.slice(centre / 4 * 3, centre / 4 * 3 + 3)).toEqual(new Float32Array([180, 90, 45]));
    expect(padTransparent({ data: new Uint8Array(4), width: 1, height: 1, channels: 4 })?.data).toEqual(new Float32Array([0, 0, 0]));
  });
  test("conformance reports identity and recovers a known one-pixel displacement", () => {
    const pattern = (x: number, y: number, c: number) => 120 + 40 * Math.sin(x * 0.31 + y * 0.17 + c) + 35 * Math.cos(y * 0.41 - x * 0.13 + c);
    const src = rgb(64, 64, pattern);
    const identity = conformanceStats(src, src);
    expect(identity.mae).toEqual([0, 0, 0]); expect(identity.meanColourDelta).toEqual([0, 0, 0]); expect(identity.drift).toBe(0);
    const shifted = conformanceStats(src, rgb(64, 64, (x, y, c) => pattern(Math.max(0, x - 1), y, c)));
    expect(shifted.bestShift.dx).toBeCloseTo(1, 2); expect(shifted.bestShift.dy).toBe(0);
    expect(shifted.drift).toBeCloseTo(1, 2);
    const offset = conformanceStats(src, rgb(64, 64, (x, y, c) => pattern(x, y, c) + 8));
    for (const n of offset.meanColourDelta) expect(n).toBeCloseTo(8, 3);
    expect(offset.blurredMae).toBeCloseTo(8, 3);
  });
  test("registration recovers a one-pixel shift through offset and contrast changes", () => {
    const pattern = (x: number, y: number, c: number) => 110 + 40 * Math.sin(x * 0.31 + y * 0.17 + c) + 35 * Math.cos(y * 0.41 - x * 0.13 + c);
    const src = rgb(96, 80, pattern);
    for (const [dx, dy] of [[1, 0], [0, -1], [0.75, 0]]) {
      const shifted = rgb(96, 80, (x, y, c) => 20 + 0.8 * pattern(Math.max(0, Math.min(95, x - dx)), Math.max(0, Math.min(79, y - dy)), c));
      const stats = conformanceStats(src, shifted);
      expect(Math.abs(stats.bestShift.dx - dx)).toBeLessThanOrEqual(0.25);
      expect(Math.abs(stats.bestShift.dy - dy)).toBeLessThanOrEqual(0.25);
      expect(Math.abs(stats.drift - Math.hypot(dx, dy))).toBeLessThanOrEqual(0.25);
    }
    expect(conformanceStats(src, rgb(96, 80, (x, y, c) => 20 + 0.8 * pattern(x, y, c))).drift).toBe(0);
  });
  test("alpha excludes arbitrary transparent paint from registration and blurred colour stats", () => {
    const width = 96, height = 80;
    const weights = Float32Array.from({ length: width * height }, (_, p) => {
      const x = p % width, y = Math.floor(p / width);
      return x >= 30 && x < 60 && y >= 20 && y < 55 ? (x < 35 ? 0.5 : 1) : 0;
    });
    const src = rgb(width, height, (x, y, c) => weights[y * width + x] ? 120 + 30 * Math.sin(x * 0.4 + y * 0.2 + c) : 255);
    const target = rgb(width, height, (x, y, c) => weights[y * width + x] ? src.data[(y * width + x) * 3 + c] : (x + y + c) % 2 ? 0 : 10000);
    const stats = conformanceStats(src, target, weights);
    expect(stats.gateable).toBe(true);
    expect(stats.drift).toBe(0);
    expect(stats.blurredMae).toBe(0);
    expect(stats.meanColourDelta).toEqual([0, 0, 0]);
    expect(conformanceStats(src, target).blurredMae).toBeGreaterThan(100);
  });
  test("visible paint at the tile edge still participates in registration", () => {
    const width = 64, height = 64;
    const weights = Float32Array.from({ length: width * height }, (_, p) => p < 3 * width ? 1 : 0);
    const pattern = (x: number) => 120 + 35 * Math.sin(x * 0.31) + 30 * Math.cos(x * 0.71);
    const src = rgb(width, height, (x) => pattern(x));
    const target = rgb(width, height, (x) => 20 + 0.8 * pattern(Math.max(0, x - 2)));
    const stats = conformanceStats(src, target, weights);
    expect(stats.gateable).toBe(true);
    expect(stats.registrationReliable).toBe(true);
    expect(Math.abs(stats.bestShift.dx - 2)).toBeLessThanOrEqual(0.25);
    expect(stats.drift).toBeGreaterThan(1.5);
  });
  test("tiny visible areas skip gating and empty masks have finite stats", () => {
    const src = rgb(32, 32, () => 80), target = rgb(32, 32, () => 240);
    const weights = new Float32Array(32 * 32);
    weights[400] = 1;
    const stats = conformanceStats(src, target, weights);
    expect(stats.gateable).toBe(false);
    expect(stats.note).toMatch(/too little visible content/);
    expect(stats.visibleFraction).toBeLessThan(0.01);
    expect(stats.blurredMae).toBeCloseTo(160, 3);
    const empty = conformanceStats(src, target, new Float32Array(weights.length));
    expect(empty.gateable).toBe(false);
    expect(empty.blurredMae).toBe(0);
    expect(empty.drift).toBe(0);
    expect(empty.meanColourDelta).toEqual([0, 0, 0]);
    expect(conformanceStats(rgb(1, 1, () => 90), rgb(1, 1, () => 120)).drift).toBe(0);
  });
  test("mismatched or malformed images fail clearly", () => {
    expect(() => toneMatch(rgb(1, 1, () => 0), rgb(2, 1, () => 0), 1)).toThrow(/geometry/);
    const src = rgb(2, 2, () => 0);
    expect(() => conformanceStats(src, src, new Float32Array(1))).toThrow(/weights/);
    for (const weight of [-1, 1.01, NaN, Infinity]) expect(() => conformanceStats(src, src, new Float32Array([1, 0, weight, 0]))).toThrow(/weight/);
    expect(() => gaussianBlur({ width: 2, height: 1, channels: 3, data: new Uint8Array(1) }, 1)).toThrow(/image/);
  });
});

describe("hires local flow alignment", () => {
  const texture = (x: number, y: number, c: number) => 120 +
    23 * Math.sin(x * 0.31 + y * 0.17 + c) + 19 * Math.cos(y * 0.41 - x * 0.13 + c) +
    16 * Math.sin(x * 0.09 - y * 0.23 + c) + 11 * Math.cos(x * 0.63 + y * 0.51);
  const downsample = async (img: ReturnType<typeof rgb>, width: number, height: number) => ({
    width, height, channels: img.channels,
    data: await sharp(Buffer.from(Uint8Array.from(img.data, (v) => Math.round(v))), {
      raw: { width: img.width, height: img.height, channels: 3 },
    }).resize(width, height, { kernel: 'lanczos3' }).raw().toBuffer(),
  });
  test("estimates a smooth displacement within 0.3px/block and corrects a 2x image", async () => {
    const width = 400, height = 320;
    const source = rgb(width, height, texture);
    // Forward geometry: q -> q + (1.5 - 0.5*q.x/(w-1), 0.5 + q.x/(w-1)).
    const model = (x: number, y: number, c: number) => {
      const qx = (x - 1.5) / (1 - 0.5 / (width - 1));
      return texture(qx, y - 0.5 - qx / (width - 1), c);
    };
    const output = rgb(width * 2, height * 2, (x, y, c) => model((x + 0.5) / 2 - 0.5, (y + 0.5) / 2 - 0.5, c));
    const flow = estimateFlow(source, await downsample(output, width, height));
    expect(flow.diagnostics.reliableShare).toBe(1);
    flow.blocks.forEach((block: { dx: number; dy: number }, i: number) => {
      const x = ((i % flow.cols) + 0.5) * width / flow.cols - 0.5;
      expect(Math.abs(block.dx - (1.5 - 0.5 * x / (width - 1)))).toBeLessThan(0.3);
      expect(Math.abs(block.dy - (0.5 + x / (width - 1)))).toBeLessThan(0.3);
    });
    const corrected = warp(output, flow, 2);
    const residual = estimateFlow(source, await downsample(corrected, width, height));
    expect(residual.diagnostics.reliableShare).toBe(1);
    expect(residual.diagnostics.max).toBeLessThan(0.3);
  });
  test("positive x/right and negative y/up drift are sampled with the correcting sign", async () => {
    const width = 240, height = 240, dx = 1.5, dy = -1;
    const source = rgb(width, height, texture);
    const output = rgb(width * 2, height * 2, (x, y, c) => texture((x + 0.5) / 2 - 0.5 - dx, (y + 0.5) / 2 - 0.5 - dy, c));
    const flow = estimateFlow(source, await downsample(output, width, height));
    for (const p of flow.blocks) { expect(p.dx).toBeCloseTo(dx); expect(p.dy).toBeCloseTo(dy); }
    const corrected = warp(output, flow, 2);
    expect(estimateFlow(source, await downsample(corrected, width, height)).diagnostics.max).toBeLessThan(0.3);
    // Direct output-pixel evidence for the inverse sampling convention.
    const p = (120 * output.width + 120) * 3;
    expect(Math.abs(corrected.data[p] - texture(59.75, 59.75, 0))).toBeLessThan(1);
  });
  test("rejects opaque texture displaced beyond the alignment search (9 by 7 source px at 2x)", async () => {
    const width = 400, height = 320;
    const noise = (x: number, y: number, c: number) => {
      const seed = Math.imul(Math.floor(x) + 1000, 73856093) ^ Math.imul(Math.floor(y) + 1000, 19349663) ^ Math.imul(c + 1, 83492791);
      return (Math.imul(seed ^ (seed >>> 16), 2246822519) >>> 0) % 256;
    };
    const source = rgb(width, height, noise);
    const output = rgb(width * 2, height * 2, (x, y, c) => noise((x + 0.5) / 2 - 0.5 - 9, (y + 0.5) / 2 - 0.5 - 7, c));
    const { postWarp } = await alignTile(source, output, 2);
    expect(postWarp.reliableBlocks).toBe(0);
    // Tone matching can hide the colour error; missing geometry evidence must
    // reject even when MAE and the fallback displacement statistics are zero.
    expect(acceptanceReasons({ gateable: true, postWarp, blurredMae: 0 }, 'whole', 14).join()).toMatch(/cannot establish alignment/);
  });
  test("identity gives a zero field and a pixel-exact warp, including edges", () => {
    const source = rgb(240, 240, texture), original = source.data.slice();
    const flow = estimateFlow(source, source);
    expect(flow.diagnostics.reliableShare).toBe(1);
    expect(flow.diagnostics.max).toBe(0);
    expect(warp(source, flow, 1).data).toEqual(source.data);
    expect(source.data).toEqual(original);
    for (const [width, height] of [[1, 240], [240, 1]]) {
      const thin = rgb(width, height, texture), thinFlow = estimateFlow(thin, thin);
      expect(thinFlow.blocks.every((p: { score: number }) => Number.isFinite(p.score))).toBe(true);
      expect(thinFlow.diagnostics.max).toBe(0);
      expect(warp(thin, thinFlow, 1).data).toEqual(thin.data);
    }
    const one = rgb(1, 1, () => 99), tiny = estimateFlow(one, one);
    expect(tiny.diagnostics.max).toBe(0);
    expect(warp(one, tiny, 1).data).toEqual(one.data);
  });
  test("unrelated block paint is unreliable and does not displace matching neighbours", () => {
    const source = rgb(400, 400, texture);
    let seed = 123;
    const output = rgb(400, 400, (x, y, c) => {
      if (x >= 160 && x < 240 && y >= 160 && y < 240) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 2 ** 32 * 255;
      }
      return texture(x, y, c);
    });
    const flow = estimateFlow(source, output);
    expect(flow.blocks[12].reliable).toBe(false);
    expect(flow.diagnostics.reliableShare).toBeGreaterThan(0.8);
    expect(flow.diagnostics.max).toBeLessThan(0.3);
    expect(Math.max(...flow.vectors.map(Math.abs))).toBeLessThan(0.3);
  });
  test("RGBA registration ignores arbitrary transparent paint, including blur support", () => {
    const width = 240, height = 240;
    const weights = Float32Array.from({ length: width * height }, (_, p) => p % width < 100 ? 0 : 1);
    const rgba = (garbage: number) => ({ width, height, channels: 4,
      data: Float32Array.from({ length: width * height * 4 }, (_, i) => {
        const p = Math.floor(i / 4), c = i % 4;
        return c === 3 ? weights[p] * 255 : weights[p] ? texture(p % width, Math.floor(p / width), c) : garbage * ((i % 2) ? 1 : -1);
      }),
    });
    const source = rgba(10000), output = rgba(-10000);
    const flow = estimateFlow(source, output, { weights });
    expect(flow.diagnostics.reliableShare).toBeGreaterThan(0.4);
    expect(flow.diagnostics.max).toBe(0);
    expect(Math.max(...flow.vectors.map(Math.abs))).toBe(0);
    expect(warp(output, flow, 1).data).toEqual(output.data);
  });
  test("flat, ambiguous and empty evidence produce a finite zero fallback", () => {
    const constant = rgb(240, 240, () => 100);
    const stripe = rgb(240, 240, (x) => 100 + 30 * Math.sin(x * 0.3));
    const nearlyStripe = rgb(240, 240, (x, y) => 100 + 30 * Math.sin(y * 0.3) + 0.2 * Math.sin(x * 0.02 + y * 0.13));
    for (const source of [constant, stripe, nearlyStripe]) {
      const flow = estimateFlow(source, source);
      expect(flow.diagnostics.reliableShare).toBe(0);
      expect(flow.diagnostics.max).toBe(0);
      expect(flow.vectors.every((v: number) => v === 0)).toBe(true);
    }
    const empty = estimateFlow(constant, constant, { weights: new Float32Array(240 * 240) });
    expect(empty.diagnostics.gateable).toBe(false);
    expect(empty.diagnostics.reliableBlocks).toBe(0);
  });
  test("malformed options and field data fail clearly", () => {
    const source = rgb(16, 16, texture);
    for (const search of [-1, NaN, Infinity, 100000]) expect(() => estimateFlow(source, source, { search })).toThrow(/search/);
    for (const step of [0, -1, NaN, 1]) expect(() => estimateFlow(source, source, { step })).toThrow(/step/);
    expect(() => estimateFlow(source, source, { blocks: { cols: 0, rows: 3 } })).toThrow(/blocks/);
    expect(() => estimateFlow(source, source, { blocks: { cols: 17, rows: 3 } })).toThrow(/blocks/);
    expect(() => estimateFlow(source, source, { weights: new Float32Array([NaN]) })).toThrow(/weights/);
    const flow = estimateFlow(source, source);
    expect(() => warp(source, flow, 0)).toThrow(/warp/);
    expect(() => warp(source, { ...flow, vectors: new Float32Array([NaN]) }, 1)).toThrow(/warp/);
  });
  test("spatial outliers are excluded from reliable-block magnitude statistics", () => {
    const source = rgb(400, 400, texture);
    const output = rgb(400, 400, (x, y, c) => texture(x >= 160 && x < 240 && y >= 160 && y < 240 ? x - 2 : x, y, c));
    const flow = estimateFlow(source, output);
    expect(flow.blocks[12].reason).toBe('outlier');
    expect(flow.blocks[12].score).toBeGreaterThan(0.9);
    expect(flow.diagnostics.outlierBlocks).toBeGreaterThan(0);
    expect(flow.diagnostics.reliableBlocks).toBe(flow.blocks.filter((p: { reliable: boolean }) => p.reliable).length);
    expect(flow.diagnostics.max).toBeLessThan(0.6);
    expect(flow.diagnostics.p90).toBeLessThan(0.6);
  });
  test("composes inverse fields at displaced coordinates without mutating inputs", () => {
    const field = { width: 100, height: 100, cols: 5, rows: 5,
      vectors: Float32Array.from({ length: 50 }, (_, i) => i % 2 ? 0 : Math.floor(i / 2) % 5) };
    const residual = { ...field, vectors: Float32Array.from({ length: 50 }, (_, i) => i % 2 ? -2 : 2) };
    const original = field.vectors.slice();
    const composed = composeFlow(field, residual);
    // At grid column 2: R.x=2, F.x evaluated at column 2.1 is 2.1.
    expect(composed.vectors[24]).toBeCloseTo(4.1, 5);
    expect(composed.vectors[25]).toBe(-2);
    expect(field.vectors).toEqual(original);
    expect(composeFlow(field, { ...residual, vectors: new Float32Array(50) }).vectors).toEqual(field.vectors);
    expect(() => composeFlow(field, { ...residual, width: 101 })).toThrow(/flow/);
    expect(() => composeFlow(field, { ...residual, vectors: new Float32Array([NaN]) })).toThrow(/flow/);
  });
  test("iterative alignment refines a smooth local displacement and stops on a plateau", async () => {
    const width = 400, height = 320;
    const source = rgb(width, height, texture);
    const output = rgb(width * 2, height * 2, (x, y, c) => {
      const sx = (x + 0.5) / 2 - 0.5, sy = (y + 0.5) / 2 - 0.5;
      return texture(sx - 1.5 - 1.2 * Math.sin(sy / 70), sy - 0.7 * Math.sin(sx / 60), c);
    });
    const result = await alignTile(source, output, 2);
    expect(result.iterations).toBeGreaterThan(1);
    expect(result.iterations).toBeLessThanOrEqual(3);
    expect(result.postWarp.p90).toBeLessThan(result.history[1].p90);
    expect(result.postWarp.p90).toBeLessThanOrEqual(1);
    const writtenFlow = estimateFlow(source, await downsample(result.aligned, width, height));
    expect(writtenFlow.diagnostics.p90).toBeLessThanOrEqual(1);
    const identity = await alignTile(source, source, 1);
    expect(identity.iterations).toBe(1);
    expect(identity.aligned.data).toEqual(source.data);
  });
  test("edge-visible evidence participates and fractional tile scales use actual output geometry", () => {
    const source = rgb(240, 240, texture);
    const weights = Float32Array.from({ length: 240 * 240 }, (_, i) => i < 3 * 240 ? 1 : 0);
    const shifted = rgb(240, 240, (x, y, c) => texture(x - 2, y, c));
    const flow = estimateFlow(source, shifted, { weights });
    expect(flow.diagnostics.gateable).toBe(true);
    expect(flow.diagnostics.reliableBlocks).toBeGreaterThan(0);
    expect(Math.abs(flow.blocks.find((p: { reliable: boolean }) => p.reliable)!.dx - 2)).toBeLessThan(0.3);
    const roundedOutput = rgb(359, 360, texture);
    const zero = estimateFlow(source, source);
    expect(warp(roundedOutput, zero, 1.5).data).toEqual(roundedOutput.data);
  });
});

describe("hires manifest and cache contracts", () => {
  test("resolves defaults and per-asset overrides without mutation", () => {
    const input = manifest([{ src: 'public/kit/a.webp', factor: 2.3, lossless: true, group: 'paper/phone-day' }]);
    const result = validateManifest(input);
    expect(result.assets[0]).toMatchObject({ factor: 2.3, quality: 82, lossless: true, model: 'gpt-image-2.5-sunburst' });
    expect(result.assets[0].group).toBe('paper/phone-day');
    expect(input.assets[0]).toEqual({ src: 'public/kit/a.webp', factor: 2.3, lossless: true, group: 'paper/phone-day' });
  });
  test("rejects malformed entries and names each entry", () => {
    for (const entry of [null, [], {}, { src: 1 }, { src: 'public/kit/a.svg' }, { src: '../public/a.webp' }, { src: 'public/../../a.png' }, { src: 'public/../secret.png' }, { src: 'public//a.png' }, { src: 'public/a.webp', surprise: true }, { src: 'public/a.webp', factor: 0 }, { src: 'public/a.webp', quality: 101 }, { src: 'public/a.webp', lossless: 1 }, { src: 'public/a.webp', note: {} }])
      expect(() => validateManifest(manifest([entry]))).toThrow(/assets\[0\]/);
    expect(() => validateManifest(manifest([{ src: 'public/a.webp' }, { src: 'public/a.webp' }]))).toThrow(/assets\[1\].*duplicate/);
    for (const value of [null, {}, { ...manifest([]), version: 2 }, { ...manifest([]), extra: 1 }, { ...manifest([]), defaults: { sigma: -1 } }]) expect(() => validateManifest(value)).toThrow();
    for (const group of [null, 1, [], '', ' ', 'paper/../night', '/night', 'paper//night', 'paper\nnight'])
      expect(() => validateManifest(manifest([{ src: 'public/a.webp', group }]))).toThrow(/invalid group/);
  });
  test("keys track source content, scale, model and complete prompt", () => {
    const key = cacheKey(new Uint8Array([1, 2]), 2, 'model', 'prompt');
    expect(cacheKey(new Uint8Array([1, 2]), 2, 'model', 'prompt')).toBe(key);
    expect(cacheKey(new Uint8Array([1, 3]), 2, 'model', 'prompt')).not.toBe(key);
    expect(cacheKey(new Uint8Array([1, 2]), 2.3, 'model', 'prompt')).not.toBe(key);
    expect(cacheKey(new Uint8Array([1, 2]), 2, 'other', 'prompt')).not.toBe(key);
    expect(cacheKey(new Uint8Array([1, 2]), 2, 'model', 'prompt\nnote')).not.toBe(key);
  });
  test("output siblings preserve the source stem and resolved scale", () => {
    expect(outputPath({ src: 'public/kit/a.paint.png', factor: 2 })).toBe('public/kit/a.paint@2x.webp');
    expect(outputPath({ src: 'public/kit/a.jpeg', factor: 2.3 })).toBe('public/kit/a@2.3x.webp');
  });
  test("rejects invalid CLI worker counts and acceptance thresholds", () => {
    for (const jobs of ['0', '-1', '1.5', 'NaN']) expect(() => cliOptions(['--jobs', jobs])).toThrow(/jobs/);
    for (const mae of ['-1', 'NaN', 'Infinity']) expect(() => cliOptions(['--max-mae', mae])).toThrow(/max-mae/);
    expect(() => cliOptions(['--verify'])).toThrow(/requires --remerge/);
  });
  test("bounded workers finish outstanding work before reporting failures", async () => {
    const completed: number[] = [];
    let active = 0, maximum = 0;
    await expect(mapJobs([0, 1, 2, 3, 4], 2, async (value: number) => {
      active++; maximum = Math.max(maximum, active);
      await Promise.resolve();
      active--; completed.push(value);
      if (value === 0) throw new Error('synthetic failure');
      return value * 2;
    })).rejects.toThrow(/synthetic failure/);
    expect(completed.toSorted()).toEqual([0, 1, 2, 3, 4]);
    expect(maximum).toBe(2);
    expect(await mapJobs([1, 2], 2, async (v: number) => v * 2)).toEqual([2, 4]);
  });
});


describe("hires offline shell", () => {
  test("gates on median, p90 and MAE with inclusive boundaries, ignoring max", () => {
    const stats = { gateable: true, postWarp: { median: 0.6, p90: 1, max: 5, reliableBlocks: 4, visibleBlocks: 20 }, blurredMae: 14 };
    expect(acceptanceReasons(stats, 'whole', 14)).toEqual([]);
    expect(acceptanceReasons({ ...stats, postWarp: { ...stats.postWarp, median: 0.61 } }, 'whole', 14).join()).toMatch(/residual median/);
    expect(acceptanceReasons({ ...stats, postWarp: { ...stats.postWarp, p90: 1.01 } }, 'whole', 14).join()).toMatch(/residual p90/);
    expect(acceptanceReasons({ ...stats, blurredMae: 14.01 }, 'tile 0', 14).join()).toMatch(/tile 0: blurred MAE/);
    expect(acceptanceReasons({ ...stats, gateable: false, blurredMae: 100 }, 'whole', 0)).toEqual([]);
  });
  test("requires three reliable blocks and 20% of visible blocks, including fractional thresholds", () => {
    const reasons = (reliableBlocks: number, visibleBlocks: number, gateable = true) => acceptanceReasons({ gateable, blurredMae: 0,
      postWarp: { median: 0, p90: 0, reliableBlocks, visibleBlocks } }, 'tile 0', 14);
    expect(reasons(2, 3).join()).toMatch(/cannot establish alignment.*need 3/);
    expect(reasons(3, 15)).toEqual([]);
    expect(reasons(3, 16).join()).toMatch(/cannot establish alignment.*need 4/);
    expect(reasons(4, 20)).toEqual([]);
    expect(reasons(0, 0, false)).toEqual([]);
    const source = rgb(240, 240, (x, y, c) => 120 + 30 * Math.sin(x * 0.31 + y * 0.17 + c) + 25 * Math.cos(y * 0.41 - x * 0.13 + c));
    const weights = Float32Array.from({ length: 240 * 240 }, (_, i) => i % 240 < 80 ? 1 : 0);
    const flow = estimateFlow(source, source, { weights });
    expect(flow.diagnostics.visibleBlocks).toBe(3);
    expect(flow.diagnostics.totalBlocks).toBe(9);
    expect(reasons(flow.diagnostics.reliableBlocks, flow.diagnostics.visibleBlocks)).toEqual([]);
  });
  test("skips below 1% weighted visibility but requires alignment evidence at exactly 1%", () => {
    const source = rgb(100, 100, () => 100);
    const weights = new Float32Array(10000);
    weights.fill(1, 0, 99);
    const gate = () => {
      const postWarp = estimateFlow(source, source, { weights }).diagnostics;
      return acceptanceReasons({ gateable: postWarp.gateable, postWarp, blurredMae: 0 }, 'whole', 14);
    };
    expect(gate()).toEqual([]);
    weights[99] = 1;
    expect(gate().join()).toMatch(/cannot establish alignment/);
  });
  test("remerge corrects cached global drift and accepts isolated redrawn texture", async () => {
    const root = await mkdtemp(join(tmpdir(), 'hires-'));
    try {
      await mkdir(join(root, 'public'));
      await mkdir(join(root, 'art/prompts/hires'), { recursive: true });
      await writeFile(join(root, 'art/prompts/hires/upscale.txt'), 'Faithful upscale.');
      const pattern = (x: number, y: number, c: number) => 120 + 30 * Math.sin(x * 0.31 + y * 0.17 + c) + 25 * Math.cos(y * 0.41 - x * 0.13 + c);
      const input = manifest([{ src: 'public/global.png', lossless: true }, { src: 'public/local.png', lossless: true }]);
      await writeFile(join(root, 'art/hires.json'), JSON.stringify(input));
      // Nine global blocks establish alignment; sixteen local blocks retain
      // matching neighbours around the isolated redrawn 80px block.
      const globalSize = 160, outputSize = globalSize * 2;
      const caches: string[] = [];
      for (const asset of validateManifest(input).assets) {
        const local = asset.src.includes('local'), width = local ? 320 : globalSize, height = width;
        const source = rgb(width, height, pattern);
        const encoded = await sharp(Buffer.from(Uint8Array.from(source.data, Math.round)), { raw: { width, height, channels: 3 } }).png().toBuffer();
        await writeFile(join(root, asset.src), encoded);
        const key = cacheKey(encoded, asset.factor, asset.model, 'Faithful upscale.\n');
        const cache = join(root, 'art/raw/hires', local ? 'local' : 'global', key.slice(0, 12));
        caches.push(cache);
        await mkdir(cache, { recursive: true });
        const output = rgb(width * 2, height * 2, (x, y, c) => {
          const sx = (x + 0.5) / 2 - 0.5, sy = (y + 0.5) / 2 - 0.5;
          const dx = local ? sx >= 160 && sx < 240 && sy >= 160 && sy < 240 ? 2 : 0 : 1.5;
          return pattern(sx - dx, sy, c);
        });
        await sharp(Buffer.from(Uint8Array.from(output.data, Math.round)), { raw: { width: output.width, height: output.height, channels: 3 } }).png().toFile(join(cache, 'tile-0.png'));
      }
      const invoke = async () => { throw new Error('remerge must not request images'); };
      expect(await main(['--remerge'], { root, invoke })).toBe(0);
      const global = JSON.parse(await readFile(join(caches[0], 'stats.json'), 'utf8'));
      expect(global.rejected).toBe(false);
      expect(global.tiles[0].preWarp.median).toBeGreaterThan(1.2);
      expect(global.tiles[0].postWarp.max).toBeLessThan(0.3);
      // Assert the written feature outcome, not just the registration diagnostic.
      const encoded = await sharp(join(root, 'public/global@2x.webp')).raw().toBuffer();
      const outputImage = { width: outputSize, height: outputSize, channels: 3, data: encoded };
      const encodedDown = await sharp(encoded, { raw: { width: outputSize, height: outputSize, channels: 3 } }).resize(globalSize, globalSize).raw().toBuffer();
      const source = rgb(globalSize, globalSize, pattern);
      const outputFlow = estimateFlow(source, { width: globalSize, height: globalSize, channels: 3, data: encodedDown });
      expect(outputFlow.diagnostics.max).toBeLessThan(0.6);
      // Encoding retains nonconstant painted detail after correction and tone matching.
      expect(Math.abs(outputImage.data[(200 * outputSize + 200) * 3] - outputImage.data[(220 * outputSize + 220) * 3])).toBeGreaterThan(5);
      const local = JSON.parse(await readFile(join(caches[1], 'stats.json'), 'utf8'));
      expect(local.tiles[0].postWarp.p90).toBeLessThan(0.6);
      expect(local.tiles[0].postWarp.reliableShare).toBeGreaterThan(0.8);
      expect(local.rejected).toBe(false);
      expect(local.reasons).toEqual([]);
      expect(await readdir(join(root, 'public'))).toContain('local@2x.webp');
      const lockPath = join(root, 'art/hires.lock.json');
      const lock = JSON.parse(await readFile(lockPath, 'utf8'));
      for (const asset of validateManifest(input).assets) {
        const source = await readFile(join(root, asset.src));
        expect(lock.assets[outputPath(asset)]).toEqual({
          sourceSha256: createHash('sha256').update(source).digest('hex'), factor: 2, model: 'gpt-image-2.5-sunburst',
          cacheKey: cacheKey(source, asset.factor, asset.model, 'Faithful upscale.\n'),
        });
      }
      const originalOutput = await readFile(join(root, 'public/global@2x.webp'));
      expect(await main(['--remerge', '--verify', '--only', 'global'], { root, invoke })).toBe(0);
      expect(await readFile(join(root, 'public/global@2x.webp'))).toEqual(originalOutput);
      expect(JSON.parse(await readFile(lockPath, 'utf8'))).toEqual(lock);
      await writeFile(join(root, 'public/global@2x.webp'), 'different shipped bytes');
      expect(await main(['--remerge', '--verify', '--only', 'global'], { root, invoke })).toBe(1);
      expect(await readFile(join(root, 'public/global@2x.webp'), 'utf8')).toBe('different shipped bytes');
      expect(JSON.parse(await readFile(lockPath, 'utf8'))).toEqual(lock);
    } finally { await rm(root, { recursive: true, force: true }); }
  }, 30_000);
  test("remerge encodes an almost transparent tile and explains why its gates were skipped", async () => {
    const root = await mkdtemp(join(tmpdir(), 'hires-'));
    try {
      await mkdir(join(root, 'public'));
      await mkdir(join(root, 'art/prompts/hires'), { recursive: true });
      await writeFile(join(root, 'art/prompts/hires/upscale.txt'), 'Faithful upscale.');
      const width = 64, height = 64;
      const rgba = new Uint8Array(width * height * 4);
      rgba.set([80, 120, 160, 255], (32 * width + 32) * 4);
      const source = await sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
      await writeFile(join(root, 'public/sparse.png'), source);
      await writeFile(join(root, 'art/hires.json'), JSON.stringify(manifest([{ src: 'public/sparse.png', lossless: true }])));
      const { assets: [asset] } = validateManifest(manifest([{ src: 'public/sparse.png', lossless: true }]));
      const key = cacheKey(source, asset.factor, asset.model, 'Faithful upscale.\n');
      const cache = join(root, 'art/raw/hires/sparse', key.slice(0, 12));
      await mkdir(cache, { recursive: true });
      const generated = rgb(128, 128, (x, y, c) => (x * 17 + y * 13 + c * 47) % 256);
      await sharp(Buffer.from(Uint8Array.from(generated.data)), { raw: { width: 128, height: 128, channels: 3 } }).png().toFile(join(cache, 'tile-0.png'));
      const invoke = async () => { throw new Error('remerge must never request images'); };
      expect(await main(['--remerge', '--max-mae', '0'], { root, invoke })).toBe(0);
      const stats = JSON.parse(await readFile(join(cache, 'stats.json'), 'utf8'));
      expect(stats.rejected).toBe(false);
      expect(stats.whole.gateable).toBe(false);
      expect(stats.tiles[0].gateable).toBe(false);
      expect(stats.tiles[0].blurredMae).toBeGreaterThan(0);
      expect(stats.reasons).toEqual([]);
      expect(stats.notes.join(' ')).toMatch(/whole: gate skipped: too little visible content/);
      expect(stats.notes.join(' ')).toMatch(/tile 0: gate skipped: too little visible content/);
      expect((await sharp(join(root, 'public/sparse@2x.webp')).metadata()).hasAlpha).toBe(true);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  test("rejects uncorrectable art, continues, retries once, restores alpha and reuses cache", async () => {
    const root = await mkdtemp(join(tmpdir(), 'hires-'));
    const calls: string[] = [];
    const width = 64, height = 64;
    const painting = (x: number, y: number, c: number) => 120 + 40 * Math.sin(x * 0.15 + y * 0.1 + c) + 35 * Math.cos(y * 0.21 - x * 0.1 + c);
    let retried = false;
    try {
      await mkdir(join(root, 'public'));
      await mkdir(join(root, 'art/prompts/hires'), { recursive: true });
      await writeFile(join(root, 'art/prompts/hires/upscale.txt'), 'Faithful upscale.');
      const bad = rgb(width, height, painting);
      await sharp(Buffer.from(Uint8Array.from(bad.data, Math.round)), { raw: { width, height, channels: 3 } }).png().toFile(join(root, 'public/bad.png'));
      const rgba = new Uint8Array(width * height * 4);
      for (let i = 0; i < width * height; i++) rgba.set([0, 1, 2].map((c) => Math.round(painting(i % width, Math.floor(i / width), c))).concat(i % width < 20 ? 0 : i % width < 40 ? 128 : 255), i * 4);
      await sharp(rgba, { raw: { width, height, channels: 4 } }).png().toFile(join(root, 'public/good.png'));
      await writeFile(join(root, 'art/hires.json'), JSON.stringify(manifest([
        { src: 'public/bad.png', lossless: true }, { src: 'public/good.png', lossless: true },
      ])));
      const invoke = async (_command: string, args: string[]) => {
        const argument = (name: string) => args[args.indexOf(name) + 1];
        const input = argument('--image'), output = argument('--out');
        calls.push(input.includes('/bad/') ? 'bad' : 'good');
        expect(args).toContain('--no-augment');
        expect(argument('--model')).toBe('gpt-image-2.5-sunburst');
        const [apiW, apiH] = argument('--size').split('x').map(Number);
        const info = await sharp(input).metadata();
        expect(info.channels).toBe(3);
        if (input.includes('/good/') && !retried) { retried = true; throw new Error('temporary offline fixture failure'); }
        if (input.includes('/bad/')) {
          const shifted = rgb(apiW, apiH, (x, y) => 120 + 110 * Math.sin(((x + 0.5) * width / apiW - 0.5) * 0.55 + ((y + 0.5) * height / apiH - 0.5) * 0.4));
          await sharp(Buffer.from(Uint8Array.from(shifted.data, Math.round)), { raw: { width: apiW, height: apiH, channels: 3 } }).png().toFile(output);
        } else await sharp(input).resize(apiW, apiH, { fit: 'fill' }).png().toFile(output);
      };
      expect(await main([], { root, invoke })).toBe(1);
      expect(calls).toEqual(['bad', 'good', 'good']);
      expect((await readdir(join(root, 'public'))).toSorted()).toEqual(['bad.png', 'good.png', 'good@2x.webp']);
      const encoded = await sharp(join(root, 'public/good@2x.webp')).metadata();
      expect([encoded.width, encoded.height, encoded.hasAlpha]).toEqual([128, 128, true]);
      const actualAlpha = await sharp(join(root, 'public/good@2x.webp')).extractChannel('alpha').raw().toBuffer();
      const expectedAlpha = await sharp(join(root, 'public/good.png')).extractChannel('alpha').resize(128, 128, { kernel: 'lanczos3' }).raw().toBuffer();
      expect(actualAlpha).toEqual(expectedAlpha);
      const badKey = (await readdir(join(root, 'art/raw/hires/bad')))[0];
      const stats = JSON.parse(await readFile(join(root, 'art/raw/hires/bad', badKey, 'stats.json'), 'utf8'));
      expect(stats.rejected).toBe(true);
      expect(stats.tiles[0].blurredMae).toBeGreaterThan(14);
      expect(stats.reasons.join(' ')).toMatch(/blurred MAE/);
      expect(await main(['--only', 'good'], { root, invoke })).toBe(0);
      expect(calls).toHaveLength(3);
      expect(await main(['--only', 'good', '--force'], { root, invoke })).toBe(0);
      expect(calls).toHaveLength(4);
      expect(await main(['--only', 'bad', '--accept'], { root, invoke })).toBe(0);
      expect(calls).toHaveLength(4);
      expect(JSON.parse(await readFile(join(root, 'art/hires.lock.json'), 'utf8')).assets['public/bad@2x.webp'].accepted).toBe(true);
      expect((await readdir(join(root, 'public')))).toContain('bad@2x.webp');
      const goodKey = (await readdir(join(root, 'art/raw/hires/good')))[0];
      const cache = join(root, 'art/raw/hires/good', goodKey);
      await rm(join(root, 'public/good@2x.webp'));
      await rm(join(cache, 'stats.json'));
      await rm(join(cache, 'master.png'));
      const neverInvoke = async () => { throw new Error('remerge must never request images'); };
      expect(await main(['--only', 'good', '--remerge', '--force'], { root, invoke: neverInvoke })).toBe(0);
      expect((await sharp(join(root, 'public/good@2x.webp')).metadata()).hasAlpha).toBe(true);
      expect(JSON.parse(await readFile(join(cache, 'stats.json'), 'utf8')).rejected).toBe(false);
      expect((await sharp(join(cache, 'master.png')).metadata()).width).toBe(128);
      await rm(join(cache, 'tile-0.png'));
      await rm(join(root, 'public/good@2x.webp'));
      const log = console.log, logs: string[] = [];
      console.log = (...args: unknown[]) => { logs.push(args.join(' ')); };
      try {
        expect(await main(['--only', 'good', '--remerge'], { root, invoke: neverInvoke })).toBe(0);
        expect(logs.join(' ')).toMatch(/SKIPPED --remerge; missing cached tiles: tile-0.png/);
        expect(logs.join(' ')).toMatch(/estimated requests 0/);
        expect(await readdir(join(root, 'public'))).not.toContain('good@2x.webp');
      } finally { console.log = log; }
    } finally { await rm(root, { recursive: true, force: true }); }
  }, 30_000);
});
