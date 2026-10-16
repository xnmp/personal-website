import sharp from 'sharp';

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
export async function renderInk(generator, { density = 2, root = process.cwd(), rawRoot = process.env.HIRES_KIT_RAW ?? `${root}/art/raw` } = {}) {
  const { inkRecipe } = await import('../kit-native.mjs');
  const recipe = inkRecipe(generator);
  const { mkdtemp, readFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { resolve, join } = await import('node:path');
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const dir = await mkdtemp(join(tmpdir(), 'hires-ink-'));
  try {
    // Match the normal build's Node runtime even when invoked by Bun tests;
    // renderer floating-point edge decisions must reproduce shipped bytes.
    await promisify(execFile)('node', [resolve(root, 'scripts/build-kit.mjs'), generator.kit,
      `--ink=${generator.name}`, `--density=${density}`, `--raw=${resolve(rawRoot, recipe.raw)}`,
      `--out=${join(dir, 'out')}`, `--tmp=${join(dir, 'work')}`], { cwd: root, maxBuffer: 1024 * 1024 });
    return await readFile(join(dir, 'out', `${generator.name}.webp`));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function inkImage(generator, options = {}) {
  if (options.sourceBytes) {
    const one = await renderInk(generator, { ...options, density: 1 });
    if (!one.equals(options.sourceBytes)) throw new Error('ink recipe no longer reproduces the shipped 1x bytes; rebuild the kit before generating its twin');
  }
  const encoded = await renderInk(generator, options);
  const { data, info } = await sharp(encoded).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: 4 };
}

// Mean absolute error across premultiplied RGBA, in 8-bit code values.
// Alpha participates equally; RGB hidden by transparency contributes nothing.
export async function inkConformance(source, output) {
  if (output.width !== source.width * 2 || output.height !== source.height * 2) throw new Error('ink output must have exact 2x dimensions');
  const { data } = await sharp(output.data, { raw: { width: output.width, height: output.height, channels: 4 } })
    .resize(source.width, source.height, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    total += Math.abs(source.data[i + 3] - data[i + 3]);
    for (let k = 0; k < 3; k++) total += Math.abs(source.data[i + k] * source.data[i + 3] / 255 - data[i + k] * data[i + 3] / 255);
  }
  const mae = total / data.length;
  return { mae, limit: 1, passes: mae <= 1, kernel: 'lanczos3', channels: 'premultiplied-rgba' };
}
