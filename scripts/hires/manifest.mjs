import { createHash } from 'node:crypto';
import { outputSizes } from './external.mjs';
import { posix } from 'node:path';

export const DEFAULTS = Object.freeze({ provider: 'api', factor: 2, quality: 82, model: 'gpt-image-2.5-sunburst', apiQuality: 'high', sigma: 4 });
const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const fail = (where, message) => { throw new Error(`${where}: ${message}`); };
const keys = (value, allowed, where) => {
  if (!object(value)) fail(where, 'expected an object');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(where, `unknown key ${key}`);
};
const options = (v, where) => {
  if ('provider' in v && !['api', 'external'].includes(v.provider)) fail(where, 'invalid provider');
  if ('external' in v) {
    keys(v.external, ['sizes'], where + '.external');
    try { outputSizes(v.external.sizes); } catch (error) { fail(where, error.message); }
  }
  if ('factor' in v && (!Number.isFinite(v.factor) || v.factor <= 0 || v.factor > 8)) fail(where, 'invalid factor');
  if ('quality' in v && (!Number.isInteger(v.quality) || v.quality < 1 || v.quality > 100)) fail(where, 'invalid quality');
  if ('sigma' in v && (!Number.isFinite(v.sigma) || v.sigma <= 0)) fail(where, 'invalid sigma');
  if ('model' in v && (typeof v.model !== 'string' || !v.model.trim())) fail(where, 'invalid model');
  if ('apiQuality' in v && !['low', 'medium', 'high', 'auto'].includes(v.apiQuality)) fail(where, 'invalid apiQuality');
  if ('lossless' in v && typeof v.lossless !== 'boolean') fail(where, 'invalid lossless');
  if ('note' in v && typeof v.note !== 'string') fail(where, 'invalid note');
};

export function validateManifest(value) {
  keys(value, ['version', 'defaults', 'assets'], 'manifest');
  if (value.version !== 1) fail('manifest', 'version must be 1');
  keys(value.defaults, [...Object.keys(DEFAULTS), 'provider', 'external'], 'defaults');
  options(value.defaults, 'defaults');
  if (!Array.isArray(value.assets)) fail('manifest', 'assets must be an array');
  const seen = new Set();
  const assets = value.assets.map((entry, i) => {
    const where = `assets[${i}]${typeof entry?.src === 'string' ? ` (${entry.src})` : ''}`;
    keys(entry, ['src', 'factor', 'quality', 'lossless', 'note', 'group', 'provider', 'external'], where);
    if (typeof entry.src !== 'string' || !entry.src.startsWith('public/') || posix.normalize(entry.src) !== entry.src ||
        entry.src.includes('\\') || entry.src.includes('\0') || !/\.(webp|png|jpe?g|tiff?|avif|gif)$/i.test(entry.src)) fail(where, 'src must be a raster path inside public/');
    if (seen.has(entry.src)) fail(where, 'duplicate src');
    seen.add(entry.src);
    options(entry, where);
    if ('group' in entry && (typeof entry.group !== 'string' || !/^[a-z0-9]+(?:[/-][a-z0-9]+)*$/.test(entry.group))) fail(where, 'invalid group');
    const asset = { ...DEFAULTS, ...value.defaults, ...entry };
    if (asset.provider === 'external') {
      try { outputSizes(asset.external?.sizes, asset.factor); } catch (error) { fail(where, error.message); }
    }
    return asset;
  });
  return { version: 1, defaults: { ...DEFAULTS, ...value.defaults }, assets };
}

export const cacheKey = (bytes, factor, model, prompt) => createHash('sha256')
  .update(bytes).update(JSON.stringify([factor, model, prompt])).digest('hex');

// Preserve the original API digest byte-for-byte, including explicit provider: api.
export const assetCacheKey = (bytes, asset, prompt) => asset.provider === 'external'
  ? createHash('sha256').update(bytes).update(JSON.stringify([asset.factor, asset.model, prompt, 'external', asset.external.sizes, 'padded-v1'])).digest('hex')
  : cacheKey(bytes, asset.factor, asset.model, prompt);
