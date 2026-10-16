import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, rename, open, unlink } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
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
