import { createHash } from 'node:crypto';
import { outputSizes } from './external.mjs';
import { STATE_RECIPE, RESIDUAL_RECIPE, statePolicy } from './states.mjs';
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
  if ('stateDerivation' in v && !['generate', 'residual', 'auto'].includes(v.stateDerivation)) fail(where, 'invalid stateDerivation');
  if ('stateResidualMaxHf' in v && (!Number.isFinite(v.stateResidualMaxHf) || v.stateResidualMaxHf < 0 || v.stateResidualMaxHf > 255)) fail(where, 'stateResidualMaxHf must be in [0, 255]');
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

// Geometry is checked once decoded metadata is available, before requests or cache writes.
export function validateProtection(asset, width = Infinity, height = Infinity) {
  const where = asset.src ?? 'asset';
  if ('protect' in asset) {
    if (!Array.isArray(asset.protect) || !asset.protect.length) fail(where, 'protect must be a non-empty array');
    if (!['api', 'external'].includes(asset.provider) || asset.factor !== 2) fail(where, 'protect requires an api/external exact 2x asset');
    asset.protect.forEach((rect, i) => {
      const at = `${where}.protect[${i}]`;
      keys(rect, ['x', 'y', 'w', 'h'], at);
      if (!['x', 'y', 'w', 'h'].every((k) => Number.isSafeInteger(rect[k])) || rect.x < 0 || rect.y < 0 || rect.w <= 0 || rect.h <= 0) fail(at, 'requires non-negative integer x/y and positive integer w/h in source px');
      if (rect.x > width - rect.w || rect.y > height - rect.h) fail(at, `rect lies outside source bounds ${width}x${height}`);
    });
  }
  if ('protectFeather' in asset && (!asset.protect || !Number.isInteger(asset.protectFeather) || asset.protectFeather < 0 || asset.protectFeather > 64)) fail(where, 'protectFeather requires protect and an integer from 0 to 64 output px');
}

export function validateManifest(value, dimensions = {}) {
  keys(value, ['version', 'defaults', 'assets', 'families'], 'manifest');
  if (value.version !== 1) fail('manifest', 'version must be 1');
  keys(value.defaults, [...Object.keys(DEFAULTS), 'provider', 'external'], 'defaults');
  options(value.defaults, 'defaults');
  if (!Array.isArray(value.assets)) fail('manifest', 'assets must be an array');
  const families = value.families ?? {};
  if (!object(families)) fail('families', 'expected an object');
  for (const [name, settings] of Object.entries(families)) {
    keys(settings, ['stateDerivation', 'stateResidualMaxHf'], `families.${name}`);
    options(settings, `families.${name}`);
    if (!value.assets.some((a) => a.family === name)) fail(`families.${name}`, 'unknown family');
  }
  const seen = new Set();
  const assets = value.assets.map((entry, i) => {
    const where = `assets[${i}]${typeof entry?.src === 'string' ? ` (${entry.src})` : ''}`;
    keys(entry, ['src', 'factor', 'quality', 'lossless', 'note', 'group', 'provider', 'external', 'family', 'reference', 'stateCrop', 'periodic', 'generator', 'protect', 'protectFeather', 'glyphs', 'stateDerivation', 'stateResidualMaxHf'], where);
    if (typeof entry.src !== 'string' || !entry.src.startsWith('public/') || posix.normalize(entry.src) !== entry.src ||
        entry.src.includes('\\') || entry.src.includes('\0') || !/\.(webp|png|jpe?g|tiff?|avif|gif)$/i.test(entry.src)) fail(where, 'src must be a raster path inside public/');
    if (seen.has(entry.src)) fail(where, 'duplicate src');
    seen.add(entry.src);
    options(entry, where);
    if ('group' in entry && (typeof entry.group !== 'string' || !/^[a-z0-9]+(?:[/-][a-z0-9]+)*$/.test(entry.group))) fail(where, 'invalid group');
    const asset = { ...DEFAULTS, ...value.defaults, ...(families[entry.family] ?? {}), ...entry };
    if (asset.provider === 'external') {
      try { outputSizes(asset.external?.sizes, asset.factor); } catch (error) { fail(where, error.message); }
    }
    for (const name of ['family', 'reference']) if (name in entry && (typeof entry[name] !== 'string' || !entry[name])) fail(where, `invalid ${name}`);
    if (!!entry.family !== !!entry.reference) fail(where, 'family and reference are required together');
    if ('family' in entry && !/^[a-z0-9]+(?:[/-][a-z0-9]+)*$/.test(entry.family)) fail(where, 'invalid family');
    for (const name of ['stateCrop', 'periodic']) if (name in entry && typeof entry[name] !== 'boolean') fail(where, `invalid ${name}`);
    if ((asset.stateDerivation !== undefined || asset.stateResidualMaxHf !== undefined) && !entry.family) fail(where, 'state derivation settings require a family');
    if (entry.stateCrop && !entry.family) fail(where, 'stateCrop requires a family');
    if (entry.family && (asset.factor !== 2 || entry.periodic || entry.lossless === false)) fail(where, 'families require lossless exact 2x, non-periodic images');
    if (entry.family) asset.lossless = true;
    if ((entry.periodic || asset.provider === 'resample') && asset.factor !== 2) fail(where, 'periodic and resample require exact 2x');
    if (entry.periodic) { try { periodicHalo(asset.sigma); } catch (error) { fail(where, error.message); } }
    validateProtection(asset, dimensions[asset.src]?.width, dimensions[asset.src]?.height);
    if ('glyphs' in entry && (typeof entry.glyphs !== 'boolean' || asset.provider !== 'resample')) fail(where, 'glyphs is a boolean allowed only with provider resample');
    if ('generator' in entry) {
      const g = entry.generator;
      if (!object(g) || asset.provider !== 'resample') fail(where, 'invalid analytic generator');
      if (g.type === 'sheen') {
        keys(g, ['type', 'color', 'alpha', 'streak'], where + '.generator');
        if (typeof g.color !== 'string' || !/^[a-f0-9]{6}$/i.test(g.color) || !Number.isFinite(g.alpha) || g.alpha < 0 || g.alpha > 1 || ('streak' in g && (!Number.isFinite(g.streak) || g.streak < 0 || g.streak > 1))) fail(where, 'invalid analytic generator');
      } else if (g.type === 'smooth-field') {
        keys(g, ['type', 'from', 'median', 'blur', 'grain', 'seed'], where + '.generator');
        if (typeof g.from !== 'string' || !g.from.startsWith('public/') || posix.normalize(g.from) !== g.from || g.from.includes('\\') || g.from.includes('\0') || !g.from.endsWith('@2x.webp')) fail(where, 'smooth-field requires from: a repo path to a locked @2x.webp');
        if (!Number.isInteger(g.median) || g.median < 1 || g.median > 255 || g.median % 2 !== 1) fail(where, 'smooth-field median must be odd, 1–255 output px');
        if (!Number.isFinite(g.blur) || g.blur < 0.3 || g.blur > 1000) fail(where, 'smooth-field blur must be 0.3–1000 output px');
        if (!Number.isInteger(g.grain) || g.grain < 0 || g.grain > 255 || !Number.isSafeInteger(g.seed) || g.seed < 0 || g.seed > 0xffffffff) fail(where, 'invalid smooth-field grain or seed');
      } else fail(where, 'invalid analytic generator type');
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
  for (const asset of assets.filter((a) => a.generator?.type === 'smooth-field')) {
    if (!assets.some((a) => a.src.replace(/\.[^.]+$/, `@${a.factor}x.webp`) === asset.generator.from)) fail(asset.src, 'smooth-field from must name a manifest output');
  }
  orderAssets(assets); // Reject dependency cycles before any processing.
  return { version: 1, defaults: { ...DEFAULTS, ...value.defaults }, assets };
}

export const cacheKey = (bytes, factor, model, prompt) => createHash('sha256')
  .update(bytes).update(JSON.stringify([factor, model, prompt])).digest('hex');

// Preserve the original API digest byte-for-byte, including explicit provider: api.
export const processingRecipe = (asset, legacyStates = false) => {
  const fields = {
    ...(asset.family ? { family: asset.family, reference: asset.reference, familyMembership: asset.familyMembership, states: STATE_RECIPE, sigma: asset.sigma, stateCrop: asset.stateCrop ?? false } : {}),
    ...(!legacyStates && asset.family && asset.src !== asset.reference ? { stateDerivation: { ...statePolicy(asset), recipe: RESIDUAL_RECIPE } } : {}),
    ...(asset.periodic ? { periodic: PERIODIC_RECIPE, halo: periodicHalo(asset.sigma), sigma: asset.sigma } : {}),
    ...(asset.provider === 'resample' ? { resample: 'premultiplied-bilinear-v1', generator: asset.generator ?? null, ...(asset.glyphs ? { glyphs: true } : {}) } : {}),
    ...(asset.protect ? { protect: asset.protect, protectFeather: asset.protectFeather ?? 6, protection: 'premultiplied-smoothstep-v1' } : {}),
  };
  return Object.keys(fields).length ? fields : null;
};
export const recipeDigest = (asset, legacyStates = false) => processingRecipe(asset, legacyStates) && createHash('sha256').update(JSON.stringify(processingRecipe(asset, legacyStates))).digest('hex');
export const assetCacheKey = (bytes, asset, prompt, requestIdentity = null) => {
  const legacy = asset.provider === 'external'
    ? createHash('sha256').update(bytes).update(JSON.stringify([asset.factor, asset.model, prompt, 'external', asset.external.sizes, 'padded-v1'])).digest('hex')
    : cacheKey(bytes, asset.factor, asset.model, prompt);
  // Protection changes delivered pixels only: paid tile identity must remain stable.
  const recipe = processingRecipe({ ...asset, protect: undefined, protectFeather: undefined }, true);
  return recipe ? createHash('sha256').update(legacy).update(JSON.stringify([recipe, requestIdentity])).digest('hex') : legacy;
};

// Stable topological order also preserves canonical-first state processing.
export function orderAssets(assets) {
  const byOutput = new Map(assets.map((a) => [a.src.replace(/\.[^.]+$/, `@${a.factor}x.webp`), a]));
  const visited = new Set(), active = new Set(), ordered = [];
  const visit = (asset) => {
    if (visited.has(asset)) return;
    if (active.has(asset)) fail(asset.src, 'cyclic output dependency');
    active.add(asset);
    const dependencies = [byOutput.get(asset.generator?.from), assets.find((a) => asset.family && asset.reference !== asset.src && a.src === asset.reference)];
    dependencies.filter(Boolean).forEach(visit);
    active.delete(asset); visited.add(asset); ordered.push(asset);
  };
  assets.forEach(visit);
  return ordered;
}
