// Restricted, side-effect-free recipe resolution for the shared kit builder.
import ligne from './kits/ligne.mjs';
import { KIT_STRUCTURE_LIMIT } from './hires/structure.mjs';
import sumi from './kits/sumi.mjs';
import solarpunk from './kits/solarpunk.mjs';
import cyanotype from './kits/cyanotype.mjs';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const isNativeKit = (generator) => ['ink', 'kit'].includes(generator?.type);
export const KIT_RECIPE_VERSION = 'kit-raster-v3';
// Enabled families peak at 1.025/255 versus a 2.047/255 Lanczos round-trip.
// One global 1.1/255 ceiling, including delivered states; no per-asset override.
export const KIT_MAE_LIMIT = 1.1;
// 58 shipped 1x Lanczos round trips peak at 41.695/255 local 3x3 mean error.
// Round up to the next five code values; independent of asset/family.
// Retain the existing p99.9 guard too: local averaging must not relax it.
export const KIT_PIXEL_TAIL_LIMIT = 60;
export const KIT_TAIL_LIMIT = 45;
const rendererFiles = ['build-kit.mjs', 'kit-native.mjs', 'kit-raster.mjs', 'straighten.mjs', 'state-light.mjs', 'derive-state.mjs', 'paper-shadow.mjs', 'framed-pane.mjs', 'mitre.mjs', 'webp.mjs', 'hires/structure.mjs'];
const rendererDigest = () => sha(rendererFiles.map((file) => sha(readFileSync(new URL(file, import.meta.url)))).join(':'));

export function kitRecipe(generator, { rawBytes, rawRoot = process.env.HIRES_KIT_RAW ?? resolve('art/raw'), requireRaw = false } = {}) {
  if (generator?.type === 'ink') return inkRecipe(generator);
  const config = { sumi, solarpunk, cyanotype }[generator?.kit];
  if (generator?.type !== 'kit' || !config) throw new Error('unknown kit recipe');
  for (const kind of ['sheets', 'tiles']) for (const entry of config[kind] ?? []) {
    if (!(kind === 'tiles' && generator.kit === 'sumi') && !(kind === 'sheets' && (['sheet-card', 'sheet-card-night'].includes(entry.name) || generator.kit === 'cyanotype' && /^sheet-strip-(day|night)(-d)?$/.test(entry.name)))) continue;
    const state = (kind === 'sheets' ? entry.states ?? states : states.slice(0, 4)).find((s) => `${entry.name}-${s}` === generator.name);
    if (!state) continue;
    const rawSource = `${config.raw}/${entry.src}/${entry.src}.png`;
    const rawSha256 = config.rawHashes[entry.src];
    if (!/^[a-f0-9]{64}$/.test(rawSha256 ?? '')) throw new Error(`missing raw SHA-256 pin: ${rawSource}`);
    let actual = rawBytes;
    if (actual === undefined) {
      try { actual = readFileSync(resolve(rawRoot, rawSource)); }
      catch (error) { if (requireRaw || error.code !== 'ENOENT') throw error; }
    }
    // Locks use the recipe pin even in CI without raws. Available inputs must
    // agree with it; an explicit root never substitutes a different identity.
    if (actual !== undefined && sha(actual) !== rawSha256) {
      const error = new Error(`stale kit raw provenance: SHA-256 mismatch for ${rawSource}`);
      error.code = 'KIT_RAW_STALE';
      throw error;
    }
    return { version: KIT_RECIPE_VERSION, kit: generator.kit, raw: config.raw, kind, state, entry,
      defaults: config[kind === 'sheets' ? 'sheet' : 'tile'], rawSource,
      rawSha256,
      rendererDigest: rendererDigest(), gate: { limit: KIT_MAE_LIMIT, kernel: 'lanczos3', channels: 'premultiplied-rgba', tail: 'max-3x3-mean-premultiplied-error', tailLimit: KIT_TAIL_LIMIT, pixelTailLimit: KIT_PIXEL_TAIL_LIMIT, structure: 'max-excess-tangential-curvature', structureLimit: KIT_STRUCTURE_LIMIT } };
  }
  throw new Error(`unknown kit name: ${generator?.name}`);
}

// Lengths only: colour, opacity and dimensionless lighting gains stay unchanged.
export const scaleStateFlags = (flags, d) => flags.map((flag) => flag.replace(
  /^(--(?:catch-width|ring|ring-radius|halo)=)(.*)$/,
  (_, key, values) => key + values.replace(/-?\d+(?:\.\d+)?/g, (v) => String(Number(v) * d)),
));
const scaleLengths = (value, keys, d) => Object.fromEntries(Object.entries(value).map(([k, v]) => [k, keys.includes(k) ? v * d : v]));

const kits = { ligne };
const states = ['normal', 'hover', 'focus', 'pressed', 'flat'];
export const INK_RECIPE_VERSION = 'kit-native-v1';
export function inkRecipe(generator, config = kits[generator?.kit]) {
  if (generator?.type !== 'ink' || !Object.hasOwn(kits, generator.kit) || !config) throw new Error('unknown ink kit');
  for (const kind of ['sheets', 'tiles', 'mats', 'tapes']) {
    for (const entry of config[kind] ?? []) {
      const variants = kind === 'sheets' ? entry.states ?? states : kind === 'tiles' ? states.slice(0, 4) : [null];
      const state = variants.find((s) => (s ? `${entry.name}-${s}` : entry.name) === generator.name);
      if (state === undefined || !entry.ink) continue;
      const defaults = kind === 'sheets' ? config.sheet : kind === 'tiles' ? config.tile : {};
      const fill = entry.grain && config.fills.find((f) => f.name === entry.grain.fill);
      return { version: INK_RECIPE_VERSION, kit: generator.kit, raw: config.raw, lossless: config.lossless,
        kind, state, entry, defaults, ...(fill ? { fill } : {}) };
    }
  }
  throw new Error(`unknown ink name: ${generator?.name}`);
}

export const scaleInk = (ink, density) => ({ ...ink,
  radius: ink.radius * density,
  ...(ink.size ? { size: ink.size.map((v) => v * density) } : {}),
  bands: ink.bands.map(([w, color, flags]) => [w * density, color, ...(flags ? [{ ...flags, ...(flags.round === undefined ? {} : { round: flags.round * density }) }] : [])]),
  ...(ink.tail ? { tail: Object.fromEntries(Object.entries(ink.tail).map(([k, v]) => [k, v * density])) } : {}),
});
const scaleShadow = (shadow, d) => shadow.map((s) => s.startsWith('--') ? s : s.split(':').map((v, i) => i < 3 ? Number(v) * d : v).join(':'));
// Materialize defaults before scaling. Counts, seeds, slopes and colour gains
// are dimensionless; all sampling windows and rail geometry are lengths.
export const scaleLengthen = (value, d) => ({
  ...scaleLengths({ corner: 56, patch: 64, overlap: 20, spliceOverlap: 32, ...value }, ['corner', 'patch', 'overlap', 'spliceOverlap'], d),
  length: (value.length ?? [null, null]).map((v) => v === null ? null : v * d),
  ...(value.quiet ? { quiet: { ...value.quiet, depth: (value.quiet.depth ?? value.corner ?? 56) * d } } : {}),
  density: d,
});
export const scaleTileRails = (value, d) => {
  const settings = { corner: 56, overlap: 32, blend: 0, ...(value === true ? {} : value) };
  return scaleLengths({ ...settings, depth: settings.depth ?? settings.corner }, ['corner', 'overlap', 'depth', 'blend'], d);
};
const scaleSettings = (p, d, painted = false) => Object.fromEntries(Object.entries(p).map(([key, value]) => {
  if (['normal', 'hover', 'pressed', 'flat'].includes(key)) return [key, scaleShadow(value, d)];
  if (key === 'shadow') return [key, Array.isArray(value) ? scaleShadow(value, d) : scaleSettings(value, d, painted)];
  if (['ink', 'focusInk'].includes(key)) return [key, scaleInk(value, d)];
  if (key === 'frame') return [key, Object.fromEntries(Object.entries(value).map(([k, v]) => [k, v * d]))];
  if (key === 'lengthen') return [key, scaleLengthen(value, d)];
  if (key === 'tileRails') return [key, scaleTileRails(value, d)];
  if (key === 'feather') return [key, value * d];
  if (key === 'glass' && !painted) return [key, { ...value, dx: value.dx * d, dy: value.dy * d, soft: value.soft * d }];
  if (key === 'glass') return [key, scaleLengths({ dx: 3, dy: 4, soft: 4, glintWidth: 2, ...value }, ['dx', 'dy', 'soft', 'glintWidth'], d)];
  if (key === 'fillet') return [key, scaleLengths(value, ['width', 'key', 'radius', 'weave'], d)];
  if (key === 'grain') return [key, { ...value, size: value.size * d }];
  return [key, value];
}));

// All drawing, state, shadow, grain and encoding operations remain in build-kit.
export function nativeKit(generator, density, options = {}) {
  if (![1, 2].includes(density)) throw new Error('ink density must be 1 or 2');
  const r = kitRecipe(generator, options);
  const entry = scaleSettings(r.entry, density, generator.type === 'kit');
  return { raw: r.raw, lossless: r.lossless, [r.kind]: [entry],
    ...(r.kind === 'sheets' ? { sheet: scaleSettings(r.defaults, density, generator.type === 'kit') } : {}),
    ...(r.kind === 'tiles' ? { tile: scaleSettings(r.defaults, density, generator.type === 'kit') } : {}),
    fills: r.fill ? [{ ...r.fill, size: r.fill.size * density, highpass: r.fill.highpass * density, soften: r.fill.soften * density }] : [],
  };
}
