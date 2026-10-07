// Pull a red cast toward a warm neutral, keeping luminance and geometry.
//   node scripts/neutralize-tint.mjs <in> <out.webp> [--tint=1,0.95,0.87]
// The generated light keycaps came out with mauve skirts; the powder-coat
// family is a warm neutral (the cap face measures 225,220,209).
import sharp from "sharp";

const [, , src, out, ...flags] = process.argv;
const opt = Object.fromEntries(flags.map((f) => f.replace(/^--/, "").split("=")));
const TINT = (opt.tint ?? "1,0.95,0.87").split(",").map(Number);
const norm = (0.2126 * TINT[0] + 0.7152 * TINT[1] + 0.0722 * TINT[2]);

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const o = Buffer.from(data);
for (let p = 0; p < data.length; p += 4) {
  const [r, g, b] = [data[p], data[p + 1], data[p + 2]];
  const cast = r - (g + b) / 2; // how red the pixel leans
  const t = Math.min(1, Math.max(0, (cast - 6) / 14));
  if (!t) continue;
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  [r, g, b].forEach((c, i) => {
    o[p + i] = Math.round(Math.min(255, c * (1 - t) + (L / norm) * TINT[i] * t));
  });
}
await sharp(o, { raw: { width: info.width, height: info.height, channels: 4 } }).webp({ quality: 92, alphaQuality: 100 }).toFile(out);
console.log(out);
