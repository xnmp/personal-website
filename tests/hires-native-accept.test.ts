import { expect, test } from 'bun:test';
import sharp from 'sharp';
import { mkdtemp, mkdir, readFile, rm, access, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cliOptions, finishAsset, processAsset } from '../scripts/hires/upscale.mjs';
import { validateManifest, assetCacheKey } from '../scripts/hires/manifest.mjs';
import { lockMatches, outputPath } from '../scripts/hires/lock.mjs';

// Exercise the real encoding, gate, stats and publication boundary in an
// isolated fixture. No real pipeline/cache/public output is touched.
type Asset = ReturnType<typeof validateManifest>['assets'][number];
type Image = { data: Buffer; width: number; height: number; channels: number };
const fixture = async (run: (root: string, asset: Asset, source: Buffer, rgba: Image) => Promise<void>) => {
  const root = await mkdtemp(join(tmpdir(), 'native-accept-'));
  try {
    await Promise.all(['public/kit/solarpunk', 'art', 'cache'].map(p => mkdir(join(root, p), { recursive: true })));
    const asset = validateManifest({ version: 1, defaults: {}, assets: [{
      src: 'public/kit/solarpunk/sheet-card-normal.webp', provider: 'resample',
      generator: { type: 'kit', kit: 'solarpunk', name: 'sheet-card-normal' },
    }] }).assets[0];
    const rgba = { data: Buffer.from([0, 0, 0, 255]), width: 1, height: 1, channels: 4 };
    const source = await sharp(rgba.data, { raw: { width: 1, height: 1, channels: 4 } }).webp({ lossless: true }).toBuffer();
    await run(root, asset, source, rgba);
  } finally { await rm(root, { recursive: true, force: true }); }
};

for (const accept of [false, true]) {
  test(`native fidelity-only failure ${accept ? 'publishes with reasons under --accept' : 'rejects without --accept'}`, () => fixture(async (root, asset, source, rgba) => {
    const master = { data: Buffer.alloc(16, 255), width: 2, height: 2, channels: 4 };
    const work = finishAsset(asset, cliOptions(accept ? ['--accept'] : []), root, source, rgba, master, join(root, 'cache'), 'a'.repeat(64), [], {});
    if (accept) {
      await work;
      const stats = JSON.parse(await readFile(join(root, 'cache/stats.json'), 'utf8'));
      const lock = JSON.parse(await readFile(join(root, 'art/hires.lock.json'), 'utf8')).assets[outputPath(asset)];
      expect(stats.ink.mae).toBeGreaterThan(stats.ink.limit);
      expect(stats.ink.tail).toBeGreaterThan(stats.ink.tailLimit);
      expect(stats.acceptedOverride).toBe(true);
      expect(stats.gates.invariants).toEqual([]);
      expect(lock.accepted).toBe(true);
      expect(lock.acceptedReasons).toEqual(stats.ink.reasons);
      const outputBytes = await readFile(join(root, outputPath(asset)));
      const proof = { outputBytes, width: 2, height: 2, sourceWidth: 1, sourceHeight: 1 };
      expect(lockMatches(lock, source, asset, proof)).toBe(true);
      expect(lockMatches(lock, source, asset, { ...proof, width: 3 })).toBe(false);
      expect(lockMatches(lock, Buffer.from('changed source'), asset, proof)).toBe(false);
      expect(lockMatches(lock, source, { ...asset, family: 'changed', familyMembership: { reference: asset.src, members: [asset.src] } }, proof)).toBe(false);
    } else {
      await expect(work).rejects.toThrow(/premultiplied MAE/);
      await expect(access(join(root, outputPath(asset)))).rejects.toThrow();
      await expect(access(join(root, 'art/hires.lock.json'))).rejects.toThrow();
    }
  }));

  test(`native exact-scale invariant rejects ${accept ? 'with' : 'without'} --accept and publishes nothing`, () => fixture(async (root, asset, source, rgba) => {
    await expect(finishAsset(asset, cliOptions(accept ? ['--accept'] : []), root, source, rgba, rgba,
      join(root, 'cache'), 'a'.repeat(64), [], {})).rejects.toThrow(/exact 2x/);
    await expect(access(join(root, outputPath(asset)))).rejects.toThrow();
    await expect(access(join(root, 'art/hires.lock.json'))).rejects.toThrow();
  }));
}

for (const accept of [false, true]) {
  test(`shared 1x identity failure publishes nothing ${accept ? 'with' : 'without'} --accept`, () => fixture(async (root, _asset, source) => {
    const rawRoot = join(root, 'input');
    await mkdir(join(rawRoot, 'ligne/tape-day'), { recursive: true });
    await mkdir(join(root, 'public/kit/ligne'), { recursive: true });
    await sharp({ create: { width: 16, height: 16, channels: 4, background: '#ffffff' } }).png().toFile(join(rawRoot, 'ligne/tape-day/tape-day.png'));
    await symlink(join(process.cwd(), 'scripts'), join(root, 'scripts'));
    const asset = validateManifest({ version: 1, defaults: {}, assets: [{
      src: 'public/kit/ligne/caption-day.webp', provider: 'resample', generator: { type: 'ink', kit: 'ligne', name: 'caption-day' },
    }] }).assets[0];
    await writeFile(join(root, asset.src), source);
    const previous = { raw: process.env.HIRES_KIT_RAW, cache: process.env.HIRES_CACHE };
    try {
      process.env.HIRES_KIT_RAW = rawRoot; process.env.HIRES_CACHE = join(root, 'cache');
      await expect(processAsset(asset, cliOptions(accept ? ['--accept'] : []), '', root,
        async () => { throw new Error('unexpected provider request'); })).rejects.toThrow(/shipped 1x bytes/);
      await expect(access(join(root, outputPath(asset)))).rejects.toThrow();
      await expect(access(join(root, 'art/hires.lock.json'))).rejects.toThrow();
    } finally {
      if (previous.raw === undefined) delete process.env.HIRES_KIT_RAW; else process.env.HIRES_KIT_RAW = previous.raw;
      if (previous.cache === undefined) delete process.env.HIRES_CACHE; else process.env.HIRES_CACHE = previous.cache;
    }
  }));

  test(`raw hash failure publishes nothing ${accept ? 'with' : 'without'} --accept`, () => fixture(async (root, asset, source) => {
    const rawRoot = join(root, 'input');
    await mkdir(join(rawRoot, 'solarpunk/card-brass'), { recursive: true });
    await writeFile(join(rawRoot, 'solarpunk/card-brass/card-brass.png'), 'changed raw bytes');
    await writeFile(join(root, asset.src), source);
    const previous = process.env.HIRES_KIT_RAW;
    try {
      process.env.HIRES_KIT_RAW = rawRoot;
      await expect(processAsset(asset, cliOptions(accept ? ['--accept'] : []), '', root,
        async () => { throw new Error('unexpected provider request'); })).rejects.toThrow(/stale kit raw provenance/);
      await expect(access(join(root, outputPath(asset)))).rejects.toThrow();
      await expect(access(join(root, 'art/hires.lock.json'))).rejects.toThrow();
    } finally {
      if (previous === undefined) delete process.env.HIRES_KIT_RAW; else process.env.HIRES_KIT_RAW = previous;
    }
  }));
}

for (const accept of [false, true]) {
  test(`canonical exterior invariant rejects a delivered state ${accept ? 'with' : 'without'} --accept`, () => fixture(async (root, _asset, source, rgba) => {
    const assets = validateManifest({ version: 1, defaults: {}, assets: ['normal', 'hover'].map(state => ({
      src: `public/kit/solarpunk/sheet-card-${state}.webp`, provider: 'resample',
      family: 'solarpunk/sheet-card', reference: 'public/kit/solarpunk/sheet-card-normal.webp',
      generator: { type: 'kit', kit: 'solarpunk', name: `sheet-card-${state}` },
    })) }).assets;
    const [normal, hover] = assets;
    for (const asset of assets) await writeFile(join(root, asset.src), source);
    await mkdir(join(root, 'art/prompts/hires'), { recursive: true });
    await writeFile(join(root, 'art/prompts/hires/upscale.txt'), 'Upscale.');
    const opts = { ...cliOptions(accept ? ['--accept'] : []), assets };
    const black = { data: Buffer.from([0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255]), width: 2, height: 2, channels: 4 };
    await finishAsset(normal, opts, root, source, rgba, black, join(root, 'cache'), assetCacheKey(source, normal, 'Upscale.'), [], {});
    // A decoded residual is already registered: verify its invariant at the
    // publication boundary rather than letting registration repair this fixture.
    await expect(finishAsset(hover, opts, root, source, rgba, { ...black, data: Buffer.alloc(16, 255) },
      join(root, 'cache'), 'b'.repeat(64), [], { stateDerivation: { method: 'residual' } })).rejects.toThrow(/outside S2/);
    await expect(access(join(root, outputPath(hover)))).rejects.toThrow();
    const lockPath = join(root, 'art/hires.lock.json');
    const lock = JSON.parse(await readFile(lockPath, 'utf8'));
    expect(lock.assets[outputPath(hover)]).toBeUndefined();
    // An accepted canonical with stale membership still cannot authorize a state.
    lock.assets[outputPath(normal)].accepted = true;
    lock.assets[outputPath(normal)].familyMembership.members = [normal.src];
    await writeFile(lockPath, JSON.stringify(lock));
    await expect(finishAsset(hover, opts, root, source, rgba, black,
      join(root, 'cache'), 'b'.repeat(64), [], {})).rejects.toThrow(/stale|valid|membership/);
    await expect(access(join(root, outputPath(hover)))).rejects.toThrow();
  }));
}
