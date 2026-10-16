import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, rename, open, unlink } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { extname, resolve } from 'node:path';
import sharp from 'sharp';
import { recipeDigest, settingsDigest, validateProtection } from './manifest.mjs';
import { kitRecipe } from '../kit-native.mjs';
import { derivationDigest, statePolicy, CURRENT_DERIVATION_GENERATION, HISTORICAL_DERIVATION_GENERATIONS } from './states.mjs';

export const outputPath = ({ src, factor }) => src.slice(0, -extname(src).length) + `@${factor}x.webp`;
export const sourceSha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const generatorName = (asset) => asset.provider === 'external' ? 'codex-image_gen' : asset.provider === 'resample' ? asset.generator ? asset.generator.type === 'kit' ? 'kit-native-raster-v1' : asset.generator.type === 'ink' ? 'kit-native-ink-v1' : asset.generator.type === 'smooth-field' ? 'smooth-field-v1' : 'framed-pane/sheen-v1' : 'premultiplied-bilinear-v1' : asset.model;
export const lockEntry = (bytes, asset, key, proof = {}) => ({
  ...(asset.provider && asset.provider !== 'api' ? { provider: asset.provider } : {}),
  settingsDigest: settingsDigest(asset),
  sourceSha256: sourceSha256(bytes), factor: asset.factor, model: generatorName(asset), cacheKey: key,
  ...(asset.family && asset.reference !== asset.src ? { stateDerivation: statePolicy(asset) } : {}),
  ...(asset.glyphs ? { glyphs: true } : {}),
  ...(asset.family ? { familyMembership: asset.familyMembership } : {}),
  ...(recipeDigest(asset) ? { recipeDigest: recipeDigest(asset) } : {}), ...proof,
});
// Membership is recorded on every sibling so removing a manifest entry cannot
// silently shrink the set required for all-or-nothing delivery.
export const familyMembershipMatches = (entry, asset) => !asset.family || !!asset.familyMembership &&
  entry?.familyMembership?.reference === asset.familyMembership.reference &&
  JSON.stringify(entry.familyMembership.members) === JSON.stringify(asset.familyMembership.members);

export function lockMatches(entry, bytes, asset, proof = {}) {
  if (asset.generator?.type === 'kit') {
    try { kitRecipe(asset.generator); } catch { return false; }
  }
  if (!entry || (entry.provider ?? 'api') !== (asset.provider ?? 'api') || entry.sourceSha256 !== sourceSha256(bytes) || entry.factor !== asset.factor ||
      ![asset.model, generatorName(asset)].includes(entry.model) || !/^[a-f0-9]{64}$/.test(entry.cacheKey ?? '')) return false;
  if (entry.settingsDigest !== settingsDigest(asset)) return false;
  if (!proof.outputBytes || !Number.isSafeInteger(proof.width) || !Number.isSafeInteger(proof.height) ||
      proof.width < 1 || proof.height < 1 || proof.width !== proof.sourceWidth * asset.factor || proof.height !== proof.sourceHeight * asset.factor) return false;
  if (entry.outputSha256 !== undefined && (entry.outputSha256 !== sourceSha256(proof.outputBytes) || entry.width !== proof.width || entry.height !== proof.height)) return false;
  if (entry.outputSha256 === undefined && ((entry.width !== undefined && entry.width !== proof.width) || (entry.height !== undefined && entry.height !== proof.height))) return false;
  if (proof.candidateKey && entry.cacheKey !== proof.candidateKey) return false;
  if (!familyMembershipMatches(entry, asset) || !!entry.glyphs !== !!asset.glyphs) return false;
  if (asset.generator?.type === 'smooth-field' && (!proof.dependencyBytes || !proof.dependencyValid || entry.dependencies?.[asset.generator.from] !== sourceSha256(proof.dependencyBytes))) return false;
  const recipe = recipeDigest(asset);
  if (!recipe && entry.recipeDigest) return false;
  // Grandfather only explicitly listed recipe generations, recomputed with today's inputs.
  // Implicit auto additionally permits the pre-routing registered recipe.
  const implicitState = asset.family && asset.reference !== asset.src && !entry.stateDerivation && asset.stateDerivation === undefined && asset.stateResidualMaxHf === undefined;
  const generations = [CURRENT_DERIVATION_GENERATION, ...HISTORICAL_DERIVATION_GENERATIONS].flatMap((generation) => [
    { digest: recipeDigest(asset, false, generation), state: generation.state },
    ...(implicitState ? [{ digest: recipeDigest(asset, true, generation), state: generation.state }] : []),
  ]);
  const generation = generations.find((g) => g.digest === entry.recipeDigest);
  if (recipe && !generation) return false;
  if (asset.family && asset.reference !== asset.src) {
    if (!proof.referenceValid || !proof.referenceBytes || !proof.referenceOutputBytes || entry.derivationDigest !== derivationDigest(bytes, proof.referenceBytes, proof.referenceOutputBytes, asset.sigma, generation.state)) return false;
  }
  return true;
}

// Shared by publication, --pending and CSS so dependency validation cannot drift.
export async function outputProof(asset, sourceBytes, outputBytes, root, assets = [], visiting = new Set(), lock) {
  if (visiting.has(asset.src)) throw new Error('cyclic output dependency');
  const next = new Set([...visiting, asset.src]);
  // metadata() alone can accept a truncated image header; actually decode pixels.
  const source = await sharp(sourceBytes).metadata();
  const { info: output } = await sharp(outputBytes).raw().toBuffer({ resolveWithObject: true });
  validateProtection(asset, source.width, source.height);
  const reference = asset.family && asset.reference !== asset.src;
  const referenceProof = reference ? await lockedDependency(outputPath({ src: asset.reference, factor: 2 }), root, assets, next, lock) : null;
  return { outputBytes, width: output.width, height: output.height, sourceWidth: source.width, sourceHeight: source.height,
    ...(referenceProof ? { referenceBytes: referenceProof.sourceBytes, referenceOutputBytes: referenceProof.dependencyBytes, referenceValid: true } : {}),
    ...(asset.generator?.type === 'smooth-field' ? await generatorDependency(asset, root, assets, next, lock) : {}) };
}

async function lockedDependency(from, root, assets, visiting, lock) {
  const dependency = assets.find((a) => outputPath(a) === from);
  if (!dependency) throw new Error(`unknown output dependency: ${from}`);
  const dependencyBytes = await readFile(resolve(root, from));
  const sourceBytes = await readFile(resolve(root, dependency.src));
  const currentLock = lock ?? await readLock(root);
  const proof = await outputProof(dependency, sourceBytes, dependencyBytes, root, assets, visiting, currentLock);
  if (!lockMatches(currentLock.assets[from], sourceBytes, dependency, proof)) throw new Error(`output dependency is stale or unlocked: ${from}`);
  return { sourceBytes, dependencyBytes, dependencyValid: true };
}

export async function generatorDependency(asset, root, assets, visiting = new Set(), lock) {
  return lockedDependency(asset.generator.from, root, assets, visiting, lock);
}

export async function readLock(root) {
  let value;
  try { value = JSON.parse(await readFile(resolve(root, 'art/hires.lock.json'), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return { version: 1, assets: {} }; throw error; }
  if (value?.version !== 1 || !value.assets || typeof value.assets !== 'object' || Array.isArray(value.assets))
    throw new Error('art/hires.lock.json: expected version 1 and an assets object');
  return value;
}

// Exclusive creation serialises writers across processes. Never steal a lock:
// a slow writer must not lose ownership. A crashed writer fails closed; remove
// its .writing file after confirming that process has stopped.
export async function writeLockEntry(root, asset, entry) {
  const path = resolve(root, 'art/hires.lock.json');
  const guard = path + '.writing', pending = path + `.${randomUUID()}.pending`;
  const deadline = Date.now() + 30_000;
  let handle;
  while (!handle) {
    try { handle = await open(guard, 'wx'); }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (Date.now() >= deadline) throw new Error(`Timed out waiting for ${guard}; check for a stopped writer before removing it`);
      await delay(20);
    }
  }
  try {
    await handle.writeFile(`${process.pid}\n`);
    const lock = await readLock(root);
    const assets = Object.fromEntries(Object.entries({ ...lock.assets, [outputPath(asset)]: entry }).sort(([a], [b]) => a.localeCompare(b)));
    await writeFile(pending, JSON.stringify({ version: 1, assets }, null, 2) + '\n', { flag: 'wx' });
    await rename(pending, path);
  } finally {
    try { await unlink(pending).catch((error) => { if (error.code !== 'ENOENT') throw error; }); }
    finally {
      try { await handle.close(); }
      finally { await unlink(guard); }
    }
  }
}
