// The plate edit misspelled the right-hand sign ("PRORRAMS"); the plate
// registers with the original exactly, so the sign is laid back in from it
// under a feathered rectangle (the sign's lettering is the mock's own).
//   node scripts/kits/solarpunk-fix-plate.mjs <original> <plate> <out>
// e.g. art/originals/solarpunk.webp, the generated plate, and the corrected
// plate (art/raw/solarpunk/layer-sky-<finish>/layer-sky-<finish>.core.png).
import sharp from "sharp";
const [, , orig, plate, out] = process.argv;
const [x, y, w, h, f] = [1418, 432, 190, 132, 10];
const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><filter id="b"><feGaussianBlur stdDeviation="${f / 2}"/></filter></defs><rect x="${f}" y="${f}" width="${w - 2 * f}" height="${h - 2 * f}" fill="#fff" filter="url(#b)"/></svg>`);
const patch = await sharp(orig).extract({ left: x, top: y, width: w, height: h }).ensureAlpha()
  .composite([{ input: await sharp(mask).png().toBuffer(), blend: "dest-in" }]).png().toBuffer();
await sharp(plate).composite([{ input: patch, left: x, top: y }]).png().toFile(out);
