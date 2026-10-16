import { expect, test } from 'bun:test';
import sharp from 'sharp';
import { repairJunctions } from '../scripts/kit-junction.mjs';
import { rasterBase } from '../scripts/kit-raster.mjs';

const W = 48, H = 40;
const settings = { size: [W, H], horizontal: [14, 33], vertical: [13, 26], depth: 6, radius: 2 };
const fixture = () => ({
  info: { width: W, height: H, channels: 4 },
  data: Buffer.from(Array.from({ length: W * H }, (_, i) => {
    const x = i % W, y = Math.floor(i / W);
    return [60 + x + y, 80 + 2 * x + y, 20 + x, 255];
  }).flat()),
});
const inBand = (x: number, y: number) =>
  ((y < 6 || y >= H - 6) && settings.horizontal.some(c => Math.abs(x - c) <= 2)) ||
  ((x < 6 || x >= W - 6) && settings.vertical.some(c => Math.abs(y - c) <= 2));

test('intact smooth rail profiles and corner material survive declared junction repair', () => {
  const intact = fixture();
  expect(repairJunctions(intact, settings).data).toEqual(intact.data);
});

test('eight painted junction cuts are restored from intact rail profiles', () => {
  const intact = fixture(), cut = fixture();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inBand(x, y)) continue;
    for (let k = 0; k < 3; k++) cut.data[(y * W + x) * 4 + k] = 0;
  }
  expect(repairJunctions(cut, settings).data).toEqual(intact.data);
});

test('repair leaves all coverage and undeclared texture byte identical without mutating input', () => {
  const source = fixture();
  for (let i = 0; i < source.data.length; i++) source.data[i] = (i * 17 + (i % 11) * 31) % 256;
  const before = Buffer.from(source.data), fixed = repairJunctions(source, settings).data;
  expect(source.data).toEqual(before);
  const keptBefore: number[] = [], keptAfter: number[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = (y * W + x) * 4;
    for (let k = 0; k < 4; k++) if (k === 3 || !inBand(x, y)) {
      keptBefore.push(before[p + k]);
      keptAfter.push(fixed[p + k]);
    }
  }
  expect(keptAfter).toEqual(keptBefore);
});

test('wrong source dimensions and out-of-bounds restoration bands fail explicitly', () => {
  expect(() => repairJunctions(fixture(), { ...settings, size: [49, H] })).toThrow();
  expect(() => repairJunctions(fixture(), { ...settings, horizontal: [1] })).toThrow();
});

test('density one remains exactly the original raster even with native restoration configured', async () => {
  const source = fixture();
  const png = await sharp(source.data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  const expected = await rasterBase(png, { width: 20 }, 1);
  const actual = await rasterBase(png, { width: 20 }, 1, settings);
  expect(actual.data).toEqual(expected.data);
  expect(actual.info).toEqual(expected.info);
});
