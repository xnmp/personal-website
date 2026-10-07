// Cut a prop-free bench from the authored desk: the mat's interior only, with
// the lamp's falloff partly flattened, so the gutters either side of the rack
// show one continuous surface instead of slivers of props cut off by the rack.
//   node scripts/bench-mat.mjs <authored.webp> <out.webp> <left> <top> <width> <height> [--flatten=0.7] [--chroma=1] [--tint=hex] [--level=1] [--width=2560]
// --level scales the overall brightness (the mat sits in shade behind the rack).
// --chroma scales each pixel's colour away from its grey (the lamp's warm pool
// against the cool mat reads as two surfaces), --tint is the hue it settles on.
import sharp from "sharp";

const [, , src, out, l, t, w, h, ...flags] = process.argv;
if (!src || !out || !h) {
  console.error("usage: bench-mat.mjs <authored> <out.webp> <left> <top> <width> <height> [--flatten=0.7] [--width=2560]");
  process.exit(1);
}
const opt = Object.fromEntries(flags.map((f) => f.replace(/^--/, "").split("=")));
const FLAT = +(opt.flatten ?? 0.7); // 0 keeps the authored light, 1 removes it
const OUT_W = +(opt.width ?? 2560);
const CHROMA = +(opt.chroma ?? 1);
const LEVEL = +(opt.level ?? 1);
const TINT = opt.tint ? opt.tint.match(/../g).map((x) => parseInt(x, 16)) : null;

const crop = sharp(src).extract({ left: +l, top: +t, width: +w, height: +h }).removeAlpha();
const { data, info } = await crop.clone().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const lum = Buffer.from(Array.from({ length: W * H }, (_, i) => Math.round(0.2126 * data[i * 3] + 0.7152 * data[i * 3 + 1] + 0.0722 * data[i * 3 + 2])));
const illum = await sharp(lum, { raw: { width: W, height: H, channels: 1 } }).blur(W / 12).extractChannel(0).raw().toBuffer();
const mean = illum.reduce((a, b) => a + b, 0) / illum.length;
const outBuf = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  const gain = (1 + FLAT * (mean / Math.max(1, illum[i]) - 1)) * LEVEL;
  const grey = lum[i];
  for (let k = 0; k < 3; k++) {
    // keep the weave (luminance), pull the colour toward one hue
    const tinted = TINT ? grey * (TINT[k] / 128) : grey;
    const c = tinted + (data[i * 3 + k] - grey) * CHROMA;
    outBuf[i * 3 + k] = Math.max(0, Math.min(255, Math.round(c * gain)));
  }
}
await sharp(outBuf, { raw: { width: W, height: H, channels: 3 } })
  .resize(OUT_W)
  .webp({ quality: 86 })
  .toFile(out);
console.log(out, OUT_W, Math.round((H * OUT_W) / W));
