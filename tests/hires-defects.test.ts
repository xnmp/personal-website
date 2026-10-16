import { expect, test } from 'bun:test';
import sharp from 'sharp';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateManifest, assetCacheKey } from '../scripts/hires/manifest.mjs';
import { lockEntry, lockMatches, outputPath, outputProof, sourceSha256 } from '../scripts/hires/lock.mjs';
import { backfillSettings } from '../scripts/hires/backfill-settings.mjs';
import { checkRepo } from '../scripts/hires/css.mjs';
import { registerState, transferResidual, changeReproduction, stateStats, differenceMask, expandMask, outsideDifferences, derivationDigest } from '../scripts/hires/states.mjs';
import { protectGlyphs } from '../scripts/hires/protect.mjs';
import * as upscale from '../scripts/hires/upscale.mjs';

const image = (w: number, h: number, pixel: (x: number, y: number) => number[]) => ({ width: w, height: h, channels: 4,
  data: Uint8Array.from({ length: w * h * 4 }, (_, i) => pixel(Math.floor(i / 4) % w, Math.floor(i / 4 / w))[i % 4]) });
const scale = async (img: ReturnType<typeof image>, factor: number) => {
  const { data, info } = await sharp(Buffer.from(img.data), { raw: { width: img.width, height: img.height, channels: 4 } })
    .resize(img.width * factor, img.height * factor, { kernel: factor === 2 ? 'nearest' : 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  return { ...info, data: Uint8Array.from(data) };
};
const fixture = async (chain = false, provider = 'api') => {
  const root = await mkdtemp(join(tmpdir(), 'hires-defects-'));
  for (const dir of ['art/prompts/hires', 'public/kit', 'src/app']) await mkdir(join(root, dir), { recursive: true });
  const input = { version: 1, defaults: {}, assets: chain ? [
    { src: 'public/kit/normal.png', family: 'button', reference: 'public/kit/normal.png' },
    { src: 'public/kit/hover.png', family: 'button', reference: 'public/kit/normal.png' },
    { src: 'public/kit/copy.png', provider: 'resample', generator: { type: 'smooth-field', from: 'public/kit/hover@2x.webp', median: 1, blur: 1, grain: 0, seed: 1 } },
  ] : [{ src: 'public/kit/a.png', provider, ...(provider === 'external' ? { external: { sizes: ['1024x1024'] } } : {}) }] };
  const assets = validateManifest(input).assets;
  const source = await sharp({ create: { width: 1, height: 1, channels: 4, background: '#123456' } }).png().toBuffer();
  const output = await sharp(source).resize(2, 2).webp({ lossless: true }).toBuffer();
  const entries = Object.fromEntries(assets.map((a: { src: string; factor: number; family?: string; reference?: string; generator?: unknown }) => [outputPath(a), lockEntry(source, a, 'a'.repeat(64), {
    width: 2, height: 2, outputSha256: sourceSha256(output),
    ...(a.family && a.reference !== a.src ? { derivationDigest: derivationDigest(source, source, output, 4) } : {}),
    ...(a.generator ? { dependencies: { 'public/kit/hover@2x.webp': sourceSha256(output) } } : {}),
  })]));
  for (const a of assets) { await writeFile(join(root, a.src), source); await writeFile(join(root, outputPath(a)), output); }
  await writeFile(join(root, 'art/hires.json'), JSON.stringify(input));
  await writeFile(join(root, 'art/hires.lock.json'), JSON.stringify({ version: 1, assets: entries }));
  await writeFile(join(root, 'art/prompts/hires/upscale.txt'), 'Upscale.');
  await writeFile(join(root, 'src/app/kit.css'), `.a { background: url(/kit/${chain ? 'copy' : 'a'}.png); }`);
  return { root, input, assets, source, output, entries };
};

test('ordinary API and external outputs require decoded exact-scale proof, including legacy locks', async () => {
  for (const provider of ['api', 'external']) for (const legacy of [false, true]) {
    const f = await fixture(false, provider);
    try {
      const asset = f.assets[0], entry = f.entries[outputPath(asset)];
      if (legacy) { delete entry.outputSha256; delete entry.width; delete entry.height; }
      await writeFile(join(f.root, 'art/hires.lock.json'), JSON.stringify({ version: 1, assets: f.entries }));
      expect(lockMatches(entry, f.source, asset, await outputProof(asset, f.source, f.output, f.root, f.assets))).toBe(true);
      expect(lockMatches(entry, f.source, asset)).toBe(false);
      for (const replacement of [Buffer.from('garbage'), await sharp(f.source).resize(3, 2).webp().toBuffer(), await sharp({ create: { width: 2, height: 2, channels: 4, background: '#ffffff' } }).webp().toBuffer()]) {
        await writeFile(join(f.root, outputPath(asset)), replacement);
        const results = await checkRepo(f.root);
        const validLegacy = legacy && (await sharp(replacement).metadata().catch(() => ({} as { width?: number; height?: number }))).width === 2;
        expect(results.flatMap((r: { issues: { kind: string }[] }) => r.issues).some((i: { kind: string }) => i.kind === 'provenance')).toBe(!validLegacy);
        expect(results.at(-1).css.includes('@2x')).toBe(validLegacy);
      }
    } finally { await rm(f.root, { recursive: true, force: true }); }
  }
});

test('ordinary pixel settings invalidate a lock while post-processing keeps paid tile identity', async () => {
  const f = await fixture();
  try {
    const a = f.assets[0], entry = f.entries[outputPath(a)], proof = await outputProof(a, f.source, f.output, f.root, f.assets);
    for (const change of [{ sigma: 20 }, { quality: 40 }, { lossless: true }, { apiQuality: 'low' }, { note: 'new instructions' }]) {
      const changed = { ...a, ...change };
      expect(lockMatches(entry, f.source, changed, proof)).toBe(false);
      if (!('apiQuality' in change) && !('note' in change)) expect(assetCacheKey(f.source, changed, 'prompt')).toBe(assetCacheKey(f.source, a, 'prompt'));
    }
    expect(assetCacheKey(f.source, { ...a, apiQuality: 'low' }, 'prompt')).not.toBe(assetCacheKey(f.source, a, 'prompt'));
  } finally { await rm(f.root, { recursive: true, force: true }); }
});

test('registration and translucent derivation preserve a one-column alpha change', async () => {
  const normal = image(64, 128, () => [80, 90, 100, 128]);
  const state = image(64, 128, x => [80, 90, 100, x === 32 ? 160 : 128]);
  const reference = await scale(normal, 2), own = await scale(state, 2);
  for (const candidate of [registerState(state, normal, reference, own), transferResidual(state, normal, reference)]) {
    expect(outsideDifferences(candidate, reference, expandMask(differenceMask(state, normal), 64, 128))).toBe(0);
    expect(changeReproduction(state, normal, await scale(candidate, 0.5), await scale(reference, 0.5))).toMatchObject({ strongPixels: 128, reproducedPixels: 128, passes: true });
  }
  const n = image(9, 9, () => [80, 90, 100, 255]), s = image(9, 9, (x, y) => [x === 4 && y === 4 ? 120 : 80, 90, 100, 255]);
  const r = await scale(n, 2), o = await scale(s, 2);
  expect(changeReproduction(s, n, await scale(registerState(s, n, r, o), 0.5), await scale(r, 0.5)).passes).toBe(true);
});

test('subthreshold ring cannot pass reproduction or proportional suppression with one surviving pixel', async () => {
  const normal = image(128, 128, () => [80, 90, 100, 255]);
  const state = image(128, 128, (x, y) => [80 + ((x >= 20 && x <= 107 && (y === 20 || y === 107)) || (y > 20 && y < 107 && (x === 20 || x === 107)) ? 23 : 0), 90, 100, 255]);
  const reference = await scale(normal, 2), candidate = { ...reference, data: reference.data.slice() };
  candidate.data[(40 * 256 + 40) * 4]++;
  const registered = registerState(state, normal, reference, candidate), down = await scale(registered, 0.5);
  expect(changeReproduction(state, normal, down, normal)).toMatchObject({ strongPixels: 348, passes: false });
  expect(stateStats(state, normal, reference, registered, down).suppressed).toBe(true);
});

test('zero delta and tiny changes including 1x1 have explicit nonvacuous verdicts', async () => {
  const n = image(1, 1, () => [80, 90, 100, 255]);
  expect(changeReproduction(n, n, n, n)).toMatchObject({ strongPixels: 0, passes: true });
  for (const delta of [1, 5, 40]) {
    const s = image(1, 1, () => [80 + delta, 90, 100, 255]);
    expect(changeReproduction(s, n, n, n)).toMatchObject({ strongPixels: 1, passes: false });
    const r = await scale(n, 2), own = await scale(s, 2);
    const fractional = { ...own, data: Float32Array.from(own.data, (v, i) => v + (i % 4 === 0 ? 0.6 : 0)) };
    expect(registerState(s, n, r, fractional).data[0]).toBe(s.data[0] + 1);
    expect(changeReproduction(s, n, await scale(registerState(s, n, r, own), 0.5), n).passes).toBe(true);
  }
});

test('state protection preserves the already protected canonical outside the changed footprint', async () => {
  const n = image(32, 32, () => [80, 90, 100, 255]), s = image(32, 32, (x, y) => [x > 24 && y > 24 ? 120 : 80, 90, 100, 255]);
  const own = image(64, 64, () => [140, 150, 160, 255]);
  const asset = { protect: [{ x: 2, y: 2, w: 8, h: 8 }], protectFeather: 6 };
  const reference = protectGlyphs(n, own, asset.protect, asset.protectFeather);
  // Exercise the same composition boundary used by publication.
  const result = upscale.prepareGeneratedPixels(s, own, asset, n, reference);
  expect(outsideDifferences(result, reference, expandMask(differenceMask(s, n), 32, 32))).toBe(0);
});

test('generated dependencies reject a state whose canonical lock has become stale', async () => {
  const f = await fixture(true);
  try {
    const asset = f.assets[2];
    expect(lockMatches(f.entries[outputPath(asset)], f.source, asset, await outputProof(asset, f.source, f.output, f.root, f.assets))).toBe(true);
    const changedInput = { ...f.input, assets: f.input.assets.map((a, i) => i ? a : { ...a, protect: [{ x: 0, y: 0, w: 1, h: 1 }] }) };
    await writeFile(join(f.root, 'art/hires.json'), JSON.stringify(changedInput));
    const changed = validateManifest(changedInput).assets;
    await expect(outputProof(changed[2], f.source, f.output, f.root, changed)).rejects.toThrow(/stale|unlocked/);
    const results = await checkRepo(f.root);
    expect(results.at(-1).css.includes('@2x')).toBe(false);
    expect(results.flatMap((r: { issues: { kind: string }[] }) => r.issues).filter((i: { kind: string }) => i.kind === 'provenance')).toHaveLength(3);
  } finally { await rm(f.root, { recursive: true, force: true }); }
});


test('backfill stamps only valid outputs in dependency order and refuses stale canonical requests', async () => {
  for (const bad of ['none', 'canonical-request', 'undecodable']) {
    const f = await fixture(true);
    try {
      for (const a of f.assets) {
        const entry = f.entries[outputPath(a)];
        delete entry.settingsDigest;
        entry.cacheKey = await upscale.currentCandidateKey(a, f.source, 'Upscale.', f.root, entry);
      }
      if (bad === 'canonical-request') f.entries[outputPath(f.assets[0])].cacheKey = 'b'.repeat(64);
      if (bad === 'undecodable') await writeFile(join(f.root, outputPath(f.assets[0])), 'invalid image');
      await writeFile(join(f.root, 'art/hires.lock.json'), JSON.stringify({ version: 1, assets: f.entries }));
      const manifestSha256 = sourceSha256(await readFile(join(f.root, 'art/hires.json')));
      const before = await readFile(join(f.root, 'art/hires.lock.json'));
      const preview = await backfillSettings({ root: f.root, manifestSha256 });
      expect(await readFile(join(f.root, 'art/hires.lock.json'))).toEqual(before);
      expect(preview.migrated).toHaveLength(bad === 'none' ? 3 : 0);
      expect(preview.rejected).toHaveLength(bad === 'none' ? 0 : 3);
      const result = await backfillSettings({ root: f.root, manifestSha256, write: true });
      expect(result.migrated).toEqual(preview.migrated);
      if (bad === 'none') {
        const lock = JSON.parse(await readFile(join(f.root, 'art/hires.lock.json'), 'utf8'));
        const a = f.assets[2];
        expect(lockMatches(lock.assets[outputPath(a)], f.source, a, await outputProof(a, f.source, f.output, f.root, f.assets))).toBe(true);
        expect((await backfillSettings({ root: f.root, manifestSha256, write: true })).migrated).toEqual([]);
      }
      await expect(backfillSettings({ root: f.root, manifestSha256: '0'.repeat(64), write: true })).rejects.toThrow(/audited/);
    } finally { await rm(f.root, { recursive: true, force: true }); }
  }
});

test('per-asset overrides and defaults track all ordinary pixel and request settings', async () => {
  const f = await fixture();
  try {
    const a = f.assets[0], entry = f.entries[outputPath(a)], proof = await outputProof(a, f.source, f.output, f.root, f.assets);
    for (const settings of [{ sigma: 20 }, { quality: 40 }, { lossless: true }, { apiQuality: 'low' }, { model: 'other' }]) {
      for (const input of [
        { ...f.input, defaults: settings },
        { ...f.input, assets: [{ ...f.input.assets[0], ...settings }] },
      ]) expect(lockMatches(entry, f.source, validateManifest(input).assets[0], proof)).toBe(false);
    }
    const family = { ...a, family: 'button', reference: a.src };
    expect(assetCacheKey(f.source, family, 'prompt')).toBe(assetCacheKey(f.source, { ...family, sigma: 20 }, 'prompt'));
  } finally { await rm(f.root, { recursive: true, force: true }); }
});

test('pending skips the original ordinary lock but rebuilds after each effective setting change', async () => {
  const f = await fixture();
  try {
    const a = f.assets[0], entry = f.entries[outputPath(a)];
    entry.cacheKey = await upscale.currentCandidateKey(a, f.source, 'Upscale.', f.root, entry);
    await writeFile(join(f.root, 'art/hires.lock.json'), JSON.stringify({ version: 1, assets: f.entries }));
    for (const settings of [{}, { sigma: 20 }, { quality: 40 }, { lossless: true }, { apiQuality: 'low' }]) {
      await writeFile(join(f.root, 'art/hires.json'), JSON.stringify({ ...f.input, defaults: settings }));
      const processed: string[] = [];
      expect(await upscale.main(['--dry', '--pending'], { root: f.root,
        invoke: async () => { throw new Error('unexpected request'); },
        processAsset: async (asset: { src: string; provider: string }) => {
          processed.push(asset.src); return { provider: asset.provider, tiles: 0, requests: 0 };
        } })).toBe(0);
      expect(processed).toEqual(Object.keys(settings).length ? [a.src] : []);
    }
  } finally { await rm(f.root, { recursive: true, force: true }); }
});
