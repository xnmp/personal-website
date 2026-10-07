// Prepare a UI capture for 1-bit dithering (then scripts/dither-mask.mjs):
//   node scripts/prep-ui-capture.mjs <capture.png> <out.png> <left> <top> <width> <height>
// Made for the quick-open capture: the selected row becomes
// a solid bar with knocked-out text (as a 1-bit UI would draw selection), the
// rest is light-on-dark text.
import sharp from "sharp";
const [, , src, out, l, t, w, h] = process.argv;
const { data, info } = await sharp(src).extract({ left: +l, top: +t, width: +w, height: +h }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const blue = (i) => data[i + 2] > data[i] + 70 && data[i + 2] > 150;
const outB = Buffer.alloc(W * H);
for (let y = 0; y < H; y++) {
  let nb = 0;
  for (let x = 0; x < W; x++) nb += blue((y * W + x) * 3);
  const sel = nb > W * 0.4; // the selected row
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    outB[y * W + x] = sel ? Math.min(255, lum * 2.2) : Math.min(255, Math.max(0, (lum - 40) * 1.6));
  }
}
await sharp(outB, { raw: { width: W, height: H, channels: 1 } }).png().toFile(out);
