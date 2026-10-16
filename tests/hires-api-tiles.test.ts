import { expect, test } from 'bun:test';
import sharp from 'sharp';
import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assetCacheKey, settingsDigest, validateManifest } from '../scripts/hires/manifest.mjs';
import { planTiles, API_LIMITS } from '../scripts/hires/tiles.mjs';
import { main } from '../scripts/hires/upscale.mjs';

const manifest = (entry: Record<string, unknown>) => ({ version: 1, defaults: { external: { sizes: ['1254x1254'] } }, assets: [{ src: 'public/kit/a.webp', ...entry }] });
const bytes = Buffer.from('source');

test('apiMaxPixels is accepted for API art within the API area limits', () => {
  expect(validateManifest(manifest({ provider: 'api', apiMaxPixels: 1_900_000 })).assets[0].apiMaxPixels).toBe(1_900_000);
});

test('apiMaxPixels is rejected outside the API limits, when fractional, or for other providers', () => {
  for (const entry of [
    { provider: 'api', apiMaxPixels: API_LIMITS.minPixels - 1 },
    { provider: 'api', apiMaxPixels: API_LIMITS.maxPixels + 1 },
    { provider: 'api', apiMaxPixels: 1_500_000.5 },
    { provider: 'api', apiMaxPixels: '1900000' },
    { provider: 'external', apiMaxPixels: 1_900_000 },
    { provider: 'resample', apiMaxPixels: 1_900_000 },
  ]) expect(() => validateManifest(manifest(entry))).toThrow(/apiMaxPixels/);
});

test('a capped frame is split into tiles that each respect the cap and together cover the output', () => {
  const cap = 1_900_000;
  const plan = planTiles({ width: 1664, height: 933, factor: 2, limits: { maxPixels: cap } });
  expect(plan.tiles.length).toBeGreaterThan(1);
  for (const t of plan.tiles) expect(t.apiW * t.apiH).toBeLessThanOrEqual(cap);
  expect(Math.min(...plan.tiles.map((t) => t.ox))).toBe(0);
  expect(Math.min(...plan.tiles.map((t) => t.oy))).toBe(0);
  expect(Math.max(...plan.tiles.map((t) => t.ox + t.ow))).toBe(plan.outW);
  expect(Math.max(...plan.tiles.map((t) => t.oy + t.oh))).toBe(plan.outH);
  // Uncapped, the same frame is one request: the cap is what splits it.
  expect(planTiles({ width: 1664, height: 933, factor: 2 }).tiles.length).toBe(1);
});

test('a tile cap gets its own paid-tile namespace, and uncapped identities are unchanged', () => {
  const [asset] = validateManifest(manifest({ provider: 'api' })).assets;
  const uncapped = assetCacheKey(bytes, asset, 'prompt');
  const capped = assetCacheKey(bytes, { ...asset, apiMaxPixels: 1_900_000 }, 'prompt');
  const otherCap = assetCacheKey(bytes, { ...asset, apiMaxPixels: 1_200_000 }, 'prompt');
  expect(new Set([uncapped, capped, otherCap]).size).toBe(3);
  // An absent cap must not perturb the historical key or settings digest: these
  // values predate the cap, and paid tiles and accepted locks are addressed by them.
  expect(uncapped).toBe('e439017eb67d9164566d7a1277d105f9baee554906011eabe3ab227946873bed');
  expect(settingsDigest(asset)).toBe('6fbabd152e4bc6fec41109397369c8385f926b38a4d5e788c374e2bf7de2430e');
  expect(assetCacheKey(bytes, { ...asset, apiMaxPixels: undefined }, 'prompt')).toBe(uncapped);
  expect(settingsDigest({ ...asset, apiMaxPixels: undefined })).toBe(settingsDigest(asset));
  expect(settingsDigest({ ...asset, apiMaxPixels: 1_900_000 })).not.toBe(settingsDigest(asset));
});

test('a capped asset is requested in capped tiles, verifies as up to date and remerges from its own cache', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hires-api-tiles-'));
  const [width, height, cap] = [800, 500, 1_000_000];
  const sizes: [number, number][] = [];
  const write = (entry: Record<string, unknown>) => writeFile(join(root, 'art/hires.json'), JSON.stringify({ version: 1, defaults: { external: { sizes: ['1254x1254'] } }, assets: [{ src: 'public/a.png', provider: 'api', lossless: true, ...entry }] }));
  const run = async (args: string[], invoke: (command: string, args: string[]) => Promise<void>) => {
    const [log, error] = [console.log, console.error], messages: string[] = [];
    console.log = console.error = (...m: unknown[]) => { messages.push(m.join(' ')); };
    try { return { code: await main(args, { root, apiMinPixels: 0, invoke }), messages: messages.join('\n') }; } finally { [console.log, console.error] = [log, error]; }
  };
  const never = async () => { throw new Error('must not request images'); };
  try {
    await mkdir(join(root, 'public'));
    await mkdir(join(root, 'art/prompts/hires'), { recursive: true });
    await writeFile(join(root, 'art/prompts/hires/upscale.txt'), 'Faithful upscale.');
    // Non-periodic value noise at two scales, so alignment has unambiguous 2D structure.
    const lattice = (x: number, y: number, c: number) => ((Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(c + 1, 83492791)) >>> 0) % 256;
    const noise = (x: number, y: number, c: number, cell: number) => {
      const [gx, gy] = [Math.floor(x / cell), Math.floor(y / cell)], [fx, fy] = [x / cell - gx, y / cell - gy];
      return (lattice(gx, gy, c) * (1 - fx) + lattice(gx + 1, gy, c) * fx) * (1 - fy) + (lattice(gx, gy + 1, c) * (1 - fx) + lattice(gx + 1, gy + 1, c) * fx) * fy;
    };
    const painting = Buffer.from(Array.from({ length: width * height * 3 }, (_, i) => {
      const p = Math.floor(i / 3), x = p % width, y = Math.floor(p / width), c = i % 3;
      return Math.round(0.6 * noise(x, y, c, 9) + 0.4 * noise(x, y, c, 4));
    }));
    await sharp(painting, { raw: { width, height, channels: 3 } }).png().toFile(join(root, 'public/a.png'));
    await write({ apiMaxPixels: cap });
    // A faithful provider: the requested canvas resized to the requested size.
    const invoke = async (_command: string, args: string[]) => {
      const argument = (name: string) => args[args.indexOf(name) + 1];
      const [apiW, apiH] = argument('--size').split('x').map(Number);
      sizes.push([apiW, apiH]);
      await sharp(argument('--image')).resize(apiW, apiH, { fit: 'fill' }).png().toFile(argument('--out'));
    };
    expect((await run([], invoke)).code).toBe(0);
    expect(sizes.length).toBeGreaterThan(1);
    for (const [w, h] of sizes) expect(w * h).toBeLessThanOrEqual(cap);
    expect(await sharp(join(root, 'public/a@2x.webp')).metadata()).toMatchObject({ width: 2 * width, height: 2 * height });

    // The lock proof reconstructs the capped request identity, so nothing is pending.
    expect((await run(['--pending', '--dry'], never)).messages).toMatch(/Skipped 1 assets as up to date[\s\S]*estimated API requests 0/);

    // Every capped tile is found again in the capped cache directory.
    await rm(join(root, 'public/a@2x.webp'));
    expect((await run(['--remerge', '--force'], never)).code).toBe(0);
    expect(await sharp(join(root, 'public/a@2x.webp')).metadata()).toMatchObject({ width: 2 * width, height: 2 * height });

    // Dropping the cap is a different request plan: it is pending, needs one
    // uncapped request, and never reuses the capped tiles.
    await write({});
    expect((await run(['--pending', '--dry'], never)).messages).toMatch(/estimated API requests 1\b/);
    expect((await readdir(join(root, 'art/raw/hires/a'))).length).toBe(1);
  } finally { await rm(root, { recursive: true, force: true }); }
}, 120_000);
