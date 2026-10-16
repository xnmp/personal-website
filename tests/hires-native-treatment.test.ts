import { expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { rasterEffect } from '../scripts/kit-raster.mjs';

const image = (pixels: number[][], width: number, height: number) => ({ data: Buffer.from(pixels.flat()), info: { width, height, channels: 4 } });

test('small focus changes preserve native outer-edge coverage and material', () => {
  const before = image([[100, 90, 70, 80]], 1, 1);
  const after = image([[102, 92, 72, 82]], 1, 1);
  const native = image([19, 70, 140, 230].map(a => [110, 100, 80, a]), 2, 2);
  const result = rasterEffect(native, before, after).data;
  for (let i = 0; i < result.length; i += 4) {
    expect(Math.abs(result[i + 3] - native.data[i + 3])).toBeLessThanOrEqual(3);
    expect(Math.abs(result[i] - native.data[i])).toBeLessThanOrEqual(3);
  }
});

test('whole-stroke recolouring keeps native antialiasing and texture', () => {
  const before = image([[80, 80, 80, 128]], 1, 1), after = image([[150, 60, 20, 128]], 1, 1);
  const native = image([[60, 60, 60, 0], [70, 70, 70, 19], [80, 80, 80, 180], [90, 90, 90, 255]], 2, 2);
  const result = rasterEffect(native, before, after).data;
  expect([result[3], result[7], result[11], result[15]]).toEqual([0, 19, 180, 255]);
  expect([...result.subarray(8, 11)]).toEqual([150, 60, 20]);
  expect(result[12] - result[8]).toBe(10);
});

test('coverage removal transfers the logical delta without replacing native geometry', () => {
  const before = image([[100, 100, 100, 200]], 1, 1), after = image([[100, 100, 100, 100]], 1, 1);
  const native = image([0, 40, 160, 240].map(a => [100, 100, 100, a]), 2, 2);
  const result = rasterEffect(native, before, after).data;
  expect([result[3], result[7], result[11], result[15]]).toEqual([0, 0, 60, 140]);
});

test('density-1 pressed disc matches the independently rendered dade298 oracle', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'kit-rounding-'));
  try {
    const width = 128, height = 128, data = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (Math.hypot(x - 64, y - 64) <= 10) data.set([200, 200, 200, 255], (y * width + x) * 4);
    await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(join(dir, 'disc.png'));
    await promisify(execFile)('node', ['scripts/derive-state.mjs', join(dir, 'disc.png'), join(dir, 'pressed.webp'), 'pressed', '--catch=0.45', '--catch-width=5.5', '--dim=0.9'], { env: { ...process.env, KIT_LOSSLESS: '1' } });
    const actual = await sharp(join(dir, 'pressed.webp')).ensureAlpha().raw().toBuffer();
    expect([...actual.subarray((59 * width + 59) * 4, (59 * width + 59) * 4 + 4)]).toEqual([139, 139, 139, 255]);
    // SHA256 of decoded RGBA from `git show dade298:scripts/derive-state.mjs`,
    // independently run with the fixture and flags above (Node, lossless WebP).
    expect(createHash('sha256').update(actual).digest('hex')).toBe('a5e6ccb3da84205d50b2937e82f695af1f71027e508f1e6ca7fd48e00568202e');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('explicit underpaint fills native gaps hidden by opaque logical material', () => {
  const logical = image([[100, 100, 100, 255]], 1, 1);
  const native = image([0, 122, 200, 255].map(a => [100, 100, 100, a]), 2, 2);
  const underlay = { width: 1, height: 1, data: new Float32Array([200, 100, 0, 255]) };
  const result = rasterEffect(native, logical, logical, underlay).data;
  expect([result[3], result[7], result[11], result[15]]).toEqual([255, 255, 255, 255]);
  expect([...result.subarray(0, 4)]).toEqual([200, 100, 0, 255]);
  expect([...result.subarray(4, 8)]).toEqual([152, 100, 48, 255]);
  expect([...result.subarray(12, 16)]).toEqual([100, 100, 100, 255]);
  const absent = { ...underlay, data: new Float32Array(4) };
  const untouched = rasterEffect(native, logical, logical, absent).data;
  expect([untouched[3], untouched[7], untouched[11], untouched[15]]).toEqual([0, 122, 200, 255]);
});


test('a one-level residual alpha change stays small at saturated logical coverage', () => {
  const before = image([[100, 100, 100, 254]], 1, 1), after = image([[100, 100, 100, 255]], 1, 1);
  const native = image([0, 19, 180, 255].map(a => [100, 100, 100, a]), 2, 2);
  const result = rasterEffect(native, before, after).data;
  expect([result[3], result[7], result[11], result[15]]).toEqual([1, 20, 181, 255]);
});
