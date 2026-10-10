// Cut the Paper Diorama's interface paper out of its generations: the pieces
// of the original mock (art/originals/paper.webp) that register with the
// page rather than the scene, and the paper its keys and cards are cut from.
//   node scripts/kits/paper-sprites.mjs     (then: node scripts/build-kit.mjs paper)
//
// Each generation is a full 1672x941 frame on transparency, in register with
// the mock (prompts in art/prompts/paper). The generator leaves a faint alpha
// over the whole frame; each piece is kept inside its box and cleared below
// a floor, and cut to its box. That box (printed) is where
// src/app/styles/paper.css lays it on the stage, in mock px (less the kit's
// shadow pad).
//
// The foreground is drawn `extend` px taller than the frame it was cut from
// (scripts/kits/paper-quilt.mjs): the page's stage ends where its 16:9 does,
// and a taller screen would show the scene's own foreground under it, a seam
// at another scale. The extra foliage is quilted from the scene's near layer.
//
// A band that must stand taller than it was drawn (the ledge of the launch
// page, under all the shortcuts) is thickened: its middle, paper alone, is
// quilted taller between its two torn edges, so stretching it never smears
// its fibre into streaks.
//
// By night: the band at the top and the foreground are the scene's paper,
// graded as the scene is (each pixel by the ratio of the night plate to the
// day plate around it, the two in register); the interface's sheets are the
// night sheets' slate-indigo (a per-channel gain).
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { quiltDown } from "./paper-quilt.mjs";

const RAW = "art/raw/paper";
const W = 1672;
const H = 941;
const N = W * H;

/** a generation as a 1672x941 frame; the phone's (portrait) at its own scale, at the frame's top left */
const read = async (name) => {
  const file = `${RAW}/${name}/${name}.png`;
  const { width, height } = await sharp(file).metadata();
  const img = width < height
    ? sharp(file).ensureAlpha().extract({ left: 0, top: 0, width, height: Math.min(height, H) }).extend({ right: W - width, bottom: H - Math.min(height, H), background: { r: 0, g: 0, b: 0, alpha: 0 } })
    : sharp(file).resize(W, H, { fit: "fill" }).ensureAlpha();
  return (await img.raw().toBuffer({ resolveWithObject: true })).data;
};

const write = async (name, px, w = W, h = H) => {
  mkdirSync(`${RAW}/${name}`, { recursive: true });
  await sharp(px, { raw: { width: w, height: h, channels: 4 } }).png().toFile(`${RAW}/${name}/${name}.png`);
};

/** the piece inside `box` (x0, y0, x1, y1), alpha under `floor` cleared */
const keep = (src, [x0, y0, x1, y1], floor = 16) => {
  const out = Buffer.alloc(N * 4);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const p = (y * W + x) * 4;
      if (src[p + 3] < floor) continue;
      src.copy(out, p, p, p + 4);
    }
  return out;
};

/** the bounding box of what is left (where the kit's trim will cut) */
const bbox = (px) => {
  let [a, b, c, d] = [W, H, -1, -1];
  for (let i = 0; i < N; i++)
    if (px[i * 4 + 3]) {
      const x = i % W, y = (i / W) | 0;
      [a, b, c, d] = [Math.min(a, x), Math.min(b, y), Math.max(c, x), Math.max(d, y)];
    }
  return { x: a, y: b, w: c - a + 1, h: d - b + 1 };
};

/** the piece alone, cut to its box: written whole, a piece that runs to the
 *  frame's corner (the band) would defeat the kit's trim, which takes the
 *  corner pixel for the margin's colour */
const crop = (px, { x, y, w, h }) => {
  const out = Buffer.alloc(w * h * 4);
  for (let r = 0; r < h; r++) px.copy(out, r * w * 4, ((y + r) * W + x) * 4, ((y + r) * W + x + w) * 4);
  return out;
};

/** The band's right piece run on to the left, under the masthead's links
 *  (longer words than the mock's): its torn left end (the piece begins at
 *  x 1177 in the mock) moved `by` px left, and the paper between that end
 *  and the rest of the piece stretched to take up the difference, by one
 *  smooth warp of the columns, never a join: an end laid beside a copy of
 *  other paper showed as a lighter patch with a hard edge, and a band of
 *  another tone along the foot. The torn end is shifted whole (its edge,
 *  fibre and shadow as drawn); across [`from`, `to`) the columns are drawn
 *  from a source that falls back to the identity by an eased curve, so the
 *  paper there is stretched along its length by at most ~20% at the middle
 *  and not at all where it meets the end or the rest (the fibre is a fine
 *  tooth, which that does not smear). Columns left of `clear` are the left
 *  piece's tail, which keeps its place. Bilinear, premultiplied. */
const runOn = (px, { by, from, to, clear = 1100 }) => {
  const out = Buffer.alloc(N * 4);
  const at = (x, y) => (y * W + x) * 4;
  const ease = (u) => u * u * (3 - 2 * u);
  const source = (x) => (x < clear ? x : x <= from ? x + by : x < to ? x + by * (1 - ease((x - from) / (to - from))) : x);
  for (let x = 0; x < W; x++) {
    const sx = source(x);
    const [x0, f] = [Math.floor(sx), sx - Math.floor(sx)];
    const x1 = Math.min(W - 1, x0 + 1);
    for (let y = 0; y < H; y++) {
      const [pa, pb] = [at(x0, y), at(x1, y)];
      const [wa, wb] = [px[pa + 3] * (1 - f), px[pb + 3] * f];
      const total = wa + wb;
      const o = at(x, y);
      if (total <= 0) continue;
      for (let c = 0; c < 3; c++) out[o + c] = Math.round((px[pa + c] * wa + px[pb + c] * wb) / total);
      out[o + 3] = Math.round(total);
    }
  }
  return out;
};

/** `piece` (RGBA, w x h) `add` rows taller: its head (rows above `head`) and
 *  foot (the last `foot` rows, a torn edge and its shadow) kept, the paper
 *  between quilted from its own middle and the foot laid on it, blended over
 *  its first `fade` rows */
const thickened = (piece, w, h, { head, foot, add, fade = 20 }) => {
  const upper = h - foot;
  const body = quiltDown(piece, w, upper, add + fade, piece, w, { from: head, to: upper }, { tip: 0, keep: () => true, seed: 5 });
  const out = Buffer.alloc(w * (h + add) * 4);
  body.copy(out, 0, 0, w * (upper + add + fade) * 4);
  for (let y = 0; y < foot; y++)
    for (let x = 0; x < w; x++) {
      const [o, p] = [((upper + add + y) * w + x) * 4, ((upper + y) * w + x) * 4];
      const k = y < fade ? (y + 1) / (fade + 1) : 1;
      for (let c = 0; c < 4; c++) out[o + c] = Math.round(out[o + c] * (1 - k) + piece[p + c] * k);
    }
  return out;
};

const TOOTH_TINT = [1, 0.96, 0.88];

/** Zero-mean, unit-deviation noise over the frame, smoothed `r` px (a box
 *  blur twice, so ~1.15 px of smoothing for r = 1), from a seeded generator:
 *  the stuff a paper's tooth is made of. */
const grain = (seed, r) => {
  let t = seed;
  const rand = () => {
    t = (t + 0x6d2b79f5) | 0;
    let v = Math.imul(t ^ (t >>> 15), 1 | t);
    v = (v + Math.imul(v ^ (v >>> 7), 61 | v)) ^ v;
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
  const white = Float32Array.from({ length: N }, () => rand() + rand() + rand() - 1.5); // ~Gaussian
  const soft = r > 0 ? blur(white, r) : white;
  let mean = 0;
  for (let i = 0; i < N; i++) mean += soft[i];
  mean /= N;
  let variance = 0;
  for (let i = 0; i < N; i++) variance += (soft[i] - mean) ** 2;
  const deviation = Math.sqrt(variance / N);
  return Float32Array.from(soft, (v) => (v - mean) / deviation);
};

/** The paper's tone and crinkle set to the mock's: each channel scaled by
 *  `gain`, and the crinkle (detail between 2 and 12 px across, the emboss
 *  the generator leaves heavier than the mock's calm oatmeal) kept at `mid`
 *  of its strength; the finest speckle (`fine` of it) and the broad tone are
 *  kept, and a `tooth` laid on. Over the paper only (opaque pixels: an edge's
 *  soft fringe and its shadow stay as drawn), the local tone and crinkle read
 *  from the opaque paper alone, so right up to a torn edge the paper is
 *  treated as it is inside (a margin left as generated shows as a band of
 *  heavier crinkle along the edge). With `keepFringe` the pixels that are not
 *  opaque paper (the torn edge's fibre and the shadow the generator laid under
 *  it) are left exactly as generated: the local tone is read from a blur of
 *  the paper, which reaches a few px past its edge, and writing it there
 *  painted pale paper into the shadow, a translucent stair-stepped band under
 *  every torn edge (round 7, M2). `select` limits the pass to the pixels it
 *  picks, read and written: a piece of other paper on the sheet (the
 *  masthead's cloud) is not toned with the sheet (round 8). (`blur` returns
 *  its input, overwritten, so a field's two blurs below are the same array: the
 *  tone the pixel is set against is the wide one, and `mid` has no effect;
 *  `fine` keeps that share of the detail narrower than ~12 px.) */
const toned = (px, { gain = [1, 1, 1], mid = 1, fine = 1, tooth = [], keepFringe = false, select = () => true }) => {
  const out = Buffer.from(px);
  // (a tooth: noise at `r` px, `amp` levels of it, laid on the paper: warm, so
  // it reads as the fibre's own tone and not as a grey dirt)
  const grains = tooth.map(([r, amp, seed]) => [grain(seed, r), amp]);
  const solid = Float32Array.from({ length: N }, (_, i) => (px[i * 4 + 3] >= 250 && select(i) ? 1 : 0));
  const [a1, a2] = [blur(solid, 2), blur(solid, 12)];
  for (let c = 0; c < 3; c++) {
    const v = Float32Array.from({ length: N }, (_, i) => px[i * 4 + c] * solid[i]);
    const [b1, b2] = [blur(v, 2), blur(v, 12)];
    for (let i = 0; i < N; i++) {
      if (!solid[i] || !select(i) || a1[i] < 0.2 || a2[i] < 0.2) continue;
      if (keepFringe && px[i * 4 + 3] < 250) continue;
      const [low, near] = [b2[i] / a2[i], b1[i] / a1[i]];
      let x = low + mid * (near - low) + fine * (px[i * 4 + c] - near);
      for (const [g, amp] of grains) x += amp * g[i] * TOOTH_TINT[c];
      out[i * 4 + c] = Math.max(0, Math.min(255, Math.round(x * gain[c])));
    }
  }
  return out;
};

/** Value noise on a grid of `cell` px (smooth between its random nodes,
 *  -1..1), from a seeded generator. */
const noise = (seed, cell) => {
  let t = seed;
  const rand = () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  const [gw, gh] = [Math.ceil(W / cell) + 2, Math.ceil(H / cell) + 2];
  const g = Float32Array.from({ length: gw * gh }, () => rand() * 2 - 1);
  const smooth = (u) => u * u * (3 - 2 * u);
  return (x, y) => {
    const [fx, fy] = [x / cell, y / cell];
    const [ix, iy] = [Math.floor(fx), Math.floor(fy)];
    const [u, v] = [smooth(fx - ix), smooth(fy - iy)];
    const at = (i, j) => g[(iy + j) * gw + ix + i];
    return (at(0, 0) * (1 - u) + at(1, 0) * u) * (1 - v) + (at(0, 1) * (1 - u) + at(1, 1) * u) * v;
  };
};

/** A piece's silhouette roughened to a deckled edge: within a few px of its
 *  edge the picture is taken from a point moved by two scales of noise (a
 *  slow wander and a fine fray), so the straight cut becomes a torn one, its
 *  fibres carried with it; the paper inside is left as it is. */
const deckled = (px, { amp, cell, seed = 0 }) => {
  const out = Buffer.alloc(N * 4);
  const alpha = Float32Array.from({ length: N }, (_, i) => px[i * 4 + 3] / 255);
  const near = blur(alpha, 10);
  const fields = amp.map((a, k) => [a, noise(101 + k + seed, cell[k]), noise(211 + k + seed, cell[k])]);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const w = Math.min(1, near[i] / 0.08, (1 - near[i]) / 0.08);
      if (near[i] < 0.002) continue;
      let [dx, dy] = [0, 0];
      if (w > 0) for (const [a, nx, ny] of fields) [dx, dy] = [dx + w * a * nx(x, y), dy + w * a * ny(x, y)];
      // the picture at (x + dx, y + dy), bilinear and premultiplied
      const [sx, sy] = [Math.min(W - 2, Math.max(0, x + dx)), Math.min(H - 2, Math.max(0, y + dy))];
      const [x0, y0] = [Math.floor(sx), Math.floor(sy)];
      const [u, v] = [sx - x0, sy - y0];
      let [r, g, b, a] = [0, 0, 0, 0];
      for (const [ox, oy, k] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) {
        const p = ((y0 + oy) * W + x0 + ox) * 4;
        const wa = px[p + 3] * k;
        r += px[p] * wa;
        g += px[p + 1] * wa;
        b += px[p + 2] * wa;
        a += wa;
      }
      if (a > 0) {
        out[i * 4] = Math.round(r / a);
        out[i * 4 + 1] = Math.round(g / a);
        out[i * 4 + 2] = Math.round(b / a);
        out[i * 4 + 3] = Math.round(a);
      }
    }
  // (what lay beyond the displaced band is the piece's own)
  for (let i = 0; i < N; i++) if (near[i] >= 0.999) px.copy(out, i * 4, i * 4, i * 4 + 4);
  return out;
};

/** A piece's left side trimmed along a line (`edge`: points [y, x], joined
 *  straight; below the last, its x holds): what lies left of it, from `y0`
 *  down, goes, along a torn edge (a wander of `rough` px). */
const trimmedLeft = (px, { y0, edge, rough = 3 }) => {
  const out = Buffer.from(px);
  const wander = noise(7, 9);
  const xAt = (y) => {
    const k = edge.findLastIndex(([ey]) => ey <= y);
    if (k < 0) return -Infinity;
    if (k === edge.length - 1) return edge[k][1];
    const [[ya, xa], [yb, xb]] = [edge[k], edge[k + 1]];
    return xa + ((xb - xa) * (y - ya)) / (yb - ya);
  };
  for (let y = y0; y < H; y++)
    for (let x = 0; x < W; x++) if (x < xAt(y) + rough * wander(x, y)) out[(y * W + x) * 4 + 3] = 0;
  return out;
};

/** A piece's right side trimmed along a line (`edge`: points [y, x], joined
 *  straight; above the first and below the last its x holds): what lies right
 *  of it, from `y0` down, goes, along a torn edge (a wander of `rough` px),
 *  its last two px pale with the paper's fibres, as a tear shows them. */
const trimmedRight = (px, { y0, edge, rough = 3 }) => {
  const out = Buffer.from(px);
  const wander = noise(13, 9);
  const xAt = (y) => {
    const k = edge.findLastIndex(([ey]) => ey <= y);
    if (k < 0) return edge[0][1];
    if (k === edge.length - 1) return edge[k][1];
    const [[ya, xa], [yb, xb]] = [edge[k], edge[k + 1]];
    return xa + ((xb - xa) * (y - ya)) / (yb - ya);
  };
  for (let y = y0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4;
      if (!px[p + 3]) continue;
      // px past the edge (negative: inside it)
      const past = x - (xAt(y) + rough * wander(x, y));
      if (past >= 0.5) out[p + 3] = 0;
      else if (past > -2.5) {
        const fibre = (2.5 + past) / 2.5; // 0 inside the rim, 1 at the edge
        for (let c = 0; c < 3; c++) out[p + c] = Math.round(px[p + c] + (246 - px[p + c]) * 0.38 * fibre);
        out[p + 3] = Math.round(px[p + 3] * Math.min(1, 0.5 - past));
      }
    }
  return out;
};

/** per-channel gain (the night sheets' slate-indigo from the day's cream) */
const gained = (px, g) => {
  const out = Buffer.from(px);
  for (let i = 0; i < N * 4; i += 4) for (let c = 0; c < 3; c++) out[i + c] = Math.min(255, Math.round(px[i + c] * g[c]));
  return out;
};

/** separable box blur of one channel field (Float32Array), r px each way, twice */
const blur = (f, r) => {
  let a = f, b = new Float32Array(N);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < H; y++) {
      let s = 0;
      const row = y * W;
      for (let x = -r; x <= r; x++) s += a[row + Math.min(W - 1, Math.max(0, x))];
      for (let x = 0; x < W; x++) {
        b[row + x] = s / (2 * r + 1);
        s += a[row + Math.min(W - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
      }
    }
    [a, b] = [b, a];
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += a[Math.min(H - 1, Math.max(0, y)) * W + x];
      for (let y = 0; y < H; y++) {
        b[y * W + x] = s / (2 * r + 1);
        s += a[Math.min(H - 1, y + r + 1) * W + x] - a[Math.max(0, y - r) * W + x];
      }
    }
    [a, b] = [b, a];
  }
  return a;
};

/** a layer cut by scripts/kits/paper-layers.mjs, whole */
const layer = async (name) =>
  (await sharp(`${RAW}/layer-${name}/registered.png`).resize(W, H, { fit: "fill" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })).data;

// The tall pine and the mountain's peak at the top right rise in front of the
// masthead's strip in the mock (the page's strip, drawn over the scene, covers
// them): their tips, cut from the mock itself, to lie over the strip. Within
// the strip's own paper (the band generation's alpha), what stands far from
// its cream is the scene's (the pine's dark, the peak's slate); the strip's
// own shadow and fibre, and the sky below its edge, are not. Right of the
// masthead's links only (x 1524 on), and only where the mock and the scene
// register: the css shows it at 16:9.
{
  const mock = (await sharp("art/raw/originals/paper.png").resize(W, H, { fit: "fill" }).ensureAlpha().raw().toBuffer());
  const strip = await read("band-top-day");
  const cream = [0, 0, 0];
  let n = 0;
  for (let y = 6; y < 24; y++) for (let x = 1300; x < 1480; x++) { for (let c = 0; c < 3; c++) cream[c] += mock[(y * W + x) * 4 + c]; n++; }
  for (let c = 0; c < 3; c++) cream[c] /= n;
  // the strip's reach: its paper and a hand's breadth beyond its torn edge, so
  // the strip's own shadow, which falls on the bodies below it, is under them
  const reach = blur(Float32Array.from({ length: N }, (_, i) => (strip[i * 4 + 3] >= 128 ? 1 : 0)), 7);
  const m = new Float32Array(N);
  for (let y = 0; y < 135; y++)
    for (let x = 1524; x < W; x++) {
      const i = y * W + x;
      if (reach[i] < 0.02) continue;
      let d = 0;
      for (let c = 0; c < 3; c++) d += Math.abs(mock[i * 4 + c] - cream[c]);
      m[i] = Math.min(1, Math.max(0, (d - 120) / 55));
    }
  // only the three bodies (the pine, the peak, the far peak): the strip's
  // shadow at its edge and a haze of the hills are far from cream too, but
  // small and ragged
  const body = new Uint8Array(N);
  const seen = new Uint8Array(N);
  for (let start = 0; start < N; start++) {
    if (m[start] < 0.5 || seen[start]) continue;
    const comp = [start];
    seen[start] = 1;
    for (let k = 0; k < comp.length; k++) {
      const i = comp[k];
      for (const j of [i - 1, i + 1, i - W, i + W]) if (j >= 0 && j < N && m[j] >= 0.5 && !seen[j]) { seen[j] = 1; comp.push(j); }
    }
    if (comp.length >= 260) for (const i of comp) body[i] = 1;
  }
  const near = blur(Float32Array.from(body), 3); // (a few px round each, so the soft edge stays)
  const soft = blur(m, 1);
  const out = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    const a = Math.min(1, soft[i] * 1.15) * (near[i] > 0.02 ? 1 : 0) * Math.min(1, reach[i] * 40);
    if (a < 0.06) continue;
    mock.copy(out, i * 4, i * 4, i * 4 + 3);
    out[i * 4 + 3] = Math.round(a * 255);
  }
  await write("tips-src-day", out);
}

const plate = await read("plate-day");
const night = await read("plate-night");
// the night's grade of the scene, per channel, around each pixel
const ratio = [0, 1, 2].map((c) => {
  const d = blur(Float32Array.from({ length: N }, (_, i) => plate[i * 4 + c]), 10);
  const n = blur(Float32Array.from({ length: N }, (_, i) => night[i * 4 + c]), 10);
  return Float32Array.from(d, (v, i) => Math.min(1.6, n[i] / Math.max(1, v)));
});
const graded = (px) => {
  const out = Buffer.from(px);
  for (let i = 0; i < N; i++) for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.min(255, Math.round(px[i * 4 + c] * ratio[c][i]));
  return out;
};

// the night sheets' slate-indigo, from the day's cream (kit.css --plate-under
// by night, #394154, over the cream's centre)
const SLATE = [0.255, 0.31, 0.47];

// The cloud on the band's left is white paper with its own mottle, in the mock
// crisp against the cream (fibre ~2-4 px across: 4.5 levels of detail at 2 px,
// 4.9 at 4). Read through the band's pass with the cream around it, half its
// detail went and its tone with it, a soft, flat patch (3.6 and 3.9 levels).
// It is the generator's own white and mottle (4.2, 4.8), and only its tone is
// set, to the mock's (216, 207, 200) (round 8).
const CLOUD_BOX = [0, 0, 262, 92];
const isCloud = (px) => (i) => {
  const [x, y] = [i % W, (i / W) | 0];
  const [r, b] = [px[i * 4], px[i * 4 + 2]];
  return x <= CLOUD_BOX[2] && y <= CLOUD_BOX[3] && r >= 205 && r - b < 24;
};
const CLOUD_TONE = { gain: [0.982, 0.99, 0.965], fine: 1 };
/** a band's day paper: the cloud's pass and the cream's */
const bandToned = (wide) => {
  const cloud = isCloud(wide);
  const cream = toned(wide, { ...BAND_TONE, keepFringe: true, select: (i) => !cloud(i) });
  return toned(cream, { ...CLOUD_TONE, keepFringe: true, select: cloud });
};
// The masthead's band: the mock's paper there is a soft tooth with a faint
// mottle, where the generator's is a veined crinkle (swirls of fibre a few px
// across). The crinkle is held to a quarter of its strength, and the tooth
// laid on (fine grain ~1 px, a mottle ~4 px).
const BAND_TONE = { gain: [0.975, 0.97, 0.965], mid: 0.2, fine: 0.5, tooth: [[0, 3.4, 31], [1, 1.8, 33], [4, 1.8, 47]] };

// the pieces: name, generation, box in the frame, and how night takes it
const sprites = [
  // the phone's strip: the mock's torn cream strip across its top, whole
  // (paper.css lays it on the stacked masthead, scaled to its box)
  { name: "strip", src: "phone-strip-day", box: [20, 8, 905, 125], night: "slate", tone: { gain: [0.98, 0.965, 0.945], mid: 0.45 } },
  // the torn band across the top, its small cloud at the left
  // (its right piece's end run on 32px to the left, under the links)
  { name: "band", src: "band-top-day", box: [0, 0, W - 1, 150], night: "scene", runOn: { by: 32, from: 1230, to: 1510 }, tone: BAND_TONE },
  // the pine's and the peak's tips over the strip (cut above)
  { name: "tips", src: "tips-src-day", box: [1524, 0, W - 1, 135], night: "scene" },
  // its left piece alone, under the other pages' running head (their
  // scenes keep the sun and the spires at the right clear)
  { name: "band-left", src: "band-top-day", box: [0, 0, 1062, 150], night: "scene", tone: BAND_TONE },
  // the hero's two torn sheets, the lower one run on under the keys
  // (paper.css stretches its middle to the keys' foot)
  // (the lower sheet's left side is trimmed 22px back: the generation drew it
  // wider than the mock's; and its right side, which ran on past the upper
  // sheet's end, along the mock's torn diagonal: from the upper sheet's
  // corner down and in to the keys, behind which the paper runs on, as far as
  // the mock's does: its foot under "Try it live" ends at x ~650 and rises to
  // the left past the key's foot, not at 668 straight down,
  // round 8)
  // (the crinkle held to a third: the mock's paper is a fine tooth)
  {
    name: "hero",
    src: "hero-paper-day",
    box: [240, 110, 800, 440],
    night: "slate",
    trim: { y0: 303, edge: [[303, 300], [312, 322], [335, 346]], rough: 3 },
    trimRight: { y0: 238, edge: [[238, 737], [268, 737], [279, 690], [338, 586], [345, 650], [392, 650], [414, 598]], rough: 2.5 },
    tone: { mid: 0.33 },
  },
  // the window's cream mat
  { name: "mount", src: "window-mat-day", box: [740, 80, 1490, 530], night: "slate", tone: { mid: 0.33 } },
  // the scrap "Projects" is set on
  { name: "label", src: "label-projects-day", box: [20, 510, 360, 640], night: "slate", tone: { mid: 0.33 } },
  // the torn band the cards are pinned to
  // (the home's mock paper is the darker oatmeal: a gain to its mean; the launch
  // page's ledge, from the other mock, a lighter cream)
  { name: "ribbon", src: "card-band-day", box: [0, 530, W - 1, 840], night: "slate", tone: { gain: [0.95, 0.92, 0.89], mid: 0.4 } },
  // the same, thickened for the launch page's ledge, under all its shortcuts
  { name: "ledge", src: "card-band-day", box: [0, 530, W - 1, 840], night: "slate", tone: { gain: [1.03, 1.045, 1.055], mid: 0.4 }, thicken: { head: 70, foot: 70, add: 520 } },
  // the foreground over the band: leaves, flowers, rocks and the lettered stone
  { name: "foreground", src: "foreground-scene-day", box: [0, 640, W - 1, H - 1], night: "scene", extend: 420 },
];
// a piece is written beside the generations, as <name>-day and -night: never
// over one it is cut from (rerun, it would cut the piece from itself)
for (const s of sprites)
  if ([`${s.name}-day`, `${s.name}-night`].includes(s.src)) throw new Error(`${s.name}: would overwrite its generation ${s.src}`);
// the paper an extension is quilted from, per finish: the near layer's foliage
// (the lowest rows of the frame; the rocks and flowers are left out of it)
const foliage = { day: await layer("hills-near-alpenglow"), night: await layer("hills-near-night") };
// (ONLY=band,hero limits this pass to those sprites, and the torn keys' to those named, for a quick rerun while tuning)
for (const s of sprites) {
  if (process.env.ONLY && !process.env.ONLY.split(",").includes(s.name)) continue;
  const kept = keep(await read(s.src), s.box);
  const trimmed = s.trim ? trimmedLeft(kept, s.trim) : kept;
  const clipped = s.trimRight ? trimmedRight(trimmed, s.trimRight) : trimmed;
  const wide = s.runOn ? runOn(clipped, s.runOn) : clipped;
  const day = s.tone === BAND_TONE ? bandToned(wide) : s.tone ? toned(wide, { ...s.tone, keepFringe: true }) : wide;
  const b = bbox(day);
  for (const [finish, px] of [["day", day], ["night", s.night === "scene" ? graded(day) : gained(day, SLATE)]]) {
    const piece = crop(px, b);
    const grown = s.extend ? quiltDown(piece, b.w, b.h, s.extend, foliage[finish], W, { from: 800, to: H }) : s.thicken ? thickened(piece, b.w, b.h, s.thicken) : piece;
    await write(`${s.name}-${finish}`, grown, b.w, b.h + (s.extend ?? s.thicken?.add ?? 0));
  }
  console.log(`${s.name}: ${b.w}x${b.h + (s.extend ?? s.thicken?.add ?? 0)} at (${b.x}, ${b.y})`);
}

// the materials: the cream card, the cream, green and clay boards (each drawn
// large on its own), cleared to the paper itself: the soft shadow the
// generator laid round each (alpha under ~100) goes, as the kit bakes its own
// and the 9-slice puts the paper's edge on the box's
// (the cream card is smooth stock with lightly rounded corners and a soft
// deckle, as the mock's: the generation's own edge, roughened only a touch,
// and its crinkle, the generator's heavier than the mock's, held to half)
for (const [name, src, rough, tone] of [["card-cream", "card-day", { amp: [2.4, 1.1], cell: [40, 7] }, { mid: 0.5 }], ["board-cream", "tile-day"], ["board-green", "tile-signal-day"], ["board-clay", "tile-clay-day"]]) {
  const cut = keep(await read(src), [0, 0, W - 1, H - 1], 100);
  const edged = rough ? deckled(cut, rough) : cut;
  const px = tone ? toned(edged, tone) : edged;
  await write(name, px);
  const b = bbox(px);
  console.log(`${name}: ${b.w}x${b.h}`);
}

// The launch page's two keys (paper-launch.webp), and the phone's green one (paper-phone.webp), are hand-cut torn boards, not
// the home's softly rounded ones: a rectangle of paper torn along every edge
// (the fibre's pale core showing along the tear), a little off level, and the
// terracotta one lying on a cream under-sheet that shows along its foot and
// left end. Drawn in art px, twice the mock's, as the kit's own tiles are (the
// page's border-image halves them). The paper is cut from the middle of the
// materials' own generations (board-clay, board-cream) and graded to the
// mock's means; each key is four states on one canvas (normal; hover a little
// lighter; pressed a little darker; focus a groove in the ring colour just
// inside the tear), the kit baking their shadows (paper.mjs) as it does a
// tile's. By night the clay is dimmed and the cream goes to the night
// sheets' slate, as the tiles' are.
const TORN = [
  // the terracotta board (234 x 62 in the mock, its tear included: a little
  // less here, the tear's wander making up the rest) on its cream under-sheet
  {
    name: "torn-clay",
    paper: "board-clay",
    size: [232, 62],
    mean: [178, 102, 68],
    rot: 1,
    seed: 3,
    ring: [240, 226, 200],
    under: { size: [226, 58], at: [-5, 7], rot: -0.7, mean: [226, 210, 190], seed: 17 },
    night: [0.72, 0.68, 0.74],
    underNight: SLATE,
  },
  // the cream board (179 x 63 with its tear), a little lighter than the sheet it lies on,
  // on the thick card-stock edge the mock shows under its foot: a second board of the
  // stock, a shade darker where the first's shadow falls on it, standing ~4px below
  {
    name: "torn-cream",
    paper: "board-cream",
    size: [175, 57],
    mean: [235, 220, 200],
    rot: 0.7,
    seed: 9,
    ring: [79, 95, 79],
    under: { size: [172, 54], at: [-1.5, 5.5], rot: -0.4, mean: [212, 196, 174], seed: 23 },
    night: SLATE,
    underNight: SLATE.map((v) => v * 0.86),
  },
  // The phone's call to act (paper-phone.webp): the same hand-cut board as the
  // terracotta one, in the mock's mid sage green (the mock's strip measures
  // (65, 90, 74); the home's dark felt key is the other mock's), lying level,
  // with no under-sheet. Cut from the green generation, in the phone key's own
  // long shape (a 300 x 44 strip, drawn at twice the page's px: the phone's key
  // is ~311 x 42, so its middle is not stretched into streaks); the night
  // holds it a little dimmer, as the clay's.
  {
    name: "torn-green",
    paper: "board-green",
    size: [300, 44],
    mean: [66, 91, 74],
    rot: -0.5,
    seed: 41,
    ring: [240, 226, 200],
    night: [0.82, 0.86, 0.88],
  },
];

/** a `w` x `h` piece of a material's paper (the middle of its generation's
 *  board, graded to the mean colour `to`), as an opaque RGBA buffer */
const paperOf = async (name, w, h, to) => {
  const px = await read(name);
  const b = bbox(px);
  const m = 28;
  const raw = await sharp(px, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: b.x + m, top: b.y + m, width: b.w - 2 * m, height: b.h - 2 * m })
    .resize(w, h, { fit: "cover", kernel: "lanczos3" })
    .raw()
    .toBuffer();
  const mean = [0, 0, 0];
  for (let i = 0; i < w * h; i++) for (let c = 0; c < 3; c++) mean[c] += raw[i * 4 + c];
  const gain = mean.map((v, c) => to[c] / (v / (w * h)));
  for (let i = 0; i < w * h; i++) {
    for (let c = 0; c < 3; c++) raw[i * 4 + c] = Math.min(255, Math.round(raw[i * 4 + c] * gain[c]));
    raw[i * 4 + 3] = 255;
  }
  return raw;
};

/** a piece (RGBA, w x h) as a torn board on the frame: its edge displaced
 *  by two scales of noise (the tear's wander and its fray), a pale rim of
 *  fibre along it; then turned `rot` degrees clockwise. Returns the cut. */
const torn = async (rgba, w, h, { seed, rot }) => {
  const framed = Buffer.alloc(N * 4);
  const [x0, y0] = [90, 90];
  for (let y = 0; y < h; y++) rgba.copy(framed, ((y0 + y) * W + x0) * 4, y * w * 4, (y + 1) * w * 4);
  const cut = deckled(framed, { amp: [5.5, 2.3], cell: [46, 8], seed });
  // the fibre's pale core along the tear: pixels within ~3px of the edge
  const near = blur(Float32Array.from({ length: N }, (_, i) => cut[i * 4 + 3] / 255), 2);
  for (let i = 0; i < N; i++) {
    if (!cut[i * 4 + 3]) continue;
    const k = 0.5 * Math.min(1, Math.max(0, (0.995 - near[i]) / 0.5));
    if (k > 0) for (let c = 0; c < 3; c++) cut[i * 4 + c] = Math.round(cut[i * 4 + c] + (247 - cut[i * 4 + c]) * k);
  }
  const b = bbox(cut);
  const turned = await sharp(crop(cut, b), { raw: { width: b.w, height: b.h, channels: 4 } })
    .rotate(rot, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data: turned.data, w: turned.info.width, h: turned.info.height };
};

/** a cut with each channel scaled by `g` (alpha kept) */
const tintedCut = (c, g) => {
  const data = Buffer.from(c.data);
  for (let i = 0; i < data.length; i += 4) for (let k = 0; k < 3; k++) data[i + k] = Math.min(255, Math.round(data[i + k] * g[k]));
  return { ...c, data };
};

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** a cut with the focus groove: a band ~3 css px wide (6 art px), a few px
 *  inside its tear, in `color` */
const grooved = (c, color) => {
  const framed = Buffer.alloc(N * 4);
  for (let y = 0; y < c.h; y++) c.data.copy(framed, ((60 + y) * W + 60) * 4, y * c.w * 4, (y + 1) * c.w * 4);
  // blur(alpha) falls from 1 (>= 8 art px inside) to .5 at the tear; the
  // ring is where it is between ~.85 and ~.95 (a band ~4px wide, ~5px in)
  const depth = blur(Float32Array.from({ length: N }, (_, i) => framed[i * 4 + 3] / 255), 4);
  const data = Buffer.from(c.data);
  for (let y = 0; y < c.h; y++)
    for (let x = 0; x < c.w; x++) {
      const [i, j] = [(60 + y) * W + 60 + x, (y * c.w + x) * 4];
      if (data[j + 3] < 250) continue;
      const band = smooth(0.8, 0.88, depth[i]) * (1 - smooth(0.93, 0.985, depth[i]));
      if (band > 0.01) for (let k = 0; k < 3; k++) data[j + k] = Math.round(data[j + k] + (color[k] - data[j + k]) * 0.8 * band);
    }
  return { ...c, data };
};

/** the board (and its under-sheet, if it has one) laid on one canvas, the
 *  board's centre at the same place in every state (`at`: the under-sheet's
 *  centre from the board's); written as a raw for the kit */
const laidKey = async (name, board, under, at) => {
  const pieces = [{ c: board, cx: 0, cy: 0 }];
  if (under) pieces.unshift({ c: under, cx: at[0] * 2, cy: at[1] * 2 });
  const [x0, y0, x1, y1] = pieces.reduce(([a, b, c, d], { c: p, cx, cy }) => [Math.min(a, cx - p.w / 2), Math.min(b, cy - p.h / 2), Math.max(c, cx + p.w / 2), Math.max(d, cy + p.h / 2)], [1e9, 1e9, -1e9, -1e9]);
  const [cw, ch] = [Math.ceil(x1 - x0), Math.ceil(y1 - y0)];
  const canvas = sharp({ create: { width: cw, height: ch, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
  const png = await canvas
    .composite(pieces.map(({ c, cx, cy }) => ({ input: c.data, raw: { width: c.w, height: c.h, channels: 4 }, left: Math.round(cx - c.w / 2 - x0), top: Math.round(cy - c.h / 2 - y0) })))
    .png()
    .toBuffer();
  mkdirSync(`${RAW}/${name}`, { recursive: true });
  await sharp(png).toFile(`${RAW}/${name}/${name}.png`);
  return { w: cw, h: ch };
};

for (const k of TORN) {
  if (process.env.ONLY && !process.env.ONLY.split(",").includes(k.name)) continue;
  const [w, h] = k.size.map((v) => v * 2);
  const board = await torn(await paperOf(k.paper, w, h, k.mean), w, h, { seed: k.seed, rot: k.rot });
  let under = null;
  if (k.under) {
    const [uw, uh] = k.under.size.map((v) => v * 2);
    under = await torn(await paperOf("board-cream", uw, uh, k.under.mean), uw, uh, { seed: k.under.seed, rot: k.under.rot });
  }
  for (const [finish, g] of [["", [1, 1, 1]], ["night-", k.night]]) {
    const [b, u] = [tintedCut(board, g), under && tintedCut(under, finish ? k.underNight : g)];
    const ring = finish ? k.ring.map((v, c) => v * g[c]) : k.ring;
    const states = { normal: b, hover: tintedCut(b, [1.05, 1.05, 1.05]), pressed: tintedCut(b, [0.93, 0.93, 0.93]), focus: grooved(b, ring) };
    for (const [state, cut] of Object.entries(states)) {
      const box = await laidKey(`${k.name}-${finish}${state}`, cut, u, k.under?.at);
      if (state === "normal" && !finish) console.log(`${k.name}: ${box.w}x${box.h} art px (board ${w}x${h})`);
    }
  }
}

// The project page's tacks (paper-project.webp) are polished brass push-pins,
// not the cards' dull bronze: a dome with a hard specular at the upper right
// and a crescent of rim light below, ~35px across. The mock's own (the one
// that holds the tape, at (152, 152), on plain paper), cut out as a disc with
// a soft edge, and raised to twice its size for a screen of more pixels (the
// kit adds its shadow). A prop of its own (paper.mjs).
{
  const R = 17.5; // the head's radius in the mock's px
  const [cx, cy, size] = [152.3, 151.8, 40];
  const crop = await sharp("art/originals/paper-project.webp").extract({ left: Math.round(cx - size / 2), top: Math.round(cy - size / 2), width: size, height: size }).ensureAlpha().raw().toBuffer();
  const [ox, oy] = [cx - Math.round(cx - size / 2), cy - Math.round(cy - size / 2)];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - ox, y + 0.5 - oy);
      crop[(y * size + x) * 4 + 3] = Math.round(255 * Math.min(1, Math.max(0, R + 0.5 - d)));
    }
  const big = await sharp(crop, { raw: { width: size, height: size, channels: 4 } }).resize({ width: size * 2, kernel: "lanczos3" }).png().toBuffer();
  mkdirSync(`${RAW}/pin-push`, { recursive: true });
  await sharp(big).trim({ threshold: 1 }).png().toFile(`${RAW}/pin-push/pin-push.png`);
  console.log("pin-push: cut from the project mock");
}

// The phone mock's tack (paper-phone.webp) is polished copper where the cards'
// are dull bronze: the bronze head of the same generation, warmed and lifted
// toward the mock's (~#8e6631 mean, the glint over it), with a soft glint where
// the light meets it, upper left. A prop of its own (paper.mjs), 64px heads as
// the kit's other tacks.
{
  const trimmed = await sharp(`${RAW}/pins/pins.png`).trim({ threshold: 1 }).png().toBuffer();
  const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const on = (x) => {
    for (let y = 0; y < info.height; y++) if (data[(y * info.width + x) * 4 + 3] > 24) return true;
    return false;
  };
  const first = [...Array(info.width).keys()].find(on);
  const last = [...Array(info.width).keys()].find((x) => x > first && !on(x)) - 1; // the bronze head is the first of four
  const head = await sharp(trimmed).extract({ left: first, top: 0, width: last - first + 1, height: info.height }).trim({ threshold: 1 }).resize({ width: 64 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [w, h] = [head.info.width, head.info.height];
  const gain = [1.42, 1.3, 0.9];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      if (!head.data[p + 3]) continue;
      // a glint, round and soft, a third in from the head's upper left
      const d2 = ((x - w * 0.36) / (w * 0.2)) ** 2 + ((y - h * 0.32) / (h * 0.15)) ** 2;
      const glint = 0.42 * Math.exp(-d2);
      for (let c = 0; c < 3; c++) head.data[p + c] = Math.min(255, Math.round(head.data[p + c] * gain[c] + (255 - head.data[p + c] * gain[c]) * glint));
    }
  await write("pin-copper", head.data, w, h);
  console.log(`pin-copper: ${w}x${h}`);
}
