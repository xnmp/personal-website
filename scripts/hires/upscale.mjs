import sharp from 'sharp';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, access, realpath, rm, rename } from 'node:fs/promises';
import { homedir } from 'node:os';
import { extname, resolve, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { webpOptions } from '../webp.mjs';
import { planTiles } from './tiles.mjs';
import { blendTiles, colourStats, composeFlow, estimateFlow, padTransparent, toneMatch, warp } from './merge.mjs';
import { cacheKey, validateManifest } from './manifest.mjs';
import { lockEntry, writeLockEntry } from './lock.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const exists = async (path) => access(path).then(() => true, () => false);
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
    force: { type: 'boolean' }, remerge: { type: 'boolean' }, verify: { type: 'boolean' }, accept: { type: 'boolean' }, jobs: { type: 'string', default: '4' }, 'max-mae': { type: 'string', default: '14' },
  } });
  const jobs = Number(values.jobs), maxMae = Number(values['max-mae']);
  if (!Number.isSafeInteger(jobs) || jobs < 1) throw new Error('--jobs must be a positive integer');
  if (!Number.isFinite(maxMae) || maxMae < 0) throw new Error('--max-mae must be non-negative');
  if (values.verify && !values.remerge) throw new Error('--verify requires --remerge');
  return { ...values, jobs, maxMae };
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

async function processAsset(asset, opts, promptText, root, invoke) {
  const started = performance.now();
  const timing = (label) => { if (process.env.HIRES_TIMING) console.log(`${label}: ${((performance.now() - started) / 1000).toFixed(2)}s`); };
  const srcPath = resolve(root, asset.src);
  const publicPath = await realpath(resolve(root, 'public'));
  if (!((await realpath(srcPath)).startsWith(publicPath + sep))) throw new Error('src resolves outside public/');
  const sourceBytes = await readFile(srcPath);
  const metadata = await sharp(sourceBytes).metadata();
  if ((metadata.pages ?? 1) > 1) throw new Error('animated or multi-page sources are not supported');
  const plan = planTiles({ width: metadata.width, height: metadata.height, factor: asset.factor });
  const prompt = [promptText.trim(), ...(plan.tiles.length > 1 ? ['Image 1 is a crop of a larger painting: keep its edges continuous; no border, vignette or frame at the edges.'] : []), ...(asset.note ? [asset.note] : [])].join('\n') + '\n';
  const key = cacheKey(sourceBytes, asset.factor, asset.model, prompt);
  const sourceStem = asset.src.slice('public/'.length, -extname(asset.src).length);
  const cache = resolve(root, process.env.HIRES_CACHE ?? 'art/raw/hires', sourceStem, key.slice(0, 12));
  const output = srcPath.slice(0, -extname(srcPath).length) + `@${asset.factor}x.webp`;
  const present = await Promise.all(plan.tiles.map((_, i) => exists(resolve(cache, `tile-${i}.png`))));
  const missing = present.flatMap((found, i) => found ? [] : [`tile-${i}.png`]);
  const requests = opts.remerge ? 0 : opts.force ? present.length : missing.length;
  console.log(`${asset.src}: ${metadata.width}x${metadata.height} -> ${plan.outW}x${plan.outH}; ${plan.tiles.length} tiles; API ${plan.tiles.map((t) => `${t.apiW}x${t.apiH}`).join(', ')}; estimated requests ${requests} (up to ${requests * 2} with retries)`);
  if (opts.remerge && missing.length) {
    console.log(`${asset.src}: SKIPPED --remerge; missing cached tiles: ${missing.join(', ')}`);
    return;
  }
  if (opts.dry) return;
  await mkdir(cache, { recursive: true });
  const promptPath = resolve(cache, 'prompt.txt');
  await writeFile(promptPath, prompt);
  await json(resolve(cache, 'request.json'), { src: asset.src, key, ...asset, prompt, plan });
  const rgba = await raw(sharp(sourceBytes).toColourspace('srgb').ensureAlpha());
  const padded = padTransparent(rgba);
  timing('source prepared');
  await mapJobs(plan.tiles, opts.jobs, async (t, i) => {
    const input = resolve(cache, `tile-${i}-in.png`), output = resolve(cache, `tile-${i}.png`);
    if (opts.remerge || (!opts.force && await exists(output))) return;
    const inputBytes = await sharp(bytes(await crop(padded, t)), { raw: { width: t.w, height: t.h, channels: 3 } }).png().toBuffer();
    if (inputBytes.length >= 50_000_000) throw new Error(`tile ${i} input exceeds the API's 50MB limit`);
    await writeFile(input, inputBytes);
    await rm(output, { force: true });
    const temporary = resolve(cache, `tile-${i}.pending.png`);
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await rm(temporary, { force: true });
        await invoke(process.env.HIRES_PYTHON ?? resolve(homedir(), '.local/share/imagegen/.venv/bin/python'), [
          process.env.HIRES_IMAGEGEN ?? resolve(homedir(), '.claude/skills/imagegen/scripts/generate_with_keyring.py'),
          'edit', '--model', asset.model, '--image', input, '--prompt-file', promptPath, '--no-augment',
          '--size', `${t.apiW}x${t.apiH}`, '--quality', asset.apiQuality, '--output-format', 'png', '--out', temporary,
        ]);
        const info = await sharp(temporary).metadata();
        if (info.format !== 'png' || info.width !== t.apiW || info.height !== t.apiH) throw new Error('wrapper returned an invalid PNG size');
        await sharp(temporary).raw().toBuffer();
        await rename(temporary, output);
        return;
      } catch (error) {
        await rm(temporary, { force: true });
        if (attempt === 1) throw new Error(`tile ${i} failed after retry: ${error.message}`);
        console.error(`${asset.src}: tile ${i}: ${error.message}; retrying`);
      }
    }
  });
  const tiles = [], rawTiles = [], alignedTiles = [], tileStats = [];
  const alpha = (img) => Float32Array.from({ length: img.width * img.height }, (_, p) => img.data[p * 4 + 3] / 255);
  const weights = metadata.hasAlpha ? alpha(rgba) : undefined;
  for (const [i, t] of plan.tiles.entries()) {
    const source = await crop(padded, t);
    const base = await resize(source, t.ow, t.oh);
    const generated = await raw(sharp(resolve(cache, `tile-${i}.png`)).toColourspace('srgb').removeAlpha().resize(t.ow, t.oh, { fit: 'fill', kernel: 'lanczos3' }));
    const tileWeights = weights ? alpha(await crop(rgba, t)) : undefined;
    timing(`tile ${i} decoded`);
    const { down, aligned, alignedDown, preWarp, postWarp, iterations, history } = await alignTile(source, generated, asset.factor, tileWeights);
    timing(`tile ${i} warped + residual`);
    const beforeTone = colourStats(source, alignedDown, tileWeights);
    const matched = toneMatch(aligned, base, asset.sigma);
    timing(`tile ${i} tone matched`);
    tileStats.push({ ...colourStats(source, await resize(matched, t.w, t.h), tileWeights), beforeTone,
      preWarp, postWarp, iterations, alignmentHistory: history });
    // Whole-image geometry is checked before tone matching. Retain source-scale
    // tiles for these checks rather than three output-scale canvases.
    const small = { ox: t.x, oy: t.y, ow: t.w, oh: t.h };
    rawTiles.push({ ...small, image: down });
    alignedTiles.push({ ...small, image: alignedDown });
    tiles.push({ ...t, image: matched });
  }
  const beforeToneImage = blendTiles(rgba.width, rgba.height, alignedTiles);
  const beforeTone = colourStats(padded, beforeToneImage, weights);
  const preWarp = tiles.length === 1 ? tileStats[0].preWarp : estimateFlow(padded, blendTiles(rgba.width, rgba.height, rawTiles), { weights }).diagnostics;
  const postWarp = tiles.length === 1 ? tileStats[0].postWarp : estimateFlow(padded, beforeToneImage, { weights }).diagnostics;
  timing('whole flow');
  const merged = blendTiles(plan.outW, plan.outH, tiles);
  const whole = { ...colourStats(padded, await resize(merged, rgba.width, rgba.height), weights), beforeTone, preWarp, postWarp };
  timing('whole colour + blend');
  const notes = [whole, ...tileStats].flatMap((s, i) => s.gateable ? [] : [`${i === 0 ? 'whole' : `tile ${i - 1}`}: gate skipped: ${s.note}`]);
  for (const note of notes) console.log(`${asset.src}: ${note}`);
  const reasons = [whole, ...tileStats].flatMap((s, i) => acceptanceReasons(s, i === 0 ? 'whole' : `tile ${i - 1}`, opts.maxMae));
  const fmt = (n) => n.toFixed(2);
  console.log(`${asset.src}: pre median/p90 ${fmt(preWarp.median)}/${fmt(preWarp.p90)}; post median/p90/max ${fmt(postWarp.median)}/${fmt(postWarp.p90)}/${fmt(postWarp.max)} source px; reliable ${(postWarp.reliableShare * 100).toFixed(1)}%; ${reasons.length ? 'REJECTED' : 'PASS'}`);
  await json(resolve(cache, 'stats.json'), { whole, tiles: tileStats, rejected: reasons.length > 0, acceptedOverride: !!opts.accept, reasons, notes });
  let master = sharp(bytes(merged), { raw: geometry(merged) });
  if (metadata.hasAlpha) {
    const alpha = await sharp(sourceBytes).toColourspace('srgb').ensureAlpha().extractChannel('alpha').resize(plan.outW, plan.outH, { kernel: 'lanczos3' }).raw().toBuffer();
    master = master.joinChannel(alpha, { raw: { width: plan.outW, height: plan.outH, channels: 1 } });
  }
  const masterPath = resolve(cache, 'master.png');
  await master.png().toFile(masterPath);
  timing('master written');
  if (reasons.length && !opts.accept) throw new Error(`REJECTED: ${reasons.join('; ')} (review stats.json; --accept overrides)`);
  if (opts.verify) {
    if (!await exists(output)) {
      console.log(`${relative(root, output)} not shipped; verified gates only`);
      return;
    }
    const encoded = await sharp(masterPath).webp(asset.lossless ? { lossless: true } : webpOptions(asset.quality)).toBuffer();
    if (!encoded.equals(await readFile(output))) throw new Error('remerge differs from shipped bytes; output and lock left untouched');
    await writeLockEntry(root, asset, lockEntry(sourceBytes, asset, key));
    console.log(`${relative(root, output)} byte-identical; provenance locked`);
    return;
  }
  const temporary = output + '.pending';
  await sharp(masterPath).webp(asset.lossless ? { lossless: true } : webpOptions(asset.quality)).toFile(temporary);
  await rename(temporary, output);
  await writeLockEntry(root, asset, lockEntry(sourceBytes, asset, key));
  timing('webp written');
  console.log(`${relative(root, output)} written${reasons.length ? ' (--accept)' : ''}`);
}

export async function main(args = process.argv.slice(2), { root = ROOT, invoke = run } = {}) {
  const opts = cliOptions(args);
  const manifest = validateManifest(JSON.parse(await readFile(resolve(root, opts.manifest), 'utf8')));
  const prompt = await readFile(resolve(root, 'art/prompts/hires/upscale.txt'), 'utf8');
  const assets = manifest.assets.filter((a) => !opts.only || a.src.includes(opts.only));
  if (!assets.length) console.log('No matching hires assets; estimated requests 0.');
  let failed = false;
  for (const asset of assets) {
    try { await processAsset(asset, opts, prompt, root, invoke); }
    catch (error) { failed = true; console.error(`${asset.src}: ${error.message}`); }
  }
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then((code) => { process.exitCode = code; }, (error) => { console.error(error.message); process.exitCode = 1; });
}
