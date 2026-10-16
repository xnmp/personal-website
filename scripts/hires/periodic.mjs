import { validateImage } from './merge.mjs';

export const PERIODIC_RECIPE = Object.freeze({ version: 'periodic-v1', halo: 32, rmsTolerance: 1, p99Tolerance: 2 });
export function periodicHalo(sigma) {
  if (!Number.isFinite(sigma) || sigma <= 0 || sigma > 64) throw new Error('Periodic sigma must be in (0, 64]');
  return Math.max(PERIODIC_RECIPE.halo, Math.ceil(3 * sigma / 2) + 16);
}
const mod = (x, n) => ((x % n) + n) % n;
export function wrapRegion(img, x, y, width, height) {
  validateImage(img);
  if (![x, y, width, height].every(Number.isSafeInteger) || width <= 0 || height <= 0 || width * height * img.channels > 256_000_000) throw new Error('Invalid wrap region');
  const data = new Float32Array(width * height * img.channels);
  for (let yy = 0; yy < height; yy++) for (let xx = 0; xx < width; xx++) for (let c = 0; c < img.channels; c++)
    data[(yy * width + xx) * img.channels + c] = img.data[(mod(y + yy, img.height) * img.width + mod(x + xx, img.width)) * img.channels + c];
  return { width, height, channels: img.channels, data };
}

// Pixel-centred bilinear interpolation in premultiplied RGBA. Used for smooth
// maps and as a reproducible periodic seam baseline, independent of libvips.
export function resample(img, factor = 2, periodic = false) {
  validateImage(img);
  if (factor !== 2 || img.width * img.height * 4 * img.channels > 256_000_000) throw new Error('Resampling requires safe exact 2x geometry');
  const width = img.width * 2, height = img.height * 2, channels = img.channels;
  const data = new Uint8Array(width * height * channels);
  const coord = (v, n) => periodic ? mod(v, n) : Math.max(0, Math.min(n - 1, v));
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sx = (x + 0.5) / 2 - 0.5, sy = (y + 0.5) / 2 - 0.5, ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy;
    const sums = Array(channels).fill(0);
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const p = (coord(iy + dy, img.height) * img.width + coord(ix + dx, img.width)) * channels;
      const weight = (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy), a = channels === 4 ? img.data[p + 3] / 255 : 1;
      for (let c = 0; c < channels; c++) sums[c] += img.data[p + c] * weight * (channels === 4 && c < 3 ? a : 1);
    }
    for (let c = 0; c < channels; c++) data[(y * width + x) * channels + c] = Math.round(channels === 4 && c < 3 ? sums[3] ? sums[c] * 255 / sums[3] : 0 : sums[c]);
  }
  return { width, height, channels, data };
}

// Compare signed wrap jumps and the derivatives immediately on either side,
// in premultiplied RGBA so invisible RGB cannot hide or invent a seam.
export function seamStats(output, baseline) {
  validateImage(output); validateImage(baseline);
  if (output.width !== baseline.width || output.height !== baseline.height || output.channels !== baseline.channels) throw new Error('Seam baseline geometry differs');
  const { width, height, channels } = output;
  const value = (img, x, y, c) => {
    const p = (mod(y, height) * width + mod(x, width)) * channels;
    return img.data[p + c] * (channels === 4 && c < 3 ? img.data[p + 3] / 255 : 1);
  };
  const errors = [[], []];
  for (const vertical of [false, true]) for (let p = 0; p < (vertical ? height : width); p++) for (let c = 0; c < channels; c++) {
    const at = (img, t) => vertical ? value(img, t, p, c) : value(img, p, t, c);
    const end = vertical ? width : height;
    const jump = (img) => at(img, 0) - at(img, end - 1);
    errors[0].push(Math.abs(jump(output) - jump(baseline)));
    for (const start of [-2, 0]) {
      const derivative = (img) => (at(img, start + 1) - at(img, start)) - jump(img);
      errors[1].push(Math.abs(derivative(output) - derivative(baseline)));
    }
  }
  const summarize = (values) => {
    values.sort((a, b) => a - b);
    return { rms: Math.sqrt(values.reduce((sum, v) => sum + v * v, 0) / values.length), p99: values[Math.ceil(values.length * 0.99) - 1] };
  };
  const [jump, derivative] = errors.map(summarize);
  return { jump, derivative, passes: [jump, derivative].every((s) => s.rms <= PERIODIC_RECIPE.rmsTolerance && s.p99 <= PERIODIC_RECIPE.p99Tolerance) };
}
