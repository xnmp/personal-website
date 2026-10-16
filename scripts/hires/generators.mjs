import sharp from 'sharp';
import { edgeStructure } from './structure.mjs';
import { kitRecipe, KIT_MAE_LIMIT, KIT_TAIL_LIMIT, KIT_PIXEL_TAIL_LIMIT } from '../kit-native.mjs';
import { rasterGeometry, requireRasterResolution } from '../kit-raster.mjs';

// Mulberry32, matching atlas/derive.mjs. One shared grain value per RGB pixel.
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// No filesystem or ambient randomness: the field depends only on bytes/options.
export async function smoothField(inputBytes, { median, blur, grain, seed }) {
  const { data, info } = await sharp(inputBytes).toColourspace('srgb').removeAlpha().median(median).blur(blur).raw().toBuffer({ resolveWithObject: true });
  const random = rng(seed), rgba = new Uint8Array(info.width * info.height * 4);
  for (let p = 0; p < info.width * info.height; p++) {
    const noise = Math.floor(random() * (grain * 2 + 1)) - grain;
    for (let c = 0; c < 3; c++) rgba[p * 4 + c] = Math.max(0, Math.min(255, data[p * 3 + c] + noise));
    rgba[p * 4 + 3] = 255;
  }
  return { data: rgba, width: info.width, height: info.height, channels: 4 };
}

// Invoke the kit's shared builder in an isolated temporary directory. The raw
// inputs are read-only; no normal kit output or shared .build directory is used.
export async function renderKit(generator, { density = 2, root = process.cwd(), rawRoot = process.env.HIRES_KIT_RAW ?? `${root}/art/raw` } = {}) {
  const recipe = kitRecipe(generator, { rawRoot });
  const { mkdtemp, readFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { resolve, join } = await import('node:path');
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  if (generator.type === 'kit') await kitRawProof(generator, { rawRoot, density });
  const dir = await mkdtemp(join(tmpdir(), 'hires-ink-'));
  try {
    // Match the normal build's Node runtime even when invoked by Bun tests;
    // renderer floating-point edge decisions must reproduce shipped bytes.
    await promisify(execFile)('node', [resolve(root, 'scripts/build-kit.mjs'), generator.kit,
      `--${generator.type === 'ink' ? 'ink' : 'kit'}=${generator.name}`, `--density=${density}`, `--raw=${resolve(rawRoot, recipe.raw)}`,
      `--out=${join(dir, 'out')}`, `--tmp=${join(dir, 'work')}`], { cwd: root, maxBuffer: 1024 * 1024 });
    return await readFile(join(dir, 'out', `${generator.name}.webp`));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function kitImage(generator, options = {}) {
  if (options.sourceBytes) {
    const one = await renderKit(generator, { ...options, density: 1 });
    if (!one.equals(options.sourceBytes)) throw new Error('ink recipe no longer reproduces the shipped 1x bytes; rebuild the kit before generating its twin');
  }
  const encoded = await renderKit(generator, options);
  const { data, info } = await sharp(encoded).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: 4 };
}

// Pixel errors in premultiplied RGBA code values. Hidden RGB contributes zero.
const pixelErrors = (source, data) => {
  const errors = new Float32Array(source.width * source.height);
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    let error = Math.abs(source.data[i + 3] - data[i + 3]);
    for (let k = 0; k < 3; k++) error += Math.abs(source.data[i + k] * source.data[i + 3] / 255 - data[i + k] * data[i + 3] / 255);
    total += error;
    errors[i / 4] = error / 4;
  }
  // Maximum 3x3 box-filtered error: a sparse missing stroke cannot be diluted
  // by unrelated empty canvas. Clip windows at boundaries, renormalizing area.
  let tail = 0;
  for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
    let sum = 0, count = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || xx >= source.width || yy < 0 || yy >= source.height) continue;
      sum += errors[yy * source.width + xx]; count++;
    }
    tail = Math.max(tail, sum / count);
  }
  return { mae: total / data.length, tail, pixelTail: errors.sort()[Math.min(errors.length - 1, Math.floor(errors.length * 0.999))] };
};
const imageGeometry = ({ width, height }) => ({ width, height, channels: 4 });
export async function kitConformance(source, output, generator = { type: 'ink' }) {
  if (output.width !== source.width * 2 || output.height !== source.height * 2) throw new Error('ink output must have exact 2x dimensions');
  const down = async (image) => sharp(image.data, { raw: imageGeometry(image) })
    .resize(source.width, source.height, { kernel: 'lanczos3' }).raw().toBuffer();
  const enlarged = await sharp(source.data, { raw: imageGeometry(source) })
    .resize(output.width, output.height, { kernel: 'lanczos3' }).raw().toBuffer();
  const [data, roundtrip] = await Promise.all([down(output), down({ ...output, data: enlarged })]);
  const { mae, tail, pixelTail } = pixelErrors(source, data);
  const baselineTail = pixelErrors(source, roundtrip).tail;
  const tailLimit = KIT_TAIL_LIMIT;
  const limit = generator.type === 'kit' ? KIT_MAE_LIMIT : 1;
  // Native painted kits have explicit 9-slice rail spans: tile pad20+corner40,
  // sheet pad96+corner56, in logical pixels. Only the legacy rail statistic
  // uses this inset; symmetric local structure covers the complete canvas.
  const inset = generator.type === 'kit' ? (kitRecipe(generator).kind === 'tiles' ? 120 : 304) : 0;
  const structure = generator.type === 'kit' ? edgeStructure({ ...output, data: enlarged }, output, { inset }) : null;
  const reasons = [
    ...(mae > limit ? [`ink premultiplied MAE ${mae}/255 exceeds ${limit}/255`] : []),
    ...(tail > tailLimit ? [`ink premultiplied max-3x3-mean ${tail}/255 exceeds Lanczos baseline allowance ${tailLimit}/255`] : []),
    ...(structure && structure.peak > structure.limit ? [`ink structure ${structure.peak}/255 exceeds ${structure.limit}/255 (${structure.metric})`] : []),
    ...(['added', 'lost', 'coherent'].flatMap(name => structure?.[name] && !structure[name].passes
      ? [`ink structure ${name} ${structure[name].peak}/255 exceeds ${structure[name].limit}/255`] : [])),
    ...(pixelTail > KIT_PIXEL_TAIL_LIMIT ? [`ink premultiplied p99.9 ${pixelTail}/255 exceeds ${KIT_PIXEL_TAIL_LIMIT}/255`] : []),
  ];
  return { mae, tail, pixelTail, structure, pixelTailLimit: KIT_PIXEL_TAIL_LIMIT, baselineTail, tailLimit, limit,
    reasons, passes: !reasons.length,
    tailMetric: 'max-3x3-mean-premultiplied-error', kernel: 'lanczos3', channels: 'premultiplied-rgba' };
}

// Historical API aliases keep ligne recipes and callers unchanged.
export const renderInk = renderKit;
export const inkImage = kitImage;
export const inkConformance = kitConformance;

export async function kitRawProof(generator, { rawRoot = process.env.HIRES_KIT_RAW ?? `${process.cwd()}/art/raw`, density = 2 } = {}) {
  const { readFile } = await import('node:fs/promises');
  const { resolve } = await import('node:path');
  const recipe = kitRecipe(generator, { rawRoot });
  const bytes = await readFile(resolve(rawRoot, recipe.rawSource));
  kitRecipe(generator, { rawBytes: bytes, rawRoot });
  const geometry = await rasterGeometry(bytes, recipe.kind === 'tiles' ? { height: 120 } : { width: recipe.entry.width ?? 1000 });
  if (density === 2) requireRasterResolution(geometry);
  const { sampled, target, ratio } = geometry;
  return { rawSource: recipe.rawSource, rawSha256: recipe.rawSha256, sampled, target, ratio };
}

// A sheet is not periodic as a whole: only its four rails repeat. Measure the
// wrap along each rail, including its baked shadow, never across its depth.
export async function kitRailSeams(source, output, generator) {
  const recipe = kitRecipe(generator);
  if (!recipe.entry.tileRails) return null;
  const { seamStats, resample } = await import('./periodic.mjs');
  const baseline = resample(source, 2);
  const tile = recipe.entry.tileRails === true ? {} : recipe.entry.tileRails;
  const slice = (96 + (tile.corner ?? 56)) * 2;
  const w = output.width, h = output.height;
  const regions = {
    t: { left: slice, top: 0, width: w - 2 * slice, height: slice },
    b: { left: slice, top: h - slice, width: w - 2 * slice, height: slice },
    l: { left: 0, top: slice, width: slice, height: h - 2 * slice },
    r: { left: w - slice, top: slice, width: slice, height: h - 2 * slice },
  };
  const crop = async (img, region) => {
    const { data, info } = await sharp(img.data, { raw: imageGeometry(img) }).extract(region).raw().toBuffer({ resolveWithObject: true });
    return { data, ...imageGeometry(info) };
  };
  const rails = await Promise.all((tile.sides ?? ['l', 'r']).map(async (side) => {
    const [actual, control] = await Promise.all([crop(output, regions[side]), crop(baseline, regions[side])]);
    const axis = seamStats(actual, control).axes.find((a) => a.axis === (['t', 'b'].includes(side) ? 'x' : 'y'));
    return { side, ...axis };
  }));
  return { rails, passes: rails.every((rail) => rail.passes) };
}
