#!/usr/bin/env node
// Turn a grayscale illustration into a 1-bit Atkinson-dithered alpha mask on one shared
// pixel grid, so every module screen has the same LCD "dot pitch".
// The site recolours the mask with the active rice (CSS mask-image), so the art carries
// shape only and never colour.
// Usage: node scripts/dither-mask.mjs <in> <out.png> [gridW=360] [gridH=240] [scale=3] [margin=12] [despeckle=0]
// `despeckle=1` drops lit dots with no lit neighbour (stray error-diffusion dots
// along UI edges in screen captures; illustrations don't need it).
// `margin` grid pixels at every edge are forced dark, as a bezel would occlude them;
// it also kills frame/vignette residue that `normalise` would otherwise amplify.
import sharp from "sharp";

const [, , input, output, gw = "360", gh = "240", sc = "3", mg = "12", ds = "0"] = process.argv;
const W = +gw, H = +gh, S = +sc, M = +mg;

const { data } = await sharp(input)
  .resize(W, H, { fit: "cover" })
  .greyscale()
  .normalise() // stretch contrast so every screen uses the full range
  .raw()
  .toBuffer({ resolveWithObject: true });

const lum = Float32Array.from(data, (v) => v / 255);
const bit = new Uint8Array(W * H);
// Atkinson: diffuse 6/8 of the error to six neighbours, dropping the rest, which keeps
// blacks deep and highlights crisp (the original Macintosh look).
const spread = [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]];
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const v = lum[i];
    const edge = x < M || y < M || x >= W - M || y >= H - M;
    const on = !edge && v >= 0.5 ? 1 : 0;
    bit[i] = on;
    const err = edge ? 0 : (v - on) / 8; // occluded pixels must not leak light inward
    for (const [dx, dy] of spread) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < W && ny < H) lum[ny * W + nx] += err;
    }
  }
}

if (ds === "1") {
  const lit = (x, y) => x >= 0 && y >= 0 && x < W && y < H && bit[y * W + x];
  const lone = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (bit[y * W + x] && ![-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => (dx || dy) && lit(x + dx, y + dy))))
        lone.push(y * W + x);
  for (const i of lone) bit[i] = 0;
}

// RGBA: white, alpha = bit. Upscale nearest-neighbour so browsers never blur the dots.
const out = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 255;
  out[i * 4 + 3] = bit[i] ? 255 : 0;
}
await sharp(out, { raw: { width: W, height: H, channels: 4 } })
  .resize(W * S, H * S, { kernel: "nearest" })
  .png({ palette: true, colours: 2 })
  .toFile(output);
console.log(output);
