import { createHash } from 'node:crypto';
import { outputSizes } from './external.mjs';
import { STATE_RECIPE } from './states.mjs';
import { PERIODIC_RECIPE, periodicHalo } from './periodic.mjs';
import { posix } from 'node:path';

export const DEFAULTS = Object.freeze({ provider: 'api', factor: 2, quality: 82, model: 'gpt-image-2.5-sunburst', apiQuality: 'high', sigma: 4 });
const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const fail = (where, message) => { throw new Error(`${where}: ${message}`); };
const keys = (value, allowed, where) => {
  if (!object(value)) fail(where, 'expected an object');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(where, `unknown key ${key}`);
};
const options = (v, where) => {
  if ('provider' in v && !['api', 'external', 'resample'].includes(v.provider)) fail(where, 'invalid provider');
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
    keys(entry, ['src', 'factor', 'quality', 'lossless', 'note', 'group', 'provider', 'external', 'family', 'reference', 'stateCrop', 'periodic', 'generator'], where);
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
    for (const name of ['family', 'reference']) if (name in entry && (typeof entry[name] !== 'string' || !entry[name])) fail(where, `invalid ${name}`);
    if (!!entry.family !== !!entry.reference) fail(where, 'family and reference are required together');
    if ('family' in entry && !/^[a-z0-9]+(?:[/-][a-z0-9]+)*$/.test(entry.family)) fail(where, 'invalid family');
    for (const name of ['stateCrop', 'periodic']) if (name in entry && typeof entry[name] !== 'boolean') fail(where, `invalid ${name}`);
    if (entry.stateCrop && !entry.family) fail(where, 'stateCrop requires a family');
    if (entry.family && (asset.factor !== 2 || entry.periodic || entry.lossless === false)) fail(where, 'families require lossless exact 2x, non-periodic images');
    if (entry.family) asset.lossless = true;
    if ((entry.periodic || asset.provider === 'resample') && asset.factor !== 2) fail(where, 'periodic and resample require exact 2x');
    if (entry.periodic) { try { periodicHalo(asset.sigma); } catch (error) { fail(where, error.message); } }
    if ('generator' in entry) {
      keys(entry.generator, ['type', 'color', 'alpha', 'streak'], where + '.generator');
      const g = entry.generator;
      if (asset.provider !== 'resample' || g.type !== 'sheen' || typeof g.color !== 'string' || !/^[a-f0-9]{6}$/i.test(g.color) ||
          !Number.isFinite(g.alpha) || g.alpha < 0 || g.alpha > 1 || ('streak' in g && (!Number.isFinite(g.streak) || g.streak < 0 || g.streak > 1))) fail(where, 'invalid analytic generator');
    }
    return asset;
  });
  for (const asset of assets.filter((a) => a.family)) {
    const reference = assets.find((a) => a.src === asset.reference);
    if (!reference || reference.family !== asset.family || reference.reference !== reference.src || reference.factor !== asset.factor ||
        assets.some((a) => a.family === asset.family && a.reference !== asset.reference)) fail(asset.src, 'family requires one canonical self-referencing normal in the manifest');
    asset.familyMembership = Object.freeze({ reference: asset.reference,
      members: Object.freeze(assets.filter((a) => a.family === asset.family).map((a) => a.src).sort()) });
  }
  return { version: 1, defaults: { ...DEFAULTS, ...value.defaults }, assets };
}

export const cacheKey = (bytes, factor, model, prompt) => createHash('sha256')
  .update(bytes).update(JSON.stringify([factor, model, prompt])).digest('hex');

// Preserve the original API digest byte-for-byte, including explicit provider: api.
export const processingRecipe = (asset) => {
  const fields = {
    ...(asset.family ? { family: asset.family, reference: asset.reference, familyMembership: asset.familyMembership, states: STATE_RECIPE, sigma: asset.sigma, stateCrop: asset.stateCrop ?? false } : {}),
    ...(asset.periodic ? { periodic: PERIODIC_RECIPE, halo: periodicHalo(asset.sigma), sigma: asset.sigma } : {}),
    ...(asset.provider === 'resample' ? { resample: 'premultiplied-bilinear-v1', generator: asset.generator ?? null } : {}),
  };
  return Object.keys(fields).length ? fields : null;
};
export const recipeDigest = (asset) => processingRecipe(asset) && createHash('sha256').update(JSON.stringify(processingRecipe(asset))).digest('hex');
export const assetCacheKey = (bytes, asset, prompt, requestIdentity = null) => {
  const legacy = asset.provider === 'external'
    ? createHash('sha256').update(bytes).update(JSON.stringify([asset.factor, asset.model, prompt, 'external', asset.external.sizes, 'padded-v1'])).digest('hex')
    : cacheKey(bytes, asset.factor, asset.model, prompt);
  const recipe = processingRecipe(asset);
  return recipe ? createHash('sha256').update(legacy).update(JSON.stringify([recipe, requestIdentity])).digest('hex') : legacy;
};
