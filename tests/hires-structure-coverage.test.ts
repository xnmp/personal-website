import { expect, test } from 'bun:test';
import sharp from 'sharp';
import { edgeStructure } from '../scripts/hires/structure.mjs';

type Image = { data: Buffer; width: number; height: number; channels: 4 };
const image = (pixel: (x: number, y: number) => number[], width = 96, height = 96): Image => {
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data.set(pixel(x, y), (y * width + x) * 4);
  return { data, width, height, channels: 4 };
};
const change = (source: Image, mutate: (data: Buffer, width: number) => void) => {
  const data = Buffer.from(source.data); mutate(data, source.width); return { ...source, data };
};
const line = (sharpness = 1) => image((x, y) => [25, 30, 35, x >= 12 && x < 84 ? Math.round(255 * Math.max(0, Math.min(1, (3 - Math.abs(y - 40)) * sharpness))) : 0]);
const blur = async (input: Image, sigma: number) => ({ ...input, data: await sharp(input.data, { raw: { width: input.width, height: input.height, channels: 4 } }).blur(sigma).raw().toBuffer() });

test('new marks: quiet native texture passes; an opaque interior speck fails', () => {
  const reference = image(() => [150, 145, 140, 255]);
  const texture = image((x, y) => [150 + (x + y) % 5, 145, 140, 255]);
  expect(edgeStructure(reference, texture).passes).toBe(true);
  const speck = change(reference, (data, w) => {
    for (let y = 46; y < 49; y++) for (let x = 46; x < 49; x++) data.set([0, 0, 0, 255], (y * w + x) * 4);
  });
  expect(edgeStructure(reference, speck).added.passes).toBe(false);
});

test('clear regions: hidden colour passes; new visible coverage fails', () => {
  const reference = image(() => [0, 0, 0, 0]);
  expect(edgeStructure(reference, image((x, y) => [x, y, 200, 0])).passes).toBe(true);
  const speck = image((x, y) => [0, 0, 0, x >= 46 && x < 49 && y >= 46 && y < 49 ? 255 : 0]);
  expect(edgeStructure(reference, speck).added.passes).toBe(false);
});

test('line loss: independently sharper stroke passes; erased and broken strokes fail', () => {
  const reference = line(0.7);
  expect(edgeStructure(reference, line(1)).passes).toBe(true);
  expect(edgeStructure(reference, image(() => [0, 0, 0, 0])).lost.passes).toBe(false);
  const broken = change(reference, (data, w) => {
    for (let y = 35; y <= 45; y++) for (let x = 35; x < 52; x++) data[(y * w + x) * 4 + 3] = 0;
  });
  expect(edgeStructure(reference, broken).passes).toBe(false);
});

test('sharpness: mild resampling passes; a sigma-two blur fails', async () => {
  const reference = line();
  expect(edgeStructure(reference, await blur(reference, 0.5)).passes).toBe(true);
  expect(edgeStructure(reference, await blur(reference, 2)).lost.passes).toBe(false);
});

test('corners and junctions: native detail passes; a cut inside the former excluded corner fails', () => {
  const frame = (detail = 0) => image((x, y) => {
    const rail = x >= 12 && x <= 82 && y >= 12 && y <= 82 && (x < 18 || x > 76 || y < 18 || y > 76);
    return [80 + detail * ((x + y) % 3), 90, 100, rail ? 255 : 0];
  });
  const reference = frame();
  expect(edgeStructure(reference, frame(2), { inset: 36 }).passes).toBe(true);
  const cut = change(reference, (data, w) => {
    for (let y = 10; y < 20; y++) for (let x = 22; x < 25; x++) data[(y * w + x) * 4 + 3] = 0;
  });
  expect(edgeStructure(reference, cut, { inset: 36 }).passes).toBe(false);
});

test('coherent seams: smooth material variation passes; a straight cross-material step fails', () => {
  const material = (sample: (x: number, y: number) => number) => image((x, y) => [sample(x, y), sample(x, y), sample(x, y), 255]);
  const reference = material(() => 160);
  expect(edgeStructure(reference, material((x, y) => 160 + 5 * Math.sin(x / 8) + 3 * Math.cos(y / 9))).passes).toBe(true);
  const seam = material((x, y) => x >= 30 && x <= 65 && y >= 48 ? 210 : 160);
  expect(edgeStructure(reference, seam).coherent.passes).toBe(false);
});

test('chromatic marks: subtle colour detail passes; an isoluminant stripe fails', () => {
  const reference = image(() => [100, 100, 100, 255]);
  const recoloured = image((x, y) => [100 + (x + y) % 3, 100, 100, 255]);
  expect(edgeStructure(reference, recoloured).passes).toBe(true);
  const stripe = image((x, y) => x >= 36 && x < 56 && y >= 40 && y < 43 ? [160, 82, 100, 255] : [100, 100, 100, 255]);
  expect(edgeStructure(reference, stripe).passes).toBe(false);
});

test('parallel edges: a translated pair passes; removing one entire line fails', () => {
  const lines = (rows: number[]) => image((_x, y) => [0, 0, 0, rows.includes(y) ? 255 : 0]);
  const reference = lines([40, 44]);
  expect(edgeStructure(reference, lines([41, 45])).passes).toBe(true);
  expect(edgeStructure(reference, lines([44])).lost.passes).toBe(false);
});

test('flat patches cannot borrow texture allowance from a nearby edge', () => {
  const reference = image((_x, y) => [y === 30 ? 220 : 100, 100, 100, 255]);
  const detail = image((_x, y) => [y === 30 ? 225 : 100, 100, 100, 255]);
  expect(edgeStructure(reference, detail).passes).toBe(true);
  const newLine = image((_x, y) => [y === 30 || y === 42 ? 220 : 100, 100, 100, 255]);
  expect(edgeStructure(reference, newLine).passes).toBe(false);
});
