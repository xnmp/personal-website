import { expect, test } from 'bun:test';
import sharp from 'sharp';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { drawInk, rings } from '../scripts/ink.mjs';
import { frameMask, fillet, paneLight } from '../scripts/framed-pane.mjs';
import { nativeKit, scaleInk, scaleStateFlags } from '../scripts/kit-native.mjs';

const fixture = async (run: (dir: string) => Promise<void>) => {
  const dir = await mkdtemp(join(tmpdir(), 'hires-density-'));
  try { await run(dir); } finally { await rm(dir, { recursive: true, force: true }); }
};
const decode = async (path: string) => {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
};
const solid = (path: string, d: number, background = '#000000') => sharp({ create: {
  width: 96 * d, height: 96 * d, channels: 4, background,
} }).png().toFile(path);
const frame = (d: number) => ({ t: 8 * d, r: 8 * d, b: 8 * d, l: 8 * d });
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const crossing = (values: number[], level: number) => {
  const i = values.findIndex((v) => v < level);
  return i - 1 + (values[i - 1] - level) / (values[i - 1] - values[i]);
};
const transition = (values: number[]) => crossing(values, 0.1) - crossing(values, 0.9);
const doubles = (one: number, two: number, tolerance = 1) => {
  expect(one).toBeGreaterThan(0);
  expect(Math.abs(two - 2 * one)).toBeLessThanOrEqual(tolerance);
};

test('frame inset and feather retain their logical widths at native density', () => fixture(async (dir) => {
  const widths: number[][] = [];
  for (const d of [1, 2]) {
    const path = join(dir, `${d}.png`); await solid(path, d);
    const mask = await frameMask(path, frame(d), { rivets: false, feather: 6 * d });
    const profile = Array.from({ length: 24 * d }, (_, x) => mask.band[48 * d * mask.W + x]);
    widths.push([profile.filter((v) => v === 1).length, profile.filter((v) => v > 0 && v < 1).length + 1]);
  }
  doubles(widths[0][0], widths[1][0], 0);
  doubles(widths[0][1], widths[1][1], 0);
}));

test('glass glint, shadow offset and blur have twice the rendered extent', () => fixture(async (dir) => {
  const widths: number[][] = [];
  for (const d of [1, 2]) {
    const path = join(dir, `${d}.png`); await solid(path, d);
    const mask = await frameMask(path, frame(d), { rivets: false });
    const light = paneLight(mask, { dx: 5 * d, dy: 3 * d, soft: 2 * d, glintWidth: 5 * d }, d);
    const shadow = Array.from({ length: 32 * d }, (_, x) => light.shade[48 * d * mask.W + x]);
    const glint = Array.from({ length: 24 * d }, (_, x) => light.glint[48 * d * mask.W + mask.W - 8 * d - 1 - x]);
    widths.push([crossing(shadow, 0.5), transition(shadow), sum(glint)]);
  }
  widths[0].forEach((v, i) => doubles(v, widths[1][i], 1));
}));

test('fillet strip, keyline and soft edge scale in rendered pixels', () => fixture(async (dir) => {
  const widths: number[][] = [];
  for (const d of [1, 2]) {
    const path = join(dir, `${d}.png`), out = join(dir, `${d}-out.png`); await solid(path, d, '#202020');
    const mask = await frameMask(path, frame(d), { rivets: false });
    await fillet(path, mask, { width: 10 * d, key: 4 * d, color: 'ff0000', keyColor: '0000ff', grain: 0, crown: 0 }, out, { density: d });
    const img = await decode(out);
    const row = Array.from({ length: 20 * d }, (_, x) => [...img.data.subarray((48 * d * img.width + 8 * d + x) * 4, (48 * d * img.width + 8 * d + x) * 4 + 3)]);
    widths.push([row.filter(([r]) => r > 128).length, row.filter(([, , b]) => b > 128).length,
      transition(row.map(([r]) => r / 255))]);
  }
  widths[0].forEach((v, i) => doubles(v, widths[1][i], i === 2 ? 0.4 : 0));
}));

test('logical fillet material preserves a bright boundary despite sparse native hidden RGB', () => fixture(async (dir) => {
  let material: unknown;
  const widths: number[][] = [];
  for (const d of [1, 2]) {
    const width = 96 * d, px = Buffer.alloc(width * width * 4);
    for (let y = 0; y < width; y++) for (let x = 0; x < width; x++) {
      const inset = Math.min(x, y, width - 1 - x, width - 1 - y), i = (y * width + x) * 4;
      const metal = inset < 8 * d;
      const fringe = inset === 8 * d && (d === 1 || y % 3 === 0);
      px.set(metal ? [50, 40, 20, 255] : fringe ? [120, 110, 90, 2] : [0, 0, 0, 0], i);
    }
    const path = join(dir, `${d}.png`), out = join(dir, `${d}-out.png`);
    await sharp(px, { raw: { width, height: width, channels: 4 } }).png().toFile(path);
    const mask = await frameMask(path, frame(d), { rivets: false, cleared: true });
    await fillet(path, mask, { width: 10 * d, color: 'a06020', crown: 0, grain: 0.35 }, out,
      { density: d, ...(d === 2 ? { material } : { captureMaterial: (value: unknown) => { material = value; } }) } as never);
    const img = await decode(out);
    // Blue measures the white fringe independently of the warm enamel's red.
    const rows = [39, 40, 41].map((y) => sum(Array.from({ length: 6 * d }, (_, x) =>
      Math.max(0, img.data[((y * d) * width + 8 * d + x) * 4 + 2] - 21) / 234)));
    widths.push(rows);
  }
  widths[0].forEach((v, i) => doubles(v, widths[1][i], 0.4));
}));

const deriveFixture = async (dir: string, d: number, mode: string, flags: string[]) => {
  const path = join(dir, `${mode}-${d}.png`), out = join(dir, `${mode}-${d}.webp`);
  await sharp({ create: { width: 80 * d, height: 80 * d, channels: 4, background: '#000000' } })
    .extend({ top: 8 * d, bottom: 8 * d, left: 8 * d, right: 8 * d, background: '#0000' }).png().toFile(path);
  await promisify(execFile)('node', ['scripts/derive-state.mjs', path, out, mode, `--density=${d}`, ...scaleStateFlags(flags, d)],
    { env: { ...process.env, KIT_LOSSLESS: '1' } });
  return decode(out);
};

test('derived ring, halo, corner radius and focus feather scale in the output', () => fixture(async (dir) => {
  const widths: number[][] = [];
  for (const d of [1, 2]) {
    const img = await deriveFixture(dir, d, 'focus', ['--catch=0', '--sheen=0', '--ring=8:14', '--ring-radius=12', '--ring-color=ff0000', '--halo=18:22', '--halo-color=00ff00']);
    const row = Array.from({ length: 32 * d }, (_, x) => [...img.data.subarray((48 * d * img.width + (8 * d + x)) * 4, (48 * d * img.width + (8 * d + x)) * 4 + 3)]);
    const top = Array.from({ length: 40 * d }, (_, x) => img.data[((16 * d) * img.width + x) * 4]);
    widths.push([sum(row.map(([r]) => r / 255)), sum(row.map(([, g]) => g / 255)), top.findIndex((r) => r > 128), row.filter(([r]) => r > 0 && r < 255).length]);
  }
  widths[0].forEach((v, i) => doubles(v, widths[1][i], i === 3 ? 2 : 1.5));
}));

test('derived catch width and onset scale without changing lighting gain', () => fixture(async (dir) => {
  const widths: number[][] = [];
  for (const d of [1, 2]) {
    const img = await deriveFixture(dir, d, 'hover', ['--catch=1', '--sheen=0', '--catch-width=12']);
    const profile = Array.from({ length: 24 * d }, (_, x) => img.data[(48 * d * img.width + 8 * d + x) * 4]);
    widths.push([profile.findIndex((v) => v === 0), sum(profile.map((v) => v / 255)), profile.findIndex((v) => v < profile[0] - 1)]);
  }
  widths[0].forEach((v, i) => doubles(v, widths[1][i], 1));
}));

test('ink band, rounded corner and caption tail scale as visible geometry', () => fixture(async (dir) => {
  const ink = { radius: 12, bands: [[4, 'ffffff']], fill: null, tail: { x: 20, width: 20, depth: 16, tip: 15 } };
  const widths: number[][] = [];
  for (const d of [1, 2]) {
    const path = join(dir, `${d}.png`);
    await drawInk(path, 80 * d, 64 * d, rings(80 * d, 48 * d, scaleInk(ink, d), d));
    const img = await decode(path), alpha = (x: number, y: number) => img.data[(y * img.width + x) * 4 + 3] / 255;
    const top = Array.from({ length: 40 * d }, (_, x) => alpha(x, 0));
    const band = Array.from({ length: 20 * d }, (_, y) => alpha(40 * d, y));
    const tailRows = Array.from({ length: 16 * d }, (_, y) => Array.from({ length: 80 * d }, (_, x) => alpha(x, 48 * d + y)).some((a) => a > 0));
    widths.push([sum(band), top.findIndex((v) => v > 0.5), tailRows.filter(Boolean).length]);
  }
  widths[0].forEach((v, i) => doubles(v, widths[1][i], 2));
}));

// Exercise recipe resolution as well as the primitive fixtures above: a missed
// scaler must change an observed width even if the primitive draws correctly.
test('resolved native card settings preserve frame, enamel and keyline widths', () => fixture(async (dir) => {
  const widths: number[][] = [];
  for (const d of [1, 2]) {
    const kit = nativeKit({ type: 'kit', kit: 'solarpunk', name: 'sheet-card-night-focus' }, d) as unknown as { sheets: { frame: ReturnType<typeof frame>; fillet: { width: number; key: number; color: string } }[] };
    const entry = kit.sheets[0];
    const path = join(dir, `${d}.png`), out = join(dir, `${d}-out.png`); await solid(path, d, '#202020');
    const mask = await frameMask(path, entry.frame, { rivets: false });
    await fillet(path, mask, { ...entry.fillet, color: 'ff0000', keyColor: '0000ff', grain: 0, crown: 0 }, out, { density: d });
    const img = await decode(out);
    const row = Array.from({ length: 40 * d }, (_, x) => [...img.data.subarray((48 * d * img.width + x) * 4, (48 * d * img.width + x) * 4 + 3)]);
    widths.push([row.findIndex(([r]) => r > 128), row.filter(([r]) => r > 128).length, row.filter(([, , b]) => b > 128).length]);
  }
  widths[0].forEach((v, i) => doubles(v, widths[1][i], 0));
}));

// The final glaze must preserve the logical bright edge too: native alpha
// quantization can classify its second sample as pane and shade it away.
test('glazed logical material retains a two-pixel white fringe across sparse native alpha', () => fixture(async (dir) => {
  const { glaze, materialFrame } = await import('../scripts/framed-pane.mjs');
  let material: unknown;
  const widths: number[][] = [];
  for (const d of [1, 2]) {
    const width = 96 * d, px = Buffer.alloc(width * width * 4);
    for (let y = 0; y < width; y++) for (let x = 0; x < width; x++) {
      const inset = Math.min(x, y, width - 1 - x, width - 1 - y), i = (y * width + x) * 4;
      const metal = inset < 8 * d, fringe = inset === 8 * d && (d === 1 || y % 3 === 0);
      px.set(metal ? [50, 40, 20, 255] : fringe ? [120, 110, 90, 2] : [0, 0, 0, 0], i);
    }
    const path = join(dir, `${d}.png`), focused = join(dir, `${d}-focus.png`), out = join(dir, `${d}-glazed.webp`);
    await sharp(px, { raw: { width, height: width, channels: 4 } }).png().toFile(path);
    const mask = await frameMask(path, frame(d), { rivets: false, cleared: true });
    const keep = await fillet(path, mask, { width: 10 * d, color: 'f0a640', crown: 0, grain: 0.35 }, focused,
      { density: d, ...(d === 2 ? { material } : { captureMaterial: (value: unknown) => { material = value; } }) } as never);
    // Strong uniform shade isolates the protective frame classification from
    // unrelated blur falloff and makes a missing logical footprint observable.
    await glaze(focused, out, 0, mask, { shade: new Float32Array(width * width).fill(1), glint: new Float32Array(width * width) },
      { keep, shadeColor: '000000', shadeAlpha: 0.8, lightFrame: d === 2 ? materialFrame(material, d) : undefined });
    const img = await decode(out);
    widths.push([39, 40, 41].map((y) => Array.from({ length: 6 * d }, (_, x) =>
      img.data[((y * d) * width + 8 * d + x) * 4 + 2]).filter((blue) => blue >= 128).length));
  }
  expect(widths[0]).toEqual([1, 1, 1]);
  expect(widths[1]).toEqual([2, 2, 2]);
}));

test('resolved shadow offsets, blur and output padding double in the baked image', () => fixture(async (dir) => {
  const measurements: number[][] = [];
  for (const d of [1, 2]) {
    const kit = nativeKit({ type: 'ink', kit: 'ligne', name: 'tile-day-hover' }, d);
    const side = 32 * d, px = Buffer.alloc(side * side * 4);
    for (let y = 14 * d; y < 18 * d; y++) for (let x = 14 * d; x < 18 * d; x++) px.fill(255, (y * side + x) * 4, (y * side + x) * 4 + 4);
    const path = join(dir, `${d}.png`), out = join(dir, `${d}-shadow.png`);
    await sharp(px, { raw: { width: side, height: side, channels: 4 } }).png().toFile(path);
    await promisify(execFile)('node', ['scripts/paper-shadow.mjs', path, out, `--pad=${20 * d}`, `--ambient=${kit.tile.hover[0]}`, '--contact=0:0:1:0', '--tint=000000']);
    const img = await decode(out);
    expect([img.width, img.height]).toEqual([72 * d, 72 * d]);
    const samples = [];
    for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      if (img.data[i] === 0 && img.data[i + 3]) samples.push({ x, y, a: img.data[i + 3] });
    }
    const mass = sum(samples.map(({ a }) => a));
    const cx = sum(samples.map(({ x, a }) => x * a)) / mass, cy = sum(samples.map(({ y, a }) => y * a)) / mass;
    const sigma = Math.sqrt(sum(samples.map(({ x, a }) => (x - cx) ** 2 * a)) / mass);
    measurements.push([36 * d - 0.5 - cx, cy - (36 * d - 0.5), sigma]);
  }
  doubles(measurements[0][0], measurements[1][0], 0.01);
  doubles(measurements[0][1], measurements[1][1], 0.01);
  doubles(measurements[0][2], measurements[1][2], 0.2);
}));

test('native grain keeps fill bandwidth and printed texture wavelength at both densities', () => fixture(async (dir) => {
  const raw = join(dir, 'raw');
  await mkdir(join(raw, 'paper-day'), { recursive: true });
  await mkdir(join(raw, 'chip-day'), { recursive: true });
  await sharp({ create: { width: 16, height: 16, channels: 4, background: '#ffffff' } }).png().toFile(join(raw, 'chip-day/chip-day.png'));
  // Two known spatial frequencies separately exercise the broad high-pass and
  // fine softening scales. The source is large enough for direct native sampling.
  const size = 1920, px = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const value = Math.round(128 + 20 * Math.sin(2 * Math.PI * x / 160) + 20 * Math.sin(2 * Math.PI * x / 16));
    px.fill(value, (y * size + x) * 3, (y * size + x) * 3 + 3);
  }
  await sharp(px, { raw: { width: size, height: size, channels: 3 } }).png().toFile(join(raw, 'paper-day/paper-day.png'));
  const measurements: number[][] = [];
  for (const d of [1, 2]) {
    const out = join(dir, `out-${d}`);
    await promisify(execFile)('node', ['scripts/build-kit.mjs', 'ligne', '--ink=chip-day', `--density=${d}`, `--raw=${raw}`, `--out=${out}`, `--tmp=${dir}/work-${d}`]);
    const fill = await decode(join(out, 'paper-day.webp'));
    expect([fill.width, fill.height]).toEqual([768 * d, 768 * d]);
    const row = Array.from({ length: 320 * d }, (_, x) => fill.data[((512 * d) * fill.width + 384 * d + x) * 4]);
    const amplitude = (period: number) => 2 * Math.hypot(
      sum(row.map((v, x) => v * Math.sin(2 * Math.PI * x / period))),
      sum(row.map((v, x) => v * Math.cos(2 * Math.PI * x / period))),
    ) / row.length;
    const chip = await decode(join(out, 'chip-day.webp'));
    const grain = Array.from({ length: 100 * d }, (_, x) => chip.data[((40 * d) * chip.width + 24 * d + x) * 4]);
    const peaks = grain.flatMap((v, i) => i > 0 && i < grain.length - 1 && v > grain[i - 1] && v >= grain[i + 1] ? [i] : []);
    const periods = peaks.slice(1).map((p, i) => p - peaks[i]);
    measurements.push([amplitude(80 * d), amplitude(8 * d), sum(periods) / periods.length]);
  }
  expect(measurements[1][0] / measurements[0][0]).toBeCloseTo(1, 1);
  expect(measurements[1][1] / measurements[0][1]).toBeCloseTo(1, 1);
  doubles(measurements[0][2], measurements[1][2], 1);
}), 30_000);

// Rail density audit: corner, requested periods, patch, overlap, spliceOverlap,
// quiet.depth and its internal 12px chip window are lengths. Quilt strides and
// exclusion radii derive from patch/overlap; broad-tone sigma derives from blend.
// minCut's +/-1 row per column is a slope, not a length. Seed, tolerance, pool,
// quiet.share, choices and memory counts remain dimensionless.
test('quilted native strip doubles visible rail periods, corner blocks and rail depth', () => fixture(async (dir) => {
  const { lengthenRails } = await import('../scripts/mitre.mjs');
  const { scaleLengthen } = await import('../scripts/kit-native.mjs');
  const measures: number[][] = [];
  for (const d of [1, 2]) {
    const W = 96 * d, H = 80 * d, C = 12 * d, px = Buffer.alloc(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const corner = (x < C || x >= W - C) && (y < C || y >= H - C);
      const rail = Math.min(x, y, W - 1 - x, H - 1 - y) < C;
      px.set(corner ? [240, 20, 20, 255] : rail ? [20, 240, 20, 255] : [20, 20, 240, 255], (y * W + x) * 4);
    }
    const path = join(dir, `quilt-${d}.png`);
    await sharp(px, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path);
    await lengthenRails(path, scaleLengthen({ corner: 12, length: [128, 40], patch: 20, overlap: 6, seed: 3, pool: true }, d));
    const img = await decode(path);
    const row = Array.from({ length: img.width }, (_, x) => img.data[x * 4 + 1] > 128);
    const column = Array.from({ length: img.height }, (_, y) => img.data[(y * img.width) * 4 + 1] > 128);
    const depth = Array.from({ length: img.height / 2 }, (_, y) => img.data[(y * img.width + img.width / 2) * 4 + 1] > 128);
    measures.push([img.width, img.height, row.filter(Boolean).length, column.filter(Boolean).length, row.indexOf(true), depth.filter(Boolean).length]);
  }
  expect(measures[0]).toEqual([152, 64, 128, 40, 12, 12]);
  measures[0].forEach((v, i) => doubles(v, measures[1][i], 0));
}));

test('rail quilting overlap and depth double as rendered handover regions', () => fixture(async (dir) => {
  const { tileRails } = await import('../scripts/mitre.mjs');
  const { scaleTileRails } = await import('../scripts/kit-native.mjs');
  const measures: number[][] = [];
  for (const d of [1, 2]) {
    const W = 96 * d, H = 64 * d, C = 16 * d, O = 8 * d, px = Buffer.alloc(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      // A flat grey rail against a white far corner; one grey match in B
      // fixes the minimum cut halfway through the overlap at both densities.
      const bright = x >= W - C && !(x >= W - C + O / 2 && x < W - C + O / 2 + d);
      px.set([bright ? 240 : 40, 40, 40, 255], (y * W + x) * 4);
    }
    const path = join(dir, `tile-${d}.png`);
    await sharp(px, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path);
    await tileRails(path, scaleTileRails({ corner: 16, sides: ['t'], overlap: 8, depth: 10 }, d));
    const img = await decode(path);
    const row = Array.from({ length: O }, (_, x) => img.data[(C + x) * 4] > 128);
    const column = Array.from({ length: H }, (_, y) => img.data[(y * W + C) * 4] > 128);
    measures.push([row.filter(Boolean).length, column.filter(Boolean).length]);
  }
  expect(measures[0]).toEqual([4, 10]);
  measures[0].forEach((v, i) => doubles(v, measures[1][i], 0));
}));
