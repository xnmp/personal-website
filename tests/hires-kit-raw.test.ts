import { expect, test } from 'bun:test';
import sharp from 'sharp';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { rasterGeometry, rasterBase } from '../scripts/kit-raster.mjs';
import { kitRecipe, scaleStateFlags } from '../scripts/kit-native.mjs';
import { renderKit, kitConformance } from '../scripts/hires/generators.mjs';
import { prepareGeneratedPixels, resolveStateCandidate, stateConformance } from '../scripts/hires/upscale.mjs';
import { validateManifest, recipeDigest } from '../scripts/hires/manifest.mjs';
import { lockEntry, lockMatches } from '../scripts/hires/lock.mjs';
import { createHash } from 'node:crypto';
import sumi from '../scripts/kits/sumi.mjs';
const generator = { type: 'kit', kit: 'sumi', name: 'tile-day-normal' };
const decode = async (b: Buffer) => {
  const { data, info } = await sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: 4 };
};

test('raw coverage measures trimmed material, excludes transparent margins, and rejects upsampling', async () => {
  const raw = await sharp({ create: { width: 200, height: 80, channels: 4, background: '#ae5544' } })
    .extend({ top: 300, bottom: 300, left: 300, right: 300, background: '#0000' }).png().toBuffer();
  const proof = await rasterGeometry(raw, { height: 120 });
  expect(proof.sampled).toEqual({ width: 200, height: 80 });
  expect(proof.target).toEqual({ width: 600, height: 240 });
  expect(proof.ratio).toBeCloseTo(1 / 3);
  await expect(rasterBase(raw, { height: 120 }, 2)).rejects.toThrow(/insufficient raw resolution/);
  const dir = await mkdtemp(join(tmpdir(), 'kit-small-'));
  try {
    await mkdir(`${dir}/sumi/tile-line-day`, { recursive: true });
    await writeFile(`${dir}/sumi/tile-line-day/tile-line-day.png`, raw);
    await expect(renderKit(generator, { rawRoot: dir })).rejects.toThrow(/stale kit raw provenance/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('raw base samples detail directly, preserves legacy 1x bytes, and resolves odd dimensions before doubling', async () => {
  const width = 602, height = 242, pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = (x % 3) * 100;
    pixels[i + 3] = 255;
  }
  const input = await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer();
  const one = await rasterBase(input, { height: 120 }, 1), two = await rasterBase(input, { height: 120 }, 2);
  const legacy = await sharp(input).trim({ threshold: 1 }).resize({ height: 120 }).ensureAlpha().raw().toBuffer();
  expect(one.data).toEqual(legacy);
  expect([two.info.width, two.info.height]).toEqual([one.info.width * 2, 240]);
  expect(two.data).toEqual((await rasterBase(input, { height: 120 }, 2)).data);
  const enlarged = await sharp(one.data, { raw: { width: one.info.width, height: one.info.height, channels: 4 } }).resize(two.info.width, 240).raw().toBuffer();
  expect(two.data).not.toEqual(enlarged);
});

test('recipe pins validate available raw bytes; unavailable raws preserve offline lock identity', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'kit-digest-'));
  const oldRoot = process.env.HIRES_KIT_RAW, oldCwd = process.cwd();
  const tile = sumi.tiles[0], oldRing = tile.ring;
  const pins = sumi.rawHashes, oldPin = pins['tile-line-day'];
  const firstBytes = Buffer.from('first raw bytes');
  try {
    delete process.env.HIRES_KIT_RAW;
    // An isolated cwd exercises the actual default art/raw lookup, with env unset.
    process.chdir(dir);
    pins['tile-line-day'] = createHash('sha256').update(firstBytes).digest('hex');
    const asset = validateManifest({ version: 1, defaults: {}, assets: [{ src: 'public/kit/sumi/tile-day-normal.webp', provider: 'resample', generator }] }).assets[0];
    const first = recipeDigest(asset), source = Buffer.from('source');
    const proof = { outputBytes: Buffer.from('output'), width: 4, height: 4, sourceWidth: 2, sourceHeight: 2 };
    const entry = lockEntry(source, asset, 'a'.repeat(64));
    expect(lockMatches(entry, source, asset, proof)).toBe(true);
    const recipe = kitRecipe(generator);
    expect('rawSha256' in recipe && recipe.rawSha256).toBe(pins['tile-line-day']);
    for (const root of [join(dir, 'art/raw'), join(dir, 'override')]) {
      if (root.endsWith('override')) process.env.HIRES_KIT_RAW = root;
      const path = join(root, 'sumi/tile-line-day/tile-line-day.png');
      await mkdir(join(root, 'sumi/tile-line-day'), { recursive: true });
      await writeFile(path, firstBytes);
      expect(recipeDigest(asset)).toBe(first);
      expect(lockMatches(entry, source, asset, proof)).toBe(true);
      await writeFile(path, 'changed raw bytes');
      expect(() => recipeDigest(asset)).toThrow(/stale kit raw provenance/);
      expect(lockMatches(entry, source, asset, proof)).toBe(false);
      await expect(renderKit(generator, { root: oldCwd, rawRoot: root })).rejects.toThrow(/stale kit raw provenance/);
      await expect(promisify(execFile)('node', ['scripts/build-kit.mjs', 'sumi', '--kit=tile-day-normal', '--density=2',
        `--raw=${root}/sumi`, `--out=${dir}/out`, `--tmp=${dir}/work`], { cwd: oldCwd })).rejects.toThrow(/stale kit raw provenance/);
      await rm(path);
      expect(recipeDigest(asset)).toBe(first);
      expect(lockMatches(entry, source, asset, proof)).toBe(true);
      await expect(renderKit(generator, { root: oldCwd, rawRoot: root })).rejects.toThrow(/ENOENT/);
    }
    tile.ring = 'ffffff';
    expect(recipeDigest(asset)).not.toBe(first);
    tile.ring = oldRing;
    pins['tile-line-day'] = 'a'.repeat(64);
    expect(recipeDigest(asset)).not.toBe(first);
  } finally {
    tile.ring = oldRing; pins['tile-line-day'] = oldPin; process.chdir(oldCwd);
    if (oldRoot === undefined) delete process.env.HIRES_KIT_RAW; else process.env.HIRES_KIT_RAW = oldRoot;
    await rm(dir, { recursive: true, force: true });
  }
  const manifest = validateManifest(JSON.parse(await readFile('art/hires.json', 'utf8')));
  expect(recipeDigest(manifest.assets.find((a: { src: string }) => a.src === 'public/kit/ligne/caption-day.webp')))
    .toBe('d915a2729f7d47a078de58c0134b5d5da4b596f9652b72e7ac8511d148f0bc64');
});

test('state density scales lengths without changing lighting gain or colour', () => {
  expect(scaleStateFlags(['--ring=11.5:17', '--halo=8:10.2,17:18.6', '--ring-radius=8', '--catch-width=5', '--catch=0.4', '--groove=0.3', '--ring-color=f3ecdc'], 2))
    .toEqual(['--ring=23:34', '--halo=16:20.4,34:37.2', '--ring-radius=16', '--catch-width=10', '--catch=0.4', '--groove=0.3', '--ring-color=f3ecdc']);
});

// Ignored painted inputs are optional in a clean checkout; fixtures above always run.
// CI/local evidence: HIRES_KIT_RAW=<read-only raw root> bun test --timeout 30000.
for (const [kit, family] of [['sumi', 'tile-day'], ['sumi', 'tile-night'], ['solarpunk', 'sheet-card'], ['solarpunk', 'sheet-card-night']]) {
  if (process.env.HIRES_KIT_RAW) test(`${kit}/${family}: shipped 1x identity, deterministic exact 2x, native states obey mean and tail gates`, async () => {
    const dir = await mkdtemp(join(tmpdir(), 'kit-identity-'));
    const g = { type: 'kit', kit, name: `${family}-normal` };
    try {
      for (const [density, label] of [[1, 'one'], [2, 'two'], [2, 'repeat']]) {
        await promisify(execFile)('node', ['scripts/build-kit.mjs', kit, `--kit=${g.name}`, `--density=${density}`,
          `--raw=${process.env.HIRES_KIT_RAW}/${kit}`, `--out=${dir}/${label}`, `--tmp=${dir}/work`]);
      }
      const states = ['normal', 'hover', 'pressed', 'focus', ...(kit === 'solarpunk' ? ['flat'] : [])];
      const reference = `public/kit/${kit}/${family}-normal.webp`;
      const assets = validateManifest({ version: 1, defaults: {}, assets: states.map((state) => ({
        src: `public/kit/${kit}/${family}-${state}.webp`, provider: 'resample', family: `${kit}/${family}`, reference,
        generator: { ...g, name: `${family}-${state}` },
      })) }).assets;
      const normal = await decode(await readFile(reference)), nativeNormal = await decode(await readFile(`${dir}/two/${family}-normal.webp`));
      for (const state of states) {
        const file = `${family}-${state}.webp`;
        const [source, one, two, repeat] = await Promise.all([readFile(`public/kit/${kit}/${file}`), readFile(`${dir}/one/${file}`), readFile(`${dir}/two/${file}`), readFile(`${dir}/repeat/${file}`)]);
        expect(one.equals(source)).toBe(true);
        expect(two.equals(repeat)).toBe(true);
        const s = await decode(source), t = await decode(two);
        expect([t.width, t.height]).toEqual([s.width * 2, s.height * 2]);
        const nativeGate = await kitConformance(s, t, g);
        const passes = family !== 'tile-night';
        expect(nativeGate.passes).toBe(passes);
        if (family === 'tile-night') {
          expect(nativeGate.mae).toBeLessThanOrEqual(nativeGate.limit);
          expect(nativeGate.pixelTail).toBeGreaterThan(nativeGate.pixelTailLimit);
        }
        const asset = assets.find((a: { src: string }) => a.src.endsWith(file));
        if (state !== 'normal') {
          const master = prepareGeneratedPixels(s, t, asset, normal, nativeNormal);
          const delivered = await decode(await sharp(master.data, { raw: { width: master.width, height: master.height, channels: 4 } }).webp({ lossless: true }).toBuffer());
          expect((await resolveStateCandidate(s, normal, nativeNormal, delivered, asset)).failures).toEqual([]);
          expect((await kitConformance(s, delivered, g)).passes).toBe(passes);
        }
      }
    } finally { await rm(dir, { recursive: true, force: true }); }
  }, 120_000);
}

test('faint codec neighbours do not veto reproduced paint; dropping the strong change still fails', async () => {
  const { stateStats, changeReproduction } = await import('../scripts/hires/states.mjs');
  const make = (density: number, change: boolean, noise: boolean) => ({ width: 32 * density, height: 32 * density, channels: 4,
    data: Buffer.from(Array.from({ length: 32 * 32 * density * density * 4 }, (_, i) => {
      const x = Math.floor(i / 4) % (32 * density) / density, y = Math.floor(i / 4 / (32 * density)) / density;
      if (i % 4 === 3) return 255;
      const inside = x >= 12 && x < 20 && y >= 12 && y < 20;
      const halo = x >= 8 && x < 24 && y >= 8 && y < 24;
      return 70 + (change && inside ? 100 : noise && halo ? 1 : 0);
    })) });
  const normal = make(1, false, false), state = make(1, true, true), reference = make(2, false, false);
  const reproduced = make(2, true, false), down = make(1, true, false);
  expect(stateStats(state, normal, reference, reproduced, down).suppressed).toBe(true);
  expect(stateStats(state, normal, reference, reproduced, down, undefined, { native: true }).suppressed).toBe(false);
  expect(changeReproduction(state, normal, down, normal).passes).toBe(true);
  for (const native of [false, true]) {
    const asset = { provider: 'resample', ...(native ? { generator } : {}) };
    const conformance = await stateConformance(state, normal, reference, reproduced, down, asset);
    expect(conformance.registration.suppressed).toBe(!native);
    expect(conformance.reasons.includes('registration suppressed too many intended state changes')).toBe(!native);
  }
  expect(stateStats(state, normal, reference, reference, normal).suppressed).toBe(true);
  expect(changeReproduction(state, normal, normal, normal).passes).toBe(false);
});

test('registered and native states reject suppression of coherent +12 changes around a +80 centre', async () => {
  const { stateStats } = await import('../scripts/hires/states.mjs');
  const make = (density: number, centre: boolean, surround: boolean) => ({
    width: 32 * density, height: 32 * density, channels: 4,
    data: Buffer.from(Array.from({ length: 32 * 32 * density * density * 4 }, (_, i) => {
      if (i % 4 === 3) return 255;
      const x = Math.floor(i / 4) % (32 * density) / density, y = Math.floor(i / 4 / (32 * density)) / density;
      const inside = x >= 12 && x < 20 && y >= 12 && y < 20;
      return 70 + (inside ? centre ? 80 : 0 : surround ? 12 : 0);
    })),
  });
  const normal = make(1, false, false), state = make(1, true, true), reference = make(2, false, false);
  for (const native of [false, true]) {
    expect(stateStats(state, normal, reference, make(2, true, false), make(1, true, false), undefined, { native }).suppressed).toBe(true);
    expect(stateStats(state, normal, reference, make(2, true, true), state, undefined, { native }).suppressed).toBe(false);
  }
});

test('review textured generated candidate cannot retain only the +80 centre and lose the +12 surround', async () => {
  const width = 256, height = 256;
  const image = (kind: 'normal' | 'state' | 'bad') => {
    const data = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const inside = x >= 96 && x < 160 && y >= 96 && y < 160;
      const base = 70 + Math.round(20 * Math.sin(x * 0.3) + 20 * Math.cos(y * 0.25) + 15 * Math.sin((x + y) * 0.11));
      const delta = kind === 'state' ? inside ? 80 : 12 : kind === 'bad' && inside ? 80 : 0;
      data.set([base + delta, base + delta, base + delta, 255], (y * width + x) * 4);
    }
    return { data, width, height, channels: 4 };
  };
  const up = async (img: ReturnType<typeof image>) => ({
    data: await sharp(img.data, { raw: { width, height, channels: 4 } }).resize(width * 2, height * 2, { kernel: 'nearest' }).raw().toBuffer(),
    width: width * 2, height: height * 2, channels: 4,
  });
  const normal = image('normal'), state = image('state');
  const result = await resolveStateCandidate(state, normal, await up(normal), await up(image('bad')),
    { provider: 'api', stateDerivation: 'generate' });
  expect(result.change.passes).toBe(true); // Strong-centre reproduction alone is insufficient.
  expect(result.conformance.registration.preservedShare).toBe(0.0625);
  expect(result.failures).toContain('registration suppressed too many intended state changes');
});
