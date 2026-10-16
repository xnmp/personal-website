import sharp from 'sharp';
import { padTransparent } from './merge.mjs';
import { normalizationSize } from './external.mjs';

const geometry = ({ width, height, channels }) => ({ width, height, channels });
const bytes = ({ data }) => Buffer.from(Uint8Array.from(data, (n) => Math.round(Math.max(0, Math.min(255, n)))));
const raw = async (pipeline) => {
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  return { data, ...geometry(info) };
};

/** Pure image transform shared by both providers; no files or provider calls. */
export async function padRequestCanvas(image, tile) {
  if (!tile.requestW) return image;
  const canvas = await raw(sharp(bytes(image), { raw: geometry(image) }).ensureAlpha().extend({
    left: tile.padLeft, right: tile.requestW - tile.w - tile.padLeft,
    top: tile.padTop, bottom: tile.requestH - tile.h - tile.padTop,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  }));
  return padTransparent(canvas);
}

/** Normalize the complete canvas before extracting only the known tile region. */
export async function extractRequestTile(encoded, tile) {
  const pipeline = sharp(encoded).toColourspace('srgb').removeAlpha();
  if (!tile.requestW) return raw(pipeline.resize(tile.ow, tile.oh, { fit: 'fill', kernel: 'lanczos3' }));
  const info = await sharp(encoded).metadata();
  if ((info.pages ?? 1) > 1) throw new Error('animated output is not supported');
  normalizationSize(info.width, info.height, tile);
  // API minimum-area sizing may upscale both axes. Normalize back to the
  // source request grid at the tile's actual (possibly rounded) output scale.
  const sx = tile.ow / tile.w, sy = tile.oh / tile.h;
  const normalized = await pipeline.resize(Math.round(tile.requestW * sx), Math.round(tile.requestH * sy),
    { fit: 'fill', kernel: 'lanczos3' }).png().toBuffer();
  return raw(sharp(normalized).extract({ left: Math.round(tile.padLeft * sx), top: Math.round(tile.padTop * sy),
    width: tile.ow, height: tile.oh }));
}
