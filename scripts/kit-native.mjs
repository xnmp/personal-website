// Restricted, side-effect-free recipe resolution for the shared kit builder.
import ligne from './kits/ligne.mjs';

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
const scaleSettings = (p, d) => Object.fromEntries(Object.entries(p).map(([key, value]) => {
  if (['normal', 'hover', 'pressed', 'flat'].includes(key)) return [key, scaleShadow(value, d)];
  if (key === 'shadow') return [key, Array.isArray(value) ? scaleShadow(value, d) : scaleSettings(value, d)];
  if (['ink', 'focusInk'].includes(key)) return [key, scaleInk(value, d)];
  if (key === 'frame') return [key, Object.fromEntries(Object.entries(value).map(([k, v]) => [k, v * d]))];
  if (key === 'feather') return [key, value * d];
  if (key === 'glass') return [key, { ...value, dx: value.dx * d, dy: value.dy * d, soft: value.soft * d }];
  if (key === 'grain') return [key, { ...value, size: value.size * d }];
  return [key, value];
}));

// All drawing, state, shadow, grain and encoding operations remain in build-kit.
export function nativeKit(generator, density) {
  if (![1, 2].includes(density)) throw new Error('ink density must be 1 or 2');
  const r = inkRecipe(generator);
  const entry = scaleSettings(r.entry, density);
  return { raw: r.raw, lossless: r.lossless, [r.kind]: [entry],
    ...(r.kind === 'sheets' ? { sheet: scaleSettings(r.defaults, density) } : {}),
    ...(r.kind === 'tiles' ? { tile: scaleSettings(r.defaults, density) } : {}),
    fills: r.fill ? [{ ...r.fill, size: r.fill.size * density, highpass: r.fill.highpass * density, soften: r.fill.soften * density }] : [],
  };
}
