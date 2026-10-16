import { expect, test } from 'bun:test';
import sharp from 'sharp';
import { kitConformance } from '../scripts/hires/generators.mjs';

test('native tail gate rejects a half-width hairline that passes MAE', async () => {
  const width = 128, height = 128;
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    data[i + 3] = 255;
    if (x === 64 && y >= 8 && y < 120) data.fill(192, i, i + 3);
  }
  const source = { data, width, height, channels: 4 };
  const enlarged = await sharp(data, { raw: { width, height, channels: 4 } }).resize(width * 2, height * 2, { kernel: 'lanczos3' }).raw().toBuffer();
  const baseline = { data: enlarged, width: width * 2, height: height * 2, channels: 4 };
  const broken = Buffer.alloc(enlarged.length);
  for (let y = 0; y < height * 2; y++) for (let x = 0; x < width * 2; x++) {
    const i = (y * width * 2 + x) * 4;
    broken[i + 3] = 255;
    if (x === 128 && y >= 16 && y < 240) broken.fill(192, i, i + 3);
  }
  const good = await kitConformance(source, baseline);
  const bad = await kitConformance(source, { ...baseline, data: broken });
  expect(good.passes).toBe(true);
  expect(bad.mae).toBeLessThan(bad.limit);
  expect(bad.tail).toBeLessThanOrEqual(bad.tailLimit);
  expect(bad.pixelTail).toBeGreaterThan(bad.pixelTailLimit);
  expect(bad.reasons).toHaveLength(1);
  expect(bad.reasons[0]).toContain('p99.9');
  expect(bad.passes).toBe(false);
});

test('native tail ignores hidden RGB and rejects incorrect output dimensions', async () => {
  const source = { data: Buffer.alloc(16), width: 2, height: 2, channels: 4 };
  const data = Buffer.from(Array.from({ length: 64 }, (_, i) => i % 4 === 3 ? 0 : 255));
  const output = { data, width: 4, height: 4, channels: 4 };
  expect((await kitConformance(source, output)).tail).toBe(0);
  await expect(kitConformance(source, source)).rejects.toThrow(/exact 2x/);
});

// Review counterexample: only 0.03% of a large canvas carries the stroke.
test('local tail catches a removed 300-pixel hairline on a 1000px canvas', async () => {
  const width = 1000, height = 1000;
  const data = Buffer.alloc(width * height * 4);
  for (let p = 0; p < width * height; p++) data[p * 4 + 3] = 255;
  for (let y = 350; y < 650; y++) data.fill(255, (y * width + 500) * 4, (y * width + 500) * 4 + 3);
  const source = { data, width, height, channels: 4 };
  const broken = Buffer.alloc(width * height * 16);
  for (let p = 0; p < width * height * 4; p++) broken[p * 4 + 3] = 255;
  const gate = await kitConformance(source, { data: broken, width: width * 2, height: height * 2, channels: 4 });
  expect(gate.mae).toBeLessThan(gate.limit);
  expect(gate.pixelTail).toBe(0);
  expect(gate.baselineTail).toBeLessThan(gate.tailLimit);
  expect(gate.tail).toBeGreaterThan(gate.tailLimit);
  expect(gate.reasons).toHaveLength(1);
  expect(gate.reasons[0]).toContain('max-3x3-mean');
  expect(gate.passes).toBe(false);
});

test('native rail seam gate checks only the repeating axis and catches a new join line', async () => {
  const { kitRailSeams } = await import('../scripts/hires/generators.mjs');
  const { resample } = await import('../scripts/hires/periodic.mjs');
  const width = 400, height = 400;
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    // Strong cross-rail edge is intentional, not a repeated-rail seam.
    data.set([y < 100 ? 220 : 20, 60, 80, 255], (y * width + x) * 4);
  }
  const source = { data, width, height, channels: 4 }, output = resample(source);
  const generator = { type: 'kit', kit: 'cyanotype', name: 'sheet-strip-day-normal' };
  expect((await kitRailSeams(source, output, generator))?.passes).toBe(true);
  const broken = { ...output, data: Buffer.from(output.data) };
  for (let y = 0; y < 304; y++) broken.data.fill(255, (y * broken.width + 304) * 4, (y * broken.width + 305) * 4);
  const seams = await kitRailSeams(source, broken, generator);
  expect(seams?.rails.find((rail: { side: string }) => rail.side === 't')?.passes).toBe(false);
  expect(seams?.passes).toBe(false);
});
