import { expect, test } from 'bun:test';
import sharp from 'sharp';
import { edgeStructure } from '../scripts/hires/structure.mjs';
import { straightenPixels } from '../scripts/straighten.mjs';
import { rasterEffect } from '../scripts/kit-raster.mjs';
import { edgeCatch } from '../scripts/state-light.mjs';
import { frameMask, scaleField } from '../scripts/framed-pane.mjs';

const line = (shift: (x: number) => number = () => 0, width = 256, height = 128) => {
  const profile = [0, 0, 24, 180, 255, 180, 24, 0, 0];
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const z = y - 36 - shift(x) + 4, j = Math.floor(z), f = z - j;
    const a = (profile[j] ?? 0) * (1 - f) + (profile[j + 1] ?? 0) * f;
    data.set([30, 40, 50, Math.round(a)], (y * width + x) * 4);
  }
  return { data, width, height, channels: 4 };
};
const transpose = (img: ReturnType<typeof line>) => {
  const data = Buffer.alloc(img.data.length);
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) img.data.copy(data, (x * img.height + y) * 4, (y * img.width + x) * 4, (y * img.width + x + 1) * 4);
  return { ...img, data, width: img.height, height: img.width };
};

for (const vertical of [false, true]) {
  const orient = (img: ReturnType<typeof line>) => vertical ? transpose(img) : img;
  test(`structure detects a one-device-pixel step (${vertical ? 'vertical' : 'horizontal'})`, () => {
    const reference = orient(line()), broken = orient(line(x => x < 128 ? 0 : 1));
    const gate = edgeStructure(reference, broken);
    expect(gate.passes).toBe(false);
    expect(gate.peak).toBeGreaterThan(gate.limit);
  });
  for (const kind of ['specks', 'notches']) test(`structure detects ${kind} along an edge (${vertical ? 'vertical' : 'horizontal'})`, () => {
    const reference = line(), broken = { ...reference, data: Buffer.from(reference.data) };
    for (let x = 32; x < 224; x += kind === 'specks' ? 12 : 40) {
      for (let y = 33; y <= (kind === 'specks' ? 34 : 39); y++) broken.data[(y * broken.width + x) * 4 + 3] = kind === 'specks' ? 220 : 0;
    }
    expect(edgeStructure(orient(reference), orient(broken)).passes).toBe(false);
  });
}

test('smooth subpixel wobble and clean resampled edge pass', async () => {
  const reference = line(), smooth = line(x => 0.8 * Math.sin(x / 30));
  expect(edgeStructure(reference, smooth).passes).toBe(true);
  const { data, info } = await sharp(reference.data, { raw: { width: reference.width, height: reference.height, channels: 4 } }).resize(512, 256, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  const enlarged = { data, width: info.width, height: info.height, channels: 4 };
  expect(edgeStructure(enlarged, enlarged).peak).toBe(0);
  const reduced = await sharp(data, { raw: { width: 512, height: 256, channels: 4 } }).resize(256, 128, { kernel: 'lanczos3' }).raw().toBuffer();
  const roundtrip = await sharp(reduced, { raw: { width: 256, height: 128, channels: 4 } }).resize(512, 256, { kernel: 'lanczos3' }).raw().toBuffer();
  expect(edgeStructure(enlarged, { ...enlarged, data: roundtrip }).passes).toBe(true);
});

test('structure is unaffected by empty canvas area and hidden RGB', () => {
  const reference = line(), broken = line(x => x < 128 ? 0 : 1);
  const wideReference = line(() => 0, 1024, 512), wideBroken = line(x => x < 128 ? 0 : 1, 1024, 512);
  expect(edgeStructure(reference, broken).peak).toBe(edgeStructure(wideReference, wideBroken).peak);
  const hidden = { ...reference, data: Buffer.from(reference.data) };
  for (let i = 0; i < hidden.data.length; i += 4) if (!hidden.data[i + 3]) hidden.data.fill(255, i, i + 3);
  expect(edgeStructure(reference, hidden).peak).toBe(0);
  expect(() => edgeStructure(reference, { ...broken, width: 20 })).toThrow(/matching RGBA/);
});

test('native straightening preserves continuous alpha across half-pixel shifts', () => {
  const image = line(x => 1.2 * Math.sin(x / 65));
  const info = { width: image.width, height: image.height, channels: 4 };
  const legacy = { ...image, data: straightenPixels({ data: image.data, info }, 16, 1) };
  const native = { ...image, data: straightenPixels({ data: image.data, info }, 16, 2) };
  const baseline = line();
  expect(edgeStructure(baseline, native).peak).toBeLessThan(10);
  expect(edgeStructure(baseline, legacy).peak).toBeGreaterThan(30);
});

test('interpolated logical membership does not promote faint native pixels to full frame', async () => {
  const width = 12, height = 12, data = Buffer.alloc(width * height * 4);
  data.set([85, 0, 0, 3], (5 * width + 3) * 4);
  const input = await sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
  const frame = { t: 2, b: 2, l: 2, r: 2 };
  const legacy = await frameMask(input, frame, { rivets: false, cleared: true });
  const logical = new Float32Array(6 * 6);
  const coverage = scaleField(logical, 6, 6, 1, 2);
  const native = await frameMask(input, frame, { rivets: false, cleared: true, coverage });
  expect(legacy.band[5 * width + 3]).toBe(1);
  expect(native.band[5 * width + 3]).toBe(0);
});

test('logical bevel lighting interpolates continuously across threshold changes', () => {
  const width = 24, height = 48, data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 3; x < width - 3; x++) data[(y * width + x) * 4 + 3] = x === 3 ? (y < 24 ? 127 : 129) : 255;
  const field = edgeCatch(data, width, height, 12, 2);
  let jump = 0;
  for (let y = 35; y < 60; y++) jump = Math.max(jump, Math.abs(field[y * width * 2 + 10] - field[(y - 1) * width * 2 + 10]));
  expect(jump).toBeLessThan(0.2);
  expect(Array.from(field).every(v => Number.isFinite(v) && v >= 0 && v <= 1)).toBe(true);
});


test('completed material effects retain native opaque detail and resolve changed translucent coverage', () => {
  const image = (rgba: number[], width: number, height: number) => ({ data: Buffer.from(rgba), info: { width, height, channels: 4 } });
  const before = image([80, 80, 80, 255], 1, 1), after = image([100, 100, 100, 255], 1, 1);
  const native = image([60, 60, 60, 255, 90, 90, 90, 255, 70, 70, 70, 255, 80, 80, 80, 255], 2, 2);
  expect(rasterEffect(native, before, after).data).toEqual(Buffer.from([80, 80, 80, 255, 110, 110, 110, 255, 90, 90, 90, 255, 100, 100, 100, 255]));
  expect(rasterEffect(native, before, before).data).toEqual(native.data);
  const transparent = image([255, 0, 0, 0], 1, 1), enamel = image([210, 180, 120, 200], 1, 1);
  const filled = rasterEffect(native, transparent, enamel).data;
  for (let i = 0; i < filled.length; i += 4) expect(Array.from(filled.subarray(i, i + 4))).toEqual([210, 180, 120, 200]);
  expect(rasterEffect(native, transparent, enamel).data).toEqual(filled);
  expect(() => rasterEffect(before, before, after)).toThrow(/exact 2x/);
});


test('periodic cross-banding is detected in luminance with unchanged opaque coverage', () => {
  const reference = line();
  for (let i = 0; i < reference.data.length; i += 4) {
    const value = 20 + reference.data[i + 3] * 0.8;
    reference.data.fill(value, i, i + 3);
    reference.data[i + 3] = 255;
  }
  const broken = { ...reference, data: Buffer.from(reference.data) };
  for (let x = 32; x < 224; x += 40) for (let y = 33; y <= 39; y++) broken.data.fill(20, (y * broken.width + x) * 4, (y * broken.width + x) * 4 + 3);
  const result = edgeStructure(reference, broken);
  expect(result.passes).toBe(false);
  expect(result.axes[0].location?.channel).toBe('luminance');
});
