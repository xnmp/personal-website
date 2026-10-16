import { createHash } from 'node:crypto';
import { validateImage, estimateFlow, colourStats, gaussianBlur } from './merge.mjs';

import { bilinear2x } from './periodic.mjs';

const residualV4 = Object.freeze({ version: 'residual-v4', opaqueAlpha: 0.98, feather: 4, kernel: 'premultiplied-bilinear-v1', support: 'nearest-change-mask', clamp: 'premultiplied-rgba', hfSigma: 1 });
const registeredV2 = Object.freeze({ version: 'registered-v2', mask: 'premultiplied-rgba-exact-nearest-2x', feather: 2, toneAlpha: 'conform-v1' });
const registeredV3 = Object.freeze({ ...registeredV2, version: 'registered-v3' });
export const STATE_RECIPE = registeredV3;
const residualV5 = Object.freeze({ ...residualV4, version: 'residual-v5', support: 'signed-gaussian-mad-intended-mask', noiseSigma: 1, noiseFloor: 8, noiseMultiplier: 3, supportMargin: 3 });
// These objects are immutable historical byte identities, not recipes to execute.
export const HISTORICAL_DERIVATION_GENERATIONS = Object.freeze([
  Object.freeze({ state: registeredV2, residual: residualV4 }),
]);
export const RESIDUAL_RECIPE = residualV5;
export const CURRENT_DERIVATION_GENERATION = Object.freeze({ state: STATE_RECIPE, residual: RESIDUAL_RECIPE });
export const statePolicy = (asset) => ({ mode: asset.stateDerivation ?? 'auto', maxHf: asset.stateResidualMaxHf ?? 4 });
const pair = (a, b) => {
  validateImage(a); validateImage(b);
  if ([a, b].some((img) => img.data instanceof Float32Array && img.data.some((v) => !Number.isFinite(v)))) throw new Error('State images require finite channels');
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

/** @param {{ version: string, mask: string, feather: number, toneAlpha: string }} recipe */
export const derivationDigest = (stateBytes, normalBytes, referenceBytes, sigma, recipe = STATE_RECIPE) => createHash('sha256')
  .update(JSON.stringify([...[stateBytes, normalBytes, referenceBytes].map((bytes) => createHash('sha256').update(bytes).digest('hex')), recipe, sigma])).digest('hex');

export function differenceMask(state, normal) {
  pair(state, normal);
  return Uint8Array.from({ length: state.width * state.height }, (_, p) => Number(pixelDiffers(state, normal, p * 4)));
}

// Source-resolution support of S2 plus four source pixels for registration
// evidence. This is a gate mask only; the delivered S2 never expands.
export function stateGateWeights(state, normal, margin = 4) {
  const mask = differenceMask(state, normal);
  if (!Number.isSafeInteger(margin) || margin < 0 || margin > 64) throw new Error('Invalid gate margin');
  const { width, height } = state;
  const horizontal = new Uint8Array(mask.length), expanded = new Float32Array(mask.length);
  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let x = -margin; x < width; x++) {
      if (x + margin < width) sum += mask[y * width + x + margin];
      if (x - margin - 1 >= 0) sum -= mask[y * width + x - margin - 1];
      if (x >= 0) horizontal[y * width + x] = Number(sum > 0);
    }
  }
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = -margin; y < height; y++) {
      if (y + margin < height) sum += horizontal[(y + margin) * width + x];
      if (y - margin - 1 >= 0) sum -= horizontal[(y - margin - 1) * width + x];
      if (y >= 0 && sum) expanded[y * width + x] = state.data[(y * width + x) * 4 + 3] / 255;
    }
  }
  return expanded;
}

export function cropWeights(weights, width, { x, y, w, h }) {
  if (!(weights instanceof Float32Array || weights instanceof Float64Array) || !Number.isSafeInteger(width) || width < 1 || weights.length % width ||
      ![x, y, w, h].every(Number.isSafeInteger) || x < 0 || y < 0 || w < 1 || h < 1 || x + w > width || y + h > weights.length / width) throw new Error('Invalid weight crop');
  return Float32Array.from({ length: w * h }, (_, p) => weights[(y + Math.floor(p / w)) * width + x + p % w]);
}

// Fit the evidence grid to the contributing region, so a small state change
// receives the same minimum evidence requirement as a small standalone asset.
export function stateEvidence(source, target, weights, { displacement = true } = {}) {
  validateImage(source); validateImage(target);
  if (source.width !== target.width || source.height !== target.height || source.channels !== target.channels ||
      !(weights instanceof Float32Array || weights instanceof Float64Array) || weights.length !== source.width * source.height) throw new Error('Invalid state evidence geometry');
  let left = source.width, top = source.height, right = 0, bottom = 0;
  weights.forEach((v, p) => {
    if (!v) return;
    const x = p % source.width, y = Math.floor(p / source.width);
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
  });
  if (!right) return { ...colourStats(source, target, weights), ...(displacement ? { flow: estimateFlow(source, target, { weights }).diagnostics } : {}) };
  const region = { x: left, y: top, w: right - left, h: bottom - top };
  const extract = (img) => ({ width: region.w, height: region.h, channels: img.channels,
    data: Float32Array.from({ length: region.w * region.h * img.channels }, (_, i) =>
      img.data[((top + Math.floor(i / img.channels / region.w)) * img.width + left + Math.floor(i / img.channels) % region.w) * img.channels + i % img.channels]) });
  const a = extract(source), b = extract(target), support = cropWeights(weights, source.width, region);
  return { ...colourStats(a, b, support), ...(displacement ? { flow: estimateFlow(a, b, { weights: support }).diagnostics } : {}) };
}

export function expandMask(mask, width, height) {
  if (!(mask instanceof Uint8Array) || ![width, height].every((n) => Number.isSafeInteger(n) && n > 0) || mask.length !== width * height || mask.some((v) => v > 1)) throw new Error('Invalid state mask');
  return Uint8Array.from({ length: width * height * 4 }, (_, p) => mask[Math.floor(Math.floor(p / (width * 2)) / 2) * width + Math.floor(p % (width * 2) / 2)]);
}

// The footprint is a hard canonical-equality boundary. Feather weights ramp
// outside it, never inside: the exterior ramp is clipped when composing S2.
export function registerState(state, normal, reference, own, feather = Number(STATE_RECIPE.feather)) {
  pair(state, normal); pair(reference, own);
  if (reference.width !== state.width * 2 || reference.height !== state.height * 2) throw new Error('State output must be exactly 2x');
  const mask = expandMask(differenceMask(state, normal), state.width, state.height);
  const weights = outwardWeights(mask, reference.width, reference.height, feather);
  const data = Uint8Array.from(reference.data);
  for (let p = 0; p < mask.length; p++) if (mask[p] && weights[p] === 1)
    for (let c = 0; c < 4; c++) data[p * 4 + c] = Math.round(own.data[p * 4 + c]);
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

export function stateStats(state, normal, reference, shipped, down, evidence = intendedChange(state, normal)) {
  pair(state, normal); pair(state, down); pair(reference, shipped);
  const sourceMask = evidence.mask;
  const mask = expandMask(differenceMask(state, normal), state.width, state.height);
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
  const changedSourcePixels = count / 4;
  const preservedShare = changedSourcePixels ? preservedSourcePixels / changedSourcePixels : 1;
  return { outsideDifferingPixels, stateMae: error / (count || 1), changedSourcePixels, preservedSourcePixels, preservedShare,
    suppressed: preservedShare < CHANGE_GATE.minimumShare };
}

// Signed code values, before filtering: invisible RGB contributes exactly zero.
export function stateResidual(state, normal) {
  pair(state, normal);
  if (!state.data.some((v, i) => i % 4 === 3 && v > 0)) throw new Error('State is fully transparent');
  return { ...state, data: Float32Array.from(state.data, (v, i) => {
    const alpha = i - i % 4 + 3;
    return i % 4 === 3 ? v - normal.data[i] : (v * state.data[alpha] - normal.data[i] * normal.data[alpha]) / 255;
  }) };
}

export function residualRouting(state, normal, asset = {}) {
  const { mode, maxHf } = statePolicy(asset);
  const delta = stateResidual(state, normal), mask = differenceMask(state, normal);
  const blurred = gaussianBlur(delta, 1);
  let squared = 0, count = 0;
  for (let p = 0; p < mask.length; p++) if (mask[p]) for (let c = 0; c < 4; c++) {
    squared += (delta.data[p * 4 + c] - blurred.data[p * 4 + c]) ** 2;
    count++;
  }
  const hfRms = Math.sqrt(squared / (count || 1));
  return { mode, maxHf, hfRms, method: mode === 'auto' ? hfRms <= maxHf ? 'residual' : 'generate' : mode };
}

// Regions are classified at 1x, then replicated over each 2x footprint.
export function stateRegions(state, normal, evidence = intendedChange(state, normal)) {
  const changed = evidence.mask;
  const opaque = Uint8Array.from(changed, (v, p) => Number(!!v &&
    state.data[p * 4 + 3] >= 255 * RESIDUAL_RECIPE.opaqueAlpha && normal.data[p * 4 + 3] >= 255 * RESIDUAL_RECIPE.opaqueAlpha));
  return { changed, opaque, translucent: Uint8Array.from(changed, (v, p) => v && !opaque[p] ? 1 : 0) };
}

const premulValue = (img, i, c) => img.data[i + c] * (c < 3 ? img.data[i + 3] / 255 : 1);

// Full weight throughout the changed footprint, smoothstep decay outside it.
export function outwardWeights(mask, width, height, feather = Number(RESIDUAL_RECIPE.feather)) {
  if (!Number.isInteger(feather) || feather < 1 || feather > 32) throw new Error('Invalid outward feather');
  if (mask.length !== width * height) throw new Error('Invalid feather geometry');
  const distance = Float32Array.from(mask, (v) => v ? 0 : feather);
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
  return Float32Array.from(distance, (d) => { const t = d / feather; return 1 - t * t * (3 - 2 * t); });
}

export function transferResidual(state, normal, reference, feather = Number(RESIDUAL_RECIPE.feather), evidence = intendedChange(state, normal)) {
  const delta = stateResidual(state, normal);
  validateImage(reference);
  if (reference.channels !== 4 || reference.width !== state.width * 2 || reference.height !== state.height * 2) throw new Error('Residual reference output must be matching RGBA at exactly 2x');
  const regions = stateRegions(state, normal, evidence);
  const mask = expandMask(regions.changed, state.width, state.height);
  const opaque = expandMask(regions.opaque, state.width, state.height);
  const weights = outwardWeights(mask, reference.width, reference.height, feather);
  const up = bilinear2x(delta);
  const target = bilinear2x({ ...state, data: Float32Array.from(state.data, (_, i) => premulValue(state, i - i % 4, i % 4)) });
  const data = Uint8Array.from(reference.data);
  for (let p = 0; p < mask.length; p++) if (mask[p]) {
    const i = p * 4;
    const value = (c) => opaque[p] ? premulValue(reference, i, c) + up.data[i + c]
      : premulValue(reference, i, c) * (1 - weights[p]) + target.data[i + c] * weights[p];
    const alpha = Math.max(0, Math.min(255, value(3)));
    data[i + 3] = Math.round(alpha);
    // Saturated generated paint can still put an additive RGB delta out of
    // gamut. Encode valid RGBA; change reproduction and conformance assess the loss.
    for (let c = 0; c < 3; c++) data[i + c] = data[i + 3] && alpha
      ? Math.round(Math.max(0, Math.min(alpha, value(c))) * 255 / alpha) : 0;
  }
  return { ...reference, data };
}

const errorSummary = (errors) => {
  errors.sort((a, b) => a - b);
  const mae = errors.reduce((sum, v) => sum + v, 0) / (errors.length || 1);
  const p99 = errors[Math.ceil(errors.length * 0.99) - 1] ?? 0;
  return { mae, p99, samples: errors.length };
};

// Code units (/255). Opaque paint reproduces the delta; translucent paint
// is compared absolutely to the state. These are diagnostics, never gates.
export function residualDiagnostics(state, normal, down, referenceDown, evidence = intendedChange(state, normal)) {
  pair(state, normal); pair(state, down); pair(state, referenceDown);
  const regions = stateRegions(state, normal, evidence), errors = { opaque: [], translucent: [] };
  for (let p = 0; p < regions.changed.length; p++) if (regions.changed[p]) for (let c = 0; c < 4; c++) {
    const i = p * 4, value = (img) => premulValue(img, i, c);
    const region = regions.opaque[p] ? 'opaque' : 'translucent';
    errors[region].push(Math.abs(value(down) - value(state) - (regions.opaque[p] ? value(referenceDown) - value(normal) : 0)));
  }
  const opaque = errorSummary(errors.opaque), translucent = errorSummary(errors.translucent);
  return { opaque, translucent, ...errorSummary([...errors.opaque, ...errors.translucent]) };
}

// Signed filtering cancels uncorrelated speckle instead of accumulating its
// absolute magnitude. MAD estimates high-frequency noise on active pixels;
// the 8-code floor accounts for quantisation/resampling and weak paint noise.
export const CHANGE_GATE = Object.freeze({ threshold: 24, noiseFloor: RESIDUAL_RECIPE.noiseFloor, sigma: RESIDUAL_RECIPE.noiseSigma, minimumMagnitude: 0.5, minimumShare: 0.9 });
const median = (values) => {
  values.sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);
  return values.length ? (values[middle] + values[Math.max(0, Math.ceil(values.length / 2) - 1)]) / 2 : 0;
};
export function intendedChange(state, normal) {
  const delta = stateResidual(state, normal), filtered = gaussianBlur(delta, CHANGE_GATE.sigma);
  const exact = differenceMask(state, normal);
  const noiseSigma = [0, 1, 2, 3].map((c) => {
    const high = [];
    for (let p = 0; p < exact.length; p++) if (exact[p]) high.push(delta.data[p * 4 + c] - filtered.data[p * 4 + c]);
    const centre = median(high);
    return 1.4826 * median(high.map((v) => Math.abs(v - centre)));
  });
  // ||G||2 = 0.28228, ||I-G||2 = 0.87252 for our separable sigma=1 kernel.
  const noiseFloor = Math.max(CHANGE_GATE.noiseFloor, ...noiseSigma.map((s) => RESIDUAL_RECIPE.noiseMultiplier * s * 0.28228 / 0.87252));
  let maxDelta = 0;
  for (const v of filtered.data) maxDelta = Math.max(maxDelta, Math.abs(v));
  const threshold = Math.max(noiseFloor, Math.min(CHANGE_GATE.threshold, maxDelta / 2));
  const seeds = Uint8Array.from(exact, (v, p) => Number(!!v && [0, 1, 2, 3].some((c) => Math.abs(filtered.data[p * 4 + c]) >= noiseFloor)));
  // Retain the contributing source support of each Gaussian measurement. Cutting
  // at the threshold contour itself removes neighbouring evidence on resample.
  // Clip to exact differences to retain the canonical equality boundary.
  const support = outwardWeights(seeds, state.width, state.height, RESIDUAL_RECIPE.supportMargin + 1);
  const mask = Uint8Array.from(exact, (v, p) => Number(!!v && support[p] > 0));
  return { filtered, mask, noiseSigma, noiseFloor, threshold, maxDelta };
}

export function changeReproduction(state, normal, down, referenceDown, intended = intendedChange(state, normal)) {
  pair(state, normal); pair(state, down); pair(state, referenceDown);
  const { filtered, mask, ...evidence } = intended;
  const observed = gaussianBlur(stateResidual(down, referenceDown), CHANGE_GATE.sigma);
  let strongPixels = 0, reproducedPixels = 0, outputMaxDelta = 0;
  for (const v of observed.data) outputMaxDelta = Math.max(outputMaxDelta, Math.abs(v));
  for (let p = 0; p < mask.length; p++) if (mask[p]) {
    let strong = false, reproduced = true;
    for (let c = 0; c < 4; c++) {
      const delta = filtered.data[p * 4 + c];
      if (Math.abs(delta) < evidence.threshold) continue;
      strong = true;
      if (Math.sign(delta) * observed.data[p * 4 + c] + 1e-5 < Math.abs(delta) * CHANGE_GATE.minimumMagnitude) reproduced = false;
    }
    if (strong) { strongPixels++; if (reproduced) reproducedPixels++; }
  }
  const share = strongPixels ? reproducedPixels / strongPixels : 1;
  const noiseOnly = !strongPixels;
  return { ...CHANGE_GATE, ...evidence, noiseOnly, outputMaxDelta, strongPixels, reproducedPixels, share,
    passes: noiseOnly ? outputMaxDelta <= evidence.noiseFloor : share >= CHANGE_GATE.minimumShare };
}
