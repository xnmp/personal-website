// The cards' seal, as a blank and a grain (the glyph is live text):
//   node scripts/kits/sumi-seal.mjs     (then: node scripts/build-kit.mjs sumi)
//
// A card's seal stamps its project's one character (`--glyph`, from
// src/data/projects.ts), so no per-character art can exist: a project
// added later would have none. The seal is cut into what is the same for
// every project and what is not.
//
//   seal-blank   the frame alone: the cinnabar paste's rounded border with
//                its worn, bumpy edge, lifted off the white like every ink
//                (scripts/kits/sumi.mjs `inks`). It is the frame of the first
//                generated seal (art/raw/sumi/seal-shu, 書) with the
//                character taken out: the frame is the largest piece of ink
//                on the sheet, so it is the piece kept, and the character's
//                strokes (the rest) are not.
//   seal-grain   the paste's own wear, as a mask: the lifted seals' paste is
//                about 0.87 opaque, its tone moving a few hundredths from
//                point to point, with a rare fleck where the paste thinned.
//                Laid over the live character (sumi.css .card-mark::after),
//                it prints the character as the frame is printed. Written
//                here directly (it is an alpha, not an ink on white), one
//                sprite px to a texel (the sprite 160 px across is 31/88 of
//                that across the frame), tiling seamlessly.
//
// The character's face is Sumi's seal face (src/app/fonts.ts).
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const RAW = "art/raw/sumi";
const OUT = "public/kit/sumi";

// ---------- the blank ----------
const SRC = `${RAW}/seal-shu/seal-shu.png`;
// ink: how far from white a pixel stands (in its darkest channel) to belong to
// a piece; grow: the px kept round the frame, for its soft edge
const INK = 60;
const GROW = 4;

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const on = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) on[i] = 255 - Math.min(data[3 * i], data[3 * i + 1], data[3 * i + 2]) > INK ? 1 : 0;

// the pieces of ink (8-connected), the biggest by its box the frame
const label = new Int32Array(W * H);
const pieces = [];
const stack = [];
for (let s = 0; s < W * H; s++) {
  if (!on[s] || label[s]) continue;
  const id = pieces.length + 1;
  const box = { id, x0: W, y0: H, x1: 0, y1: 0 };
  stack.push(s);
  label[s] = id;
  while (stack.length) {
    const p = stack.pop();
    const [x, y] = [p % W, (p / W) | 0];
    box.x0 = Math.min(box.x0, x);
    box.x1 = Math.max(box.x1, x);
    box.y0 = Math.min(box.y0, y);
    box.y1 = Math.max(box.y1, y);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const [nx, ny] = [x + dx, y + dy];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = ny * W + nx;
        if (on[q] && !label[q]) {
          label[q] = id;
          stack.push(q);
        }
      }
  }
  pieces.push(box);
}
const frame = pieces.reduce((a, b) => ((b.x1 - b.x0) * (b.y1 - b.y0) > (a.x1 - a.x0) * (a.y1 - a.y0) ? b : a));

// the frame grown by GROW px (a separable max), the rest of the sheet white
const own = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) own[i] = label[i] === frame.id ? 1 : 0;
const grow = (src, r) => {
  const a = new Uint8Array(W * H);
  const b = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let v = 0;
      for (let k = Math.max(0, x - r); k <= Math.min(W - 1, x + r) && !v; k++) v = src[y * W + k];
      a[y * W + x] = v;
    }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let v = 0;
      for (let k = Math.max(0, y - r); k <= Math.min(H - 1, y + r) && !v; k++) v = a[k * W + x];
      b[y * W + x] = v;
    }
  return b;
};
const keep = grow(own, GROW);
const blank = Buffer.alloc(W * H * 3, 255);
for (let i = 0; i < W * H; i++) if (keep[i]) for (let j = 0; j < 3; j++) blank[3 * i + j] = data[3 * i + j];
mkdirSync(`${RAW}/seal-blank`, { recursive: true });
await sharp(blank, { raw: { width: W, height: H, channels: 3 } }).png().toFile(`${RAW}/seal-blank/seal-blank.png`);
console.log(`seal-blank: frame ${frame.x1 - frame.x0 + 1}x${frame.y1 - frame.y0 + 1} of ${pieces.length} pieces, ${RAW}/seal-blank/seal-blank.png`);

// ---------- the grain ----------
const N = 160;
// the lifted seals' paste: its mean opacity and how it moves about it
const MEAN = 0.87;
const FINE = 0.036; // sd of the texel-to-texel tone
const MOTTLE = 0.018; // sd of the slower drift over a few texels
const FLECKS = 0.0035; // share of texels where the paste thinned
const FLECK_DEPTH = 0.55;

/** a deterministic generator, so a rebuild changes nothing */
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = rng(0x5ea1);
/** roughly gaussian, unit sd (a sum of uniforms) */
const gauss = () => (rand() + rand() + rand() + rand() - 2) * Math.sqrt(3);
/** a wrapped box blur, radius r, so the tile has no seam */
const blurWrap = (src, r) => {
  const a = new Float32Array(N * N);
  const b = new Float32Array(N * N);
  const m = (v) => ((v % N) + N) % N;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += src[y * N + m(x + k)];
      a[y * N + x] = s / (2 * r + 1);
    }
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += a[m(y + k) * N + x];
      b[y * N + x] = s / (2 * r + 1);
    }
  return b;
};
/** the field rescaled to zero mean and unit sd */
const unit = (f) => {
  const mean = f.reduce((s, v) => s + v, 0) / f.length;
  const sd = Math.sqrt(f.reduce((s, v) => s + (v - mean) ** 2, 0) / f.length);
  return f.map((v) => (v - mean) / sd);
};
const white = () => Float32Array.from({ length: N * N }, gauss);
const fine = unit(blurWrap(white(), 1));
const slow = unit(blurWrap(white(), 4));
const alpha = new Float32Array(N * N);
for (let i = 0; i < N * N; i++) alpha[i] = MEAN + FINE * fine[i] + MOTTLE * slow[i];
for (let i = 0; i < N * N; i++) {
  if (rand() >= FLECKS) continue;
  // a fleck is a texel or two, the paste thinned most at its middle
  const [x, y] = [i % N, (i / N) | 0];
  const [w, h] = [1 + (rand() < 0.5 ? 1 : 0), 1 + (rand() < 0.35 ? 1 : 0)];
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++) alpha[((y + dy) % N) * N + ((x + dx) % N)] -= FLECK_DEPTH * (0.6 + 0.4 * rand());
}
const px = Buffer.alloc(N * N * 4, 255);
for (let i = 0; i < N * N; i++) px[4 * i + 3] = Math.round(255 * Math.min(1, Math.max(0, alpha[i])));
// lossless: a lossy alpha would smooth the very grain this is
await sharp(px, { raw: { width: N, height: N, channels: 4 } }).webp({ lossless: true, alphaQuality: 100, exact: true }).toFile(`${OUT}/seal-grain.webp`);
console.log(`seal-grain: ${N}x${N}, mean alpha ${(px.reduce((s, v, i) => s + (i % 4 === 3 ? v : 0), 0) / (N * N) / 255).toFixed(3)}, ${OUT}/seal-grain.webp`);
