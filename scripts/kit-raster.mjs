import sharp from 'sharp';
import { scaleField } from './framed-pane.mjs';
import { repairJunctions } from './kit-junction.mjs';

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
export async function rasterBase(src, resize, density, junctions) {
  const geometry = await rasterGeometry(src, resize);
  if (density === 1) return geometry.base;
  requireRasterResolution(geometry);
  if (junctions) {
    const source = await sharp(src).trim({ threshold: 1 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const repaired = repairJunctions(source, junctions);
    return sharp(repaired.data, { raw: { width: source.info.width, height: source.info.height, channels: 4 } })
      .resize(geometry.target.width, geometry.target.height, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  }
  return sharp(src).trim({ threshold: 1 }).resize(geometry.target.width, geometry.target.height, { fit: 'fill' })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

// Composite the actual enamel layer behind material before transferring the
// residual lighting/glaze treatment. A completed opaque logical pixel cannot
// reveal whether paint was laid underneath it; retain that operation explicitly.
export function rasterUnderlay(image, layer, density = 1) {
  if (image.info.width !== layer.width * density || image.info.height !== layer.height * density || layer.data.length !== layer.width * layer.height * 4) throw new Error('underlay must match logical image dimensions');
  const field = density === 1 ? layer.data : scaleField(layer.data, layer.width, layer.height, 4, density);
  const data = Buffer.from(image.data);
  for (let i = 0; i < data.length; i += 4) {
    if (!field[i + 3]) continue;
    const a = image.data[i + 3] / 255, behind = 1 - a;
    const alpha = a + field[i + 3] / 255 * behind;
    for (let k = 0; k < 3; k++) data[i + k] = alpha ? Math.round((image.data[i + k] * a + field[i + k] * behind) / alpha) : 0;
    data[i + 3] = Math.round(alpha * 255);
  }
  return { data, info: image.info };
}

// Transfer the residual logical treatment as coverage and material colour deltas.
// A one-code-value logical alpha change stays small even near saturation. Colour
// changes are coverage-weighted before interpolation, so hidden RGB never paints
// native edges. Unlike replacing a logical composite, these operations preserve
// native silhouette and texture when the treatment is small or only recolours.
/** @param {{ data: Float32Array, width: number, height: number } | null} underlay */
export function rasterEffect(native, before, after, underlay = null) {
  const { width, height } = before.info;
  if (after.info.width !== width || after.info.height !== height || native.info.width !== width * 2 || native.info.height !== height * 2) throw new Error('material effect requires matching logical images and exact 2x native art');
  if (underlay) {
    native = rasterUnderlay(native, underlay, 2);
    before = rasterUnderlay(before, underlay);
  }
  // alpha delta, target alpha, target premultiplied RGB, colour delta * coverage,
  // and coverage for normalizing that delta. Alpha fields use [0,1].
  const channels = 9, field = new Float32Array(width * height * channels);
  for (let i = 0, j = 0; i < before.data.length; i += 4, j += channels) {
    const a = before.data[i + 3] / 255, b = after.data[i + 3] / 255;
    field[j] = b - a;
    field[j + 1] = b;
    field[j + 8] = a;
    for (let k = 0; k < 3; k++) {
      field[j + 2 + k] = b * after.data[i + k];
      field[j + 5 + k] = a * (after.data[i + k] - before.data[i + k]);
    }
  }
  const effect = scaleField(field, width, height, channels, 2);
  const data = Buffer.from(native.data);
  for (let i = 0, j = 0; i < data.length; i += 4, j += channels) {
    const nativeAlpha = native.data[i + 3] / 255;
    const a = Math.max(0, Math.min(1, nativeAlpha + effect[j]));
    const surviving = Math.min(a, nativeAlpha), added = a - surviving;
    for (let k = 0; k < 3; k++) {
      const delta = effect[j + 8] ? effect[j + 5 + k] / effect[j + 8] : 0;
      const colour = Math.max(0, Math.min(255, native.data[i + k] + delta));
      const paint = effect[j + 1] ? effect[j + 2 + k] / effect[j + 1] : 0;
      data[i + k] = a ? Math.round(Math.max(0, Math.min(255, (surviving * colour + added * paint) / a))) : 0;
    }
    data[i + 3] = Math.round(a * 255);
  }
  return { data, info: native.info };
}

/** @param {{ data: Float32Array, width: number, height: number } | null} underlay */
export async function applyRasterEffect(nativePath, beforePath, afterPath, outPath, underlay = null) {
  const load = async path => sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [native, before, after] = await Promise.all([load(nativePath), load(beforePath), load(afterPath)]);
  const result = rasterEffect(native, before, after, underlay);
  // Preserve native pixels outside the treatment; a second lossy encoding
  // would introduce unrelated state changes through chroma resampling.
  await sharp(result.data, { raw: { width: result.info.width, height: result.info.height, channels: 4 } }).webp({ lossless: true }).toFile(outPath);
}
