import { createHash } from 'node:crypto';
import { validateImage } from './merge.mjs';

export const STATE_RECIPE = Object.freeze({ version: 'registered-v2', mask: 'premultiplied-rgba-exact-nearest-2x', feather: 2, toneAlpha: 'conform-v1' });
const pair = (a, b) => {
  validateImage(a); validateImage(b);
  if (a.channels !== 4 || b.channels !== 4 || a.width !== b.width || a.height !== b.height) throw new Error('State images require matching RGBA geometry');
};
// Exact visible-paint contract: alpha and RGB * alpha must match. Compare
// integer products without rounding so even faint nonzero-alpha changes count.
const pixelDiffers = (a, b, i) => a.data[i + 3] !== b.data[i + 3] ||
  [0, 1, 2].some((c) => a.data[i + c] * a.data[i + 3] !== b.data[i + c] * b.data[i + 3]);

// Give encoders deterministic invisible RGB; decoded equality still uses the
// visible-paint contract because WebP may rewrite those invisible values.
export function canonicaliseTransparent(img) {
  validateImage(img);
  if (img.channels !== 4) throw new Error('Canonicalisation requires RGBA');
  const data = img.data.slice();
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] === 0) data.fill(0, i, i + 3);
  return { ...img, data };
}

export const derivationDigest = (stateBytes, normalBytes, referenceBytes, sigma) => createHash('sha256')
  .update(JSON.stringify([...[stateBytes, normalBytes, referenceBytes].map((bytes) => createHash('sha256').update(bytes).digest('hex')), STATE_RECIPE, sigma])).digest('hex');

export function differenceMask(state, normal) {
  pair(state, normal);
  return Uint8Array.from({ length: state.width * state.height }, (_, p) => Number(pixelDiffers(state, normal, p * 4)));
}

export function expandMask(mask, width, height) {
  if (!(mask instanceof Uint8Array) || ![width, height].every((n) => Number.isSafeInteger(n) && n > 0) || mask.length !== width * height || mask.some((v) => v > 1)) throw new Error('Invalid state mask');
  return Uint8Array.from({ length: width * height * 4 }, (_, p) => mask[Math.floor(Math.floor(p / (width * 2)) / 2) * width + Math.floor(p % (width * 2) / 2)]);
}

// Distance to unchanged paint; all feather support stays strictly inside S2.
export function registerState(state, normal, reference, own, feather = Number(STATE_RECIPE.feather)) {
  pair(state, normal); pair(reference, own);
  if (reference.width !== state.width * 2 || reference.height !== state.height * 2) throw new Error('State output must be exactly 2x');
  if (!Number.isInteger(feather) || feather < 1 || feather > 32) throw new Error('Invalid inward feather');
  const mask = expandMask(differenceMask(state, normal), state.width, state.height);
  const { width, height } = reference;
  const distance = Float32Array.from(mask, (v) => v ? feather : 0);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x;
    if (x) distance[p] = Math.min(distance[p], distance[p - 1] + 1);
    if (y) distance[p] = Math.min(distance[p], distance[p - width] + 1);
  }
  for (let y = height - 1; y >= 0; y--) for (let x = width - 1; x >= 0; x--) {
    const p = y * width + x;
    if (x + 1 < width) distance[p] = Math.min(distance[p], distance[p + 1] + 1);
    if (y + 1 < height) distance[p] = Math.min(distance[p], distance[p + width] + 1);
  }
  const data = Uint8Array.from(reference.data);
  for (let p = 0; p < mask.length; p++) {
    const weight = distance[p] / feather;
    if (!weight) continue;
    const i = p * 4, a = reference.data[i + 3] * (1 - weight), b = own.data[i + 3] * weight;
    const alpha = a + b;
    data[i + 3] = Math.round(alpha);
    for (let c = 0; c < 3; c++) data[i + c] = data[i + 3]
      ? Math.round((reference.data[i + c] * a + own.data[i + c] * b) / alpha) : 0;
  }
  return { ...reference, data };
}

export function outsideDifferences(shipped, reference, mask) {
  pair(shipped, reference);
  if (!(mask instanceof Uint8Array) || mask.length !== shipped.width * shipped.height) throw new Error('Invalid output mask');
  let differing = 0;
  for (let p = 0; p < mask.length; p++) if (!mask[p] && pixelDiffers(shipped, reference, p * 4)) differing++;
  return differing;
}

export function stateRequestCrop(state, normal, margin = 16, maxArea = 0.25) {
  const mask = differenceMask(state, normal);
  if (!Number.isSafeInteger(margin) || margin < 0 || margin > 4096 || !Number.isFinite(maxArea) || maxArea <= 0 || maxArea > 1) throw new Error('Invalid state crop settings');
  let left = state.width, top = state.height, right = 0, bottom = 0;
  mask.forEach((v, p) => {
    if (!v) return;
    const x = p % state.width, y = Math.floor(p / state.width);
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
  });
  if (!right) return null;
  const x = Math.max(0, left - margin), y = Math.max(0, top - margin);
  const w = Math.min(state.width, right + margin) - x, h = Math.min(state.height, bottom + margin) - y;
  return w * h <= state.width * state.height * maxArea ? { x, y, w, h } : null;
}

export function stateStats(state, normal, reference, shipped, down) {
  pair(state, normal); pair(state, down); pair(reference, shipped);
  const sourceMask = differenceMask(state, normal);
  const mask = expandMask(sourceMask, state.width, state.height);
  const outsideDifferingPixels = outsideDifferences(shipped, reference, mask);
  let error = 0, count = 0, preservedSourcePixels = 0;
  for (let p = 0; p < sourceMask.length; p++) if (sourceMask[p]) {
    for (let c = 0; c < 4; c++) {
      error += Math.abs(down.data[p * 4 + c] * (c < 3 ? down.data[p * 4 + 3] / 255 : 1) - state.data[p * 4 + c] * (c < 3 ? state.data[p * 4 + 3] / 255 : 1));
      count++;
    }
    const x = p % state.width * 2, y = Math.floor(p / state.width) * 2;
    if ([0, 1].some((dy) => [0, 1].some((dx) => pixelDiffers(shipped, reference, ((y + dy) * shipped.width + x + dx) * 4)))) preservedSourcePixels++;
  }
  return { outsideDifferingPixels, stateMae: error / (count || 1), preservedSourcePixels, suppressed: !!count && !preservedSourcePixels };
}
