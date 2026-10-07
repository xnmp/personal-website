// Turn a glow shot on black into a straight-alpha sprite, for surfaces where an
// additive (screen) blend shows nothing, such as the light powder-coat chassis.
// alpha = brightest channel; colour = channel / alpha (un-premultiplied).
//   node scripts/glow-alpha.mjs <glow-on-black.jpg> <out.webp>
import sharp from "sharp";

const [, , src, out] = process.argv;
const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const o = Buffer.alloc(info.width * info.height * 4);
for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
  const a = Math.max(data[i], data[i + 1], data[i + 2]);
  for (let c = 0; c < 3; c++) o[j + c] = a ? Math.min(255, Math.round((data[i + c] * 255) / a)) : 0;
  o[j + 3] = a;
}
await sharp(o, { raw: { width: info.width, height: info.height, channels: 4 } }).webp({ quality: 90, alphaQuality: 100 }).toFile(out);
console.log(out);
