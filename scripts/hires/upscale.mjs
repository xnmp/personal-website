import sharp from 'sharp';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, access, realpath, rm, rename } from 'node:fs/promises';
import { homedir } from 'node:os';
import { extname, resolve, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { webpOptions } from '../webp.mjs';
import { planTiles } from './tiles.mjs';
import { planExternalTiles, normalizationSize } from './external.mjs';
import { blendTiles, colourStats, composeFlow, estimateFlow, padTransparent, placeRegion, toneMatch, warp } from './merge.mjs';
import { resample, seamStats, wrapRegion, periodicHalo } from './periodic.mjs';
import { canonicaliseTransparent, registerState, stateRequestCrop, stateStats, derivationDigest, stateGateWeights, cropWeights, stateEvidence } from './states.mjs';
import { detailStats } from './detail.mjs';
import { CandidateRejected, retrySelection } from './retries.mjs';
import { sheenImage } from '../framed-pane.mjs';
import { assetCacheKey, validateManifest, processingRecipe } from './manifest.mjs';
import { lockEntry, lockMatches, outputPath, readLock, sourceSha256, writeLockEntry } from './lock.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const exists = async (path) => access(path).then(() => true, () => false);
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
  const child = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] });
  child.on('error', reject);
  child.on('exit', (code, signal) => code === 0 ? done() : reject(new Error(`image wrapper exited ${signal ?? code}`)));
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
    manifest: { type: 'string', default: 'art/hires.json' }, only: { type: 'string' }, dry: { type: 'boolean' },
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

export function acceptanceReasons(stats, label, maxMae) {
  if (!stats.gateable) return [];
  const { reliableBlocks = 0, visibleBlocks = 0 } = stats.postWarp;
  const required = Math.max(3, Math.ceil(0.2 * visibleBlocks));
  return [...(reliableBlocks < required ? [`${label}: cannot establish alignment (${reliableBlocks} reliable blocks; need ${required} of ${visibleBlocks} visible blocks)`] : []),
    ...(stats.postWarp.median > 0.6 ? [`${label}: residual median ${stats.postWarp.median.toFixed(2)} source px > 0.6`] : []),
    ...(stats.postWarp.p90 > 1 ? [`${label}: residual p90 ${stats.postWarp.p90.toFixed(2)} source px > 1.0`] : []),
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

async function outputProof(asset, sourceBytes, outputBytes, root) {
  const source = await sharp(sourceBytes).metadata(), output = await sharp(outputBytes).metadata();
  const reference = asset.family && asset.reference !== asset.src;
  return { outputBytes, width: output.width, height: output.height, sourceWidth: source.width, sourceHeight: source.height,
    ...(reference ? { referenceBytes: await readFile(resolve(root, asset.reference)),
      referenceOutputBytes: await readFile(resolve(root, outputPath({ src: asset.reference, factor: 2 }))) } : {}) };
}

async function finishAsset(asset, opts, root, sourceBytes, rgba, master, cache, key, reasons, stats) {
  const output = resolve(root, outputPath(asset));
  let derivation, reference, normal;
  if (asset.family && asset.reference !== asset.src) {
    const normalAsset = opts.assets.find((a) => a.src === asset.reference);
    const normalBytes = await readFile(resolve(root, asset.reference));
    const referenceBytes = await readFile(resolve(root, outputPath(normalAsset)));
    const lock = await readLock(root);
    if (!lockMatches(lock.assets[outputPath(normalAsset)], normalBytes, normalAsset, await outputProof(normalAsset, normalBytes, referenceBytes, root))) throw new Error('canonical reference is stale or unlocked');
    normal = await raw(sharp(normalBytes).toColourspace('srgb').ensureAlpha());
    reference = await raw(sharp(referenceBytes).toColourspace('srgb').ensureAlpha());
    derivation = derivationDigest(sourceBytes, normalBytes, referenceBytes, asset.sigma);
    const derivedPath = resolve(cache, `derived-${derivation}-${sourceSha256(bytes(master))}.png`);
    if (await exists(derivedPath)) master = await raw(sharp(derivedPath).ensureAlpha());
    else {
      master = registerState(rgba, normal, reference, master);
      await sharp(bytes(master), { raw: geometry(master) }).png().toFile(derivedPath);
    }
  }
  if (asset.family) master = canonicaliseTransparent(master);
  const encoded = await sharp(bytes(master), { raw: geometry(master) }).webp(asset.lossless || asset.family ? { lossless: true } : webpOptions(asset.quality)).toBuffer();
  const decoded = await raw(sharp(encoded).toColourspace('srgb').ensureAlpha());
  const hardReasons = [], invariantReasons = [];
  if (decoded.width !== rgba.width * asset.factor || decoded.height !== rgba.height * asset.factor) invariantReasons.push('decoded output dimensions differ from exact scale');
  if (reference) {
    stats.registration = { ...stateStats(rgba, normal, reference, decoded, await resize(decoded, rgba.width, rgba.height)), derivationDigest: derivation };
    if (stats.registration.outsideDifferingPixels) invariantReasons.push(`registered state differs outside S2 (${stats.registration.outsideDifferingPixels} premultiplied RGBA pixels)`);
    if (stats.registration.suppressed) hardReasons.push('registration suppressed every intended state change');
    if (stats.registration.stateMae > opts.maxMae) reasons.push(`registered state premultiplied MAE ${stats.registration.stateMae} > ${opts.maxMae}`);
  }
  if (asset.periodic) {
    stats.seams = seamStats(decoded, resample(rgba, 2, true));
    if (!stats.seams.passes) reasons.push('decoded periodic wrap jump or first derivative exceeds baseline tolerance');
  }
  stats.reasons = [...reasons, ...hardReasons, ...invariantReasons];
  stats.rejected = stats.reasons.length > 0;
  stats.acceptedOverride = !!opts.accept && reasons.length > 0 && !hardReasons.length && !invariantReasons.length;
  await json(resolve(cache, 'stats.json'), stats);
  await sharp(bytes(master), { raw: geometry(master) }).png().toFile(resolve(cache, 'master.png'));
  // Geometry and canonical-copy invariants are properties of our processing,
  // independent of the model's paint. A new paid output cannot repair them.
  if (invariantReasons.length) throw new Error(`REJECTED: ${stats.reasons.join('; ')}`);
  if (hardReasons.length || (reasons.length && !opts.accept)) throw new CandidateRejected(`REJECTED: ${stats.reasons.join('; ')} (review stats.json; --accept overrides conformance gates only)`, stats.retryTiles?.length ? stats.retryTiles : stats.tiles?.map((_, i) => i));
  const proof = processingRecipe(asset) ? { outputSha256: sourceSha256(encoded), width: decoded.width, height: decoded.height,
    ...(derivation ? { derivationDigest: derivation } : {}) } : {};
  const entry = lockEntry(sourceBytes, asset, key, { ...proof, ...(stats.acceptedOverride ? { accepted: true } : {}) });
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
  if ((metadata.pages ?? 1) > 1) throw new Error('animated or multi-page sources are not supported');
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
    if (!detail.passes) throw new Error(`resample refused: HF RMS ${detail.hfRms.toFixed(4)}/255 > ${detail.limit}/255; use a generative provider`);
    console.log(`${asset.src}: ${metadata.width}x${metadata.height} -> ${metadata.width * 2}x${metadata.height * 2}; resample; estimated requests 0`);
    if (opts.dry) return { provider: asset.provider, requests: 0, tiles: 0 };
    const key = assetCacheKey(sourceBytes, asset, promptText);
    const cache = resolve(root, process.env.HIRES_CACHE ?? 'art/raw/hires', asset.src.slice(7, -extname(asset.src).length), key.slice(0, 12));
    await mkdir(cache, { recursive: true });
    if (asset.generator && (rgba.width !== rgba.height || rgba.width !== 256)) throw new Error('sheen generator requires a 256px square source');
    const master = asset.generator ? sheenImage(rgba.width * 2, asset.generator) : resample(rgba, 2, !!asset.periodic);
    await finishAsset(asset, opts, root, sourceBytes, rgba, master, cache, key, [], { detail, attempts: { requests: 0, retries: 0 }, generator: asset.generator ? 'framed-pane/sheen-v1' : 'premultiplied-bilinear-v1' });
    return;
  }
  if (opts.requests && !external) return;
  if (external && opts.force) throw new Error('--force is not supported for external assets; remove the cached tile to request a replacement');
  const plan = external
    ? planExternalTiles({ width: width + 2 * halo, height: height + 2 * halo, factor: asset.factor, sizes: asset.external.sizes })
    : planTiles({ width: width + 2 * halo, height: height + 2 * halo, factor: asset.factor });
  const prompt = [promptText.trim(), ...(plan.tiles.length > 1 ? ['Image 1 is a crop of a larger painting: keep its edges continuous; no border, vignette or frame at the edges.'] : []), ...(external ? ['The input includes padding. Preserve the entire canvas and padding exactly; do not crop, reframe or enlarge the subject.'] : []), ...(asset.note ? [asset.note] : [])].join('\n') + '\n';
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
  console.log(`${asset.src}: ${metadata.width}x${metadata.height} -> ${plan.outW}x${plan.outH}; ${plan.tiles.length} tiles; ${external ? 'external' : 'API'} ${plan.tiles.map((t) => `${t.apiW}x${t.apiH}`).join(', ')}; estimated requests ${requests} ${external ? '' : `(up to ${requests + opts.retryRejected} including asset retry budget)`}`);
  if (opts.remerge && missing.length) {
    console.log(`${asset.src}: SKIPPED --remerge; missing cached tiles: ${missing.join(', ')}`);
    return;
  }
  if (opts.dry) return { provider: asset.provider, requests, tiles: plan.tiles.length };
  await mkdir(cache, { recursive: true });
  context.cache = cache;
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
      const canvas = await raw(sharp(bytes(tile), { raw: geometry(tile) }).ensureAlpha().extend({
        left: t.padLeft, right: t.requestW - t.w - t.padLeft,
        top: t.padTop, bottom: t.requestH - t.h - t.padTop, background: { r: 0, g: 0, b: 0, alpha: 0 },
      }));
      const filled = asset.periodic ? wrapRegion(periodicSource, t.x - t.padLeft - halo, t.y - t.padTop - halo, t.requestW, t.requestH) : padTransparent(canvas);
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
    const inputBytes = await sharp(bytes(await crop(padded, t)), { raw: { width: t.w, height: t.h, channels: 3 } }).png().toBuffer();
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
      throw new CandidateRejected(`tile ${i}: ${error.message}`, [i]);
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
      if (external) {
        const info = await sharp(tilePath).metadata();
        if ((info.pages ?? 1) > 1) throw new Error('animated external output is not supported');
        const size = normalizationSize(info.width, info.height, t);
        // Resize the complete request canvas, then remove only our known padding.
        const normalized = await sharp(tilePath).toColourspace('srgb').removeAlpha()
          .resize(size.width, size.height, { fit: 'fill', kernel: 'lanczos3' }).png().toBuffer();
        generated = await raw(sharp(normalized).extract({ left: t.padLeft * asset.factor, top: t.padTop * asset.factor, width: t.ow, height: t.oh }));
      } else {
        generated = await raw(sharp(tilePath).toColourspace('srgb').removeAlpha().resize(t.ow, t.oh, { fit: 'fill', kernel: 'lanczos3' }));
      }
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
  console.log(`${asset.src}: pre median/p90 ${fmt(preWarp.median)}/${fmt(preWarp.p90)}; post median/p90/max ${fmt(postWarp.median)}/${fmt(postWarp.p90)}/${fmt(postWarp.max)} source px; reliable ${(postWarp.reliableShare * 100).toFixed(1)}%; ${reasons.length ? 'REJECTED' : 'PASS'}`);
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
    gateScope: gateWeights ? 'state-mask-plus-4-source-px' : 'whole',
    retryTiles, ...(region ? { requestCrop: region } : {}) });
  timing('webp written');
}

async function processAsset(asset, opts, promptText, root, invoke) {
  const context = { cache: null, loaded: false, attempts: { requests: 0, retries: 0, tiles: {}, history: [] } };
  let first = true;
  while (true) {
    try {
      const result = await processAttempt(asset, { ...opts, force: first && opts.force }, promptText, root, invoke, context);
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
      await json(statsPath, { ...stats, rejected: true, reasons: errors.map((e) => e.message), attempts: context.attempts });
      console.log(`${asset.src}: attempts ${context.attempts.requests}; extra requests ${context.attempts.retries}/${opts.retryRejected}; ${selected.length ? `retrying tiles ${selected.join(', ')}` : 'retry budget exhausted'}`);
      if (!selected.length) throw error;
      first = false;
    }
  }
}

export async function main(args = process.argv.slice(2), { root = ROOT, invoke = run } = {}) {
  const opts = cliOptions(args);
  const manifest = validateManifest(JSON.parse(await readFile(resolve(root, opts.manifest), 'utf8')));
  const prompt = await readFile(resolve(root, 'art/prompts/hires/upscale.txt'), 'utf8');
  const selected = manifest.assets.filter((a) => !opts.only || a.src.includes(opts.only));
  const families = new Set(selected.map((a) => a.family).filter(Boolean));
  const assets = manifest.assets.filter((a) => selected.includes(a) || families.has(a.family))
    .toSorted((a, b) => Number(!!a.family && a.src !== a.reference) - Number(!!b.family && b.src !== b.reference));
  opts.assets = manifest.assets;
  const summary = { api: 0, external: 0, resample: 0, requests: 0, externalTiles: 0 };
  const failedFamilies = new Set();
  if (!assets.length && !opts.requests) console.log('No matching hires assets; estimated requests 0.');
  let failed = false;
  for (const asset of assets) {
    if (asset.family && failedFamilies.has(asset.family)) { console.error(`${asset.src}: family blocked by a failed member`); continue; }
    try {
      const plan = await processAsset(asset, opts, prompt, root, invoke);
      summary[asset.provider]++;
      if (plan?.provider === 'api') summary.requests += plan.requests;
      if (plan?.provider === 'external') summary.externalTiles += plan.requests;
    } catch (error) { failed = true; if (asset.family && asset.reference === asset.src) failedFamilies.add(asset.family); console.error(`${asset.src}: ${error.message}`); }
  }
  if (opts.dry) console.log(`Plan: ${assets.length} assets; api ${summary.api}, external ${summary.external}, resample ${summary.resample}; estimated API requests ${summary.requests}; external tiles ${summary.externalTiles}.`);
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then((code) => { process.exitCode = code; }, (error) => { console.error(error.message); process.exitCode = 1; });
}
