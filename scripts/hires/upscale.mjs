import sharp from 'sharp';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, access, realpath, rm, rename } from 'node:fs/promises';
import { homedir } from 'node:os';
import { extname, resolve, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { webpOptions } from '../webp.mjs';
import { planTiles } from './tiles.mjs';
import { planExternalTiles } from './external.mjs';
import { padRequestCanvas, extractRequestTile } from './canvas.mjs';
import { blendTiles, colourStats, composeFlow, estimateFlow, padTransparent, placeRegion, toneMatch, warp } from './merge.mjs';
import { resample, seamStats, wrapRegion, periodicHalo } from './periodic.mjs';
import { intendedChange, canonicaliseTransparent, registerState, stateRequestCrop, stateStats, derivationDigest, stateGateWeights, cropWeights, stateEvidence, residualRouting, transferResidual, residualDiagnostics, changeReproduction, statePolicy } from './states.mjs';
import { protectGlyphs, protectedStats } from './protect.mjs';
import { isNativeKit } from '../kit-native.mjs';
import { smoothField, kitImage, kitConformance, kitRailSeams, kitRawProof } from './generators.mjs';
import { detailStats } from './detail.mjs';
import { CandidateRejected, retrySelection } from './retries.mjs';
import { sheenImage } from '../framed-pane.mjs';
import { assetCacheKey, validateManifest, validateProtection, orderAssets } from './manifest.mjs';
import { lockEntry, lockMatches, outputPath, readLock, sourceSha256, writeLockEntry, outputProof, generatorDependency, generatorName } from './lock.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const exists = async (path) => access(path).then(() => true, () => false);
// API credits are for large art only: under about 2 MP at 2x, Codex image_gen
// (provider "external") produces the same tiles without spending credits.
export const API_MIN_OUTPUT_PIXELS = 2_000_000;
const deterministicError = (error) => ['ENOENT', 'ENOTDIR', 'EACCES', 'EPERM', 'ENOSPC', 'EROFS', 'EMFILE', 'ENFILE'].includes(error.code);
const geometry = ({ width, height, channels }) => ({ width, height, channels });
const bytes = (img) => {
  const out = Buffer.allocUnsafe(img.data.length);
  for (let i = 0; i < out.length; i++) out[i] = Math.round(Math.max(0, Math.min(255, img.data[i])));
  return out;
};
const raw = async (pipeline) => {
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  return { data, ...geometry(info) };
};
const resize = (img, width, height) => raw(sharp(bytes(img), { raw: geometry(img) }).resize(width, height, { fit: 'fill', kernel: 'lanczos3' }));
const crop = (img, t) => raw(sharp(bytes(img), { raw: geometry(img) }).extract({ left: t.x, top: t.y, width: t.w, height: t.h }));
const json = (path, value) => writeFile(path, JSON.stringify(value, null, 2) + '\n');
const run = (command, args) => new Promise((done, reject) => {
  const child = spawn(command, args, { stdio: ['ignore', 'inherit', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (chunk) => { process.stderr.write(chunk); stderr = (stderr + chunk.toString()).slice(-4096); });
  child.on('error', reject);
  child.on('close', (code, signal) => code === 0 ? done() : reject(new Error(`image wrapper exited ${signal ?? code}${stderr.trim() ? `: ${stderr.trim()}` : ''}`)));
});

export async function mapJobs(items, jobs, task) {
  let next = 0;
  const results = Array(items.length);
  await Promise.all(Array.from({ length: Math.min(jobs, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      try { results[i] = { value: await task(items[i], i) }; }
      catch (error) { results[i] = { error }; }
    }
  }));
  const failures = results.filter((r) => r.error);
  if (failures.length) throw new AggregateError(failures.map((r) => r.error), failures.map((r) => r.error.message).join('; '));
  return results.map((r) => r.value);
}

export function cliOptions(args) {
  const { values } = parseArgs({ args, options: {
    manifest: { type: 'string', default: 'art/hires.json' }, only: { type: 'string' }, dry: { type: 'boolean' }, pending: { type: 'boolean' },
    'retry-rejected': { type: 'string', default: '0' }, requests: { type: 'boolean' }, force: { type: 'boolean' }, remerge: { type: 'boolean' }, verify: { type: 'boolean' }, accept: { type: 'boolean' }, jobs: { type: 'string', default: '4' }, 'max-mae': { type: 'string', default: '14' },
  } });
  const jobs = Number(values.jobs), maxMae = Number(values['max-mae']), retryRejected = Number(values['retry-rejected']);
  if (!Number.isSafeInteger(retryRejected) || retryRejected < 0) throw new Error('--retry-rejected must be a non-negative integer');
  if (!Number.isSafeInteger(jobs) || jobs < 1) throw new Error('--jobs must be a positive integer');
  if (!Number.isFinite(maxMae) || maxMae < 0) throw new Error('--max-mae must be non-negative');
  if (values.requests && ['dry', 'force', 'remerge', 'verify', 'accept'].some((key) => values[key])) throw new Error('--requests cannot be combined with processing flags');
  if (values.verify && !values.remerge) throw new Error('--verify requires --remerge');
  return { ...values, jobs, maxMae, retryRejected };
}

export function acceptanceReasons(stats, label, maxMae, { alignment = true } = {}) {
  if (!stats.gateable) return [];
  const { reliableBlocks = 0, visibleBlocks = 0 } = stats.postWarp ?? {};
  const required = Math.max(3, Math.ceil(0.2 * visibleBlocks));
  return [...(alignment && reliableBlocks < required ? [`${label}: cannot establish alignment (${reliableBlocks} reliable blocks; need ${required} of ${visibleBlocks} visible blocks)`] : []),
    ...(alignment && stats.postWarp.median > 0.6 ? [`${label}: residual median ${stats.postWarp.median.toFixed(2)} source px > 0.6`] : []),
    ...(alignment && stats.postWarp.p90 > 1 ? [`${label}: residual p90 ${stats.postWarp.p90.toFixed(2)} source px > 1.0`] : []),
    ...(stats.blurredMae > maxMae ? [`${label}: blurred MAE ${stats.blurredMae.toFixed(2)} > ${maxMae}`] : [])];
}

export async function alignTile(source, generated, factor, weights) {
  const down = await resize(generated, source.width, source.height);
  const pre = estimateFlow(source, down, { weights });
  const history = [pre.diagnostics];
  let field = pre, residual = pre, aligned = generated, alignedDown = down;
  for (let iteration = 0; iteration < 3; iteration++) {
    aligned = warp(generated, field, factor);
    alignedDown = await resize(aligned, source.width, source.height);
    const post = estimateFlow(source, alignedDown, { weights });
    history.push(post.diagnostics);
    const improvement = residual.diagnostics.p90 - post.diagnostics.p90;
    residual = post;
    if (improvement < 0.05 || iteration === 2) break;
    field = composeFlow(field, residual);
  }
  return { down, aligned, alignedDown, preWarp: pre.diagnostics, postWarp: residual.diagnostics, iterations: history.length - 1, history };
}

// Evaluate the delivered state with the generated path's evidence support,
// tile plan, alignment/colour thresholds and registration invariants.
export async function stateConformance(state, normal, reference, decoded, down, asset = {}, maxMae = 14, { derived = false, evidence = intendedChange(state, normal) } = {}) {
  const native = isNativeKit(asset.generator);
  const alignment = !derived && !native;
  const support = stateGateWeights(state, normal);
  const region = asset.stateCrop ? stateRequestCrop(state, normal) : null;
  const width = region?.w ?? state.width, height = region?.h ?? state.height;
  const plan = asset.provider === 'external'
    ? planExternalTiles({ width, height, factor: 2, sizes: asset.external.sizes })
    : planTiles({ width, height, factor: 2, ...(asset.apiMaxPixels ? { limits: { maxPixels: asset.apiMaxPixels } } : {}) });
  const regions = plan.tiles.map((t) => ({ x: t.x + (region?.x ?? 0), y: t.y + (region?.y ?? 0), w: t.w, h: t.h }));
  const wholeImage = protectedStats(state, down, undefined, { alignment });
  const whole = protectedStats(state, down, support, { alignment });
  const tiles = await Promise.all(regions.map(async (t) => protectedStats(await crop(state, t), await crop(down, t), cropWeights(support, state.width, t), { alignment })));
  const registration = stateStats(state, normal, reference, decoded, down, evidence, { native });
  const reasons = [wholeImage, whole, ...tiles].flatMap((s, i) => acceptanceReasons(s, i === 0 ? 'whole-image' : i === 1 ? 'state-region' : `state tile ${i - 2}`, maxMae, { alignment }));
  if (registration.stateMae > maxMae) reasons.push(`registered state premultiplied MAE ${registration.stateMae} > ${maxMae}`);
  if (registration.outsideDifferingPixels) reasons.push(`registered state differs outside S2 (${registration.outsideDifferingPixels} premultiplied RGBA pixels)`);
  if (registration.suppressed) reasons.push('registration suppressed too many intended state changes');
  return { alignment: native ? { analytic: true, reason: 'Kit-native geometry; gated by exact 2x dimensions and the kit premultiplied MAE gate.' } : derived ? { inherited: true, reference: asset.reference ?? null, reason: 'Deterministic delta over the locked canonical; alignment accepted by its lock.' } : { inherited: false }, wholeImage, whole, tiles, registration, reasons, passes: !reasons.length };
}

export async function residualCandidate(state, normal, reference, asset = {}, maxMae = 14) {
  const evidence = intendedChange(state, normal);
  const master = canonicaliseTransparent(transferResidual(state, normal, reference, undefined, evidence));
  const encoded = await sharp(bytes(master), { raw: geometry(master) }).webp({ lossless: true }).toBuffer();
  const decoded = await raw(sharp(encoded).toColourspace('srgb').ensureAlpha());
  const down = await resize(decoded, state.width, state.height);
  const diagnostics = residualDiagnostics(state, normal, down, await resize(reference, state.width, state.height), evidence);
  const conformance = await stateConformance(state, normal, reference, decoded, down, asset, maxMae, { derived: true, evidence });
  const change = changeReproduction(state, normal, down, await resize(reference, state.width, state.height), evidence);
  return { master, encoded, diagnostics, conformance, change };
}

// Accept only waives conformance. Missing state changes remain hard failures
// for every candidate, including an auto fallback. Region errors are diagnostic.
export function stateCandidateFailures(candidate, accept = false) {
  return [
    ...(candidate.conformance.registration?.suppressed ? ['registration suppressed too many intended state changes'] : []),
    ...(!candidate.change.passes && candidate.change.noiseOnly ? [`output low-passed delta ${candidate.change.outputMaxDelta} exceeds noise floor ${candidate.change.noiseFloor}`] : []),
    ...(!candidate.change.passes && !candidate.change.noiseOnly ? [`change reproduction ${candidate.change.reproducedPixels}/${candidate.change.strongPixels} (${(candidate.change.share * 100).toFixed(2)}%) < 90%`] : []),
    ...(!accept ? candidate.conformance.reasons : []),
  ];
}

export async function resolveStateCandidate(state, normal, reference, generated, asset = {}, { maxMae = 14, accept = false, generationReasons = [] } = {}) {
  const down = await resize(generated, state.width, state.height);
  const change = changeReproduction(state, normal, down, await resize(reference, state.width, state.height));
  const conformance = await stateConformance(state, normal, reference, generated, down, asset, maxMae);
  conformance.reasons = [...generationReasons, ...conformance.reasons];
  conformance.passes = !conformance.reasons.length;
  const original = { change, conformance };
  // Even --accept must attempt the deterministic fallback when generation loses
  // conformance. Only the fallback's conformance can then be waived.
  if (statePolicy(asset).mode === 'auto' && (!change.passes || !conformance.passes)) {
    const candidate = await residualCandidate(state, normal, reference, asset, maxMae);
    return { ...candidate, method: 'residual', fallbackReason: stateCandidateFailures(original).join('; '), generated: original,
      failures: stateCandidateFailures(candidate, accept) };
  }
  return { ...original, master: generated, method: 'generate', failures: stateCandidateFailures(original, accept) };
}

// Only failures at the provider boundary qualify. Programming, filesystem and
// invariant failures elsewhere must not silently change the route.
export class ProviderUnavailable extends CandidateRejected {}
export async function withStateProviderFallback(asset, generate, derive) {
  try { return await generate(); }
  catch (error) {
    const errors = error instanceof AggregateError ? error.errors : [error];
    if (!asset.family || asset.reference === asset.src || statePolicy(asset).mode !== 'auto' ||
        !errors.some((e) => e instanceof ProviderUnavailable) || !errors.every((e) => e instanceof CandidateRejected)) throw error;
    return derive(errors.map((e) => e.message).join('; '));
  }
}

async function lockedReference(asset, root, assets) {
  const normalAsset = assets.find((a) => a.src === asset.reference);
  const normalBytes = await readFile(resolve(root, asset.reference));
  let referenceBytes;
  try { referenceBytes = await readFile(resolve(root, outputPath(normalAsset))); }
  catch (error) { if (error.code === 'ENOENT') throw new Error(`missing reference output: ${outputPath(normalAsset)}`); throw error; }
  const lock = await readLock(root);
  if (!await isUpToDate(normalAsset, lock, root, assets)) throw new Error('canonical reference is stale or unlocked');
  return { normalBytes, referenceBytes,
    normal: await raw(sharp(normalBytes).toColourspace('srgb').ensureAlpha()),
    reference: await raw(sharp(referenceBytes).toColourspace('srgb').ensureAlpha()) };
}

export function prepareGeneratedPixels(source, master, asset, normal, reference) {
  const protectedMaster = asset.protect ? protectGlyphs(source, master, asset.protect, asset.protectFeather ?? 6) : master;
  return reference ? registerState(source, normal, reference, protectedMaster) : protectedMaster;
}

export async function finishAsset(asset, opts, root, sourceBytes, rgba, master, cache, key, reasons, stats) {
  const output = resolve(root, outputPath(asset));
  let derivation, reference, normal;
  if (asset.family && asset.reference !== asset.src) {
    const dependency = await lockedReference(asset, root, opts.assets);
    const { normalBytes, referenceBytes } = dependency;
    normal = dependency.normal; reference = dependency.reference;
    derivation = derivationDigest(sourceBytes, normalBytes, referenceBytes, asset.sigma);
  }
  // Protect the own candidate before canonical registration. Never blend an
  // already protected canonical feather a second time. Registration is cheap;
  // recompute it so cached derived PNGs cannot preserve an older composition.
  if (stats.stateDerivation?.method !== 'residual') master = prepareGeneratedPixels(rgba, master, asset, normal, reference);
  if (asset.protect && stats.stateDerivation?.method !== 'residual') {
    stats.protect = asset.protect;
    stats.protectFeather = asset.protectFeather ?? 6;
    // Protection changes the delivered image. Gate each contributing tile and
    // the whole protected master, rather than the discarded model lettering.
    const down = await resize(master, rgba.width, rgba.height);
    const support = reference ? stateGateWeights(rgba, normal) : undefined;
    stats.whole = protectedStats(rgba, down, support);
    stats.tiles = await Promise.all((stats.gateRegions ?? []).map(async (t) => protectedStats(await crop(rgba, t), await crop(down, t), support ? cropWeights(support, rgba.width, t) : undefined)));
    stats.notes = [stats.whole, ...stats.tiles].flatMap((s, i) => s.gateable ? [] : [`${i ? `tile ${i - 1}` : 'whole'}: gate skipped: ${s.note}`]);
    reasons = [stats.whole, ...stats.tiles].flatMap((s, i) => acceptanceReasons(s, i ? `tile ${i - 1}` : 'whole', opts.maxMae));
    stats.retryTiles = stats.tiles.flatMap((s, i) => acceptanceReasons(s, 'tile', opts.maxMae).length ? [i] : []);
    console.log(`${asset.src}: protected conformance ${reasons.length ? 'REJECTED' : 'PASS'}`);
  }
  if (asset.family) master = canonicaliseTransparent(master);
  let encoded = await sharp(bytes(master), { raw: geometry(master) }).webp(asset.lossless || asset.family ? { lossless: true } : webpOptions(asset.quality)).toBuffer();
  let decoded = await raw(sharp(encoded).toColourspace('srgb').ensureAlpha());
  const hardReasons = [], invariantReasons = [];
  if (decoded.width !== rgba.width * asset.factor || decoded.height !== rgba.height * asset.factor) invariantReasons.push('decoded output dimensions differ from exact scale');
  if (reference) {
    if (stats.stateDerivation?.method !== 'residual') {
      const resolved = await resolveStateCandidate(rgba, normal, reference, decoded, asset, { ...opts, generationReasons: reasons });
      stats.stateDerivation = { ...stats.stateDerivation, method: resolved.method,
        ...(resolved.fallbackReason ? { fallbackReason: resolved.fallbackReason, generated: resolved.generated } : {}) };
      if (resolved.method === 'residual') {
        master = resolved.master; encoded = resolved.encoded;
        decoded = await raw(sharp(encoded).toColourspace('srgb').ensureAlpha());
        // The rejected model candidate's conformance is recorded above; gate
        // the replacement on its own delivered pixels.
        reasons = [];
      }
    }
    const down = await resize(decoded, rgba.width, rgba.height);
    const referenceDown = await resize(reference, rgba.width, rgba.height);
    stats.conformance = await stateConformance(rgba, normal, reference, decoded, down, asset, opts.maxMae, { derived: stats.stateDerivation?.method === 'residual' });
    stats.registration = { ...stats.conformance.registration, derivationDigest: derivation };
    if (stats.registration.suppressed) hardReasons.push('registration suppressed too many intended state changes');
    if (stats.registration.outsideDifferingPixels) invariantReasons.push(`registered state differs outside S2 (${stats.registration.outsideDifferingPixels} premultiplied RGBA pixels)`);
    stats.changeReproduction = changeReproduction(rgba, normal, down, referenceDown);
    if (!stats.changeReproduction.passes) hardReasons.push(...stateCandidateFailures({ change: stats.changeReproduction, conformance: { reasons: [] } }));
    reasons.push(...stats.conformance.reasons);
    if (stats.stateDerivation?.method === 'residual') {
      stats.stateDerivation.diagnostics = residualDiagnostics(rgba, normal, down, referenceDown);
      stats.stateDerivation.conformance = stats.conformance;
    }
  }
  if (isNativeKit(asset.generator)) {
    stats.ink = await kitConformance(rgba, decoded, asset.generator);
    reasons.push(...stats.ink.reasons);
    stats.railSeams = await kitRailSeams(rgba, decoded, asset.generator);
    if (stats.railSeams && !stats.railSeams.passes) reasons.push('decoded native rail wrap jump or first derivative exceeds baseline tolerance');
  }
  if (asset.periodic) {
    stats.seams = seamStats(decoded, resample(rgba, 2, true));
    if (!stats.seams.passes) reasons.push('decoded periodic wrap jump or first derivative exceeds baseline tolerance');
  }
  const invariants = new Set([...hardReasons, ...invariantReasons]);
  reasons = reasons.filter((reason) => !invariants.has(reason));
  stats.gates = { conformance: reasons, invariants: [...invariants] };
  stats.reasons = [...reasons, ...hardReasons, ...invariantReasons];
  stats.rejected = stats.reasons.length > 0;
  stats.acceptedOverride = !!opts.accept && reasons.length > 0 && !hardReasons.length && !invariantReasons.length;
  await json(resolve(cache, 'stats.json'), stats);
  await sharp(bytes(master), { raw: geometry(master) }).png().toFile(resolve(cache, 'master.png'));
  // Geometry and canonical-copy invariants are properties of our processing,
  // independent of the model's paint. A new paid output cannot repair them.
  if (invariantReasons.length) throw new Error(`REJECTED: ${stats.reasons.join('; ')}`);
  if (hardReasons.length || (reasons.length && !opts.accept)) throw new CandidateRejected(`REJECTED: ${stats.reasons.join('; ')} (review stats.json; --accept overrides conformance gates only)`, stats.retryTiles?.length ? stats.retryTiles : stats.tiles?.map((_, i) => i));
  const proof = { outputSha256: sourceSha256(encoded), width: decoded.width, height: decoded.height,
    ...(derivation ? { derivationDigest: derivation } : {}),
    ...(stats.stateDerivation ? { stateDerivation: stats.stateDerivation } : {}),
    ...(stats.dependencies ? { dependencies: stats.dependencies } : {}) };
  const entry = lockEntry(sourceBytes, asset, key, { ...proof, ...(stats.acceptedOverride ? { accepted: true, acceptedReasons: reasons } : {}) });
  if (opts.verify) {
    if (!await exists(output)) { console.log(`${relative(root, output)} not shipped; verified gates only`); return; }
    if (!encoded.equals(await readFile(output))) throw new Error('remerge differs from shipped bytes; output and lock left untouched');
    console.log(`${relative(root, output)} byte-identical; output and lock untouched`);
    return;
  }
  await writeFile(output + '.pending', encoded);
  await rename(output + '.pending', output);
  await writeLockEntry(root, asset, entry);
  console.log(`${relative(root, output)} written${stats.acceptedOverride ? ' (--accept)' : ''}`);
}

async function processAttempt(asset, opts, promptText, root, invoke, context) {
  const started = performance.now();
  const timing = (label) => { if (process.env.HIRES_TIMING) console.log(`${label}: ${((performance.now() - started) / 1000).toFixed(2)}s`); };
  const srcPath = resolve(root, asset.src);
  const publicPath = await realpath(resolve(root, 'public'));
  if (!((await realpath(srcPath)).startsWith(publicPath + sep))) throw new Error('src resolves outside public/');
  const sourceBytes = await readFile(srcPath);
  const metadata = await sharp(sourceBytes).metadata();
  validateProtection(asset, metadata.width, metadata.height);
  if ((metadata.pages ?? 1) > 1) throw new Error('animated or multi-page sources are not supported');
  if (asset.family && asset.reference !== asset.src) {
    const state = await raw(sharp(sourceBytes).toColourspace('srgb').ensureAlpha());
    const normal = await raw(sharp(await readFile(resolve(root, asset.reference))).toColourspace('srgb').ensureAlpha());
    context.stateDerivation ??= residualRouting(state, normal, asset);
    const decision = context.stateDerivation;
    if (decision.method === 'residual') {
      // Dry planning may precede creation of the canonical output. Its gate is
      // deferred until that dependency is locked; no cache or output is written.
      let dependency;
      if (!opts.dry && !opts.requests) dependency = await lockedReference(asset, root, opts.assets);
      else {
        try { dependency = await lockedReference(asset, root, opts.assets); }
        catch (error) { decision.referencePendingReason = error.message; }
      }
      const candidate = dependency ? await residualCandidate(state, normal, dependency.reference, asset, opts.maxMae) : null;
      if (candidate) {
        decision.diagnostics = candidate.diagnostics; decision.conformance = candidate.conformance; decision.change = candidate.change;
        decision.failures = stateCandidateFailures(candidate, opts.accept);
        if (decision.failures.length && !opts.dry && !opts.requests) {
          const key = assetCacheKey(sourceBytes, asset, promptText);
          const cache = resolve(root, process.env.HIRES_CACHE ?? 'art/raw/hires', asset.src.slice(7, -extname(asset.src).length), key.slice(0, 12));
          await mkdir(cache, { recursive: true });
          await json(resolve(cache, 'stats.json'), { stateDerivation: decision, rejected: true, reasons: decision.failures });
          throw new Error(`REJECTED: ${decision.failures.join('; ')} (--accept overrides conformance only, never change-reproduction gates)`);
        }
      }
      if (decision.method === 'residual') {
        if (opts.requests) return;
        console.log(`${asset.src}: state residual; HF RMS ${decision.hfRms.toFixed(4)}/255; threshold ${decision.maxHf}/255; ${candidate ? decision.failures.length ? `REJECTED (${decision.failures.join('; ')})` : 'change + conformance PASS' : `gates deferred (${decision.referencePendingReason})`}; estimated requests 0`);
        if (opts.dry) return { provider: asset.provider, requests: 0, tiles: 0, stateDerivation: decision };
        const key = assetCacheKey(sourceBytes, asset, promptText);
        const cache = resolve(root, process.env.HIRES_CACHE ?? 'art/raw/hires', asset.src.slice(7, -extname(asset.src).length), key.slice(0, 12));
        await mkdir(cache, { recursive: true });
        await finishAsset(asset, opts, root, sourceBytes, state, candidate.master, cache, key, [], { stateDerivation: decision, attempts: { requests: 0, retries: 0 } });
        return { provider: asset.provider, requests: 0, tiles: 0, stateDerivation: decision };
      }
    }
    if (!opts.requests) console.log(`${asset.src}: state generate; HF RMS ${decision.hfRms.toFixed(4)}/255; threshold ${decision.maxHf}/255${decision.fallbackReason ? `; ${decision.fallbackReason}` : ''}`);
  }
  const external = asset.provider === 'external';
  const deterministic = asset.provider === 'resample';
  const halo = asset.periodic ? periodicHalo(asset.sigma) : 0;
  let original, region, normalBytes;
  if (asset.stateCrop && asset.reference !== asset.src) {
    original = await raw(sharp(sourceBytes).toColourspace('srgb').ensureAlpha());
    normalBytes = await readFile(resolve(root, asset.reference));
    region = stateRequestCrop(original, await raw(sharp(normalBytes).toColourspace('srgb').ensureAlpha()));
  }
  const width = region?.w ?? metadata.width, height = region?.h ?? metadata.height;
  if (deterministic) {
    if (opts.requests) return;
    const rgba = await raw(sharp(sourceBytes).toColourspace('srgb').ensureAlpha());
    const detail = detailStats(rgba);
    // For seals, glyph fidelity outweighs recovered detail; generators synthesize their own field.
    if (!asset.generator && !asset.glyphs && !detail.passes) throw new Error(`resample refused: HF RMS ${detail.hfRms.toFixed(4)}/255 > ${detail.limit}/255; use a generative provider`);
    const rawProof = asset.generator?.type === 'kit' ? await kitRawProof(asset.generator) : null;
    if (rawProof) console.log(`${asset.src}: kit-native raw ${rawProof.rawSource}; sampled ${rawProof.sampled.width}x${rawProof.sampled.height}; ratio ${rawProof.ratio.toFixed(6)}`);
    const dependency = !opts.dry && asset.generator?.type === 'smooth-field' ? await generatorDependency(asset, root, opts.assets) : null;
    console.log(`${asset.src}: ${metadata.width}x${metadata.height} -> ${metadata.width * 2}x${metadata.height * 2}; resample; estimated requests 0`);
    if (opts.dry) return { provider: asset.provider, requests: 0, tiles: 0, stateDerivation: context.stateDerivation };
    const key = assetCacheKey(sourceBytes, asset, promptText);
    const cache = resolve(root, process.env.HIRES_CACHE ?? 'art/raw/hires', asset.src.slice(7, -extname(asset.src).length), key.slice(0, 12));
    await mkdir(cache, { recursive: true });
    if (asset.generator?.type === 'sheen' && (rgba.width !== rgba.height || rgba.width !== 256)) throw new Error('sheen generator requires a 256px square source');
    const master = isNativeKit(asset.generator) ? await kitImage(asset.generator, { root, sourceBytes }) : dependency ? await smoothField(dependency.dependencyBytes, asset.generator) : asset.generator ? sheenImage(rgba.width * 2, asset.generator) : resample(rgba, 2, !!asset.periodic);
    await finishAsset(asset, opts, root, sourceBytes, rgba, master, cache, key, [], { detail, attempts: { requests: 0, retries: 0 }, generator: generatorName(asset), ...(context.stateDerivation ? { stateDerivation: context.stateDerivation } : {}), ...(dependency ? { dependencies: { [asset.generator.from]: sourceSha256(dependency.dependencyBytes) } } : {}) });
    return;
  }
  if (opts.requests && !external) return;
  if (external && opts.force) throw new Error('--force is not supported for external assets; remove the cached tile to request a replacement');
  const plan = external
    ? planExternalTiles({ width: width + 2 * halo, height: height + 2 * halo, factor: asset.factor, sizes: asset.external.sizes })
    : planTiles({ width: width + 2 * halo, height: height + 2 * halo, factor: asset.factor, ...(asset.apiMaxPixels ? { limits: { maxPixels: asset.apiMaxPixels } } : {}) });
  const prompt = requestPrompt(promptText, asset, plan);
  const requestIdentity = normalBytes ? { normalSha256: sourceSha256(normalBytes), region: region ?? null } : null;
  const key = assetCacheKey(sourceBytes, asset, prompt, requestIdentity);
  const sourceStem = asset.src.slice('public/'.length, -extname(asset.src).length);
  const cache = resolve(root, process.env.HIRES_CACHE ?? 'art/raw/hires', sourceStem, key.slice(0, 12));
  const present = await Promise.all(plan.tiles.map((_, i) => exists(resolve(cache, `tile-${i}.png`))));
  const missing = present.flatMap((found, i) => found ? [] : [`tile-${i}.png`]);
  const requestsPath = resolve(cache, 'requests.json');
  if (opts.requests) {
    if (missing.length && await exists(requestsPath)) console.log(requestsPath);
    return;
  }
  const requests = opts.remerge ? 0 : opts.force ? present.length : missing.length;
  if (!external && (requests > 0 || opts.retryRejected > 0) && plan.outW * plan.outH < (opts.apiMinPixels ?? API_MIN_OUTPUT_PIXELS))
    throw new Error(`API refused: ${plan.outW}x${plan.outH} is under ${(opts.apiMinPixels ?? API_MIN_OUTPUT_PIXELS) / 1e6} MP at 2x; set provider "external" (Codex image_gen)`);
  console.log(`${asset.src}: ${metadata.width}x${metadata.height} -> ${plan.outW}x${plan.outH}; ${plan.tiles.length} tiles; ${external ? 'external' : 'API'} ${plan.tiles.map((t) => `${t.apiW}x${t.apiH}${t.requestW ? ` (padded input ${t.requestW}x${t.requestH}, offset ${t.padLeft},${t.padTop})` : ''}`).join(', ')}; estimated requests ${requests} ${external ? '' : `(up to ${requests + opts.retryRejected} including asset retry budget)`}`);
  if (opts.remerge && missing.length && !(external && context.stateDerivation?.mode === 'auto')) {
    console.log(`${asset.src}: SKIPPED --remerge; missing cached tiles: ${missing.join(', ')}`);
    return;
  }
  if (opts.dry && external && missing.length && context.stateDerivation?.mode === 'auto') {
    context.stateDerivation = { ...context.stateDerivation, method: 'residual', fallbackReason: `provider unavailable: missing external tiles: ${missing.join(', ')}` };
    return processAttempt(asset, opts, promptText, root, invoke, context);
  }
  if (opts.dry) return { provider: asset.provider, requests, tiles: plan.tiles.length, stateDerivation: context.stateDerivation };
  await mkdir(cache, { recursive: true });
  context.cache = cache;
  context.generationKey = key;
  if (context.stateDerivation) await json(resolve(cache, 'stats.json'), { stateDerivation: context.stateDerivation, status: 'generation-pending' });
  if (external && !context.loaded) {
    if (await exists(resolve(cache, 'attempts.json'))) context.attempts = JSON.parse(await readFile(resolve(cache, 'attempts.json'), 'utf8'));
    context.loaded = true;
  }
  const promptPath = resolve(cache, 'prompt.txt');
  await writeFile(promptPath, prompt);
  await json(resolve(cache, 'request.json'), { src: asset.src, key, ...asset, prompt, plan, ...(region ? { requestCrop: region } : {}) });
  const full = original ?? await raw(sharp(sourceBytes).toColourspace('srgb').ensureAlpha());
  const selected = region ? await crop(full, region) : full;
  const rgba = halo ? wrapRegion(selected, -halo, -halo, width + halo * 2, height + halo * 2) : selected;
  const periodicSource = asset.periodic ? { ...selected, channels: 3, data: Float32Array.from({ length: selected.width * selected.height * 3 }, (_, i) => selected.data[Math.floor(i / 3) * 4 + i % 3]) } : null;
  const padded = periodicSource ? wrapRegion(periodicSource, -halo, -halo, rgba.width, rgba.height) : padTransparent(rgba);
  timing('source prepared');
  if (external) {
    const pending = [];
    for (const [i, t] of plan.tiles.entries()) {
      const requestPath = resolve(cache, `tile-${i}-in.png`), outputPath = resolve(cache, `tile-${i}.png`);
      if (present[i]) continue;
      const tile = await crop(padded, t);
      const filled = asset.periodic
        ? wrapRegion(periodicSource, t.x - t.padLeft - halo, t.y - t.padTop - halo, t.requestW, t.requestH)
        : await padRequestCanvas(tile, t);
      await sharp(bytes(filled), { raw: geometry(filled) }).png().toFile(requestPath);
      if (!context.attempts.tiles[i]) {
        context.attempts.tiles[i] = 1;
        context.attempts.requests++;
      }
      pending.push({ requestPath, outputPath, prompt, allowedSizes: asset.external.sizes,
        factor: asset.factor, width: t.apiW, height: t.apiH });
    }
    await json(requestsPath, { version: 1, src: asset.src, provider: 'external', requests: pending });
    await json(resolve(cache, 'attempts.json'), context.attempts);
    if (pending.length && context.stateDerivation?.mode === 'auto') throw new ProviderUnavailable(`provider unavailable: missing external tiles: ${missing.join(', ')}`, []);
    if (pending.length) {
      const statsPath = resolve(cache, 'stats.json');
      const stats = await exists(statsPath) ? JSON.parse(await readFile(statsPath, 'utf8')) : {};
      await json(statsPath, { ...stats, awaiting: pending.length, attempts: context.attempts });
      console.log(`AWAITING ${pending.length} external tiles: ${requestsPath}`);
      return;
    }
  }
  if (!external) await mapJobs(plan.tiles, opts.jobs, async (t, i) => {
    const input = resolve(cache, `tile-${i}-in.png`), output = resolve(cache, `tile-${i}.png`);
    if (opts.remerge || (!opts.force && await exists(output))) return;
    const inputTile = await crop(padded, t);
    const inputCanvas = t.requestW && periodicSource
      ? wrapRegion(periodicSource, t.x - t.padLeft - halo, t.y - t.padTop - halo, t.requestW, t.requestH)
      : await padRequestCanvas(inputTile, t);
    const inputBytes = await sharp(bytes(inputCanvas), { raw: geometry(inputCanvas) }).png().toBuffer();
    if (inputBytes.length >= 50_000_000) throw new Error(`tile ${i} input exceeds the API's 50MB limit`);
    await writeFile(input, inputBytes);
    await rm(output, { force: true });
    const temporary = resolve(cache, `tile-${i}.pending.png`);
    await rm(temporary, { force: true });
    context.attempts.requests++;
    context.attempts.tiles[i] = (context.attempts.tiles[i] ?? 0) + 1;
    try {
      await invoke(process.env.HIRES_PYTHON ?? resolve(homedir(), '.local/share/imagegen/.venv/bin/python'), [
        process.env.HIRES_IMAGEGEN ?? resolve(homedir(), '.claude/skills/imagegen/scripts/generate_with_keyring.py'),
        'edit', '--model', asset.model, '--image', input, '--prompt-file', promptPath, '--no-augment',
        '--size', `${t.apiW}x${t.apiH}`, '--quality', asset.apiQuality, '--output-format', 'png', '--out', temporary,
      ]);
    } catch (error) {
      if (deterministicError(error)) throw error;
      throw new ProviderUnavailable(`provider unavailable, tile ${i}: ${error.message}`, [i]);
    }
    try {
      const info = await sharp(temporary).metadata();
      if (info.format !== 'png' || info.width !== t.apiW || info.height !== t.apiH) throw new Error('wrapper returned an invalid PNG size');
      await sharp(temporary).raw().toBuffer();
    } catch (error) {
      if (deterministicError(error)) throw error;
      throw new CandidateRejected(`tile ${i}: ${error.message}`, [i]);
    }
    await rename(temporary, output);
  });
  const tiles = [], rawTiles = [], alignedTiles = [], tileStats = [];
  const alpha = (img) => Float32Array.from({ length: img.width * img.height }, (_, p) => img.data[p * 4 + 3] / 255);
  const gateWeights = asset.family && asset.reference !== asset.src
    ? stateGateWeights(full, await raw(sharp(normalBytes ?? await readFile(resolve(root, asset.reference))).toColourspace('srgb').ensureAlpha())) : null;
  const alignmentWeights = metadata.hasAlpha ? alpha(rgba) : undefined;
  const weights = gateWeights ? region ? cropWeights(gateWeights, full.width, region) : gateWeights : metadata.hasAlpha ? alpha(rgba) : undefined;
  for (const [i, t] of plan.tiles.entries()) {
    const source = await crop(padded, t);
    const base = await resize(source, t.ow, t.oh);
    let generated;
    const tilePath = resolve(cache, `tile-${i}.png`);
    try {
      generated = await extractRequestTile(await readFile(tilePath), t);
    } catch (error) {
      if (deterministicError(error)) throw error;
      throw new CandidateRejected(`tile ${i}: ${error.message}`, [i]);
    }
    const tileWeights = weights ? cropWeights(weights, rgba.width, t) : undefined;
    timing(`tile ${i} decoded`);
    const alignment = await alignTile(source, generated, asset.factor, gateWeights ? tileWeights : alignmentWeights ? cropWeights(alignmentWeights, rgba.width, t) : undefined);
    const { down, aligned, alignedDown, iterations, history } = alignment;
    const beforeTone = gateWeights ? stateEvidence(source, alignedDown, tileWeights) : colourStats(source, alignedDown, tileWeights);
    const preWarp = gateWeights ? stateEvidence(source, down, tileWeights).flow : alignment.preWarp;
    const postWarp = gateWeights ? beforeTone.flow : alignment.postWarp;
    timing(`tile ${i} warped + residual`);
    const matched = toneMatch(aligned, base, asset.sigma, !!asset.periodic);
    timing(`tile ${i} tone matched`);
    tileStats.push({ ...(gateWeights ? stateEvidence(source, await resize(matched, t.w, t.h), tileWeights, { displacement: false }) : colourStats(source, await resize(matched, t.w, t.h), tileWeights)), beforeTone,
      preWarp, postWarp, iterations, alignmentHistory: history });
    // Whole-image geometry is checked before tone matching. Retain source-scale
    // tiles for these checks rather than three output-scale canvases.
    const small = { ox: t.x, oy: t.y, ow: t.w, oh: t.h };
    rawTiles.push({ ...small, image: down });
    alignedTiles.push({ ...small, image: alignedDown });
    tiles.push({ ...t, image: matched });
  }
  const beforeToneImage = blendTiles(rgba.width, rgba.height, alignedTiles);
  const beforeTone = gateWeights ? stateEvidence(padded, beforeToneImage, weights) : colourStats(padded, beforeToneImage, weights);
  const preWarp = tiles.length === 1 ? tileStats[0].preWarp : (gateWeights ? stateEvidence(padded, blendTiles(rgba.width, rgba.height, rawTiles), weights).flow : estimateFlow(padded, blendTiles(rgba.width, rgba.height, rawTiles), { weights }).diagnostics);
  const postWarp = tiles.length === 1 ? tileStats[0].postWarp : (gateWeights ? beforeTone.flow : estimateFlow(padded, beforeToneImage, { weights }).diagnostics);
  timing('whole flow');
  const merged = blendTiles(plan.outW, plan.outH, tiles);
  const whole = { ...(gateWeights ? stateEvidence(padded, await resize(merged, rgba.width, rgba.height), weights, { displacement: false }) : colourStats(padded, await resize(merged, rgba.width, rgba.height), weights)), beforeTone, preWarp, postWarp };
  timing('whole colour + blend');
  const notes = [whole, ...tileStats].flatMap((s, i) => s.gateable ? [] : [`${i === 0 ? 'whole' : `tile ${i - 1}`}: gate skipped: ${s.note}`]);
  for (const note of notes) console.log(`${asset.src}: ${note}`);
  const reasons = [whole, ...tileStats].flatMap((s, i) => acceptanceReasons(s, i === 0 ? 'whole' : `tile ${i - 1}`, opts.maxMae));
  const fmt = (n) => n.toFixed(2);
  if (!asset.protect) console.log(`${asset.src}: pre median/p90 ${fmt(preWarp.median)}/${fmt(preWarp.p90)}; post median/p90/max ${fmt(postWarp.median)}/${fmt(postWarp.p90)}/${fmt(postWarp.max)} source px; reliable ${(postWarp.reliableShare * 100).toFixed(1)}%; ${reasons.length ? 'REJECTED' : 'PASS'}`);
  let master = sharp(bytes(merged), { raw: geometry(merged) });
  if (metadata.hasAlpha) {
    const restored = halo ? await resize(rgba, plan.outW, plan.outH) : await raw(sharp(bytes(rgba), { raw: geometry(rgba) }).resize(plan.outW, plan.outH, { kernel: 'lanczos3' }));
    const alphaBytes = Uint8Array.from({ length: restored.width * restored.height }, (_, p) => restored.data[p * 4 + 3]);
    master = master.joinChannel(alphaBytes, { raw: { width: plan.outW, height: plan.outH, channels: 1 } });
  }
  let finished = await raw(master.ensureAlpha());
  if (halo) finished = await crop(finished, { x: halo * 2, y: halo * 2, w: width * 2, h: height * 2 });
  if (region) finished = placeRegion(resample(full), { x: region.x * 2, y: region.y * 2 }, finished);
  const rejectedTiles = tileStats.flatMap((s, i) => acceptanceReasons(s, 'tile', opts.maxMae).length ? [i] : []);
  const retryTiles = rejectedTiles.length ? rejectedTiles : acceptanceReasons(whole, 'whole', opts.maxMae).length ? plan.tiles.map((_, i) => i) : [];
  await finishAsset(asset, opts, root, sourceBytes, full, finished, cache, key, reasons, { whole, tiles: tileStats, notes, attempts: context.attempts,
    ...(context.stateDerivation ? { stateDerivation: context.stateDerivation } : {}),
    gateScope: gateWeights ? 'state-mask-plus-4-source-px' : 'whole',
    ...(asset.protect ? { gateRegions: plan.tiles.map((t) => {
      const x = t.x - halo + (region?.x ?? 0), y = t.y - halo + (region?.y ?? 0);
      const left = Math.max(0, x), top = Math.max(0, y);
      return { x: left, y: top, w: Math.min(full.width, x + t.w) - left, h: Math.min(full.height, y + t.h) - top };
    }).filter((r) => r.w > 0 && r.h > 0) } : {}),
    retryTiles, ...(region ? { requestCrop: region } : {}) });
  timing('webp written');
}

/** @returns {Promise<{provider: string, requests: number, tiles: number, stateDerivation?: ReturnType<typeof residualRouting>} | undefined>} */
export async function processAsset(asset, opts, promptText, root, invoke) {
  const context = { cache: null, loaded: false, attempts: { requests: 0, retries: 0, tiles: {}, history: [] } };
  let first = true;
  while (true) {
    try {
      const result = await withStateProviderFallback(asset,
        () => processAttempt(asset, { ...opts, force: first && opts.force }, promptText, root, invoke, context),
        async (fallbackReason) => {
          // Provider errors can only arise after the dry/request return above.
          const sourceBytes = await readFile(resolve(root, asset.src));
          const state = await raw(sharp(sourceBytes).toColourspace('srgb').ensureAlpha());
          const { normal, reference } = await lockedReference(asset, root, opts.assets);
          const candidate = await residualCandidate(state, normal, reference, asset, opts.maxMae);
          context.stateDerivation = { ...context.stateDerivation, method: 'residual', fallbackReason };
          await finishAsset(asset, opts, root, sourceBytes, state, candidate.master, context.cache, context.generationKey, [],
            { stateDerivation: context.stateDerivation, attempts: context.attempts });
          return { provider: asset.provider, requests: context.attempts.requests, tiles: 0, stateDerivation: context.stateDerivation };
        });
      if (context.cache) {
        await json(resolve(context.cache, 'attempts.json'), context.attempts);
        console.log(`${asset.src}: attempts ${context.attempts.requests}; extra requests ${context.attempts.retries}/${opts.retryRejected}`);
      }
      return result;
    } catch (error) {
      const errors = error instanceof AggregateError ? error.errors : [error];
      if (!context.cache || opts.dry || opts.requests || opts.remerge || !errors.every((e) => e instanceof CandidateRejected)) throw error;
      const candidates = errors.flatMap((e) => e.tiles);
      const selected = retrySelection(candidates, context.attempts.retries, opts.retryRejected);
      context.attempts.history.push({ reasons: errors.map((e) => e.message), tiles: candidates, retryTiles: selected });
      // Record terminal failures too, even when decoding failed before conformance.
      const statsPath = resolve(context.cache, 'stats.json');
      const stats = await exists(statsPath) ? JSON.parse(await readFile(statsPath, 'utf8')) : {};
      for (const i of selected) {
        for (const suffix of ['.png', '.pending.png']) {
          const source = resolve(context.cache, `tile-${i}${suffix}`);
          if (!await exists(source)) continue;
          let k = 1;
          while (await exists(resolve(context.cache, `tile-${i}.rejected${k}.png`))) k++;
          await rename(source, resolve(context.cache, `tile-${i}.rejected${k}.png`));
        }
        context.attempts.retries++;
        if (asset.provider === 'external') {
          context.attempts.requests++;
          context.attempts.tiles[i] = (context.attempts.tiles[i] ?? 1) + 1;
        }
      }
      await json(resolve(context.cache, 'attempts.json'), context.attempts);
      await json(statsPath, { ...stats, ...(stats.stateDerivation || context.stateDerivation ? { stateDerivation: stats.stateDerivation ?? context.stateDerivation } : {}), rejected: true, reasons: errors.map((e) => e.message), attempts: context.attempts });
      console.log(`${asset.src}: attempts ${context.attempts.requests}; extra requests ${context.attempts.retries}/${opts.retryRejected}; ${selected.length ? `retrying tiles ${selected.join(', ')}` : 'retry budget exhausted'}`);
      if (!selected.length) throw error;
      first = false;
    }
  }
}

// Reconstruct the paid request identity without opening cache tiles or writing.
// A shipped fallback retains its generated request key; a direct derivation
// uses the raw prompt key. Recipe/output/reference validation remains separate.
export async function currentCandidateKey(asset, sourceBytes, promptText, root, entry = {}) {
  if (asset.provider === 'resample' || (entry.stateDerivation?.method === 'residual' && !entry.stateDerivation?.fallbackReason))
    return assetCacheKey(sourceBytes, asset, promptText);
  const metadata = await sharp(sourceBytes).metadata();
  let region, normalBytes;
  if (asset.stateCrop && asset.reference !== asset.src) {
    normalBytes = await readFile(resolve(root, asset.reference));
    region = stateRequestCrop(await raw(sharp(sourceBytes).ensureAlpha()), await raw(sharp(normalBytes).ensureAlpha()));
  }
  const halo = asset.periodic ? periodicHalo(asset.sigma) : 0;
  const width = (region?.w ?? metadata.width) + halo * 2, height = (region?.h ?? metadata.height) + halo * 2;
  const external = asset.provider === 'external';
  const plan = external ? planExternalTiles({ width, height, factor: asset.factor, sizes: asset.external.sizes }) : planTiles({ width, height, factor: asset.factor, ...(asset.apiMaxPixels ? { limits: { maxPixels: asset.apiMaxPixels } } : {}) });
  return assetCacheKey(sourceBytes, asset, requestPrompt(promptText, asset, plan), normalBytes ? { normalSha256: sourceSha256(normalBytes), region: region ?? null } : null);
}

const requestPrompt = (promptText, asset, plan) => [promptText.trim(), ...(plan.tiles.length > 1 ? ['Image 1 is a crop of a larger painting: keep its edges continuous; no border, vignette or frame at the edges.'] : []), ...(asset.provider === 'external' || plan.tiles.some((t) => t.requestW) ? ['The input includes padding. Preserve the entire canvas and padding exactly; do not crop, reframe or enlarge the subject.'] : []), ...(asset.note ? [asset.note] : [])].join('\n') + '\n';

// Decode delivered files and validate provenance; never load cached tiles or merge.
async function isUpToDate(asset, lock, root, assets) {
  const entry = lock.assets[outputPath(asset)];
  if (!entry) return false;
  try {
    const sourceBytes = await readFile(resolve(root, asset.src));
    const outputBytes = await readFile(resolve(root, outputPath(asset)));
    const proof = await outputProof(asset, sourceBytes, outputBytes, root, assets, new Set(), lock);
    const prompt = await readFile(resolve(root, 'art/prompts/hires/upscale.txt'), 'utf8');
    proof.candidateKey = await currentCandidateKey(asset, sourceBytes, prompt, root, entry);
    return lockMatches(entry, sourceBytes, asset, proof);
  } catch {
    // Missing, unreadable or malformed files must go through normal processing.
    return false;
  }
}

export async function main(args = process.argv.slice(2), { root = ROOT, invoke = run, processAsset: processSelectedAsset = processAsset, apiMinPixels = API_MIN_OUTPUT_PIXELS } = {}) {
  const opts = { ...cliOptions(args), apiMinPixels };
  const manifest = validateManifest(JSON.parse(await readFile(resolve(root, opts.manifest), 'utf8')));
  const prompt = await readFile(resolve(root, 'art/prompts/hires/upscale.txt'), 'utf8');
  const selected = new Set(manifest.assets.filter((a) => !opts.only || a.src.includes(opts.only)));
  // Close selection over families and output dependencies, including transitive ones.
  let size;
  do {
    size = selected.size;
    for (const asset of [...selected]) for (const candidate of manifest.assets) {
      if ((asset.family && candidate.family === asset.family) || outputPath(candidate) === asset.generator?.from) selected.add(candidate);
    }
  } while (selected.size !== size);
  const candidates = orderAssets(manifest.assets.filter((a) => selected.has(a)));
  const lock = opts.pending ? await readLock(root) : null;
  const states = await Promise.all(candidates.map(async (asset) => ({ asset, valid: opts.pending && await isUpToDate(asset, lock, root, manifest.assets) })));
  let changed;
  do {
    changed = false;
    const stale = new Set(states.filter(({ valid }) => !valid).map(({ asset }) => outputPath(asset)));
    // Valid siblings stay untouched. Shipping completeness is enforced by CSS;
    // only actual output dependencies propagate pending status.
    for (const state of states) if (state.valid && (stale.has(state.asset.generator?.from) ||
      (state.asset.family && state.asset.reference !== state.asset.src && stale.has(outputPath({ src: state.asset.reference, factor: 2 }))))) {
      state.valid = false; changed = true;
    }
  } while (changed);
  const assets = states.filter(({ valid }) => !valid).map(({ asset }) => asset);
  const skipped = candidates.length - assets.length;
  opts.assets = manifest.assets;
  const summary = { api: 0, external: 0, resample: 0, requests: 0, externalTiles: 0 };
  const routing = { api: { residual: 0, generate: 0 }, external: { residual: 0, generate: 0 }, resample: { residual: 0, generate: 0 } };
  const failedFamilies = new Set(), failedOutputs = new Set();
  if (!candidates.length && !opts.requests) console.log('No matching hires assets; estimated requests 0.');
  if (opts.pending && !opts.requests) console.log(`Skipped ${skipped} assets as up to date.`);
  let failed = false;
  for (const asset of assets) {
    if (asset.family && failedFamilies.has(asset.family)) { failedOutputs.add(outputPath(asset)); console.error(`${asset.src}: family blocked by a failed member`); continue; }
    if (failedOutputs.has(asset.generator?.from)) { failed = true; failedOutputs.add(outputPath(asset)); console.error(`${asset.src}: generator dependency failed`); continue; }
    try {
      const plan = await processSelectedAsset(asset, opts, prompt, root, invoke);
      summary[asset.provider]++;
      if (plan?.stateDerivation) routing[asset.provider][plan.stateDerivation.method]++;
      if (plan?.provider === 'api') summary.requests += plan.requests;
      if (plan?.provider === 'external') summary.externalTiles += plan.requests;
    } catch (error) { failed = true; failedOutputs.add(outputPath(asset)); if (asset.family && asset.reference === asset.src) failedFamilies.add(asset.family); console.error(`${asset.src}: ${error.message}`); }
  }
  if (opts.dry && Object.values(routing).some((r) => r.residual + r.generate)) console.log(`State routing: ${JSON.stringify(routing)}`);
  if (opts.dry) console.log(`Plan: ${assets.length} assets; api ${summary.api}, external ${summary.external}, resample ${summary.resample}; estimated API requests ${summary.requests}; external tiles ${summary.externalTiles}.`);
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then((code) => { process.exitCode = code; }, (error) => { console.error(error.message); process.exitCode = 1; });
}
