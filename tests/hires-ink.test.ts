import { expect, test } from 'bun:test';
import sharp from 'sharp';
import { mkdtemp, readFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { drawInk, rings } from '../scripts/ink.mjs';
import { inkRecipe, scaleInk } from '../scripts/kit-native.mjs';
import { renderInk, inkConformance } from '../scripts/hires/generators.mjs';
import { validateManifest, recipeDigest } from '../scripts/hires/manifest.mjs';
import { lockEntry } from '../scripts/hires/lock.mjs';
import { prepareGeneratedPixels, resolveStateCandidate } from '../scripts/hires/upscale.mjs';
import ligne from '../scripts/kits/ligne.mjs';

const generator = { type: 'ink', kit: 'ligne', name: 'caption-day' };
const entry = { src: 'public/kit/ligne/caption-day.webp', provider: 'resample', generator };
const validate = (asset: object) => validateManifest({ version: 1, defaults: {}, assets: [asset] }).assets[0];
const decode = async (b: Buffer) => {
  const { data, info } = await sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: 4 };
};

test('ink manifest resolves known recipes and rejects unknown or incompatible requests', () => {
  expect(validate(entry).lossless).toBe(true);
  for (const bad of [{ kit: 'unknown' }, { name: 'missing' }, { name: '../mat-day' }, { name: null }])
    expect(() => validate({ ...entry, generator: { ...generator, ...bad } })).toThrow(/unknown ink/);
  for (const bad of [{ factor: 3 }, { lossless: false }, { periodic: true }, { glyphs: true }, { provider: 'api' }, { src: 'public/wrong.webp' }])
    expect(() => validate({ ...entry, ...bad })).toThrow();
});

test('lock recipe follows resolved kit parameters, not just generator name', () => {
  const asset = validate(entry), before = recipeDigest(asset);
  const tape = ligne.tapes.find((t: { name: string }) => t.name === 'caption-day')!;
  const oldRadius = tape.ink.radius;
  try {
    tape.ink.radius += 1;
    expect(recipeDigest(asset)).not.toBe(before);
    expect(lockEntry(Buffer.from('source'), asset, 'a'.repeat(64)).recipeDigest).toBe(recipeDigest(asset));
  } finally { tape.ink.radius = oldRadius; }
  expect(recipeDigest(asset)).toBe(before);
});

test('rendered bands double from four to eight pixels without changing colour or alpha', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ink-band-'));
  try {
    const ink = { radius: 4, bands: [[4, '040404']], fill: null };
    for (const d of [1, 2]) {
      const path = join(dir, `${d}.png`);
      await drawInk(path, 32 * d, 24 * d, rings(32 * d, 24 * d, scaleInk(ink, d), d));
      const { data, width } = await decode(await readFile(path));
      const column = Array.from({ length: 12 * d }, (_, y) => Array.from(data.subarray((y * width + 16 * d) * 4, (y * width + 16 * d) * 4 + 4)));
      expect(column.filter((px) => px[3] > 0)).toEqual(Array.from({ length: 4 * d }, () => [4, 4, 4, 255]));
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

// Caption geometry comes entirely from its recipe; a small raw supplies the
// legacy builder's input existence contract without relying on ignored files.
const withRaw = async (run: (rawRoot: string) => Promise<void>) => {
  const dir = await mkdtemp(join(tmpdir(), 'ink-raw-'));
  try {
    for (const name of ['tape-day', 'paper-day', 'tile-day']) {
      await mkdir(`${dir}/ligne/${name}`, { recursive: true });
      await sharp({ create: { width: 16, height: 16, channels: 4, background: '#ffffff' } }).png().toFile(`${dir}/ligne/${name}/${name}.png`);
    }
    await run(dir);
  } finally { await rm(dir, { recursive: true, force: true }); }
};

test('shared kit render is byte-identical at 1x, deterministic at exact 2x, and passes premultiplied gate', () => withRaw(async (rawRoot) => {
  const source = await readFile(entry.src);
  const one = await renderInk(generator, { density: 1, rawRoot });
  const two = await renderInk(generator, { rawRoot });
  const repeat = await renderInk(generator, { rawRoot });
  expect(one.equals(source)).toBe(true);
  expect(two.equals(repeat)).toBe(true);
  const s = await decode(source), t = await decode(two);
  expect([t.width, t.height]).toEqual([s.width * 2, s.height * 2]);
  expect((await inkConformance(s, t)).passes).toBe(true);
}), 120_000);

test('native grain refuses to invent source resolution', () => withRaw(async (rawRoot) => {
  const g = { type: 'ink', kit: 'ligne', name: 'cap-day' };
  expect(inkRecipe(g).fill.src).toBe('paper-day');
  await expect(renderInk(g, { rawRoot })).rejects.toThrow(/insufficient.*1920x1920/);
}), 30_000);

test('native conformance rejects wrong dimensions and visibly wrong pixels', async () => {
  const source = { data: Buffer.from([0, 0, 0, 255]), width: 1, height: 1, channels: 4 };
  await expect(inkConformance(source, source)).rejects.toThrow(/exact 2x/);
  expect((await inkConformance(source, { data: Buffer.alloc(16, 255), width: 2, height: 2, channels: 4 })).passes).toBe(false);
});


test('native family states pass delivered conformance and preserve canonical pixels', () => withRaw(async (rawRoot) => {
  const stateEntry = (name: string) => ({ src: `public/kit/ligne/${name}.webp`, provider: 'resample',
    family: 'ligne/tile-day', reference: 'public/kit/ligne/tile-day-normal.webp', generator: { type: 'ink', kit: 'ligne', name } });
  const [normalAsset, stateAsset] = validateManifest({ version: 1, defaults: {}, assets: [stateEntry('tile-day-normal'), stateEntry('tile-day-hover')] }).assets;
  const normal = await decode(await renderInk(normalAsset.generator, { density: 1, rawRoot }));
  const reference = await decode(await renderInk(normalAsset.generator, { rawRoot }));
  const state = await decode(await renderInk(stateAsset.generator, { density: 1, rawRoot }));
  const generated = await decode(await renderInk(stateAsset.generator, { rawRoot }));
  const master = prepareGeneratedPixels(state, generated, stateAsset, normal, reference);
  const delivered = await decode(await sharp(master.data, { raw: { width: master.width, height: master.height, channels: 4 } }).webp({ lossless: true }).toBuffer());
  const result = await resolveStateCandidate(state, normal, reference, delivered, stateAsset);
  expect(result.failures).toEqual([]);
  expect(result.change.passes).toBe(true);
  expect(result.conformance.registration.outsideDifferingPixels).toBe(0);
  expect((await inkConformance(state, delivered)).passes).toBe(true);
}), 120_000);

test('sufficient raw grain is sampled through the shared native density path', () => withRaw(async (rawRoot) => {
  const size = 1920, data = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const value = Math.round(190 + 4 * Math.sin(x / 8) + 3 * Math.cos(y / 12));
    data.fill(value, (y * size + x) * 3, (y * size + x) * 3 + 3);
  }
  await sharp(data, { raw: { width: size, height: size, channels: 3 } }).png().toFile(`${rawRoot}/ligne/paper-day/paper-day.png`);
  const g = { type: 'ink', kit: 'ligne', name: 'cap-day' };
  const one = await decode(await renderInk(g, { density: 1, rawRoot }));
  const two = await decode(await renderInk(g, { rawRoot }));
  expect([two.width, two.height]).toEqual([352, 192]);
  expect((await inkConformance(one, two)).mae).toBeLessThanOrEqual(1);
  const interior = Array.from({ length: 100 }, (_, x) => two.data[(80 * two.width + 60 + x) * 4 + 1]);
  expect(Math.max(...interior) - Math.min(...interior)).toBeGreaterThan(2);
}), 120_000);
