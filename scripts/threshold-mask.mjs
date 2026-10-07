#!/usr/bin/env node
// Hard-threshold a grayscale frame into a 1-bit alpha mask on the shared
// 360×240 screen grid (the dither-mask.mjs grid), for frames of flat shapes
// (game sprites, dots) where error diffusion only roughens their edges.
// Usage: node scripts/threshold-mask.mjs <in> <out.png> [level=105] [margin=6]
import sharp from "sharp";

const [, , input, output, lv = "105", mg = "6"] = process.argv;
const W = 360, H = 240, S = 3, T = +lv, M = +mg;
const { data } = await sharp(input)
  .resize(W, H, { fit: "cover", kernel: "lanczos3" })
  .blur(0.7) // rounds the upscaled JPEG blocks before the cut
  .normalise()
  .extractChannel(0)
  .raw()
  .toBuffer({ resolveWithObject: true });
const out = Buffer.alloc(W * S * H * S * 4);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const edge = x < M || y < M || x >= W - M || y >= H - M; // under the bezel
    const on = !edge && data[y * W + x] > T;
    for (let j = 0; j < S; j++)
      for (let i = 0; i < S; i++) {
        const o = ((y * S + j) * W * S + x * S + i) * 4;
        out[o] = out[o + 1] = out[o + 2] = 255;
        out[o + 3] = on ? 255 : 0;
      }
  }
await sharp(out, { raw: { width: W * S, height: H * S, channels: 4 } }).png({ palette: true, colours: 2 }).toFile(output);
console.log(output);
