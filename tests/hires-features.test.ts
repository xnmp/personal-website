import { describe, expect, test } from 'bun:test';
import sharp from 'sharp';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assetCacheKey, cacheKey, processingRecipe, validateManifest } from '../scripts/hires/manifest.mjs';
import { canonicaliseTransparent, differenceMask, expandMask, registerState, outsideDifferences, stateRequestCrop, stateStats, derivationDigest } from '../scripts/hires/states.mjs';
import { PERIODIC_RECIPE, periodicHalo, resample, seamStats, wrapRegion } from '../scripts/hires/periodic.mjs';
import { gaussianBlur } from '../scripts/hires/merge.mjs';
import { generatorName, lockEntry, lockMatches, outputPath, sourceSha256 } from '../scripts/hires/lock.mjs';
import { main } from '../scripts/hires/upscale.mjs';
import { checkRepo, diagnostics, main as cssMain } from '../scripts/hires/css.mjs';
import { sheenImage } from '../scripts/framed-pane.mjs';

const rgba = (width: number, height: number, pixel: (x: number, y: number) => number[] = () => [70, 100, 130, 255]) => ({
  width, height, channels: 4,
  data: Uint8Array.from({ length: width * height * 4 }, (_, i) => pixel(Math.floor(i / 4) % width, Math.floor(i / 4 / width))[i % 4]),
});
const decode = async (bytes: Buffer) => {
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
};
const encode = (img: ReturnType<typeof rgba>) => sharp(Buffer.from(img.data), { raw: { width: img.width, height: img.height, channels: 4 } }).png().toBuffer();
const input = (assets: unknown[]) => ({ version: 1, defaults: {}, assets });
const family = (provider = 'resample') => ['normal', 'hover', 'pressed', 'focus', 'flat'].map((state) => ({
  src: `public/kit/key-${state}.png`, family: 'key/day', reference: 'public/kit/key-normal.png', provider, stateCrop: true,
  ...(provider === 'external' ? { external: { sizes: ['384x384'] }, stateDerivation: 'generate' } : {}),
}));
const fixture = async () => {
  const root = await mkdtemp(join(tmpdir(), 'hires-features-'));
  await Promise.all(['public/kit', 'art/prompts/hires', 'src/app'].map((dir) => mkdir(join(root, dir), { recursive: true })));
  await writeFile(join(root, 'art/prompts/hires/upscale.txt'), 'Faithful upscale.');
  return root;
};
const neverInvoke = async () => { throw new Error('provider invocation forbidden'); };

describe('registered state image contracts', () => {
  test('premultiplied difference ignores invisible RGB and includes alpha changes', () => {
    const normal = rgba(3, 1, () => [100, 20, 50, 0]);
    const state = rgba(3, 1, (x) => x === 0 ? [0, 255, 170, 0] : x === 1 ? [100, 20, 50, 1] : [100, 20, 50, 0]);
    expect(differenceMask(state, normal)).toEqual(new Uint8Array([0, 1, 0]));
    expect(expandMask(differenceMask(state, normal), 3, 1)).toEqual(new Uint8Array([0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0]));
  });
  test('copies every RGBA channel outside S2 and feathers only inward, retaining a one-pixel stroke', () => {
    const normal = rgba(5, 5), state = rgba(5, 5, (x, y) => x === 2 && y === 2 ? [170, 200, 230, 128] : [70, 100, 130, 255]);
    const reference = rgba(10, 10, () => [20, 30, 40, 64]), own = rgba(10, 10, () => [200, 210, 220, 255]);
    const result = registerState(state, normal, reference, own);
    const mask = expandMask(differenceMask(state, normal), 5, 5);
    expect(outsideDifferences(result, reference, mask)).toBe(0);
    const composite = (pixel: number[], background: number[]) => background.map((v, c) => pixel[c] * pixel[3] / 255 + v * (1 - pixel[3] / 255));
    const blended = Array.from<number>(result.data.slice((4 * 10 + 4) * 4, (4 * 10 + 4) * 4 + 4));
    for (const background of [[0, 0, 0], [240, 170, 90]]) {
      const a = composite([20, 30, 40, 64], background), b = composite([200, 210, 220, 255], background);
      composite(blended, background).forEach((v, c) => expect(Math.abs(v - (a[c] + b[c]) / 2)).toBeLessThan(1));
    }
    expect(outsideDifferences(own, reference, mask)).toBe(96);
    expect(registerState(normal, normal, reference, own).data).toEqual(reference.data);
    expect(reference.data[0]).toBe(20);
    const narrow = { ...reference, data: reference.data.slice() };
    narrow.data[(5 * 10 + 5) * 4]++;
    expect(stateStats(state, normal, reference, narrow, state).preservedSourcePixels).toBe(1);
  });
  test('half feather from transparent black to opaque blue retains its composited contribution', () => {
    const normal = rgba(3, 3, () => [0, 0, 0, 0]);
    const state = rgba(3, 3, (x, y) => x === 1 && y === 1 ? [0, 0, 255, 255] : [0, 0, 0, 0]);
    const result = registerState(state, normal, rgba(6, 6, () => [0, 0, 0, 0]), rgba(6, 6, () => [0, 0, 255, 255]));
    const pixel = Array.from<number>(result.data.slice((2 * 6 + 2) * 4, (2 * 6 + 2) * 4 + 4));
    expect(pixel).toEqual([0, 0, 255, 128]);
    for (const background of [[0, 0, 0], [255, 180, 100]]) {
      background.forEach((v, c) => expect(Math.abs(pixel[c] * pixel[3] / 255 + v * (1 - pixel[3] / 255) - (v + (c === 2 ? 255 : 0)) / 2)).toBeLessThan(1));
    }
  });
  test('outside gate and suppression compare visible premultiplied paint', () => {
    const normal = rgba(1, 1, () => [0, 0, 0, 0]), state = rgba(1, 1, () => [0, 0, 255, 255]);
    const reference = rgba(2, 2, () => [0, 0, 0, 0]), invisible = rgba(2, 2, () => [50, 80, 200, 0]);
    expect(outsideDifferences(invisible, reference, new Uint8Array(4))).toBe(0);
    expect(stateStats(state, normal, reference, invisible, state).suppressed).toBe(true);
    expect(outsideDifferences(rgba(2, 2, () => [0, 0, 0, 1]), reference, new Uint8Array(4))).toBe(4);
    expect(outsideDifferences(rgba(2, 2, () => [1, 0, 0, 1]), rgba(2, 2, () => [0, 0, 0, 1]), new Uint8Array(4))).toBe(4);
  });
  test('transparent canonicalisation is pure and preserves every visible RGBA value', () => {
    const source = rgba(3, 1, (x) => x === 0 ? [70, 100, 130, 0] : x === 1 ? [1, 2, 3, 1] : [200, 80, 50, 255]);
    expect(Array.from(canonicaliseTransparent(source).data)).toEqual([0, 0, 0, 0, 1, 2, 3, 1, 200, 80, 50, 255]);
    expect(Array.from(source.data.slice(0, 4))).toEqual([70, 100, 130, 0]);
    expect(() => canonicaliseTransparent({ ...source, channels: 3 })).toThrow();
  });
  test('request crop includes a bounded margin, rejects large changes, and handles empty masks', () => {
    const normal = rgba(100, 80), state = rgba(100, 80, (x, y) => x === 1 && y === 2 ? [90, 120, 140, 255] : [70, 100, 130, 255]);
    expect(stateRequestCrop(state, normal, 4)).toEqual({ x: 0, y: 0, w: 6, h: 7 });
    expect(stateRequestCrop(normal, normal)).toBeNull();
    expect(stateRequestCrop(rgba(100, 80, () => [0, 0, 0, 255]), normal)).toBeNull();
    for (const margin of [-1, NaN, Infinity, Number.MAX_SAFE_INTEGER]) expect(() => stateRequestCrop(state, normal, margin)).toThrow();
  });
  test('malformed images, masks and output scales fail without allocation', () => {
    for (const img of [null, {}, { ...rgba(1, 1), width: Number.MAX_SAFE_INTEGER }]) expect(() => differenceMask(img, rgba(1, 1))).toThrow();
    expect(() => differenceMask(rgba(1, 1), rgba(2, 1))).toThrow(/geometry/);
    expect(() => expandMask(new Uint8Array([2]), 1, 1)).toThrow();
    expect(() => registerState(rgba(1, 1), rgba(1, 1), rgba(1, 1), rgba(1, 1))).toThrow(/2x/);
    expect(() => registerState(rgba(1, 1), rgba(1, 1), rgba(2, 2), rgba(2, 2), 100000)).toThrow(/feather/);
  });
});

describe('periodic image contracts', () => {
  test('modular request padding retains exact paint at negative and repeated coordinates', () => {
    const source = rgba(2, 2, (x, y) => [x * 80, y * 90, 30, 255]);
    const result = wrapRegion(source, -3, -1, 7, 5);
    for (let y = 0; y < 5; y++) for (let x = 0; x < 7; x++) expect(Array.from(result.data.slice((y * 7 + x) * 4, (y * 7 + x) * 4 + 4))).toEqual([(x + 1) % 2 * 80, (y + 1) % 2 * 90, 30, 255]);
    for (const width of [0, Infinity, 1e12]) expect(() => wrapRegion(source, 0, 0, width, 5)).toThrow();
  });
  test('periodic Gaussian is shift equivariant at the wrap, unlike a clamped filter', () => {
    const source = rgba(12, 8, (x, y) => [x === 0 && y === 0 ? 255 : 0, 0, 0, 255]);
    const blurred = gaussianBlur(source, 1, true);
    expect(blurred.data[4]).toBeCloseTo(blurred.data[11 * 4], 5);
    expect(blurred.data[0]).toBeLessThan(gaussianBlur(source, 1).data[0]);
    const shifted = wrapRegion(source, 3, 2, 12, 8);
    const shiftBlur = gaussianBlur(shifted, 1, true);
    expect(shiftBlur.data).toEqual(wrapRegion(blurred, 3, 2, 12, 8).data);
  });
  test('periodic baseline retains a real edge slope and detects jumps and derivative kinks', () => {
    const source = rgba(32, 24, (x, y) => [Math.round(120 + 40 * Math.sin(x * Math.PI / 16)), Math.round(100 + 30 * Math.cos(y * Math.PI / 12)), 50, 255]);
    const baseline = resample(source, 2, true);
    expect(baseline.data[0]).not.toBe(baseline.data[(baseline.width - 1) * 4]);
    expect(seamStats(baseline, baseline).passes).toBe(true);
    for (const column of [0, 1, baseline.width - 2, baseline.width - 1]) {
      const damaged = { ...baseline, data: baseline.data.slice() };
      for (let y = 0; y < baseline.height; y++) damaged.data[(y * baseline.width + column) * 4] += 12;
      expect(seamStats(damaged, baseline).passes).toBe(false);
    }
    const small = { ...baseline, data: baseline.data.slice() };
    for (let y = 0; y < baseline.height; y++) small.data[y * baseline.width * 4]++;
    expect(seamStats(small, baseline).passes).toBe(true);
    expect(PERIODIC_RECIPE).toMatchObject({ halo: 32, rmsTolerance: 1, p99Tolerance: 2 });
    expect(() => seamStats(baseline, source)).toThrow(/geometry/);
  });
  test('smooth-map resampling is exact 2x, deterministic and premultiplies alpha', () => {
    const source = rgba(2, 1, (x) => x ? [255, 0, 0, 255] : [0, 255, 0, 0]);
    const result = resample(source);
    expect([result.width, result.height]).toEqual([4, 2]);
    expect(result.data).toEqual(resample(source).data);
    expect(Array.from(result.data.slice(4, 8))).toEqual([255, 0, 0, 64]);
    expect(() => resample(source, 8)).toThrow();
    expect(() => resample(null)).toThrow();
    expect(periodicHalo(4)).toBe(32);
    expect(periodicHalo(64)).toBe(112);
    for (const sigma of [0, Infinity, 65, 1e12]) expect(() => periodicHalo(sigma)).toThrow();
  });
});

describe('manifest and dependency provenance', () => {
  test('strictly validates family closure, feature combinations and analytic settings', () => {
    const assets = family();
    expect(validateManifest(input(assets)).assets.every((a: { lossless: boolean }) => a.lossless)).toBe(true);
    for (const change of [{ family: null }, { reference: null }, { reference: 'public/missing.png' }, { lossless: false }, { periodic: true }, { stateCrop: 1 }, { factor: 1.5 }, { family: 'bad id' }]) {
      expect(() => validateManifest(input([{ ...assets[0], ...change }, ...assets.slice(1)]))).toThrow();
    }
    for (const entry of [{ src: 'public/a.png', stateCrop: true }, { src: 'public/a.png', periodic: null },
      { src: 'public/a.png', provider: 'resample', generator: null }, { src: 'public/a.png', provider: 'resample', generator: { type: 'sheen', color: 'bad', alpha: 0.5 } }]) expect(() => validateManifest(input([entry]))).toThrow();
    expect(() => validateManifest(input([assets[1]]))).toThrow(/canonical/);
  });
  test('legacy API/external keys remain fixed; only present recipes enter new keys', () => {
    const bytes = Buffer.from('source'), a = validateManifest(input([{ src: 'public/a.png' }])).assets[0];
    expect(processingRecipe(a)).toBeNull();
    expect(assetCacheKey(bytes, a, 'prompt')).toBe(cacheKey(bytes, 2, a.model, 'prompt'));
    const periodic = { ...a, periodic: true };
    expect(assetCacheKey(bytes, periodic, 'prompt')).not.toBe(assetCacheKey(bytes, a, 'prompt'));
    expect(assetCacheKey(bytes, periodic, 'prompt')).not.toBe(assetCacheKey(bytes, { ...periodic, sigma: 3 }, 'prompt'));
    const external = { ...a, provider: 'external', external: { sizes: ['1254x1254'] } };
    const legacy = { ...lockEntry(bytes, external, 'a'.repeat(64)), model: a.model };
    expect(lockMatches(legacy, bytes, external)).toBe(true);
    expect(lockEntry(bytes, external, 'a'.repeat(64)).model).toBe('codex-image_gen');
    expect(generatorName({ ...a, provider: 'resample' })).toMatch(/bilinear/);
  });
  test('lockMatches recomputes derivation dependency and recipe digests, output hash and dimensions', () => {
    const asset = validateManifest(input(family())).assets[1];
    const bytes = Buffer.from('state'), normal = Buffer.from('normal'), output = Buffer.from('state2'), ref = Buffer.from('normal2');
    const proof = { outputBytes: output, referenceBytes: normal, referenceOutputBytes: ref, sourceWidth: 10, sourceHeight: 20, width: 20, height: 40 };
    const entry = lockEntry(bytes, asset, 'a'.repeat(64), { outputSha256: sourceSha256(output), width: 20, height: 40, derivationDigest: derivationDigest(bytes, normal, ref, asset.sigma) });
    expect(lockMatches(entry, bytes, asset, proof)).toBe(true);
    for (const change of [{ referenceBytes: Buffer.from('new normal') }, { referenceOutputBytes: Buffer.from('new normal2') }, { outputBytes: Buffer.from('tampered') }, { width: 19 }, { sourceHeight: 21 }]) expect(lockMatches(entry, bytes, asset, { ...proof, ...change })).toBe(false);
    expect(lockMatches(entry, bytes, { ...asset, sigma: 5 }, proof)).toBe(false);
    expect(lockMatches({ ...entry, derivationDigest: 'f'.repeat(64) }, bytes, asset, proof)).toBe(false);
    expect(lockMatches(entry, bytes, asset)).toBe(false);
    const members = family();
    for (const changed of [members.filter((_, i) => i !== 4), [...members, { ...members[1], src: 'public/kit/key-extra.png' }]]) {
      const changedAsset = validateManifest(input(changed)).assets.find((a: { src: string }) => a.src === asset.src);
      expect(lockMatches(entry, bytes, changedAsset, proof)).toBe(false);
    }
    const reordered = validateManifest(input(members.toReversed())).assets.find((a: { src: string }) => a.src === asset.src);
    expect(lockMatches(entry, bytes, reordered, proof)).toBe(true);
    expect(lockMatches({ ...entry, familyMembership: { ...entry.familyMembership, reference: members[1].src } }, bytes, asset, proof)).toBe(false);
    expect(lockMatches({ ...entry, familyMembership: undefined }, bytes, asset, proof)).toBe(false);
  });
});

test('deterministic family ships registered lossless outputs; CSS withholds every member on stale dependencies', async () => {
  const root = await fixture();
  try {
    const entries = family(), { assets } = validateManifest(input(entries));
    await writeFile(join(root, 'art/hires.json'), JSON.stringify(input(entries)));
    const normal = rgba(64, 64);
    for (const [i, asset] of assets.entries()) await writeFile(join(root, asset.src), await encode(i ? rgba(64, 64, (x, y) => x >= 25 && x < 39 && y >= 25 && y < 39 ? [70 + 4 * i, 100, 130, 255] : [70, 100, 130, 255]) : normal));
    await writeFile(join(root, 'src/app/kit.css'), `.key {\n  --key: url(/kit/key-normal.png);\n  --hover: url(/kit/key-hover.png);\n  border-image: var(--key) 8 fill / 4px;\n}`);
    expect(await main(['--only', 'key-hover', '--accept'], { root, invoke: neverInvoke })).toBe(0);
    const reference = await decode(await readFile(join(root, outputPath(assets[0]))));
    for (const asset of assets.slice(1)) {
      const state = await decode(await readFile(join(root, asset.src)));
      const shipped = await decode(await readFile(join(root, outputPath(asset))));
      expect(outsideDifferences(shipped, reference, expandMask(differenceMask(state, normal), 64, 64))).toBe(0);
      expect(shipped.data).not.toEqual(reference.data);
    }
    const results = await checkRepo(root);
    expect(results[1].css).toContain('image-set(url(/kit/key-normal@2x.webp) 2x)');
    const lock = JSON.parse(await readFile(join(root, 'art/hires.lock.json'), 'utf8'));
    expect(lock.assets[outputPath(assets[1])].derivationDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(lock.assets[outputPath(assets[1])].outputSha256).toBe(sourceSha256(await readFile(join(root, outputPath(assets[1])))));
    await writeFile(join(root, outputPath(assets[0])), await encode(rgba(128, 128, () => [20, 30, 40, 255])));
    const stale = await checkRepo(root);
    expect(stale[1].css).not.toContain('@2x');
    expect(diagnostics(stale).filter((s: string) => s.includes('provenance'))).toHaveLength(5);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('external state requests crop only the changed region; dry plans do not write or invoke providers', async () => {
  const root = await fixture();
  const log = console.log, logs: string[] = [];
  console.log = (...args: unknown[]) => logs.push(args.join(' '));
  try {
    const entries = family('external').slice(0, 2);
    await writeFile(join(root, 'art/hires.json'), JSON.stringify(input(entries)));
    const normal = rgba(256, 256, (x, y) => [70 + x % 40, 100 + y % 40, 130, 255]);
    await writeFile(join(root, entries[0].src), await encode(normal));
    const state = { ...normal, data: normal.data.slice() }; state.data[(128 * 256 + 128) * 4] += 30;
    await writeFile(join(root, entries[1].src), await encode(state));
    expect(await main(['--dry'], { root, invoke: neverInvoke })).toBe(0);
    expect(await readdir(join(root, 'art'))).toEqual(['hires.json', 'prompts']);
    expect(logs.at(-1)).toMatch(/2 assets; api 0, external 2, resample 0; estimated API requests 0; external tiles 5/);
    expect(await main([], { root, invoke: neverInvoke })).toBe(0);
    const awaiting = logs.filter((s) => s.startsWith('AWAITING'));
    const pendingPath = awaiting.at(-1)!.split(': ').at(-1)!;
    const request = JSON.parse(await readFile(pendingPath, 'utf8')).requests[0];
    const plan = JSON.parse(await readFile(join(pendingPath, '..', 'request.json'), 'utf8')).plan;
    expect([plan.outW, plan.outH, plan.tiles.length]).toEqual([66, 66, 1]);
    expect((await sharp(request.requestPath).metadata()).width).toBe(192);
    const changed = { ...normal, data: normal.data.slice() };
    changed.data[(128 * 256 + 127) * 4] += 25;
    await writeFile(join(root, entries[0].src), await encode(changed));
    logs.length = 0;
    expect(await main([], { root, invoke: neverInvoke })).toBe(0);
    const nextPath = logs.filter((s) => s.startsWith('AWAITING')).at(-1)!.split(': ').at(-1)!;
    expect(nextPath).not.toBe(pendingPath);
    const nextPlan = JSON.parse(await readFile(join(nextPath, '..', 'request.json'), 'utf8')).plan;
    expect([nextPlan.outW, nextPlan.outH]).toEqual([68, 66]);
  } finally { console.log = log; await rm(root, { recursive: true, force: true }); }
});

test('periodic external request uses modular halo and ships decoded seamless exact central geometry', async () => {
  const root = await fixture();
  const log = console.log, logs: string[] = [];
  console.log = (...args: unknown[]) => logs.push(args.join(' '));
  try {
    const asset = { src: 'public/kit/tile.png', provider: 'external', periodic: true, lossless: true, external: { sizes: ['384x384'] } };
    await writeFile(join(root, 'art/hires.json'), JSON.stringify(input([asset])));
    const noise = rgba(80, 80, (x, y) => [0, 1, 2].map((c) => (Math.imul((x + 1) * 73856093 ^ (y + 1) * 19349663 ^ (c + 1) * 83492791, 2246822519) >>> 16) % 180 + 38).concat(255));
    const source = { ...noise, data: Uint8Array.from(gaussianBlur(noise, 2.5, true).data, Math.round) };
    await writeFile(join(root, asset.src), await encode(source));
    expect(await main([], { root, invoke: neverInvoke })).toBe(0);
    const path = logs.find((s) => s.startsWith('AWAITING'))!.split(': ').at(-1)!;
    const request = JSON.parse(await readFile(path, 'utf8')).requests[0];
    const requestImage = await decode(await readFile(request.requestPath));
    expect(requestImage.data).toEqual(Uint8Array.from(wrapRegion(source, -56, -56, 192, 192).data));
    await sharp(request.requestPath).resize(384, 384).png().toFile(request.outputPath);
    expect(await main([], { root, invoke: neverInvoke })).toBe(0);
    const shipped = await decode(await readFile(join(root, 'public/kit/tile@2x.webp')));
    expect([shipped.width, shipped.height]).toEqual([160, 160]);
    expect(seamStats(shipped, resample(source, 2, true)).passes).toBe(true);
    const stats = JSON.parse(await readFile(join(path, '..', 'stats.json'), 'utf8'));
    expect(stats.seams.passes).toBe(true);
  } finally { console.log = log; await rm(root, { recursive: true, force: true }); }
}, 30_000);

test('analytic light maps use the repo generator at 512px and record actual provenance', async () => {
  const root = await fixture();
  try {
    const generator = { type: 'sheen', color: 'ffe6a8', alpha: 0.3, streak: 0.12 };
    const asset = { src: 'public/kit/light.png', provider: 'resample', generator, lossless: true };
    await writeFile(join(root, 'art/hires.json'), JSON.stringify(input([asset])));
    await writeFile(join(root, asset.src), await encode(sheenImage(256, generator)));
    expect(await main([], { root, invoke: neverInvoke })).toBe(0);
    const shipped = await decode(await readFile(join(root, 'public/kit/light@2x.webp')));
    // WebP canonicalises invisible RGB; compare premultiplied pixels.
    expect(differenceMask(shipped, sheenImage(512, generator)).some(Boolean)).toBe(false);
    const lock = JSON.parse(await readFile(join(root, 'art/hires.lock.json'), 'utf8'));
    expect(lock.assets['public/kit/light@2x.webp'].model).toBe('framed-pane/sheen-v1');
    for (const size of [0, 1, NaN, 1e12]) expect(() => sheenImage(size, generator)).toThrow();
    expect(await main(['--remerge', '--verify'], { root, invoke: neverInvoke })).toBe(0);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('replacing a cached state tile changes its derivation while keeping every unchanged source pixel registered', async () => {
  const root = await fixture();
  const log = console.log, logs: string[] = [];
  console.log = (...args: unknown[]) => logs.push(args.join(' '));
  try {
    const entries = family('external').slice(0, 2), { assets } = validateManifest(input(entries));
    await writeFile(join(root, 'art/hires.json'), JSON.stringify(input(entries)));
    const normal = rgba(96, 96, (x, y) => [0, 1, 2].map((c) => Math.round(120 + 30 * Math.sin(x * .31 + y * .17 + c) + 25 * Math.cos(y * .41 - x * .13 + c))).concat(255));
    const state = { ...normal, data: normal.data.slice() };
    for (let y = 35; y < 55; y++) for (let x = 35; x < 55; x++) state.data[(y * 96 + x) * 4] += 20;
    await writeFile(join(root, assets[0].src), await encode(normal));
    await writeFile(join(root, assets[1].src), await encode(state));
    expect(await main([], { root, invoke: neverInvoke })).toBe(0);
    const paths = logs.filter((s) => s.startsWith('AWAITING')).map((s) => s.split(': ').at(-1)!);
    const pending = await Promise.all(paths.map(async (path) => JSON.parse(await readFile(path, 'utf8')).requests[0]));
    for (const request of pending) await sharp(request.requestPath).resize(request.width, request.height).png().toFile(request.outputPath);
    expect(await main([], { root, invoke: neverInvoke })).toBe(0);
    const before = await readFile(join(root, outputPath(assets[1])));
    const request = pending[1];
    const original = await decode(await readFile(request.outputPath));
    const data = Uint8Array.from(original.data, (v, i) => i % 4 === 3 ? v : Math.max(0, Math.min(255, v + (Math.floor((Math.floor(i / 4) % original.width) / 3) % 2 ? 8 : -8))));
    await sharp(data, { raw: { width: original.width, height: original.height, channels: 4 } }).png().toFile(request.outputPath);
    expect(await main(['--remerge'], { root, invoke: neverInvoke })).toBe(0);
    const after = await readFile(join(root, outputPath(assets[1])));
    expect(after).not.toEqual(before);
    expect(outsideDifferences(await decode(after), await decode(await readFile(join(root, outputPath(assets[0])))), expandMask(differenceMask(state, normal), 96, 96))).toBe(0);
    expect(await main(['--remerge', '--verify'], { root, invoke: neverInvoke })).toBe(0);
  } finally { console.log = log; await rm(root, { recursive: true, force: true }); }
}, 30_000);

test('resample detail refusal cannot be overridden by accept or retry flags', async () => {
  const root = await fixture();
  try {
    const asset = { src: 'public/kit/material.png', provider: 'resample', periodic: true };
    await writeFile(join(root, 'art/hires.json'), JSON.stringify(input([asset])));
    await writeFile(join(root, asset.src), await encode(rgba(32, 32, (x, y) => [x % 2 * 255, y % 2 * 255, 100, 255])));
    for (const flags of [[], ['--accept'], ['--retry-rejected', '5'], ['--dry']]) {
      expect(await main(flags, { root, invoke: neverInvoke })).toBe(1);
      expect(await readdir(join(root, 'public/kit'))).toEqual(['material.png']);
      expect(await readdir(join(root, 'art'))).not.toContain('raw');
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('real Atlas sources retain zero visible outside-mask differences through lossless shipping', async () => {
  const root = await fixture();
  try {
    const entries = ['normal', 'hover'].map((state) => ({ src: `public/kit/atlas/tile-day-${state}.webp`, family: 'atlas/tile-day', reference: 'public/kit/atlas/tile-day-normal.webp', provider: 'api', stateDerivation: 'generate' }));
    await mkdir(join(root, 'public/kit/atlas'));
    await writeFile(join(root, 'art/hires.json'), JSON.stringify(input(entries)));
    for (const entry of entries) await writeFile(join(root, entry.src), await readFile(new URL(`../${entry.src}`, import.meta.url)));
    expect(await main([], { root, invoke: async (_command: string, args: string[]) => {
      const arg = (name: string) => args[args.indexOf(name) + 1];
      const [w, h] = arg('--size').split('x').map(Number);
      await sharp(arg('--image')).resize(w, h).png().toFile(arg('--out'));
    } })).toBe(0);
    const [normal, state] = await Promise.all(entries.map(async (entry) => decode(await readFile(join(root, entry.src)))));
    const [reference, shipped] = await Promise.all(entries.map(async (entry) => decode(await readFile(join(root, outputPath({ ...entry, factor: 2 }))))));
    const mask = expandMask(differenceMask(state, normal), normal.width, normal.height);
    expect(mask.some((v) => !v)).toBe(true);
    // Independent visible-paint assertion, including nonzero-alpha edge pixels.
    let visibleDifferences = 0;
    for (let p = 0; p < mask.length; p++) if (!mask[p]) {
      const i = p * 4, alpha = shipped.data[i + 3], referenceAlpha = reference.data[i + 3];
      if (alpha !== referenceAlpha || [0, 1, 2].some((c) => shipped.data[i + c] * alpha !== reference.data[i + c] * referenceAlpha)) visibleDifferences++;
    }
    expect(visibleDifferences).toBe(0);
    expect(outsideDifferences(shipped, reference, mask)).toBe(0);
    expect(stateStats(state, normal, reference, shipped, state).suppressed).toBe(false);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('changed locked family membership withholds all five states and fails CSS check after reconciliation', async () => {
  const root = await fixture();
  try {
    const entries = family();
    await writeFile(join(root, 'art/hires.json'), JSON.stringify(input(entries)));
    for (const [i, entry] of entries.entries()) await writeFile(join(root, entry.src), await encode(rgba(8, 8, () => [70 + i * 20, 100, 130, 255])));
    await writeFile(join(root, 'src/app/kit.css'), `.key {\n${entries.map((entry, i) => `  --state-${i}: url(${entry.src.slice(6)});`).join('\n')}\n}`);
    expect(await main(['--accept'], { root, invoke: neverInvoke })).toBe(0);
    const lock = JSON.parse(await readFile(join(root, 'art/hires.lock.json'), 'utf8'));
    for (const entry of entries) expect(lock.assets[outputPath({ ...entry, factor: 2 })].familyMembership).toEqual({
      reference: entries[0].reference, members: entries.map((e) => e.src).sort(),
    });
    const initial = await checkRepo(root);
    expect(initial[1].css.match(/@2x/g)).toHaveLength(5);
    await writeFile(join(root, 'src/app/kit.css'), initial[1].css);
    for (const changed of [entries.filter((_, i) => i !== 1), [...entries, { ...entries[1], src: 'public/kit/key-extra.png' }]]) {
      await writeFile(join(root, 'art/hires.json'), JSON.stringify(input(changed)));
      const results = await checkRepo(root);
      expect(results[1].css).not.toContain('@2x');
      expect(diagnostics(results).some((s: string) => s.includes('family membership'))).toBe(true);
      await writeFile(join(root, 'src/app/kit.css'), results[1].css);
      const logs: string[] = [];
      expect(await cssMain(['--check'], { root, log: (s: string) => logs.push(s) })).toBe(1);
      expect(logs.some((s) => s.includes('family membership'))).toBe(true);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});
