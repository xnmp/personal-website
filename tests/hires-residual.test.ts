import { expect, test } from 'bun:test';
import sharp from 'sharp';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { differenceMask, expandMask, transferResidual, residualRouting, residualDiagnostics, derivationDigest, changeReproduction } from '../scripts/hires/states.mjs';
import { auditStates } from '../scripts/hires/audit-states.mjs';
import { validateManifest, assetCacheKey, recipeDigest } from '../scripts/hires/manifest.mjs';
import { lockEntry, lockMatches, outputPath, sourceSha256 } from '../scripts/hires/lock.mjs';
import { cliOptions, main, processAsset, residualCandidate, stateConformance, resolveStateCandidate, stateCandidateFailures, currentCandidateKey } from '../scripts/hires/upscale.mjs';

const image = (width: number, height: number, pixel: (x: number, y: number) => number[]) => ({ width, height, channels: 4,
  data: Uint8Array.from({ length: width * height * 4 }, (_, i) => pixel(Math.floor(i / 4) % width, Math.floor(i / 4 / width))[i % 4]) });
const encode = (img: ReturnType<typeof image>) => sharp(Buffer.from(img.data), { raw: { width: img.width, height: img.height, channels: 4 } }).png().toBuffer();
const decode = async (buffer: Buffer) => { const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { ...info, data: Uint8Array.from(data) }; };
const shadow = (strength: number) => image(256, 256, (x, y) => {
  if (x >= 20 && x < 70 && y >= 18 && y < 65) return [170, 150, 120, 255];
  const dx = Math.max(24 - x, 0, x - 73), dy = Math.max(24 - y, 0, y - 70);
  return [0, 0, 0, Math.round(strength * Math.exp(-(dx * dx + dy * dy) / 1800))];
});
const neverInvoke = async () => { throw new Error('unexpected provider request'); };

// Nonperiodic structure provides alignment evidence; the small high-frequency
// perturbation models imperfect generated paint without moving that structure.
const texture = (size: number, offset = 0, localized = false) => image(size, size, (x, y) => {
  const v = Math.round(100 + 25 * Math.sin(x * 0.23 + y * 0.13) + 20 * Math.cos(y * 0.31 - x * 0.09) + 10 * Math.sin(x * y * 0.015));
  return [v + ((!localized || (x >= 8 && x < 56 && y >= 8 && y < 56)) ? offset : 0), v + 10, v + 20, 255];
});
const nearest = async (img: ReturnType<typeof image>) => decode(await sharp(await encode(img)).resize(img.width * 2, img.height * 2, { kernel: 'nearest' }).png().toBuffer());
const downsample = async (img: ReturnType<typeof image>) => decode(await sharp(await encode(img)).resize(img.width / 2, img.height / 2, { kernel: 'lanczos3' }).png().toBuffer());

test('correct delta over noisy imperfect normal passes change and conformance', async () => {
  const normal = texture(64), state = texture(64, 8), base = await nearest(normal);
  const reference = { ...base, data: Uint8Array.from(base.data, (v, i) => i % 4 === 3 ? v : v + 5 + ((i * 17 % 7) - 3)) };
  const result = await residualCandidate(state, normal, reference);
  expect(result.change.passes).toBe(true);
  expect(result.conformance.passes).toBe(true);
  // The old gate would have rejected the reference's own texture/tone error.
  expect(result.conformance.registration.stateMae).toBeGreaterThan(1);
});

test('regional error is diagnostic when change reproduction and conformance pass', async () => {
  const normal = texture(64), state = texture(64, 8), reference = await nearest(normal);
  const transferred: ReturnType<typeof image> = transferResidual(state, normal, reference);
  const corrupted = { ...transferred, data: Uint8Array.from(transferred.data, (v, i) => v + (i % 4 === 0 ? 6 : 0)) };
  const down = await downsample(corrupted), referenceDown = await downsample(reference);
  const diagnostics = residualDiagnostics(state, normal, down, referenceDown);
  expect(diagnostics.mae).toBeGreaterThan(1);
  expect(diagnostics.p99).toBeGreaterThan(4);
  expect(diagnostics).not.toHaveProperty('passes');
  const candidate = { diagnostics, change: changeReproduction(state, normal, down, referenceDown),
    conformance: await stateConformance(state, normal, reference, corrupted, down) };
  expect(stateCandidateFailures(candidate)).toEqual([]);
  expect((await stateConformance(state, normal, reference, corrupted, down)).passes).toBe(true);
});

test('globally wrong normal fails conformance despite a correct delta', async () => {
  const normal = texture(64), state = texture(64, 8), reference = await nearest(texture(64, 60));
  const result = await residualCandidate(state, normal, reference);
  expect(result.change.passes).toBe(true);
  expect(result.conformance.passes).toBe(false);
  expect(result.conformance.reasons.join('; ')).toMatch(/MAE/);
});

test('zero residual preserves reference bytes through identical encoding, including invisible RGB', async () => {
  const normal = image(8, 8, () => [80, 50, 20, 128]);
  const reference = image(16, 16, (x, y) => [x * 13, y * 11, 73, x ? 200 : 0]);
  const result = transferResidual(normal, normal, reference);
  expect(result.data).toEqual(reference.data);
  const webp = (img: typeof reference) => sharp(Buffer.from(img.data), { raw: { width: img.width, height: img.height, channels: 4 } }).webp({ lossless: true }).toBuffer();
  expect(await webp(result)).toEqual(await webp(reference));
});

test('shadow transfer retains diagnostics, preserves opaque sheet, and is deterministic', async () => {
  const normal = shadow(30), state = shadow(50);
  const reference = await decode(await sharp(await encode(normal)).resize(512, 512, { kernel: 'nearest' }).png().toBuffer());
  const result = await residualCandidate(state, normal, reference);
  expect(result.change.passes).toBe(true);
  expect(result.diagnostics.mae).toBeLessThanOrEqual(1);
  expect(Number.isFinite(result.diagnostics.p99)).toBe(true);
  expect(result.diagnostics.samples).toBeGreaterThan(0);
  expect((await residualCandidate(state, normal, reference)).encoded).toEqual(result.encoded);
  const mask = expandMask(differenceMask(state, normal), normal.width, normal.height);
  let changed = 0, unchangedErrors = 0, invalid = 0;
  for (let p = 0; p < mask.length; p++) {
    const i = p * 4;
    if ((!mask[p] || reference.data[i + 3] === 255) && [0, 1, 2, 3].some((c) => result.master.data[i + c] !== reference.data[i + c])) unchangedErrors++;
    if (result.master.data[i + 3] !== reference.data[i + 3]) changed++;
    const alpha = result.master.data[i + 3];
    for (let c = 0; c < 3; c++) if (result.master.data[i + c] * alpha / 255 < 0 || result.master.data[i + c] * alpha / 255 > alpha) invalid++;
  }
  expect(changed).toBeGreaterThan(1000);
  expect(unchangedErrors).toBe(0);
  expect(invalid).toBe(0);
});

test('shadow reduction over a 30% fainter reference uses absolute state with sub-code regional error', async () => {
  const normal = image(16, 16, () => [20, 10, 5, 10]);
  const state = image(16, 16, () => [20, 10, 5, 2]);
  const reference = image(32, 32, () => [20, 10, 5, 7]);
  const result = transferResidual(state, normal, reference);
  // Translucent paint is the source state, independent of the generated shadow.
  expect(result.data).toEqual(image(32, 32, () => [20, 10, 5, 2]).data);
  expect(residualDiagnostics(state, normal, await downsample(result), await downsample(reference)).p99).toBeLessThan(1);
});

test('translucent replacement preserves source colour and recolouring', () => {
  const normal = image(1, 1, () => [100, 80, 60, 200]);
  const reference = image(2, 2, () => [120, 100, 80, 140]);
  const opacityOnly = transferResidual(image(1, 1, () => [100, 80, 60, 100]), normal, reference);
  expect(opacityOnly.data).toEqual(image(2, 2, () => [100, 80, 60, 100]).data);
  const recoloured = transferResidual(image(1, 1, () => [114, 73, 60, 100]), normal, reference);
  expect(recoloured.data).toEqual(image(2, 2, () => [114, 73, 60, 100]).data);
});

test('translucent replacement keeps faint state colour even over an opaque generated pixel', () => {
  const normal = image(1, 1, () => [80, 100, 120, 10]);
  const state = image(1, 1, () => [80, 100, 120, 1]);
  const reference = image(2, 2, (x) => [80, 100, 120, x ? 255 : 5]);
  expect(transferResidual(state, normal, reference).data)
    .toEqual(image(2, 2, () => [80, 100, 120, 1]).data);
});

test('transfer is continuous across a spatial alpha-delta sign change with a nonzero colour delta', () => {
  const normal = image(3, 1, () => [80, 100, 120, 100]);
  const reference = image(6, 2, () => [100, 120, 140, 70]);
  // Floating source pixels expose the limit without source-byte quantisation.
  // Include exactly zero alpha delta while keeping the colour-change mask on.
  for (const epsilon of [0.1, 0.001, 0.00001]) {
    const state = { ...normal, data: Float32Array.from(normal.data, (v, i) =>
      i % 4 === 3 ? v + (Math.floor(i / 4) - 1) * epsilon : v + 24) };
    const result = transferResidual(state, normal, reference);
    expect(result.data).toEqual(image(6, 2, () => [104, 124, 144, 100]).data);
  }
});

test('transparent and tiny-alpha normals remain finite and preserve unchanged footprints', () => {
  const normal = image(3, 1, () => [80, 100, 120, 0]);
  const state = image(3, 1, (x) => [80, 100, 120, x === 2 ? 16 : 0]);
  const reference = image(6, 2, () => [80, 100, 120, 0]);
  const added = transferResidual(state, normal, reference);
  expect(Array.from(added.data.slice(0, 16))).toEqual(Array.from(reference.data.slice(0, 16)));
  expect(added.data[23]).toBe(16);
  const tinyNormal = { ...normal, data: Float32Array.from(normal.data, (v, i) => i % 4 === 3 ? 1e-8 : v) };
  const tinyState = { ...state, data: Float32Array.from(state.data, (v, i) => i % 4 === 3 ? 5e-9 : v) };
  const faint = transferResidual(tinyState, tinyNormal, image(6, 2, () => [80, 100, 120, 1]));
  // Changes below the noise floor retain the canonical exactly.
  expect(faint.data).toEqual(image(6, 2, () => [80, 100, 120, 1]).data);
});

test('translucent replacement has valid premultiplied colour regardless of reference', () => {
  const normal = image(1, 1, () => [255, 0, 0, 200]), state = image(1, 1, () => [0, 255, 0, 100]);
  const reference = image(2, 2, (x) => x ? [255, 255, 255, 255] : [255, 255, 255, 50]);
  const result = transferResidual(state, normal, reference);
  expect(Array.from(result.data.slice(0, 4))).toEqual([0, 255, 0, 100]);
  expect(Array.from(result.data.slice(4, 8))).toEqual([0, 255, 0, 100]);
});

test('auto uses delta HF over changed pixels: soft shadow transfers; crisp one-pixel ring generates', () => {
  expect(residualRouting(shadow(50), shadow(30)).method).toBe('residual');
  const normal = image(64, 64, () => [0, 0, 0, 255]);
  const ring = image(64, 64, (x, y) => [0, 1, 2].map(() => x >= 16 && x < 48 && y >= 16 && y < 48 && (x === 16 || x === 47 || y === 16 || y === 47) ? 255 : 0).concat(255));
  const decision = residualRouting(ring, normal);
  expect(decision.hfRms).toBeGreaterThan(4);
  expect(decision.method).toBe('generate');
  expect(residualRouting(ring, normal, { stateDerivation: 'residual' }).method).toBe('residual');
  expect(residualRouting(ring, normal, { stateResidualMaxHf: 255 }).method).toBe('residual');
});

test('residual diagnostics measure alpha and p99 outliers, handle empty masks and reject mismatched dimensions', () => {
  const normal = image(20, 20, () => [0, 0, 0, 255]), state = image(20, 20, () => [10, 10, 10, 255]);
  expect(residualDiagnostics(state, normal, state, normal)).toMatchObject({ mae: 0, p99: 0 });
  const outlier = image(20, 20, (x) => [x ? 10 : 30, 10, 10, 255]);
  expect(residualDiagnostics(state, normal, outlier, normal)).toMatchObject({ p99: 20 });
  expect(residualDiagnostics(normal, normal, normal, normal)).toMatchObject({ mae: 0, p99: 0, samples: 0 });
  const alphaOutlier = image(20, 20, (x) => [10, 10, 10, x ? 255 : 235]);
  expect(residualDiagnostics(state, normal, alphaOutlier, normal).p99).toBe(20);
  expect(() => residualDiagnostics(state, normal, state, image(1, 1, () => [0, 0, 0, 0]))).toThrow(/geometry/);
  expect(() => transferResidual(state, image(1, 1, () => [0, 0, 0, 0]), state)).toThrow(/geometry/);
  expect(() => transferResidual(image(1, 1, () => [255, 255, 255, 0]), image(1, 1, () => [0, 0, 0, 0]), normal)).toThrow(/fully transparent/);
  expect(() => transferResidual(state, normal, normal)).toThrow(/2x/);
});

const input = (mode?: string, provider = 'external') => ({ version: 1, defaults: {}, assets: ['normal', 'hover'].map((name) => ({
  src: `public/${name}.png`, provider, external: { sizes: ['128x128'] }, family: 'sheet/day', reference: 'public/normal.png', ...(mode ? { stateDerivation: mode } : {}),
})) });

test('family policy is inherited, asset overrides win, threshold enters lock recipe but preserves paid cache keys', () => {
  const manifest = input();
  const base = validateManifest(manifest).assets[1];
  const configured = validateManifest({ ...manifest, families: { 'sheet/day': { stateDerivation: 'auto', stateResidualMaxHf: 7 } } }).assets[1];
  expect(configured.stateResidualMaxHf).toBe(7);
  expect(recipeDigest(base)).not.toBe(recipeDigest(configured));
  expect(assetCacheKey(Buffer.from('source'), base, 'prompt')).toBe(assetCacheKey(Buffer.from('source'), configured, 'prompt'));
  const override = validateManifest({ ...manifest, families: { 'sheet/day': { stateDerivation: 'residual' } }, assets: manifest.assets.map((a) => ({ ...a, stateDerivation: 'generate' })) }).assets[1];
  expect(override.stateDerivation).toBe('generate');
  for (const value of [null, -1, Infinity, 256]) expect(() => validateManifest({ ...manifest, families: { 'sheet/day': { stateResidualMaxHf: value } } })).toThrow();
  expect(() => validateManifest(input('bad'))).toThrow(/stateDerivation/);
});

const fixture = async (mode?: string, partial = false, deltaFailure = false) => {
  const root = await mkdtemp(join(tmpdir(), 'hires-residual-'));
  await mkdir(join(root, 'public')); await mkdir(join(root, 'art/prompts/hires'), { recursive: true });
  await writeFile(join(root, 'art/prompts/hires/upscale.txt'), 'Upscale.');
  const manifest = input(mode);
  if (partial) manifest.assets.push({ ...manifest.assets[1], src: 'public/pressed.png' });
  const assets = validateManifest(manifest).assets;
  await writeFile(join(root, 'art/hires.json'), JSON.stringify(manifest));
  const paint = texture(64);
  const normal = deltaFailure ? { ...paint, data: Uint8Array.from(paint.data, (v, i) => i % 4 === 0 ? 40 : v) } : paint;
  const state = deltaFailure ? { ...paint, data: Uint8Array.from(paint.data, (v, i) => i % 4 === 0 ? 0 : v) } : texture(64, 1);
  const up = await nearest(normal);
  const referenceImage = deltaFailure ? { ...up, data: Uint8Array.from(up.data, (v, i) => i % 4 === 0 ? 15 : v) } : image(128, 128, () => [180, 180, 180, 255]);
  const source = await encode(normal), reference = await sharp(await encode(referenceImage)).webp({ lossless: true }).toBuffer();
  await writeFile(join(root, assets[0].src), source);
  for (const asset of assets.slice(1)) await writeFile(join(root, asset.src), await encode(state));
  await writeFile(join(root, outputPath(assets[0])), reference);
  const entries = { [outputPath(assets[0])]: lockEntry(source, assets[0], await currentCandidateKey(assets[0], source, 'Upscale.', root), { outputSha256: sourceSha256(reference), width: 128, height: 128 }) };
  await writeFile(join(root, 'art/hires.lock.json'), JSON.stringify({ version: 1, assets: entries }));
  return { root, assets, entries, source, reference };
};

test('smooth auto derivation rejects change reproduction and conformance failures', async () => {
  for (const deltaFailure of [false, true]) {
    const { root, assets } = await fixture(undefined, false, deltaFailure);
    try {
      await expect(processAsset(assets[1], { ...cliOptions([]), assets }, 'Upscale.', root, neverInvoke)).rejects.toThrow(/REJECTED/);
      const keys = await readdir(join(root, 'art/raw/hires/hover'));
      const stats = JSON.parse(await readFile(join(root, 'art/raw/hires/hover', keys[0], 'stats.json'), 'utf8'));
      expect(stats.stateDerivation.method).toBe('residual');
      expect(stats.rejected).toBe(true);
      expect(await readdir(join(root, 'public'))).not.toContain('hover@2x.webp');
    } finally { await rm(root, { recursive: true, force: true }); }
  }
});

test('accept waives conformance only; change failures and invalid references still reject', async () => {
  for (const change of ['conformance', 'delta', 'missing', 'unlocked']) {
    const { root, assets } = await fixture('residual', false, change === 'delta');
    try {
      if (change === 'missing') await rm(join(root, outputPath(assets[0])));
      if (change === 'unlocked') await writeFile(join(root, 'art/hires.lock.json'), JSON.stringify({ version: 1, assets: {} }));
      const work = processAsset(assets[1], { ...cliOptions(['--accept']), assets }, 'Upscale.', root, neverInvoke);
      if (change === 'conformance') {
        await work;
        const lock = JSON.parse(await readFile(join(root, 'art/hires.lock.json'), 'utf8'));
        expect(lock.assets[outputPath(assets[1])].accepted).toBe(true);
      } else {
        await expect(work).rejects.toThrow(change === 'delta' ? /change reproduction/ : change === 'missing' ? /missing reference output/ : /unlocked/);
        expect(await readdir(join(root, 'public'))).not.toContain('hover@2x.webp');
      }
    } finally { await rm(root, { recursive: true, force: true }); }
  }
});

test('legacy state recipes stay valid and pending skips them; changing reference bytes invalidates residual lock', async () => {
  for (const partial of [false, true]) {
  const { root, assets, entries, source, reference } = await fixture(undefined, partial);
  try {
    const stateSource = await readFile(join(root, assets[1].src)), stateOutput = reference;
    await writeFile(join(root, outputPath(assets[1])), stateOutput);
    const proof = { outputBytes: stateOutput, referenceBytes: source, referenceOutputBytes: reference, referenceValid: true, sourceWidth: 64, sourceHeight: 64, width: 128, height: 128 };
    const entry = lockEntry(stateSource, assets[1], await currentCandidateKey(assets[1], stateSource, 'Upscale.', root), { outputSha256: sourceSha256(stateOutput), width: 128, height: 128, derivationDigest: derivationDigest(stateSource, source, reference, assets[1].sigma) });
    expect(lockMatches(entry, stateSource, assets[1], proof)).toBe(true);
    expect(lockMatches(entry, stateSource, assets[1], { ...proof, referenceOutputBytes: Buffer.concat([reference, Buffer.from('changed')]) })).toBe(false);
    const legacy = { ...entry, recipeDigest: recipeDigest(assets[1], true) }; delete legacy.stateDerivation;
    expect(lockMatches(legacy, stateSource, assets[1], proof)).toBe(true);
    await writeFile(join(root, 'art/hires.lock.json'), JSON.stringify({ version: 1, assets: { ...entries, [outputPath(assets[1])]: legacy } }));
    const before = await readFile(join(root, 'art/hires.lock.json'));
    const processed: string[] = [];
    expect(await main(['--dry', '--pending'], { root, processAsset: async (a: { src: string }) => { processed.push(a.src); return undefined; } })).toBe(0);
    expect(processed).toEqual(partial ? ['public/pressed.png'] : []);
    expect(await readFile(join(root, 'art/hires.lock.json'))).toEqual(before);
  } finally { await rm(root, { recursive: true, force: true }); }
}
});

test('protected residual retains canonical pixels outside the changed region and locks its method', async () => {
  const { root, assets, entries, source } = await fixture('residual');
  try {
    const referenceImage = await nearest(texture(64));
    const reference = await sharp(await encode(referenceImage)).webp({ lossless: true }).toBuffer();
    await writeFile(join(root, outputPath(assets[0])), reference);
    const referenceEntries = { ...entries, [outputPath(assets[0])]: lockEntry(source, assets[0], await currentCandidateKey(assets[0], source, 'Upscale.', root), { outputSha256: sourceSha256(reference), width: 128, height: 128 }) };
    await writeFile(join(root, 'art/hires.lock.json'), JSON.stringify({ version: 1, assets: referenceEntries }));
    const state = texture(64, 2, true);
    await writeFile(join(root, assets[1].src), await encode(state));
    const asset = { ...assets[1], protect: [{ x: 0, y: 0, w: 64, h: 64 }], protectFeather: 0 };
    await processAsset(asset, { ...cliOptions([]), assets: [assets[0], asset] }, 'Upscale.', root, neverInvoke);
    const shipped = await decode(await readFile(join(root, outputPath(asset))));
    const normal = await decode(source), mask = expandMask(differenceMask(state, normal), 64, 64);
    let errors = 0;
    for (let p = 0; p < mask.length; p++) if (!mask[p] && [0, 1, 2, 3].some((c) => shipped.data[p * 4 + c] !== referenceImage.data[p * 4 + c])) errors++;
    expect(errors).toBe(0);
    const lock = JSON.parse(await readFile(join(root, 'art/hires.lock.json'), 'utf8'));
    expect(lock.assets[outputPath(asset)].stateDerivation).toMatchObject({ mode: 'residual', method: 'residual', maxHf: 4, change: { passes: true } });
    const proof = { outputBytes: await readFile(join(root, outputPath(asset))), referenceBytes: source, referenceOutputBytes: reference, referenceValid: true, sourceWidth: 64, sourceHeight: 64, width: 128, height: 128 };
    expect(lockMatches(lock.assets[outputPath(asset)], await readFile(join(root, asset.src)), asset, proof)).toBe(true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('pressed shadow shrink over a fainter normal preserves additive face detail and valid premultiplication', async () => {
  const normal = shadow(60);
  const state = shadow(40);
  // Change only the face interior; opaque boundary pixels remain the canonical paint.
  for (let y = 25; y < 58; y++) for (let x = 27; x < 63; x++) state.data[(y * 256 + x) * 4] += 12;
  const reference = await nearest(normal);
  for (let i = 0; i < reference.data.length; i += 4) if (reference.data[i + 3] < 250) reference.data[i + 3] = Math.round(reference.data[i + 3] * 0.7);
  const result = await residualCandidate(state, normal, reference);
  expect(result.diagnostics.opaque.samples).toBeGreaterThan(0);
  expect(result.diagnostics.translucent.samples).toBeGreaterThan(0);
  for (let y = 52; y < 112; y++) for (let x = 56; x < 122; x++) {
    const i = (y * 512 + x) * 4;
    expect(result.master.data[i]).toBe(reference.data[i] + 12);
    expect(result.master.data[i + 3]).toBe(255);
  }
  expect(result.master.data.every((v: number, i: number) => i % 4 === 3 || v * result.master.data[i - i % 4 + 3] / 255 <= result.master.data[i - i % 4 + 3])).toBe(true);
});

test('translucent boundary retains state paint without altering the canonical exterior', () => {
  const normal = image(32, 8, () => [0, 0, 0, 100]);
  const state = image(32, 8, (x) => [0, 0, 0, x < 8 ? 100 : 90]);
  const reference = image(64, 16, () => [0, 0, 0, 70]);
  const output = transferResidual(state, normal, reference);
  const alpha = (x: number) => output.data[(8 * 64 + x) * 4 + 3];
  expect(alpha(16)).toBeGreaterThanOrEqual(90);
  for (let x = 0; x < 16; x++) expect(alpha(x)).toBe(70);
  expect(alpha(22)).toBe(90);
});

test('dropped dashed ring fails change reproduction despite passing conformance and auto derives', async () => {
  const normal = texture(128), state = texture(128);
  for (let y = 20; y < 108; y++) for (let x = 20; x < 108; x++) {
    const edge = Math.min(x - 20, 107 - x, y - 20, 107 - y);
    if (edge < 8 && Math.floor((x + y) / 16) % 2 === 0) state.data[(y * 128 + x) * 4] += 24;
  }
  const reference = await nearest(normal);
  const droppedOutput = { ...reference, data: reference.data.slice() };
  // A tiny surviving mark avoids the older total-suppression invariant while
  // still losing the actual dashed ring, as the real generated masters did.
  droppedOutput.data[(44 * 256 + 44) * 4] += 1;
  const down = await downsample(droppedOutput), referenceDown = await downsample(reference);
  const dropped = changeReproduction(state, normal, down, referenceDown);
  expect(dropped.strongPixels).toBeGreaterThan(500);
  expect(dropped.share).toBe(0);
  expect(dropped.passes).toBe(false);
  expect((await stateConformance(state, normal, reference, droppedOutput, down)).registration.suppressed).toBe(true);
  const resolved = await resolveStateCandidate(state, normal, reference, droppedOutput);
  expect(resolved.method).toBe('residual');
  expect('fallbackReason' in resolved && resolved.fallbackReason).toContain('change reproduction');
  expect(resolved.change.passes).toBe(true);
  // Crisp-edge regional error exceeds the retired threshold but cannot veto
  // a fallback that meets the same change and conformance gates as generation.
  expect('diagnostics' in resolved && resolved.diagnostics.p99).toBeGreaterThan(4);
  expect(resolved.failures).toEqual([]);
  const acceptedFallback = await resolveStateCandidate(state, normal, reference, droppedOutput, {}, { accept: true });
  expect(acceptedFallback.method).toBe('residual');
  expect(acceptedFallback.failures).toEqual([]);
  const explicit = await resolveStateCandidate(state, normal, reference, droppedOutput, { stateDerivation: 'generate' }, { accept: true });
  expect(explicit.failures.join(';')).toContain('change reproduction');
  expect(stateCandidateFailures({ change: dropped, conformance: { reasons: ['colour failed'] } }, true)).toHaveLength(1);
});

test('change reproduction requires every strongly changed channel, counts pixels, and handles empty evidence', () => {
  const normal = image(100, 1, () => [100, 100, 100, 255]);
  const state = image(100, 1, () => [140, 60, 100, 255]);
  const output = image(100, 1, (x) => [130, x < 95 ? 70 : 100, 100, 255]);
  const result = changeReproduction(state, normal, output, normal);
  expect(result.strongPixels).toBe(100);
  expect(result.share).toBeGreaterThanOrEqual(0.9);
  expect(result.passes).toBe(true);
  expect(changeReproduction(state, normal, image(100, 1, () => [130, 130, 100, 255]), normal).passes).toBe(false);
  expect(changeReproduction(normal, normal, normal, normal)).toMatchObject({ strongPixels: 0, passes: true });
  expect(() => changeReproduction(state, normal, image(1, 1, () => [0, 0, 0, 0]), normal)).toThrow(/geometry/);
});


test('accept cannot waive total suppression of a low-contrast state below the strong-change threshold', async () => {
  const normal = texture(64), state = texture(64, 8), reference = await nearest(normal);
  const candidate = await resolveStateCandidate(state, normal, reference, reference, { stateDerivation: 'generate' }, { accept: true });
  expect(candidate.change.strongPixels).toBeGreaterThan(0);
  expect(candidate.failures.join(';')).toContain('suppressed too many intended state changes');
});


test('state gates reject malformed, non-finite and unsafe geometry instead of passing empty evidence', () => {
  const valid = image(1, 1, () => [10, 20, 30, 255]);
  const nonfinite = { ...valid, data: Float32Array.from([NaN, 20, 30, 255]) };
  expect(() => changeReproduction(valid, valid, nonfinite, valid)).toThrow(/finite/);
  expect(() => residualDiagnostics(valid, valid, nonfinite, valid)).toThrow(/finite/);
  expect(() => changeReproduction(null, valid, valid, valid)).toThrow(/geometry/);
  expect(() => changeReproduction({ ...valid, width: Number.MAX_SAFE_INTEGER }, valid, valid, valid)).toThrow(/geometry/);
  expect(() => transferResidual(valid, valid, image(2, 2, () => [10, 20, 30, 255]), 0)).toThrow(/feather/);
});


test('conformance-only generated failure triggers auto fallback before an acceptance override', async () => {
  const normal = texture(64), state = texture(64, 24), reference = await nearest(normal);
  const generated = await nearest(texture(64, 84));
  expect(changeReproduction(state, normal, await downsample(generated), await downsample(reference)).passes).toBe(true);
  for (const accept of [false, true]) {
    const resolved = await resolveStateCandidate(state, normal, reference, generated, {}, { accept });
    expect(resolved.method).toBe('residual');
    expect('fallbackReason' in resolved && resolved.fallbackReason).toMatch(/MAE/);
    expect(resolved.failures).toEqual([]);
  }
});


test('state-scoped conformance rejects local colour damage hidden by whole-image averages', async () => {
  const normal = texture(256), state = texture(256), reference = await nearest(normal);
  const generated = { ...reference, data: reference.data.slice() };
  for (let y = 16; y < 48; y++) for (let x = 16; x < 48; x++) {
    state.data[(y * 256 + x) * 4] += 24;
    for (const dy of [0, 1]) for (const dx of [0, 1]) generated.data[((y * 2 + dy) * 512 + x * 2 + dx) * 4] += 84;
  }
  const conformance = await stateConformance(state, normal, reference, generated, await downsample(generated));
  expect(conformance.reasons.some((reason: string) => reason.startsWith('whole-image'))).toBe(false);
  expect(conformance.reasons.some((reason: string) => reason.startsWith('state-region'))).toBe(true);
  expect(conformance.passes).toBe(false);
});

test('read-only calibration respects explicit generation and unavailable current cache candidates', async () => {
  for (const mode of ['auto', 'generate']) {
    const { root, assets } = await fixture(mode);
    try {
      const asset = { ...assets[1], stateResidualMaxHf: 0 }, normal = texture(64), state = texture(64, 24, true), reference = await nearest(normal);
      const manifest = JSON.parse(await readFile(join(root, 'art/hires.json'), 'utf8'));
      manifest.assets[1].stateResidualMaxHf = 0;
      await writeFile(join(root, 'art/hires.json'), JSON.stringify(manifest));
      await writeFile(join(root, asset.src), await encode(state));
      await writeFile(join(root, outputPath(assets[0])), await encode(reference));
      const cache = join(root, 'cache');
      const key = await currentCandidateKey(asset, await readFile(join(root, asset.src)), 'Upscale.', root);
      const folder = join(cache, 'hover', key.slice(0, 12));
      await mkdir(folder, { recursive: true });
      await writeFile(join(folder, 'request.json'), JSON.stringify({ key, src: asset.src }));
      await writeFile(join(folder, 'stats.json'), JSON.stringify({ reasons: [] }));
      await writeFile(join(folder, 'master.png'), await encode(reference));
      const rows: { src?: string; finalRouting?: string }[] = [];
      await auditStates({ root, calibrate: true, cache, baseline: undefined }, (row: typeof rows[number]) => rows.push(row));
      expect(rows.find((row) => row.src === asset.src)).toMatchObject({
        changeFallback: mode === 'auto', noPassingRoute: mode !== 'auto', finalRouting: mode === 'auto' ? 'residual' : 'rejected',
      });
      await rm(join(folder, 'master.png'));
      rows.length = 0;
      await auditStates({ root, calibrate: true, cache, baseline: undefined }, (row: typeof rows[number]) => rows.push(row));
      expect(rows.find((row) => row.src === asset.src)).toMatchObject({ changeFallback: false, finalRouting: 'generate-unchecked' });
    } finally { await rm(root, { recursive: true, force: true }); }
  }
});
