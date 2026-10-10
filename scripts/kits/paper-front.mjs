// Cut the launch page's foreground: the pieces of cut paper that stand in
// FRONT of its sheets in the mock (art/originals/paper-launch.webp), each a
// whole piece of its own, registered to the page's stage rather than to the
// scene:
//   hiker        the hiker in the orange jacket, his dog, and the brown rock
//                they stand on (with the grey stone at its end): the mock's
//                pixels, cut by colour
//   pines-left   the pines at the left edge, from the tip of the tallest to
//                their trunks' flat cut bases
//   pines-right  the pines at the right edge, the same
// The page lays them over the shortcuts ledge (paper.css, the ledge section's
// `::after`), where the mock has them, in `--u`; they scroll with the sheets
// they stand beside, and the scene's own layers (cleared of the same figures
// by scripts/kits/paper-pages.mjs) slide on behind them, so no scene
// registration is needed at any shape of screen. Each is lit by the kit with
// its own soft cast shadow (scripts/kits/paper.mjs).
//   node scripts/kits/paper-front.mjs        (then: node scripts/build-kit.mjs paper)
//
// The mock ends at its frame's foot (y 941) with the pines still going, and
// the page goes on below it. The pines are therefore the mock's, completed:
// art/raw/paper/pines-feet-b is an edit of the mock's own pines (cut by
// colour onto flat cream, in the file's top corners; prompt in
// art/prompts/paper/pines-feet.txt) that carries each one down to its
// own trunk and a flat scissor-cut base. It leaves the visible part where it
// was (the silhouettes agree to ~98%), so the first screen is the mock's.
// A pine is its pixels over cream, keyed by how dark and green they are (the
// cream's soft shadow is lighter than any pine and is not kept: the kit casts
// the shadow).
//
// The hiker's rock is cut where the mock's ledge cuts it (the ledge's torn
// edge is the rock's lower edge in the mock, where the ledge lies in front of
// it). Here the rock lies on the ledge, so its foot is carried a few px
// below that edge (its last rows reflected), over the ledge's own edge, which
// the page's ledge sprite registers to within a few px.
//
// Reads art/originals/paper-launch.webp, art/raw/paper/launch-plate-night
// (the night's colours, in register), the left layer of the launch scene (to
// bound the cut to the removal's own region), art/raw/paper/pines-feet-b.
// Writes art/raw/paper/launch-stage-<hiker|pines-left|pines-right>-<day|night>/
// <id>.png (trimmed; its place in the mock's px printed).
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { W, H, N, blur, components } from "./paper-cut.mjs";

const RAW = "art/raw/paper";
const rgba = async (file) => await sharp(file).resize(W, H, { fit: "fill" }).ensureAlpha().raw().toBuffer();
const grow = (m, r) => Uint8Array.from(blur(Float32Array.from(m), r, 1), (v) => (v > 0.001 ? 1 : 0));
const shrink = (m, r) => Uint8Array.from(blur(Float32Array.from(m), r, 1), (v) => (v > 0.999 ? 1 : 0));

const [mock, plateNight, layer, gen] = await Promise.all([
  rgba("art/originals/paper-launch.webp"),
  rgba(`${RAW}/launch-plate-night/launch-plate-night.png`),
  rgba(`${RAW}/layer-pines-left-launch-day/registered.png`),
  rgba(`${RAW}/pines-feet-b/pines-feet-b.png`),
]);

const trim = (rgb, alpha) => {
  let [x0, y0, x1, y1] = [W, H, -1, -1];
  for (let i = 0; i < N; i++)
    if (alpha[i] > 4) [x0, y0, x1, y1] = [Math.min(x0, i % W), Math.min(y0, (i / W) | 0), Math.max(x1, i % W), Math.max(y1, (i / W) | 0)];
  const [w, h] = [x1 - x0 + 1, y1 - y0 + 1];
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y0 + y) * W + x0 + x, o = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) out[o + c] = rgb[i * 4 + c];
      out[o + 3] = alpha[i];
    }
  return { out, w, h, x0, y0 };
};

/** the colour of a piece's edge pixels from its inside: the mask's own edge
 *  carries a fringe of what lay behind it (the cream, the hill), so each
 *  pixel under `core` (alpha 1) keeps its colour and the rest take the
 *  nearest inside's, a normalised blur of it */
const bleed = (src, core, alpha) => {
  const out = Buffer.from(src);
  const w = Float32Array.from(core);
  const sw = blur(w, 3, 2);
  const ch = [0, 1, 2].map((c) => blur(Float32Array.from({ length: N }, (_, i) => w[i] * src[i * 4 + c]), 3, 2));
  for (let i = 0; i < N; i++) {
    if (core[i] || !alpha[i] || sw[i] < 0.01) continue;
    for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.round(ch[c][i] / sw[i]);
  }
  return out;
};

const emit = async (name, finish, rgb, alpha, dy = 0) => {
  const { out, w, h, x0, y0 } = trim(rgb, alpha);
  const id = `launch-stage-${name}-${finish}`;
  mkdirSync(`${RAW}/${id}`, { recursive: true });
  await sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toFile(`${RAW}/${id}/${id}.png`);
  console.log(`${id}: ${w}x${h} at (${x0}, ${y0 + dy})`);
};

// ---- the hiker, his dog and their rock ------------------------------------

const warm = (r, g, b) => r - b >= 20 && r >= g + 6 && b < 165; // rock, jacket, pack, dog, skin (not the sheet's cream)
const inBox = (x, y, [x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const FIG = [118, 520, 205, 700], DOG = [190, 620, 285, 700], ROCK = [0, 664, 372, 760];
// (the hill chips beside him and the spruce's boughs are not his: within the
// removal's own region, grown 2px)
const region = grow(Uint8Array.from({ length: N }, (_, i) => (layer[i * 4 + 3] > 128 ? 1 : 0)), 2);

const hikerMask = () => {
  const on = new Uint8Array(N);
  for (let y = 500; y < 780; y++)
    for (let x = 0; x < 400; x++) {
      const i = y * W + x;
      if (!region[i]) continue;
      const [r, g, b] = [mock[i * 4], mock[i * 4 + 1], mock[i * 4 + 2]], s = r + g + b;
      let k = false;
      if (inBox(x, y, FIG)) k = warm(r, g, b) || (s < 235 && (b >= g - 2 || s < 90)); // hair, trousers, boots
      else if (inBox(x, y, DOG)) k = warm(r, g, b) || s < 160;
      if (!k && inBox(x, y, ROCK)) k = s < 520 && r - b >= 14 && r - g >= 7; // the rock, and the grey stone
      on[i] = k ? 1 : 0;
    }
  const m = Uint8Array.from(blur(Float32Array.from(on), 1, 1), (v) => (v > 0.45 ? 1 : 0));
  components(m, (px) => px.length < 400 && px.forEach((i) => (m[i] = 0)));
  const off = Uint8Array.from(m, (v) => 1 - v);
  components(off, (px) => px.length < 60 && px.forEach((i) => (m[i] = 1)));
  return m;
};

const FOOT = 7; // px of rock carried below the mock's ledge edge
const hiker = async () => {
  const m = hikerMask();
  // the rock's foot: each column's last rows reflected below it
  const rgb = Buffer.from(mock);
  const night = Buffer.from(plateNight);
  const mask = Uint8Array.from(m);
  for (let x = 0; x < 380; x++) {
    let yb = -1;
    for (let y = 760; y >= 664; y--) if (m[y * W + x]) { yb = y; break; }
    if (yb < 0) continue;
    // (the ledge's pale fibres ride along the rock's last rows: the foot starts above them)
    const pale = (y) => mock[(y * W + x) * 4] + mock[(y * W + x) * 4 + 1] + mock[(y * W + x) * 4 + 2] > 430;
    while (yb > 664 && (pale(yb) || pale(yb - 1) || pale(yb - 2))) yb--;
    yb -= 1;
    for (let y = yb + 1; y < 770; y++) mask[y * W + x] = 0;
    for (let k = 1; k <= FOOT + 3; k++) {
      const [d, s] = [(yb + k) * W + x, Math.max(664, yb - k) * W + x];
      for (let c = 0; c < 4; c++) { rgb[d * 4 + c] = mock[s * 4 + c]; night[d * 4 + c] = plateNight[s * 4 + c]; }
      mask[d] = 1;
    }
  }
  // the edge: ~1px of softness, colours from the inside
  const core = shrink(mask, 1);
  const alpha = Uint8Array.from(blur(Float32Array.from(mask), 1, 1), (v) => Math.round(Math.min(1, Math.max(0, (v - 0.25) / 0.5)) * 255));
  const opaque = Uint8Array.from(alpha, (v, i) => (v === 255 && core[i] ? 1 : 0));
  await emit("hiker", "day", bleed(rgb, opaque, alpha), alpha);
  await emit("hiker", "night", bleed(night, opaque, alpha), alpha);
};

// ---- the pines --------------------------------------------------------------

const S = 590; // the pines were drawn S px up the frame (the generation's canvas y = the mock's y - S)
const PINES = [
  { name: "pines-left", box: [0, 10, 340, 560] },
  { name: "pines-right", box: [1370, 120, W - 1, 560] },
];

/** how much of a generated pixel is pine paper rather than the cream (its soft shadow is lighter than any pine) */
const pineAlpha = (i) => {
  const [r, g, b] = [gen[i * 4], gen[i * 4 + 1], gen[i * 4 + 2]];
  // (the tallest pine's tip stands among the pale chips of the hill it was cut from: only its own dark paper counts there)
  if (i % W < 90 && i < 90 * W && (r + g + b > 262 || g - b > 15)) return 0;
  // (the shadow is the cream's own warm hue, darkened: a pine's is the neutral green)
  const a = Math.min(1, Math.max(0, (500 - (r + g + b)) / 160)) * Math.min(1, Math.max(0, (g - r + 16) / 10));
  // (a contrast on it: the shadow's last speckle drops out, a pine's edge stays crisp)
  return Math.min(1, Math.max(0, (a - 0.35) / 0.4));
};

const pines = async () => {
  // the night's grade of the spruce: the plates' ratio over the tallest pine's body
  const [sd, sn] = [[0, 0, 0], [0, 0, 0]];
  for (let y = 700; y < 940; y++)
    for (let x = 0; x < 110; x++) {
      const i = y * W + x, s = mock[i * 4] + mock[i * 4 + 1] + mock[i * 4 + 2];
      if (s < 245 && mock[i * 4 + 1] >= mock[i * 4] - 6)
        for (let c = 0; c < 3; c++) [sd[c], sn[c]] = [sd[c] + mock[i * 4 + c], sn[c] + plateNight[i * 4 + c]];
    }
  const grade = sn.map((v, c) => v / sd[c]);
  console.log("night grade of the pines", grade.map((v) => v.toFixed(3)).join(" "));
  for (const { name, box: [x0, y0, x1, y1] } of PINES) {
    const a = new Uint8Array(N);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) a[y * W + x] = Math.round(pineAlpha(y * W + x) * 255);
    // specks of the cream's grain, and the stray bits the generation left
    const on = Uint8Array.from(a, (v) => (v > 128 ? 1 : 0));
    components(on, (px) => px.length < 300 && px.forEach((i) => (a[i] = 0)));
    const core = Uint8Array.from(a, (v) => (v === 255 ? 1 : 0));
    const day = bleed(gen, core, a);
    const nightRgb = Buffer.from(day);
    for (let i = 0; i < N; i++) for (let c = 0; c < 3; c++) nightRgb[i * 4 + c] = Math.min(255, Math.round(day[i * 4 + c] * grade[c]));
    // (the piece stands S px lower in the mock's frame than it was drawn)
    await emit(name, "day", day, a, S);
    await emit(name, "night", nightRgb, a, S);
  }
};

await hiker();
await pines();
