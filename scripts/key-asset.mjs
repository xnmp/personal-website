#!/usr/bin/env node
// Chroma-key a generated asset shot on pure magenta (#FF00FF) to an alpha WebP/PNG.
// Usage: node scripts/key-asset.mjs <in.png> <out.webp|png> [maxWidth] [--no-trim] [--crop=x,y,w,h]
//
// Per pixel: "magenta-ness" md = min(r,b) - g. Alpha falls off smoothly as md rises,
// edge colour is un-mixed from the magenta (F = (C - (1-a)M) / a), then any residual
// magenta cast is despilled by pulling r and b down to the excess over g.
// Vermilion/amber survive because min(r,b) stays below g for them.
import sharp from "sharp";

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--"));
const [input, output, maxWidth] = args.filter((a) => !a.startsWith("--"));
const noTrim = flags.includes("--no-trim");
const crop = flags.find((f) => f.startsWith("--crop="))?.slice(7).split(",").map(Number);

const LO = 40, HI = 200;
const smooth = (x) => { const t = Math.min(1, Math.max(0, (x - LO) / (HI - LO))); return t * t * (3 - 2 * t); };

let img = sharp(input).ensureAlpha();
if (crop) img = img.extract({ left: crop[0], top: crop[1], width: crop[2], height: crop[3] });
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const px = Buffer.from(data);

for (let i = 0; i < px.length; i += 4) {
  let r = px[i], g = px[i + 1], b = px[i + 2];
  const md = Math.min(r, b) - g;
  const a = 1 - smooth(md);
  if (a <= 0.004) { px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0; continue; }
  if (a < 1) { // un-mix the magenta backdrop from the edge colour
    r = (r - (1 - a) * 255) / a;
    b = (b - (1 - a) * 255) / a;
    g = g / a;
  }
  const spill = Math.min(r, b) - g; // residual magenta cast
  if (spill > 0) { r -= spill; b -= spill; }
  px[i] = Math.max(0, Math.min(255, r));
  px[i + 1] = Math.max(0, Math.min(255, g));
  px[i + 2] = Math.max(0, Math.min(255, b));
  px[i + 3] = Math.round(a * 255);
}

let out = sharp(px, { raw: { width, height, channels: 4 } });
if (!noTrim) {
  // trim to the alpha bounding box
  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (px[(y * width + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  out = sharp(await out.png().toBuffer()).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 });
}
if (maxWidth) out = sharp(await out.png().toBuffer()).resize({ width: +maxWidth, withoutEnlargement: true });
out = output.endsWith(".webp") ? out.webp({ quality: 90, alphaQuality: 100 }) : out.png();
const meta = await out.toFile(output);
console.log(`${output} ${meta.width}x${meta.height}`);
