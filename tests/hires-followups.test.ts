import sharp from 'sharp';
import { expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { validateManifest, recipeDigest, processingRecipe, assetCacheKey } from '../scripts/hires/manifest.mjs';
import { lockEntry, lockMatches } from '../scripts/hires/lock.mjs';
import { derivationDigest, CURRENT_DERIVATION_GENERATION, HISTORICAL_DERIVATION_GENERATIONS, STATE_RECIPE, RESIDUAL_RECIPE, changeReproduction, transferResidual, intendedChange } from '../scripts/hires/states.mjs';
import { residualCandidate, stateConformance, stateCandidateFailures, withStateProviderFallback, ProviderUnavailable } from '../scripts/hires/upscale.mjs';
import { CandidateRejected } from '../scripts/hires/retries.mjs';
import { resample } from '../scripts/hires/periodic.mjs';

const image = (w: number, h: number, pixel: (x: number, y: number) => number[]) => ({ width: w, height: h, channels: 4,
  data: Uint8Array.from({ length: w * h * 4 }, (_, i) => pixel(Math.floor(i / 4) % w, Math.floor(i / 4 / w))[i % 4]) });
const assets = validateManifest({ version: 1, defaults: {}, assets: [
  { src: 'public/normal.png', family: 'pane', reference: 'public/normal.png' },
  { src: 'public/hover.png', family: 'pane', reference: 'public/normal.png' },
] }).assets;

// Captured from committed v4/v5 implementations; do not regenerate from the allowlist.
const historicalLocks = [
  { recipe: 'e52fb284a1646e42793ff8f58402ab17096f09263440e0544e0a68aab75cc588', implicit: 'b96b6b087c7c6bcfa5887c1e05567ca9812acac7b506718f9e4ff83bdbf111f5', derivation: '1281d12659e8648d6fec90efd94740f36791fca4a7c5aeee412e8287bc5aa5e1' },
  { recipe: '58f96b07a71a51ed7abbe25633a7bba1f8890def0700dc9310a50841f88bf257', implicit: 'f4d9d69d53adbde8e8525ff9685459c6989f11832822db7a6ad6c8aed1998045', derivation: 'f1deeb44be69952f39e12da71e028dc951c4fa86b9a14c0f8e4685db08053960' },
];

test('v4 historical and v5 current locks survive only unchanged inputs', () => {
  const bytes = Buffer.from('source'), normal = Buffer.from('normal'), reference = Buffer.from('reference');
  const a = assets[1], key = 'a'.repeat(64);
  const proof = { outputBytes: Buffer.from('output'), width: 2, height: 2, sourceWidth: 1, sourceHeight: 1,
    referenceValid: true, referenceBytes: normal, referenceOutputBytes: reference };
  expect(HISTORICAL_DERIVATION_GENERATIONS).toHaveLength(1);
  for (const [index, generation] of [...HISTORICAL_DERIVATION_GENERATIONS, CURRENT_DERIVATION_GENERATION].entries()) for (const implicit of [false, true]) {
    const golden = historicalLocks[index];
    const entry = lockEntry(bytes, a, key, { recipeDigest: implicit ? golden.implicit : golden.recipe, derivationDigest: golden.derivation });
    expect(recipeDigest(a, implicit, generation)).toBe(entry.recipeDigest);
    expect(derivationDigest(bytes, normal, reference, a.sigma, generation.state)).toBe(golden.derivation);
    if (implicit) delete entry.stateDerivation;
    expect(lockMatches(entry, bytes, a, proof)).toBe(true);
    for (const changed of [{ sigma: 9 }, { stateDerivation: 'generate' }, { stateResidualMaxHf: 8 }, { stateCrop: true }])
      expect(lockMatches(entry, bytes, { ...a, ...changed }, proof)).toBe(false);
    expect(lockMatches(entry, Buffer.from('changed source'), a, proof)).toBe(false);
    expect(lockMatches(entry, bytes, a, { ...proof, referenceOutputBytes: Buffer.from('changed reference') })).toBe(false);
    expect(lockMatches({ ...entry, recipeDigest: '0'.repeat(64) }, bytes, a, proof)).toBe(false);
  }
  const fake = { state: { ...STATE_RECIPE, version: 'registered-v999' }, residual: { ...RESIDUAL_RECIPE, version: 'residual-v999' } };
  const unlisted = lockEntry(bytes, a, key, { recipeDigest: recipeDigest(a, false, fake),
    derivationDigest: derivationDigest(bytes, normal, reference, a.sigma, fake.state) });
  expect(lockMatches(unlisted, bytes, a, proof)).toBe(false);
  const fresh = lockEntry(bytes, a, key, { derivationDigest: derivationDigest(bytes, normal, reference, a.sigma) });
  expect(STATE_RECIPE.version).toBe('registered-v3');
  expect(RESIDUAL_RECIPE.version).toBe('residual-v5');
  expect(fresh.recipeDigest).toBe(recipeDigest(a));
  expect(fresh.recipeDigest).not.toBe(recipeDigest(a, false, HISTORICAL_DERIVATION_GENERATIONS[0]));
  expect(lockMatches(fresh, bytes, a, proof)).toBe(true);
  // Paid request identities remain byte-identical to the previous generation.
  const original = createHash('sha256').update(bytes).update(JSON.stringify([a.factor, a.model, 'prompt'])).digest('hex');
  const previous = processingRecipe({ ...a, sigma: 4, protect: undefined, protectFeather: undefined }, true, HISTORICAL_DERIVATION_GENERATIONS[0]);
  expect(assetCacheKey(bytes, a, 'prompt')).toBe(createHash('sha256').update(original).update(JSON.stringify([previous, null])).digest('hex'));
});

test('noise-only derivation keeps canonical bytes and rejects introduced tint or shifted edge', () => {
  const normal = image(64, 64, x => [x < 32 ? 60 : 160, 100, 120, 128]);
  const state = image(64, 64, (x, y) => [normal.data[(y * 64 + x) * 4] + ((x + y) % 2 ? 10 : -10), 100, 120, 128]);
  const reference = resample(normal);
  expect(intendedChange(state, normal).mask.some(Boolean)).toBe(false);
  expect(transferResidual(state, normal, reference).data).toEqual(reference.data);
  expect(changeReproduction(state, normal, normal, normal)).toMatchObject({ noiseOnly: true, passes: true, outputMaxDelta: 0 });
  const tint = image(64, 64, (x, y) => [normal.data[(y * 64 + x) * 4] + 25, 100, 120, 128]);
  const shifted = image(64, 64, x => [x < 34 ? 60 : 160, 100, 120, 128]);
  for (const output of [tint, shifted]) {
    const change = changeReproduction(state, normal, output, normal);
    expect(change.passes).toBe(false);
    expect(stateCandidateFailures({ change, conformance: { reasons: [] } }, true)).toHaveLength(1);
  }
});

test('348-pixel +23 red ring is coherent evidence: missing fails, present passes', async () => {
  const n = image(128, 128, () => [80, 90, 100, 255]);
  const s = image(128, 128, (x, y) => [80 + ((x >= 20 && x <= 107 && (y === 20 || y === 107)) || (y > 20 && y < 107 && (x === 20 || x === 107)) ? 23 : 0), 90, 100, 255]);
  expect(changeReproduction(s, n, n, n)).toMatchObject({ strongPixels: 348, passes: false });
  expect(changeReproduction(s, n, s, n)).toMatchObject({ strongPixels: 348, passes: true });
  expect((await residualCandidate(s, n, resample(n))).change.passes).toBe(true);
});

test('derived candidates inherit alignment but retain colour and exterior invariants', async () => {
  const n = image(64, 64, (x, y) => [50 + (x * 13 + y * 7) % 100, 90, 100, 255]);
  const s = image(64, 64, (x, y) => [n.data[(y * 64 + x) * 4] + 10, 90, 100, 255]);
  const reference = resample(image(64, 64, (x, y) => [n.data[(y * 64 + (x + 3) % 64) * 4], 90, 100, 255]));
  const candidate = await residualCandidate(s, n, reference);
  const { data, info } = await sharp(Buffer.from(candidate.master.data), { raw: candidate.master }).resize(64, 64).raw().toBuffer({ resolveWithObject: true });
  const generated = await stateConformance(s, n, reference, candidate.master, { ...info, data });
  expect(candidate.conformance.alignment.inherited).toBe(true);
  expect(generated.alignment.inherited).toBe(false);
  expect(candidate.conformance.reasons.some((r: string) => /alignment|residual (median|p90)/.test(r))).toBe(false);
  expect(generated.reasons.some((r: string) => /alignment|residual (median|p90)/.test(r))).toBe(true);
  const wrong = image(128, 128, () => [240, 240, 240, 255]);
  const bad = await stateConformance(s, n, reference, wrong, image(64, 64, () => [240, 240, 240, 255]), {}, 14, { derived: true });
  expect(bad.passes).toBe(false);
  expect(bad.reasons.some((r: string) => /MAE/.test(r))).toBe(true);
});

test('provider unavailability falls back in auto, preserves reason, and fails in generate', async () => {
  const n = image(32, 32, () => [80, 90, 100, 255]), s = image(32, 32, () => [100, 90, 100, 255]);
  for (const reason of ['429 insufficient_quota', 'network disconnected', 'missing external tile']) {
    const generate = async () => { throw new ProviderUnavailable(reason, []); };
    const derive = async (fallbackReason: string) => ({ ...await residualCandidate(s, n, resample(n)), method: 'residual', fallbackReason });
    const candidate = await withStateProviderFallback(assets[1], generate, derive);
    expect(candidate.method).toBe('residual');
    expect(candidate.fallbackReason).toBe(reason);
    expect(candidate.change.passes).toBe(true);
    await expect(withStateProviderFallback({ ...assets[1], stateDerivation: 'generate' }, generate, derive)).rejects.toThrow(reason);
  }
  await expect(withStateProviderFallback(assets[1], async () => { throw new Error('implementation failure'); }, async () => null)).rejects.toThrow('implementation failure');
});

test('mixed provider and candidate tile errors still derive, infrastructure errors do not', async () => {
  const unavailable = new ProviderUnavailable('429 quota', [0]);
  const resolve = (errors: Error[]) => withStateProviderFallback(assets[1], async () => { throw new AggregateError(errors); }, async (reason: string) => reason);
  expect(await resolve([unavailable, new CandidateRejected('invalid PNG', [1])])).toContain('429 quota');
  await expect(resolve([unavailable, new Error('disk full')])).rejects.toThrow();
});
