import { gaussianBlur, validateImage } from './merge.mjs';

// Code values (0..255), equivalent to 0.6/255 in normalised RGB. Smooth
// analytic maps and cleared skies qualify; textured paint must use a model.
export const RESAMPLE_HF_LIMIT = 0.6;
export function detailStats(img) {
  validateImage(img);
  if (![3, 4].includes(img.channels)) throw new Error('Detail measurement requires RGB or RGBA');
  const rms = (background) => {
    const composite = { width: img.width, height: img.height, channels: 3,
      data: Float32Array.from({ length: img.width * img.height * 3 }, (_, i) => {
        const p = Math.floor(i / 3) * img.channels, a = img.channels === 4 ? img.data[p + 3] / 255 : 1;
        return img.data[p + i % 3] * a + background * (1 - a);
      }) };
    const blurred = gaussianBlur(composite, 1);
    let squared = 0;
    for (let i = 0; i < composite.data.length; i++) squared += (composite.data[i] - blurred.data[i]) ** 2;
    return Math.sqrt(squared / composite.data.length);
  };
  const black = rms(0), white = rms(255), hfRms = Math.max(black, white);
  return { black, white, hfRms, limit: RESAMPLE_HF_LIMIT, passes: hfRms <= RESAMPLE_HF_LIMIT };
}
