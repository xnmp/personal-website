import sharp from "sharp";

// Captures use CSS pixels, independent of DPR. An 8x reduction followed by
// blur (sigma 0.5 at reduced size, ~4 CSS px) suppresses sharpening. Use the
// worst RGB channel, not a viewport average that could hide a small sprite.
export const ART_DOWNSAMPLE = 8;
// Offline calibration against dimension-preserving Lanczos3 B: actual twins
// reach 28 at 1920x1080 (border fixtures <= 13); the full-viewport
// unit fixture reaches 14 sharpened, 99 shifted 4px, 225 doubled. 32 allows
// detail/encoding variation with margin while retaining displacement sensitivity.
export const ART_MAX_DIFFERENCE = 32; // 0–255; contracts in hires-art.test.ts

/** B keeps the served twin's pixel dimensions (and image-set density) while
 * replacing only its detail. Lossless WebP avoids a second lossy encode.
 */
export async function resampleArtwork(sibling: Uint8Array, twin: Uint8Array): Promise<Buffer> {
  const { width, height } = await sharp(Buffer.from(twin)).metadata();
  if (!width || !height) throw new Error("Twin has no pixel dimensions");
  return sharp(Buffer.from(sibling))
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .webp({ lossless: true, effort: 0 }).toBuffer();
}

/** Pure comparison: no browser, filesystem, baseline or mutable state.
 * The diff is the reduced absolute RGB difference, amplified 4x for review.
 */
export async function compareArtwork(a: Uint8Array, b: Uint8Array) {
  const inputs = [Buffer.from(a), Buffer.from(b)];
  const [first, second] = await Promise.all(inputs.map((input) => sharp(input).metadata()));
  if (!first.width || !first.height || first.width !== second.width || first.height !== second.height) {
    throw new Error(`Capture dimensions differ: ${first.width}x${first.height} vs ${second.width}x${second.height}`);
  }
  const width = Math.ceil(first.width / ART_DOWNSAMPLE);
  const height = Math.ceil(first.height / ART_DOWNSAMPLE);
  const [lowA, lowB] = await Promise.all(inputs.map((input) => sharp(input)
    .flatten({ background: "white" }).toColourspace("srgb").removeAlpha()
    .resize(width, height, { fit: "fill" }).blur(0.5).raw().toBuffer()));
  const pixels = Buffer.alloc(lowA.length);
  let maxDifference = 0;
  for (let i = 0; i < pixels.length; i++) {
    const difference = Math.abs(lowA[i] - lowB[i]);
    maxDifference = Math.max(maxDifference, difference);
    pixels[i] = Math.min(255, difference * 4);
  }
  const diff = await sharp(pixels, { raw: { width, height, channels: 3 } }).png().toBuffer();
  return { maxDifference, passes: maxDifference <= ART_MAX_DIFFERENCE, diff };
}
