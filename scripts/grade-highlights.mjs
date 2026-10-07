// Compress and warm the highlights of a kit bitmap, keeping its geometry.
//   node scripts/grade-highlights.mjs <in> <out.webp> [--knee=110] [--ratio=0.5] [--warm=0.6]
// Used on the dark bezel. Its generated lower/right lip came out as the
// brightest, coolest value on the page and read as a white photo border. Real
// anodised trim catches far less light on the faces turned away from an
// upper-left key light, and in the plate's neutral, not blue.
import sharp from "sharp";

const [, , src, out, ...flags] = process.argv;
const opt = Object.fromEntries(flags.map((f) => f.replace(/^--/, "").split("=")));
const KNEE = +(opt.knee ?? 110); // luminance above which values are compressed
const RATIO = +(opt.ratio ?? 0.5); // slope above the knee
const WARM = +(opt.warm ?? 0.6); // 0 keeps the hue, 1 moves highlights fully to a warm neutral
const NEUTRAL = [1.0, 0.97, 0.92]; // the plate's edge-catch tint, relative to luminance

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const o = Buffer.from(data);
for (let p = 0; p < data.length; p += 4) {
  const [r, g, b] = [data[p], data[p + 1], data[p + 2]];
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (L <= KNEE) continue;
  const L2 = KNEE + (L - KNEE) * RATIO;
  const t = Math.min(1, (L - KNEE) / 60) * WARM; // blend the warmth in over the knee
  const k = L2 / L;
  [r, g, b].forEach((c, i) => {
    o[p + i] = Math.round(Math.min(255, c * k * (1 - t) + L2 * NEUTRAL[i] * t));
  });
}
await sharp(o, { raw: { width: info.width, height: info.height, channels: 4 } }).webp({ quality: 92, alphaQuality: 100 }).toFile(out);
console.log(out);
