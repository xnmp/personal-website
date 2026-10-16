import sharp from 'sharp';
import { scaleField } from './framed-pane.mjs';

// Resolve the legacy integer base dimensions first, but sample the painted
// region directly at the requested density. Padding never counts as resolution.
export async function rasterGeometry(src, resize) {
  const [sample, base] = await Promise.all([
    sharp(src).trim({ threshold: 1 }).raw().toBuffer({ resolveWithObject: true }),
    sharp(src).trim({ threshold: 1 }).resize(resize).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  const sampled = { width: sample.info.width, height: sample.info.height };
  const target = { width: base.info.width * 2, height: base.info.height * 2 };
  return { base, sampled, target, ratio: Math.min(sampled.width / target.width, sampled.height / target.height) };
}
export function requireRasterResolution({ sampled, target, ratio }) {
  if (ratio < 1) throw new Error(`insufficient raw resolution: sampled ${sampled.width}x${sampled.height}, requires ${target.width}x${target.height} (ratio ${ratio})`);
}
export async function rasterBase(src, resize, density) {
  const geometry = await rasterGeometry(src, resize);
  if (density === 1) return geometry.base;
  requireRasterResolution(geometry);
  return sharp(src).trim({ threshold: 1 }).resize(geometry.target.width, geometry.target.height, { fit: 'fill' })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

// Apply a completed logical material treatment in premultiplied space. Native
// artwork carries the signed treatment on opaque material. Where the treatment
// changes translucent coverage, interpolate the complete composite instead.
// This keeps nonlinear mask/paint/shade interactions together.
export function rasterEffect(native, before, after) {
  const { width, height } = before.info;
  if (after.info.width !== width || after.info.height !== height || native.info.width !== width * 2 || native.info.height !== height * 2) throw new Error('material effect requires matching logical images and exact 2x native art');
  const delta = new Float32Array(before.data.length);
  const logicalBefore = new Float32Array(before.data.length);
  const retain = new Float32Array(width * height);
  for (let i = 0; i < delta.length; i += 4) {
    delta[i + 3] = after.data[i + 3] - before.data[i + 3];
    logicalBefore[i + 3] = before.data[i + 3];
    for (let k = 0; k < 3; k++) {
      logicalBefore[i + k] = before.data[i + k] * before.data[i + 3] / 255;
      delta[i + k] = after.data[i + k] * after.data[i + 3] / 255 - logicalBefore[i + k];
    }
    const changed = delta.subarray(i, i + 4).some(v => v !== 0);
    // An opaque surface carries an additive lighting/material change. A
    // treatment changing translucent coverage must resolve the complete target;
    // adding its delta to different native coverage is not alpha compositing.
    retain[i / 4] = !changed || before.data[i + 3] === 255 && after.data[i + 3] === 255 ? 1 : 0;
  }
  const effect = scaleField(delta, width, height, 4, 2);
  const base = scaleField(logicalBefore, width, height, 4, 2);
  const retainNative = scaleField(retain, width, height, 1, 2);
  const data = Buffer.from(native.data);
  for (let i = 0; i < data.length; i += 4) {
    const value = k => base[i + k] + effect[i + k] + retainNative[i / 4] * ((k === 3 ? native.data[i + 3] : native.data[i + k] * native.data[i + 3] / 255) - base[i + k]);
    const a = Math.max(0, Math.min(255, value(3)));
    for (let k = 0; k < 3; k++) data[i + k] = a ? Math.round(Math.max(0, Math.min(a, value(k))) * 255 / a) : 0;
    data[i + 3] = Math.round(a);
  }
  return { data, info: native.info };
}

export async function applyRasterEffect(nativePath, beforePath, afterPath, outPath) {
  const load = async path => sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [native, before, after] = await Promise.all([load(nativePath), load(beforePath), load(afterPath)]);
  const result = rasterEffect(native, before, after);
  // Preserve native pixels outside the treatment; a second lossy encoding
  // would introduce unrelated state changes through chroma resampling.
  await sharp(result.data, { raw: { width: result.info.width, height: result.info.height, channels: 4 } }).webp({ lossless: true }).toFile(outPath);
}
