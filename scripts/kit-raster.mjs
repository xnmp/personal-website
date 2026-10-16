import sharp from 'sharp';

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
