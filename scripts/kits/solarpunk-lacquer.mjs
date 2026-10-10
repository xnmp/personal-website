// The cards' face: the mock's plaque is dark, near-opaque mossy enamel
// (about rgb 35-45 under the title), the scene only faintly through it, moss
// mottled along its foot and one faint catch of sun at the upper right. It is
// built from the lacquer generation (art/raw/solarpunk/lacquer), which already
// carries the leaf-shadow and the sun at its upper right:
//   1. pulled a little toward grey (the mock's enamel is an olive smoke, the
//      generation's a bottle green; round 5 pulled it by a third, which read
//      as grey smoke beside the mock's deep green, so now by a seventh: the
//      sun's catch keeps its warmth) and darkened, its sun compressed to a
//      faint catch (a knee: what lies above it is carried at a third);
//   2. warm light leaks: a few soft gold dapples over the upper half, where
//      the mock's sun comes through the leaves;
//   3. moss along the foot: soft olive blotches (two octaves of noise) that
//      grow over the last fifth of the face;
//   4. laid at 0.96 alpha, so the scene shows only faintly.
// The page stretches it over two cards (the sun falls on every other one), so
// the foot is the cards' foot. Writes art/raw/solarpunk/lacquer-enamel/lacquer-enamel.png.
//   node scripts/kits/solarpunk-lacquer.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const [ALPHA, GREY, GAIN, KNEE, ABOVE] = [0.96, 0.14, 0.82, 72, 0.34];
const COOL = [4, 5, 11]; // the mock's upper half is a shade bluer (leaf shadow on glass): added there, fading by 40%
const LEAK = [168, 140, 60]; // a dapple of sun through leaves, as the mock's: gold, laid thin over the upper half
const LEAK_UNTIL = 0.55; // as a share of the face's height
const MOSS = [84, 80, 32]; // the mock's foot band: about (51-61, 49-58, 25-28) under the brass
const MOSS_FROM = 0.68; // where the moss begins, as a share of the face's height

// a seeded PRNG, so the face is the same on every build
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const { data, info } = await sharp("art/raw/solarpunk/lacquer/lacquer.png").removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

// one octave of smooth noise at W / cell cells across, as a Float32 field
async function octave(cell, seed) {
  const [w, h] = [Math.ceil(W / cell), Math.ceil(H / cell)];
  const r = rng(seed);
  const small = Buffer.alloc(w * h);
  for (let i = 0; i < small.length; i++) small[i] = Math.floor(r() * 256);
  const big = await sharp(small, { raw: { width: w, height: h, channels: 1 } })
    .resize({ width: W, height: H, kernel: "cubic" })
    .toColourspace("b-w") // (a resize hands back three channels)
    .raw()
    .toBuffer();
  return big;
}
const [coarse, fine] = await Promise.all([octave(34, 7), octave(11, 19)]);

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const knee = (v) => (v < KNEE ? v : KNEE + (v - KNEE) * ABOVE);

const out = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) {
  const foot = smooth(MOSS_FROM, 0.97, y / H);
  const cool = 1 - smooth(0, 0.4, y / H);
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const o = i * 4;
    const l = 0.3 * data[i * 3] + 0.59 * data[i * 3 + 1] + 0.11 * data[i * 3 + 2];
    // blotches: the coarse octave carries them, the fine breaks their edges;
    // only the upper part of the noise's range grows moss
    const n = (coarse[i] * 0.65 + fine[i] * 0.35) / 255;
    const moss = foot * smooth(0.25, 0.8, n) * 0.95;
    // dapples: only the finer octave's highest crests, so they are specks and small
    // patches, not clouds
    const leak = (1 - smooth(0.1, LEAK_UNTIL, y / H)) * smooth(0.62, 0.9, fine[i] / 255) * smooth(0.35, 0.7, coarse[i] / 255) * 0.26;
    for (let k = 0; k < 3; k++) {
      let c = knee((data[i * 3 + k] + (l - data[i * 3 + k]) * GREY) * GAIN) + COOL[k] * cool;
      c += (LEAK[k] - c) * leak;
      out[o + k] = Math.round(c + (MOSS[k] - c) * moss);
    }
    out[o + 3] = Math.round(255 * ALPHA);
  }
}
mkdirSync("art/raw/solarpunk/lacquer-enamel", { recursive: true });
await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile("art/raw/solarpunk/lacquer-enamel/lacquer-enamel.png");
console.log("lacquer-enamel written");
