import { createHash } from 'node:crypto';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

export const outputPath = ({ src, factor }) => src.slice(0, -extname(src).length) + `@${factor}x.webp`;
export const sourceSha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const lockEntry = (bytes, { factor, model, provider }, key) => ({ ...(provider === 'external' ? { provider } : {}), sourceSha256: sourceSha256(bytes), factor, model, cacheKey: key });
export const lockMatches = (entry, bytes, { factor, model, provider }) =>
  !!entry && (entry.provider ?? 'api') === (provider ?? 'api') && entry.sourceSha256 === sourceSha256(bytes) && entry.factor === factor && entry.model === model &&
  typeof entry.cacheKey === 'string' && /^[a-f0-9]{64}$/.test(entry.cacheKey);

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
