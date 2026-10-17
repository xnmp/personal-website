import { expect, test } from 'bun:test';
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateManifest } from '../scripts/hires/manifest.mjs';
import { generatorName } from '../scripts/hires/lock.mjs';
import { srLuma } from '../scripts/hires/generators.mjs';
import { DEFAULT_SR_MODELS_DIR, SR_MODELS, verifySrWeights } from '../scripts/hires/sr.mjs';
import { main } from '../scripts/hires/upscale.mjs';

const SR = { type: 'sr', model: 'realesr-animevideov3' };
const manifest = (entry: Record<string, unknown>) => ({ version: 1, defaults: { external: { sizes: ['1254x1254'] } }, assets: [{ src: 'public/a.png', ...entry }] });

test('sr generators are accepted for standalone resample art with a known model', () => {
  expect(validateManifest(manifest({ provider: 'resample', generator: SR })).assets[0].generator).toEqual(SR);
  for (const entry of [
    { provider: 'resample', generator: { type: 'sr', model: 'realesrgan-x4plus' } },
    { provider: 'resample', generator: { type: 'sr', model: 'constructor' } },
    { provider: 'resample', generator: { type: 'sr' } },
    { provider: 'resample', generator: { ...SR, scale: 4 } },
    { provider: 'external', generator: SR },
    { provider: 'resample', generator: SR, periodic: true },
  ]) expect(() => validateManifest(manifest(entry))).toThrow();
});

test('locks name each resample generator, unchanged for existing generators', () => {
  const name = (generator?: object) => generatorName({ provider: 'resample', generator });
  expect(name(SR)).toBe('real-esrgan-ncnn/realesr-animevideov3');
  expect(name()).toBe('premultiplied-bilinear-v1');
  expect(name({ type: 'kit' })).toBe('kit-native-raster-v1');
  expect(name({ type: 'ink' })).toBe('kit-native-ink-v1');
  expect(name({ type: 'smooth-field' })).toBe('smooth-field-v1');
  expect(name({ type: 'sheen' })).toBe('framed-pane/sheen-v1');
});

test('model weights must be present and match their pins', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'hires-sr-weights-'));
  try {
    await expect(verifySrWeights(SR.model, dir)).rejects.toThrow(/not found/);
    for (const file of Object.keys(SR_MODELS['realesr-animevideov3'])) await writeFile(join(dir, file), 'other weights');
    await expect(verifySrWeights(SR.model, dir)).rejects.toThrow(/do not match the pinned SHA-256/);
    await expect(verifySrWeights('realesrgan-x4plus', dir)).rejects.toThrow(/unknown sr model/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

// Only where the optional local install exists.
if (existsSync(join(DEFAULT_SR_MODELS_DIR, 'realesr-animevideov3-x2.bin'))) test('installed weights match their pins', async () => {
  await verifySrWeights(SR.model, DEFAULT_SR_MODELS_DIR);
});

test('srLuma keeps model luma and alpha but takes colour from the reference where it is opaque', () => {
  const px = (...v: number[]) => ({ data: Buffer.from(v), width: v.length / 4, height: 1, channels: 4 });
  const luma = (d: Buffer, i: number) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  // Pixel 0: orange-tinted model over a gold reference. Pixel 1: reference transparent.
  const model = px(240, 150, 40, 255, 240, 150, 40, 128);
  const reference = px(214, 168, 74, 255, 0, 0, 0, 0);
  const out = srLuma(model, reference).data;
  expect(Math.abs(luma(out, 0) - luma(model.data, 0))).toBeLessThan(1);
  expect(out[3]).toBe(255);
  // Same luma as the model, so compare chroma: the reference's R-Y and B-Y.
  expect(Math.abs((out[0] - luma(out, 0)) - (214 - luma(reference.data, 0)))).toBeLessThan(1.5);
  expect(Math.abs((out[2] - luma(out, 0)) - (74 - luma(reference.data, 0)))).toBeLessThan(1.5);
  expect([...out.subarray(4, 8)]).toEqual([240, 150, 40, 128]);
});

// Gold strokes on a transparent page, like the atlas border, drawn at 8x so the
// 1x source and the 2x a perfect model would return are both anti-aliased renders.
const [W, H, S] = [96, 64, 8];
const GOLD = [214, 168, 74];
const render = async (scale: number) => {
  const rgba = new Uint8Array(W * S * H * S * 4);
  for (let y = 0; y < H * S; y++) for (let x = 0; x < W * S; x++) {
    const [u, v] = [x / S, y / S];
    if ((v >= 6 && v < 9.5) || (u >= 6 && u < 9.5) || Math.abs(u - v - 20) < 1.6) rgba.set([...GOLD, 255], (y * W * S + x) * 4);
  }
  return sharp(await sharp(rgba, { raw: { width: W * S, height: H * S, channels: 4 } }).resize(W * scale, H * scale, { kernel: 'lanczos3' }).png().toBuffer()).png().toBuffer();
};
const transparent = () => sharp({ create: { width: W * 2, height: H * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });

type Fake = (input: string, output: string) => Promise<void>;
const fixture = async (fake: Fake) => {
  const root = await mkdtemp(join(tmpdir(), 'hires-sr-'));
  await mkdir(join(root, 'public'));
  await mkdir(join(root, 'art/prompts/hires'), { recursive: true });
  await writeFile(join(root, 'art/prompts/hires/upscale.txt'), 'Faithful upscale.');
  await writeFile(join(root, 'public/a.png'), await render(1));
  await writeFile(join(root, 'art/hires.json'), JSON.stringify(manifest({ provider: 'resample', generator: SR })));
  const calls: string[][] = [];
  const invoke = async (_command: string, args: string[]) => {
    calls.push(args);
    await fake(args[args.indexOf('-i') + 1], args[args.indexOf('-o') + 1]);
  };
  // The real weights are a local install; tests stand in for their verification.
  let srWeights = async () => {};
  const run = async (args: string[]) => {
    const [log, error] = [console.log, console.error], messages: string[] = [];
    console.log = console.error = (...m: unknown[]) => { messages.push(m.join(' ')); };
    try { return { code: await main(args, { root, invoke, srWeights: () => srWeights() }), messages: messages.join('\n') }; } finally { [console.log, console.error] = [log, error]; }
  };
  // Model files left in the asset's cache directories (including any temp dirs).
  const cachedSr = async () => {
    const base = join(root, 'art/raw/hires/a');
    const keys = await readdir(base).catch(() => [] as string[]);
    return (await Promise.all(keys.map(async (k) => (await readdir(join(base, k))).map((f) => `${k}/${f}`)))).flat().filter((p) => p.includes('/sr'));
  };
  return { root, calls, run, cachedSr, setWeights: (f: () => Promise<void>) => { srWeights = f; }, cleanup: () => rm(root, { recursive: true, force: true }) };
};
const faithful: Fake = async (_input, output) => writeFile(output, await render(2));
const shipped = (root: string) => readdir(join(root, 'public'));

test('an sr asset is written from the model output, locked under its model, and reuses the cached output', async () => {
  const f = await fixture(faithful);
  try {
    expect((await f.run([])).code).toBe(0);
    expect(f.calls).toHaveLength(1);
    expect(f.calls[0].join(' ')).toContain('-s 2 -n realesr-animevideov3');
    expect(await sharp(join(f.root, 'public/a@2x.webp')).metadata()).toMatchObject({ width: W * 2, height: H * 2, hasAlpha: true });
    const lock = JSON.parse(await readFile(join(f.root, 'art/hires.lock.json'), 'utf8'));
    expect(lock.assets['public/a@2x.webp'].model).toBe('real-esrgan-ncnn/realesr-animevideov3');
    expect((await f.cachedSr()).map((p) => p.split('/')[1])).toEqual(['sr.png']);
    // Reprocessing reuses the cached model output rather than running the model again.
    expect((await f.run(['--force'])).code).toBe(0);
    expect((await f.run(['--remerge', '--verify'])).messages).toMatch(/byte-identical/);
    expect(f.calls).toHaveLength(1);
    expect((await f.run(['--pending', '--dry'])).messages).toMatch(/Skipped 1 assets as up to date/);
  } finally { await f.cleanup(); }
});

test('--remerge never runs the model: without a cached output the asset is skipped', async () => {
  const f = await fixture(faithful);
  try {
    const result = await f.run(['--remerge']);
    expect(result.code).toBe(0);
    expect(result.messages).toMatch(/SKIPPED --remerge; missing cached sr output/);
    expect(f.calls).toHaveLength(0);
    expect(await shipped(f.root)).not.toContain('a@2x.webp');
  } finally { await f.cleanup(); }
});

test('unverified weights stop the run before the model is invoked', async () => {
  const f = await fixture(faithful);
  f.setWeights(async () => { throw new Error('sr weights do not match the pinned SHA-256'); });
  try {
    const result = await f.run([]);
    expect(result.code).toBe(1);
    expect(result.messages).toMatch(/pinned SHA-256/);
    expect(f.calls).toHaveLength(0);
  } finally { await f.cleanup(); }
});

test('a model that tints the strokes ships the same colour as a faithful one', async () => {
  // Orange tint at unchanged luma: R up, B down by 0.299/0.114 as much (+20 / -52).
  const tinted: Fake = async (_input, output) => {
    const { data, info } = await sharp(await render(2)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) if (data[i + 3]) { data[i] = Math.min(255, data[i] + 20); data[i + 2] = Math.max(0, data[i + 2] - 52); }
    await sharp(data, { raw: info }).png().toFile(output);
  };
  const strokeColour = async (fake: Fake) => {
    const f = await fixture(fake);
    try {
      expect((await f.run([])).code).toBe(0);
      const { data } = await sharp(join(f.root, 'public/a@2x.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const sum = [0, 0, 0]; let n = 0;
      for (let i = 0; i < data.length; i += 4) if (data[i + 3] === 255) { sum[0] += data[i]; sum[1] += data[i + 1]; sum[2] += data[i + 2]; n++; }
      expect(n).toBeGreaterThan(100);
      return sum.map((s) => s / n);
    } finally { await f.cleanup(); }
  };
  const [faithfulColour, tintedColour] = [await strokeColour(faithful), await strokeColour(tinted)];
  tintedColour.forEach((v, c) => expect(Math.abs(v - faithfulColour[c])).toBeLessThan(4));
});

test('a uniform model output (lost Vulkan device) is refused, even under --accept, and not cached', async () => {
  for (const background of [{ r: 0, g: 0, b: 0, alpha: 0 }, { r: 0, g: 0, b: 0, alpha: 1 }]) {
    const blank: Fake = (_input, output) => sharp({ create: { width: W * 2, height: H * 2, channels: 4, background } }).png().toFile(output).then(() => {});
    const f = await fixture(blank);
    try {
      const first = await f.run(['--accept']);
      expect(first.code).toBe(1);
      expect(first.messages).toMatch(/sr output is a uniform canvas/);
      expect(await shipped(f.root)).not.toContain('a@2x.webp');
      expect((await f.run([])).code).toBe(1);
      expect(f.calls).toHaveLength(2);
      expect(await f.cachedSr()).toEqual([]);
    } finally { await f.cleanup(); }
  }
});

test('model texture that a 2x downscale averages away still fails the structure gate', async () => {
  // A +-48 checkerboard at Nyquist on the strokes: invisible to the downscaled error gates.
  const textured: Fake = async (_input, output) => {
    const { data, info } = await sharp(await render(2)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4, d = (x + y) % 2 ? 48 : -48;
      if (data[i + 3] === 255) for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, Math.min(255, data[i + c] + d));
    }
    await sharp(data, { raw: info }).png().toFile(output);
  };
  const f = await fixture(textured);
  try {
    const result = await f.run([]);
    expect(result.code).toBe(1);
    expect(result.messages).toMatch(/ink structure/);
    expect(await shipped(f.root)).not.toContain('a@2x.webp');
  } finally { await f.cleanup(); }
});

test('a nonconforming model output is rejected and not cached, so the next run asks the model again', async () => {
  // A Vulkan device lost partway through leaves some tiles empty but still exits 0.
  const partial: Fake = async (_input, output) => {
    const { data, info } = await sharp(await render(2)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    data.fill(0, 0, info.width * 24 * 4);
    await sharp(data, { raw: info }).png().toFile(output);
  };
  let fake = partial;
  const f = await fixture((input, output) => fake(input, output));
  try {
    const result = await f.run([]);
    expect(result.code).toBe(1);
    expect(result.messages).toMatch(/ink premultiplied MAE/);
    expect(await shipped(f.root)).not.toContain('a@2x.webp');
    expect(await f.cachedSr()).toEqual([]);
    fake = faithful;
    expect((await f.run([])).code).toBe(0);
    expect(f.calls).toHaveLength(2);
    expect(await shipped(f.root)).toContain('a@2x.webp');
  } finally { await f.cleanup(); }
});

test('an output shipped under --accept is the one cached', async () => {
  const shifted: Fake = async (_input, output) => {
    await transparent().composite([{ input: await render(2), left: 6, top: 6 }]).png().toFile(output);
  };
  const f = await fixture(shifted);
  try {
    expect((await f.run([])).code).toBe(1);
    expect((await f.run(['--accept'])).code).toBe(0);
    const bytes = await readFile(join(f.root, 'public/a@2x.webp'));
    // Reprocessing reuses the accepted model output: same bytes, no new model run.
    expect((await f.run(['--force', '--accept'])).code).toBe(0);
    expect(f.calls).toHaveLength(2);
    expect(await readFile(join(f.root, 'public/a@2x.webp'))).toEqual(bytes);
  } finally { await f.cleanup(); }
});
