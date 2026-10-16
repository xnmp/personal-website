import { createHash } from 'node:crypto';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { recipeDigest } from './manifest.mjs';
import { derivationDigest } from './states.mjs';

export const outputPath = ({ src, factor }) => src.slice(0, -extname(src).length) + `@${factor}x.webp`;
export const sourceSha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const generatorName = (asset) => asset.provider === 'external' ? 'codex-image_gen' : asset.provider === 'resample' ? asset.generator ? 'framed-pane/sheen-v1' : 'premultiplied-bilinear-v1' : asset.model;
export const lockEntry = (bytes, asset, key, proof = {}) => ({
  ...(asset.provider && asset.provider !== 'api' ? { provider: asset.provider } : {}),
  sourceSha256: sourceSha256(bytes), factor: asset.factor, model: generatorName(asset), cacheKey: key,
  ...(asset.family ? { familyMembership: asset.familyMembership } : {}),
  ...(recipeDigest(asset) ? { recipeDigest: recipeDigest(asset) } : {}), ...proof,
});
// Membership is recorded on every sibling so removing a manifest entry cannot
// silently shrink the set required for all-or-nothing delivery.
export const familyMembershipMatches = (entry, asset) => !asset.family || !!asset.familyMembership &&
  entry?.familyMembership?.reference === asset.familyMembership.reference &&
  JSON.stringify(entry.familyMembership.members) === JSON.stringify(asset.familyMembership.members);

export function lockMatches(entry, bytes, asset, proof = {}) {
  if (!entry || (entry.provider ?? 'api') !== (asset.provider ?? 'api') || entry.sourceSha256 !== sourceSha256(bytes) || entry.factor !== asset.factor ||
      ![asset.model, generatorName(asset)].includes(entry.model) || !/^[a-f0-9]{64}$/.test(entry.cacheKey ?? '')) return false;
  if (!familyMembershipMatches(entry, asset)) return false;
  const recipe = recipeDigest(asset);
  if (!recipe) return true;
  if (entry.recipeDigest !== recipe || !proof.outputBytes || entry.outputSha256 !== sourceSha256(proof.outputBytes) ||
      entry.width !== proof.width || entry.height !== proof.height || proof.width !== proof.sourceWidth * asset.factor || proof.height !== proof.sourceHeight * asset.factor) return false;
  if (asset.family && asset.reference !== asset.src) {
    if (!proof.referenceBytes || !proof.referenceOutputBytes || entry.derivationDigest !== derivationDigest(bytes, proof.referenceBytes, proof.referenceOutputBytes, asset.sigma)) return false;
  }
  return true;
}

export async function readLock(root) {
  let value;
  try { value = JSON.parse(await readFile(resolve(root, 'art/hires.lock.json'), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return { version: 1, assets: {} }; throw error; }
  if (value?.version !== 1 || !value.assets || typeof value.assets !== 'object' || Array.isArray(value.assets))
    throw new Error('art/hires.lock.json: expected version 1 and an assets object');
  return value;
}

// Assets publish sequentially; commit each entry only after its output succeeds.
export async function writeLockEntry(root, asset, entry) {
  const lock = await readLock(root);
  const assets = Object.fromEntries(Object.entries({ ...lock.assets, [outputPath(asset)]: entry }).sort(([a], [b]) => a.localeCompare(b)));
  const path = resolve(root, 'art/hires.lock.json');
  await writeFile(path + '.pending', JSON.stringify({ version: 1, assets }, null, 2) + '\n');
  await rename(path + '.pending', path);
}
