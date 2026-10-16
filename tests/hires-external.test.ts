import { describe, expect, test } from 'bun:test';
import sharp from 'sharp';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { planExternalTiles, normalizationSize } from '../scripts/hires/external.mjs';
import { assetCacheKey, cacheKey, validateManifest } from '../scripts/hires/manifest.mjs';
import { lockEntry, lockMatches } from '../scripts/hires/lock.mjs';
import { main } from '../scripts/hires/upscale.mjs';

const sizes = ['1254x1254'];
const asset = { src: 'public/kit/a.png', provider: 'external', external: { sizes } };
const manifest = (entry: unknown = asset, defaults = {}) => ({ version: 1, defaults, assets: [entry] });

describe('external geometry contracts', () => {
  for (const [width, height, count] of [[42, 28, 1], [644, 119, 2], [119, 644, 2], [1600, 1300, 9], [627, 627, 1]]) {
    test(`${width}x${height} retains all paint in ${count} padded requests`, () => {
      const plan = planExternalTiles({ width, height, factor: 2, sizes });
      expect([plan.outW, plan.outH]).toEqual([width * 2, height * 2]);
      expect(plan.tiles).toHaveLength(count);
      // Every source pixel is covered, including edges and intersections.
      const covered = new Uint8Array(width * height);
      for (const t of plan.tiles) {
        expect(sizes).toContain(`${t.requestW * 2}x${t.requestH * 2}`);
        expect(t.padLeft).toBeGreaterThanOrEqual(0); expect(t.padTop).toBeGreaterThanOrEqual(0);
        expect(t.padLeft + t.w).toBeLessThanOrEqual(t.requestW); expect(t.padTop + t.h).toBeLessThanOrEqual(t.requestH);
        expect([t.ox, t.oy, t.ow, t.oh]).toEqual([t.x * 2, t.y * 2, t.w * 2, t.h * 2]);
        for (let y = t.y; y < t.y + t.h; y++) covered.fill(1, y * width + t.x, y * width + t.x + t.w);
        const next = plan.tiles.find((n: typeof t) => n.y === t.y && n.x > t.x);
        if (next) expect(t.x + t.w - next.x).toBeGreaterThanOrEqual(64);
        const below = plan.tiles.find((n: typeof t) => n.x === t.x && n.y > t.y);
        if (below) expect(t.y + t.h - below.y).toBeGreaterThanOrEqual(64);
      }
      expect(covered.every(Boolean)).toBe(true);
    });
  }
  test('chooses allowed landscape geometry to avoid an unnecessary seam', () => {
    const plan = planExternalTiles({ width: 644, height: 119, factor: 2, sizes: ['1024x1024', '1536x1024'] });
    expect(plan.tiles).toHaveLength(1);
    expect([plan.tiles[0].apiW, plan.tiles[0].apiH]).toEqual([1536, 1024]);
  });
  test('skips an excessive candidate when another size can cover the image', () => {
    const plan = planExternalTiles({ width: 100100, height: 1, factor: 2, sizes: ['130x130', '1536x1024'] });
    expect(plan.tiles).toHaveLength(143);
    expect(plan.tiles.at(-1)!.x + plan.tiles.at(-1)!.w).toBe(100100);
  });
  test('normalizes proportional sizes and small rounding; rejects reframing', () => {
    const tile = { apiW: 1536, apiH: 1024 };
    expect(normalizationSize(900, 600, tile)).toEqual({ width: 1536, height: 1024 });
    expect(normalizationSize(1580, 1054, tile)).toEqual({ width: 1536, height: 1024 });
    for (const [w, h] of [[1024, 1024], [0, 10], [NaN, 600], [10000, 1]]) expect(() => normalizationSize(w, h, tile)).toThrow();
    expect(() => normalizationSize(1024, 1024, tile)).toThrow(/tile rejected, no stretching/);
  });
  test('rejects unsafe dimensions and unplannable overlap', () => {
    for (const width of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) expect(() => planExternalTiles({ width, height: 100, factor: 2, sizes })).toThrow();
    expect(() => planExternalTiles({ width: 100, height: 100, factor: 2, sizes: ['64x64'] })).toThrow(/overlap/);
    expect(() => planExternalTiles({ width: 100, height: 100, factor: 2, sizes, overlap: -1 })).toThrow(/overlap/);
  });
});

describe('external manifest and provenance contracts', () => {
  test('resolves provider/settings in defaults and per asset', () => {
    expect(validateManifest(manifest({ src: asset.src }, { provider: 'external', external: { sizes } })).assets[0]).toMatchObject(asset);
    expect(validateManifest(manifest({ ...asset, provider: 'api' }, { provider: 'external', external: { sizes } })).assets[0].provider).toBe('api');
    expect(validateManifest(manifest({ src: asset.src })).assets[0].provider).toBe('api');
  });
  test('malformed provider settings fail before any generation', () => {
    for (const entry of [
      { ...asset, provider: 'other' }, { ...asset, provider: null }, { ...asset, external: null }, { ...asset, external: {} },
      { ...asset, external: { sizes: [] } }, { ...asset, external: { sizes: ['0x1024'] } }, { ...asset, external: { sizes: ['1024x1024', '1024x1024'] } },
      { ...asset, external: { sizes: ['16384x16384'] } }, { ...asset, external: { sizes, extra: true } },
      { ...asset, factor: 1.5 }, { ...asset, external: { sizes: ['1580x995'] } }, { src: asset.src, provider: 'external' },
    ]) expect(() => validateManifest(manifest(entry))).toThrow(/assets\[0\]/);
    expect(() => validateManifest(manifest(asset, { provider: 'other' }))).toThrow(/defaults/);
  });
  test('API keys remain identical to the legacy byte contract; external settings isolate caches', () => {
    const bytes = Buffer.from('source'), a = validateManifest(manifest(asset)).assets[0];
    const legacy = createHash('sha256').update(bytes).update(JSON.stringify([2, a.model, 'prompt'])).digest('hex');
    expect(cacheKey(bytes, 2, a.model, 'prompt')).toBe(legacy);
    expect(assetCacheKey(bytes, { ...a, provider: 'api' }, 'prompt')).toBe(legacy);
    const key = assetCacheKey(bytes, a, 'prompt');
    expect(key).not.toBe(legacy);
    expect(assetCacheKey(bytes, { ...a, external: { sizes: ['1024x1024'] } }, 'prompt')).not.toBe(key);
    const proof = { outputBytes: bytes, sourceWidth: 1, sourceHeight: 1, width: 2, height: 2 };
    const oldLock = lockEntry(bytes, { ...a, provider: 'api' }, legacy);
    expect(lockMatches(oldLock, bytes, { ...a, provider: 'api' }, proof)).toBe(true);
    expect(lockMatches(oldLock, bytes, a)).toBe(false);
    const externalLock = lockEntry(bytes, a, key);
    expect(externalLock.provider).toBe('external');
    expect(lockMatches(externalLock, bytes, a, proof)).toBe(true);
    expect(lockMatches(externalLock, bytes, { ...a, provider: 'api' })).toBe(false);
  });
});

test('external batch emits requests without invoking the API, resumes, rejects wrong aspect, and publishes original alpha', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hires-external-'));
  const logs: string[] = [];
  const originalLog = console.log, originalError = console.error;
  console.log = (message: unknown) => { logs.push(String(message)); };
  const errors: string[] = [];
  console.error = (message: unknown) => { errors.push(String(message)); };
  let calls = 0;
  const invoke = async () => { calls++; throw new Error('API must never be used'); };
  try {
    await mkdir(join(root, 'public/kit'), { recursive: true });
    await mkdir(join(root, 'art/prompts/hires'), { recursive: true });
    await writeFile(join(root, 'art/prompts/hires/upscale.txt'), 'Faithful upscale.');
    // Keep nine registration blocks and real padding/normalization without
    // making this lifecycle test encode a production-sized request canvas.
    const batchAsset = { ...asset, external: { sizes: ['384x384'] } };
    await writeFile(join(root, 'art/hires.json'), JSON.stringify(manifest(batchAsset)));
    const width = 160, height = 160;
    const rgba = Buffer.from(Uint8Array.from({ length: width * height * 4 }, (_, i) => {
      const p = Math.floor(i / 4), x = p % width, y = Math.floor(p / width), c = i % 4;
      return c === 3 ? (x < 8 ? 0 : 255) : Math.round(120 + 35 * Math.sin(x * .31 + y * .17 + c) + 30 * Math.cos(y * .41 - x * .13 + c));
    }));
    await sharp(rgba, { raw: { width, height, channels: 4 } }).png().toFile(join(root, asset.src));
    expect(await main(['--only', asset.src], { root, invoke })).toBe(0);
    expect(calls).toBe(0);
    expect(logs.some((s) => s.startsWith('AWAITING 1 external tiles: '))).toBe(true);
    const path = logs.find((s) => s.startsWith('AWAITING'))!.split(': ').at(-1)!;
    const pending = JSON.parse(await readFile(path, 'utf8'));
    const request = pending.requests[0];
    expect(request).toMatchObject({ allowedSizes: batchAsset.external.sizes, factor: 2, width: 384, height: 384 });
    expect(request.prompt).toContain('Faithful upscale.');
    const info = await sharp(request.requestPath).metadata();
    expect([info.width, info.height, info.hasAlpha]).toEqual([192, 192, false]);
    expect(await readdir(join(root, 'public/kit'))).toEqual(['a.png']);
    logs.length = 0;
    expect(await main(['--requests', '--only', asset.src], { root, invoke })).toBe(0);
    expect(logs).toEqual([path]);
    expect(await main(['--force'], { root, invoke })).toBe(1);
    await sharp({ create: { width: 200, height: 100, channels: 3, background: '#aaa' } }).png().toFile(request.outputPath);
    expect(await main([], { root, invoke })).toBe(1);
    expect(errors.join()).toMatch(/aspect.*tile rejected, no stretching/);
    expect(await readdir(join(root, 'public/kit'))).toEqual(['a.png']);
    // Supply a faithfully scaled canvas at a different, matching resolution.
    await sharp(request.requestPath).resize(432, 432).png().toFile(request.outputPath);
    expect(await main([], { root, invoke })).toBe(0);
    expect(calls).toBe(0);
    const stats = JSON.parse(await readFile(join(path, '..', 'stats.json'), 'utf8'));
    expect(stats.whole.gateable).toBe(true);
    expect(stats.tiles[0].postWarp.reliableBlocks).toBeGreaterThanOrEqual(3);
    const alpha = await sharp(join(root, 'public/kit/a@2x.webp')).extractChannel('alpha').raw().toBuffer();
    const expectedAlpha = await sharp(rgba, { raw: { width, height, channels: 4 } }).extractChannel('alpha').resize(width * 2, height * 2, { kernel: 'lanczos3' }).raw().toBuffer();
    expect(alpha).toEqual(expectedAlpha);
    const lock = JSON.parse(await readFile(join(root, 'art/hires.lock.json'), 'utf8'));
    expect(lock.assets['public/kit/a@2x.webp'].provider).toBe('external');
    logs.length = 0;
    expect(await main(['--requests'], { root, invoke })).toBe(0);
    expect(logs).toEqual([]);
  } finally { console.log = originalLog; console.error = originalError; await rm(root, { recursive: true, force: true }); }
}, 30_000);
