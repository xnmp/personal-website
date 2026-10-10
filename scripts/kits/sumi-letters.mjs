// Lift the Sumi-e Ink original's brush lettering off its paper:
//   node scripts/kits/sumi-letters.mjs     (then: node scripts/build-kit.mjs sumi)
//
// The home page's three brushed names ("chong", "Tauri Explorer",
// "Projects") are fixed strings, and so is the line drawn round "Try it
// live"; and the original mock (art/raw/originals/
// sumi.png) has each one written in the hand the style is judged by: upright,
// a bouncing baseline, wet ink running dry along each stroke (and the key's
// line broken and heavier along its foot). No face draws that, so the page
// draws the mock's own: each is cut from the mock and keyed to ink on white
// (letter-*, key-line), which the kit lifts to alpha
// (scripts/kits/sumi.mjs `inks`) and sumi.css lays as a mask over a fill of
// the words' ink, so the night recolours it.
//
// The key is the standard flat-field one for ink on paper: the paper under a
// word (its tone and any wash) is estimated by a grey closing wider than a
// stroke, the ink's density is how far a pixel falls below it toward black,
// and a soft knee clears the paper's fibres while the density above it is
// kept (the wet greys and the dry streaks inside a stroke). Only the strokes
// that belong to the word are kept: the marks that reach its core band, and
// the fray within a few px of them, so the pitch under the title and the
// tagline under the name stay out (and the key's label, inside its `hole`).
// Written at 2x (the screen's pixels are
// finer than the mock's), upsampled smooth.
//
// Each word's `box` is where it stands in the mock; sumi.css sizes and places
// the word's box from it, in mock px (--u).
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "art/raw/originals/sumi.png";
const RAW = "art/raw/sumi";
// box: the crop, [x, y, w, h] in mock px; core: the band a kept stroke must
// reach; hole: a box whose ink is not the word's; mark: the alpha a stroke's
// pixels reach (the key's line is thin, and greyer where the brush lifted)
const WORDS = {
  "letter-brand": { box: [80, 14, 262, 102], core: [82, 22, 258, 74] },
  "letter-title": { box: [78, 186, 574, 124], core: [80, 192, 572, 92] },
  "letter-projects": { box: [84, 544, 132, 48], core: [86, 548, 128, 32] },
  "key-line": { box: [400, 387, 175, 65], core: [400, 387, 175, 65], hole: [411, 399, 153, 41], mark: 0.16 },
};
const SCALE = 2;
// the closing's radius (wider than the widest stroke, half a dot), the
// darkest ink, the density the paper's fibres reach, and the knee over it
const RADIUS = 13;
const INK = 12;
const FLOOR = 0.1;
const KNEE = 0.25;
// the mock's ink is a shade denser than its density reads linearly
const GAMMA = 0.85;

/** a separable max (or min) filter over a w x h field, radius r */
const extreme = (src, w, h, r, pick) => {
  const a = new Float32Array(w * h);
  const b = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = src[y * w + x];
      for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + r); k++) v = pick(v, src[y * w + k]);
      a[y * w + x] = v;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = a[y * w + x];
      for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r); k++) v = pick(v, a[k * w + x]);
      b[y * w + x] = v;
    }
  return b;
};
/** a box blur, radius r */
const blur = (src, w, h, r) => {
  const a = new Float32Array(w * h);
  const b = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      let n = 0;
      for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + r); k++) {
        s += src[y * w + k];
        n++;
      }
      a[y * w + x] = s / n;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      let n = 0;
      for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r); k++) {
        s += a[k * w + x];
        n++;
      }
      b[y * w + x] = s / n;
    }
  return b;
};
const max = (a, b) => (a > b ? a : b);
const min = (a, b) => (a < b ? a : b);
/** density over the floor, a soft knee at its foot (continuous, slope 1 above it) */
const knee = (d) => {
  const t = Math.min(1, Math.max(0, (d - FLOOR) / (1 - FLOOR)));
  return t < KNEE ? (t * t) / (2 * KNEE) : t - KNEE / 2 + (KNEE / 2) * ((t - KNEE) / (1 - KNEE));
};

const { data: rgb, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });

for (const [name, { box, core, hole = [0, 0, 0, 0], mark = 0.33 }] of Object.entries(WORDS)) {
  const [bx, by, w, h] = box;
  // the darkest channel: ink is neutral, and it keys a warm paper best
  const L = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = ((by + y) * info.width + bx + x) * 3;
      L[y * w + x] = Math.min(rgb[p], rgb[p + 1], rgb[p + 2]);
    }
  const paper = blur(extreme(extreme(L, w, h, RADIUS, max), w, h, RADIUS, min), w, h, 4);
  const A = new Float32Array(w * h);
  const [hx, hy, hw, hh] = [hole[0] - bx, hole[1] - by, hole[2], hole[3]];
  const inHole = (i) => {
    const x = i % w;
    const y = (i / w) | 0;
    return x >= hx && x < hx + hw && y >= hy && y < hy + hh;
  };
  for (let i = 0; i < A.length; i++) A[i] = inHole(i) ? 0 : knee((paper[i] - L[i]) / Math.max(40, paper[i] - INK));

  // the word's strokes: marks reaching its core
  const [cx, cy, cw, ch] = [core[0] - bx, core[1] - by, core[2], core[3]];
  const seen = new Uint8Array(w * h);
  const keep = new Float32Array(w * h);
  for (let s = 0; s < A.length; s++) {
    if (A[s] < mark || seen[s]) continue;
    const stack = [s];
    const px = [];
    seen[s] = 1;
    let reach = false;
    while (stack.length) {
      const i = stack.pop();
      px.push(i);
      const x = i % w;
      const y = (i / w) | 0;
      if (x >= cx && x < cx + cw && y >= cy && y < cy + ch) reach = true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const X = x + dx;
        const Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const j = Y * w + X;
        if (A[j] < mark || seen[j]) continue;
        seen[j] = 1;
        stack.push(j);
      }
    }
    if (reach && px.length >= 6) for (const i of px) keep[i] = 1;
  }
  // and the dry fray round them
  const near = extreme(keep, w, h, 3, max);
  const ink = Buffer.alloc(w * h);
  for (let i = 0; i < ink.length; i++) ink[i] = Math.round(255 * (1 - (near[i] ? A[i] ** GAMMA : 0)));

  mkdirSync(`${RAW}/${name}`, { recursive: true });
  await sharp(ink, { raw: { width: w, height: h, channels: 1 } })
    .resize({ width: w * SCALE, kernel: "lanczos3" })
    .toColourspace("srgb")
    .png()
    .toFile(`${RAW}/${name}/${name}.png`);
  console.log(`${name}: ${w * SCALE}x${h * SCALE}, from the mock's ${w}x${h} at ${bx},${by}`);
}
