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
