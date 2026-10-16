import { describe, expect, test } from 'bun:test';
import sharp from 'sharp';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assetCacheKey, processingRecipe, validateManifest } from '../scripts/hires/manifest.mjs';
import { protectGlyphs, protectedStats } from '../scripts/hires/protect.mjs';
import { resample } from '../scripts/hires/periodic.mjs';
import { smoothField } from '../scripts/hires/generators.mjs';
import { lockEntry, lockMatches, outputPath, outputProof, sourceSha256 } from '../scripts/hires/lock.mjs';
import { currentCandidateKey, main, acceptanceReasons } from '../scripts/hires/upscale.mjs';
import { checkRepo } from '../scripts/hires/css.mjs';

const image = (w: number, h: number, pixel: (x: number, y: number) => number[] = () => [40, 90, 180, 255]) => ({ width: w, height: h, channels: 4,
  data: Uint8Array.from({ length: w * h * 4 }, (_, i) => pixel(Math.floor(i / 4) % w, Math.floor(i / 4 / w))[i % 4]) });
const png = (img: ReturnType<typeof image>) => sharp(Buffer.from(img.data), { raw: { width: img.width, height: img.height, channels: 4 } }).png().toBuffer();
const input = (assets: unknown[]) => ({ version: 1, defaults: {}, assets });
const rect = { x: 3, y: 3, w: 2, h: 2 };
const pixelAt = (img: ReturnType<typeof image>, x: number, y: number) => Array.from(img.data.slice((y * img.width + x) * 4, (y * img.width + x) * 4 + 4));
const generator = { type: 'smooth-field', from: 'public/quiet@2x.webp', median: 3, blur: 0.8, grain: 1, seed: 83 };
const never = async () => { throw new Error('unexpected paid request'); };
const fixture = async () => {
  const root = await mkdtemp(join(tmpdir(), 'hires-glyphs-'));
  for (const dir of ['public', 'art/prompts/hires', 'src/app']) await mkdir(join(root, dir), { recursive: true });
  await writeFile(join(root, 'art/prompts/hires/upscale.txt'), 'Faithful upscale.');
  return root;
};

describe('glyph protection validation and provenance', () => {
  test('rejects empty, malformed, fractional, negative, zero-size and out-of-bounds source rects', () => {
    const validate = (protect: unknown, protectFeather?: unknown) => validateManifest(input([{ src: 'public/a.png', protect, ...(protectFeather === undefined ? {} : { protectFeather }) }]), { 'public/a.png': { width: 8, height: 8 } });
    for (const protect of [[], null, [null], [{ ...rect, x: -1 }], [{ ...rect, y: -1 }], [{ ...rect, w: 0 }], [{ ...rect, h: -1 }],
      [{ ...rect, x: 1.1 }], [{ ...rect, w: 1.5 }], [{ ...rect, x: 7 }], [{ ...rect, y: 7 }], [{ ...rect, extra: 1 }], [{ x: 0, y: 0, w: 1 }]]) expect(() => validate(protect)).toThrow(/protect/);
    for (const feather of [-1, 65, 0.1, null, Infinity]) expect(() => validate([rect], feather)).toThrow(/protectFeather/);
    expect(validate([rect], 0).assets[0].protectFeather).toBe(0);
    expect(() => validateManifest(input([{ src: 'public/a.png', protectFeather: 6 }]))).toThrow(/protectFeather/);
  });
  test('glyphs requires resample; smooth-field requires a declared from output', () => {
    for (const provider of ['api', 'external']) expect(() => validateManifest(input([{ src: 'public/a.png', provider, external: { sizes: ['384x384'] }, glyphs: true }]))).toThrow(/glyphs/);
    expect(() => validateManifest(input([{ src: 'public/a.png', provider: 'resample', glyphs: 'true' }]))).toThrow(/glyphs/);
    for (const from of [undefined, '', '../outside@2x.webp', 'public/missing@2x.webp']) expect(() => validateManifest(input([{ src: 'public/a.png', provider: 'resample', generator: { ...generator, from } }]))).toThrow(/from/);
  });
  test('protect and feather invalidate locks without changing API or external tile keys', () => {
    for (const provider of ['api', 'external']) {
      const a = validateManifest(input([{ src: 'public/a.png', provider, external: { sizes: ['384x384'] }, protect: [rect] }])).assets[0];
      const bytes = Buffer.from('source'), output = Buffer.from('output');
      const proof = { outputBytes: output, sourceWidth: 8, sourceHeight: 8, width: 16, height: 16 };
      const entry = lockEntry(bytes, a, assetCacheKey(bytes, a, 'prompt'), { outputSha256: sourceSha256(output), width: 16, height: 16 });
      expect(lockMatches(entry, bytes, a, proof)).toBe(true);
      for (const b of [{ ...a, protect: [{ ...rect, x: 4 }] }, { ...a, protectFeather: 0 }, { ...a, protect: undefined }]) {
        expect(processingRecipe(b)).not.toEqual(processingRecipe(a));
        expect(assetCacheKey(bytes, b, 'prompt')).toBe(assetCacheKey(bytes, a, 'prompt'));
        expect(lockMatches(entry, bytes, b, proof)).toBe(false);
      }
    }
  });
});

describe('protected premultiplied composite', () => {
  const source = image(8, 8), master = image(16, 16, () => [200, 30, 10, 64]);
  test('copies the deterministic resample inside and leaves master bytes beyond the feather', () => {
    const baseline = resample(source), result = protectGlyphs(source, master, [rect], 2);
    for (let y = 6; y < 10; y++) for (let x = 6; x < 10; x++) expect(pixelAt(result, x, y)).toEqual(pixelAt(baseline, x, y));
    for (const [x, y] of [[0, 0], [3, 8], [12, 8], [8, 12]]) expect(pixelAt(result, x, y)).toEqual(pixelAt(master, x, y));
    expect(pixelAt(master, 8, 8)).toEqual([200, 30, 10, 64]);
  });
  test('smoothstep coverage increases monotonically toward the rect and blends premultiplied RGBA', () => {
    const result = protectGlyphs(source, master, [rect], 4);
    const alphas = [1, 2, 3, 4, 5, 6].map((x) => pixelAt(result, x, 8)[3]);
    expect(alphas).toEqual([...alphas].sort((a, b) => a - b));
    expect(new Set(alphas).size).toBe(6);
    const t = 1 - 0.5 / 4, weight = t * t * (3 - 2 * t), p = pixelAt(result, 5, 8);
    const a = 64 * (1 - weight), b = 255 * weight;
    expect(p[0]).toBe(Math.round((200 * a + 40 * b) / (a + b)));
    expect(p[3]).toBe(Math.round(a + b));
  });
  test('zero feather has a hard edge, including rectangles touching image borders', () => {
    const result = protectGlyphs(source, master, [{ x: 0, y: 0, w: 2, h: 8 }], 0);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) expect(pixelAt(result, x, y)).toEqual(pixelAt(x < 4 ? resample(source) : master, x, y));
  });
  test('overlapping regions use max coverage and transparent source RGB stays invisible', () => {
    const transparent = image(8, 8, () => [255, 0, 255, 0]);
    const one = protectGlyphs(transparent, master, [rect], 3), duplicate = protectGlyphs(transparent, master, [rect, rect], 3);
    expect(duplicate.data).toEqual(one.data);
    expect(pixelAt(one, 8, 8)).toEqual([0, 0, 0, 0]);
    const other = { x: 4, y: 3, w: 2, h: 2 };
    const union = protectGlyphs(source, master, [rect, other], 3);
    const a = protectGlyphs(source, master, [rect], 3), b = protectGlyphs(source, master, [other], 3);
    for (let x = 0; x < 16; x++) expect(pixelAt(union, x, 8)[3]).toBe(Math.max(pixelAt(a, x, 8)[3], pixelAt(b, x, 8)[3]));
  });
});

test('smooth-field is deterministic for the same bytes/options and responds to input and seed changes', async () => {
  const bytes = await png(image(12, 10));
  const first = await smoothField(bytes, generator);
  expect(first.data).toEqual((await smoothField(bytes, generator)).data);
  expect(first.data).not.toEqual((await smoothField(bytes, { ...generator, seed: 84 })).data);
  expect(first.data).not.toEqual((await smoothField(await png(image(12, 10, () => [80, 90, 100, 255])), generator)).data);
  expect([first.width, first.height, first.channels]).toEqual([12, 10, 4]);
});

const dependencyFixture = async () => {
  const root = await fixture();
  // Reverse declaration order to exercise dependency scheduling.
  const manifest = input([{ src: 'public/copy.png', provider: 'resample', generator, lossless: true }, { src: 'public/quiet.png', provider: 'resample', lossless: true }]);
  await writeFile(join(root, 'art/hires.json'), JSON.stringify(manifest));
  const assets = validateManifest(manifest).assets;
  const source = await png(image(8, 8));
  const output = await sharp(source).resize(16, 16).webp({ lossless: true }).toBuffer();
  for (const asset of assets) { await writeFile(join(root, asset.src), source); await writeFile(join(root, outputPath(asset)), output); }
  const entries = Object.fromEntries(assets.map((a: { src: string; factor: number }) => [outputPath(a), lockEntry(source, a, 'a'.repeat(64), { outputSha256: sourceSha256(output), width: 16, height: 16,
    ...(a.src.includes('copy') ? { dependencies: { [generator.from]: sourceSha256(output) } } : {}) })]));
  for (const asset of assets) entries[outputPath(asset)].cacheKey = await currentCandidateKey(asset, source, await readFile(join(root, 'art/prompts/hires/upscale.txt'), 'utf8'), root);
  const writeLock = () => writeFile(join(root, 'art/hires.lock.json'), JSON.stringify({ version: 1, assets: entries }));
  await writeLock();
  return { root, assets, source, output, entries, writeLock };
};

test('dependency byte changes invalidate locks, CSS provenance and pending without reprocessing a valid dependency', async () => {
  const f = await dependencyFixture();
  try {
    const asset = f.assets[0], entry = f.entries[outputPath(asset)];
    const proof = await outputProof(asset, f.source, f.output, f.root, f.assets);
    expect(lockMatches(entry, f.source, asset, proof)).toBe(true);
    const runPending = async () => {
      const processed: string[] = [];
      expect(await main(['--dry', '--pending', '--only', 'copy'], { root: f.root, invoke: never, processAsset: async (a: { src: string }) => { processed.push(a.src); return undefined; } })).toBe(0);
      return processed;
    };
    expect(await runPending()).toEqual([]);
    const changed = await sharp(await png(image(8, 8, () => [100, 110, 120, 255]))).resize(16, 16).webp({ lossless: true }).toBuffer();
    await writeFile(join(f.root, generator.from), changed);
    f.entries[generator.from].outputSha256 = sourceSha256(changed); await f.writeLock();
    expect(lockMatches(entry, f.source, asset, await outputProof(asset, f.source, f.output, f.root, f.assets))).toBe(false);
    expect(await runPending()).toEqual(['public/copy.png']);
    expect((await checkRepo(f.root)).flatMap((r: { issues: { kind: string; message: string }[] }) => r.issues).some((i: { kind: string; message: string }) => i.kind === 'provenance' && i.message.includes('copy@2x'))).toBe(true);
    await rm(join(f.root, generator.from));
    expect(await runPending()).toEqual(['public/quiet.png', 'public/copy.png']);
  } finally { await rm(f.root, { recursive: true, force: true }); }
});

test('only expands dependencies, processes them first and rejects output cycles', async () => {
  const f = await dependencyFixture();
  try {
    const processed: string[] = [];
    expect(await main(['--dry', '--only', 'copy'], { root: f.root, processAsset: async (a: { src: string }) => { processed.push(a.src); return undefined; } })).toBe(0);
    expect(processed).toEqual(['public/quiet.png', 'public/copy.png']);
    expect(() => validateManifest(input([{ src: 'public/copy.png', provider: 'resample', generator: { ...generator, from: 'public/copy@2x.webp' } }]))).toThrow(/cyclic/);
  } finally { await rm(f.root, { recursive: true, force: true }); }
});

test('dry processing refuses textured resamples except explicit glyphs and generators; locks record the exemption', async () => {
  const root = await fixture();
  try {
    await writeFile(join(root, 'public/a.png'), await png(image(256, 256, (x) => [x % 2 * 255, 90, 120, 255])));
    for (const extra of [{}, { glyphs: false }, { glyphs: true }, { generator: { type: 'sheen', color: 'ffe6a8', alpha: 0.3 } }]) {
      const manifest = input([{ src: 'public/a.png', provider: 'resample', ...extra }]);
      await writeFile(join(root, 'art/hires.json'), JSON.stringify(manifest));
      expect(await main(['--dry'], { root, invoke: never })).toBe('glyphs' in extra && extra.glyphs || 'generator' in extra ? 0 : 1);
      const asset = validateManifest(manifest).assets[0];
      expect(lockEntry(Buffer.from('a'), asset, 'a'.repeat(64)).glyphs).toBe(extra.glyphs || undefined);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('real dry planning includes a missing upstream output before its generator without writing files', async () => {
  const f = await dependencyFixture();
  try {
    await rm(join(f.root, generator.from));
    await rm(join(f.root, outputPath(f.assets[0])));
    expect(await main(['--dry', '--pending', '--only', 'copy'], { root: f.root, invoke: never })).toBe(0);
    expect((await readdir(join(f.root, 'public'))).sort()).toEqual(['copy.png', 'quiet.png']);
    expect(await readdir(join(f.root, 'art'))).not.toContain('raw');
  } finally { await rm(f.root, { recursive: true, force: true }); }
});

test('out-of-bounds protection fails dry processing before requests or cache writes', async () => {
  const root = await fixture();
  try {
    await writeFile(join(root, 'public/a.png'), await png(image(8, 8)));
    await writeFile(join(root, 'art/hires.json'), JSON.stringify(input([{ src: 'public/a.png', protect: [{ x: 7, y: 0, w: 2, h: 1 }] }])));
    expect(await main(['--dry'], { root, invoke: never })).toBe(1);
    expect(await readdir(join(root, 'art'))).not.toContain('raw');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('protection does not mutate Buffer-backed masters', () => {
  const master = { ...image(16, 16), data: Buffer.alloc(16 * 16 * 4, 100) }, before = Buffer.from(master.data);
  protectGlyphs(image(8, 8), master, [rect]);
  expect(master.data).toEqual(before);
});

test('protected conformance ignores transparent RGB and retains RGB MAE and visibility contracts', () => {
  const source = image(160, 160, (x) => x < 80 ? [100, 110, 120, 255] : [0, 0, 0, 0]);
  const target = image(160, 160, (x) => x < 80 ? [120, 130, 140, 255] : [255, 255, 255, 0]);
  const stats = protectedStats(source, target);
  expect(stats.blurredMae).toBeCloseTo(20, 4);
  expect(stats.visibleFraction).toBe(0.5);
  const invisible = image(160, 160, () => [255, 0, 255, 0]);
  const empty = protectedStats(image(160, 160, () => [0, 0, 0, 0]), invisible);
  expect(empty.blurredMae).toBe(0);
  expect(empty.gateable).toBe(false);
  expect(acceptanceReasons(empty, 'whole', 0)).toEqual([]);
});

test('conformance judges the protected image rather than discarded generated pixels', async () => {
  const source = image(160, 160, (x, y) => [120 + 35 * Math.sin(x * .31 + y * .17), 100 + 35 * Math.cos(y * .41 - x * .13), 100 + 30 * Math.sin(x * .4 + y * .3), 255]);
  const master = image(320, 320, () => [0, 0, 0, 255]);
  const protectedImage = protectGlyphs(source, master, [{ x: 0, y: 0, w: 160, h: 160 }]);
  const down = async (img: ReturnType<typeof image>) => ({ ...source, data: await sharp(Buffer.from(img.data), { raw: { width: img.width, height: img.height, channels: 4 } }).resize(160, 160).raw().toBuffer() });
  expect(acceptanceReasons(protectedStats(source, await down(master)), 'whole', 14).length).toBeGreaterThan(0);
  expect(acceptanceReasons(protectedStats(source, await down(protectedImage)), 'whole', 14)).toEqual([]);
});

test('scheduling respects both canonical-state and generator-output dependencies', async () => {
  const root = await fixture(), processed: string[] = [];
  try {
    const reference = 'public/normal.png';
    await writeFile(join(root, 'art/hires.json'), JSON.stringify(input([
      { src: 'public/state.png', family: 'button', reference, provider: 'resample', generator },
      { src: reference, family: 'button', reference, provider: 'resample' },
      { src: 'public/quiet.png', provider: 'resample' },
    ])));
    expect(await main(['--dry', '--only', 'state'], { root, processAsset: async (a: { src: string }) => { processed.push(a.src); return undefined; } })).toBe(0);
    expect(processed.indexOf('public/state.png')).toBeGreaterThan(processed.indexOf(reference));
    expect(processed.indexOf('public/state.png')).toBeGreaterThan(processed.indexOf('public/quiet.png'));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('a failed canonical output blocks family members and their downstream generators', async () => {
  const root = await fixture(), processed: string[] = [];
  try {
    const reference = 'public/normal.png';
    await writeFile(join(root, 'art/hires.json'), JSON.stringify(input([
      { src: 'public/copy.png', provider: 'resample', generator: { ...generator, from: 'public/state@2x.webp' } },
      { src: 'public/state.png', family: 'button', reference, provider: 'resample' },
      { src: reference, family: 'button', reference, provider: 'resample' },
    ])));
    expect(await main(['--dry', '--only', 'copy'], { root, processAsset: async (a: { src: string }) => {
      processed.push(a.src);
      if (a.src === reference) throw new Error('failed canonical');
      return undefined;
    } })).toBe(1);
    expect(processed).toEqual([reference]);
  } finally { await rm(root, { recursive: true, force: true }); }
});
