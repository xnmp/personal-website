// Cut the Paper Diorama's scene layers out of its plate (the original mock
// with the interface painted out), so the settled scene is the plate (with
// the mock's own detail) and the layers still pop up and slide over one another.
//   node scripts/kits/paper-layers.mjs        (then: node scripts/build-kit.mjs paper)
//
// Reads art/raw/originals/paper.png (the mock) and art/raw/paper (prompts in
// art/prompts/paper):
//   plate-day, plate-night        the scene by day, and an edit of it by night
//                                 (a recolouring, so the two register)
//   remove-<layer>                the plate with one depth band taken out and
//                                 what lies behind it continued: full-frame
//                                 edits, which keep the rest of the picture in
//                                 register to the pixel, so where one differs
//                                 from the plate is exactly that band
//   layer-sky-day                 the sky alone, the band at the top taken out
//   layer-hills-far-day           the green ridges and the valley, continued
//                                 down behind the foreground
//   layer-hills-near-day          the foreground hills, whole (its alpha is
//                                 the band's outline)
//   band-top-day                  the torn band across the top (a sprite on
//                                 the page: the sky is left without it)
// Writes art/raw/paper/layer-<raw>-<finish>/registered.png, the frames
// scripts/build-kit.mjs takes for scripts/kits/paper.mjs `scene.layers`.
//
// How a layer is cut: every pixel of the plate is labelled with the nearest
// band that shows there (each band's mask is where its removal differs from
// the plate, cleaned of specks and holes, nearest first; the far bands are
// opaque from their outline down). A band carries the plate's own pixels
// (with the mock's detail, below) where it shows, so the settled layers
// composite to that picture exactly, and its edge is the plate's: a hard cut
// between two of the plate's pixels, so no fringe of what lies behind rides
// along with it. Where something nearer covers it, it carries what the nearer
// band's removal shows behind that band, so a band that sinks or rises
// uncovers the scene continued, not a hole (that continuation is the
// generator's, so it is not in register to the pixel: a layer slid far enough
// shows a seam or two along the mountains). By night the labels are the day's; the colours where a band
// shows are the night plate's, and its hidden parts are the day's fills
// graded by that band's own day-to-night ratio.
//
// Two things keep the scene as crisp as the mock. The plate is a generation,
// softer than the mock it was painted from; where the scene shows in the mock
// (nothing of the interface over it; the two register to the pixel there),
// the plate takes the mock's own fine detail (its high frequencies, over the
// plate's colour, so the plate and its edits still agree), by night scaled by
// the night's grade. And the page shows each layer through two resamplings:
// scripts/build-kit.mjs frames it at 1920x1080 from these 1672x941 cuts, and
// the browser scales that frame back to the screen (bilinear), which takes
// off the finest octave; every frame is sharpened once here, on the whole
// opaque picture, to give it back.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { W, H, N, blur, components, distance, solid } from "./paper-cut.mjs";

const RAW = "art/raw/paper";

const rgb = async (name, file = name, path = `${RAW}/${name}/${file}.png`) => {
  const { data } = await sharp(path).resize(W, H, { fit: "fill" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return data;
};

// back to front, as kit.css stacks them (sky, far, mid, near, left-back,
// right-back, left, right), with the raws' names in scripts/kits/paper.mjs
const SKY = 0, FAR = 1, MID = 2, NEAR = 3, GL = 4, GR = 5, LEFT = 6, RIGHT = 7;
const NAMES = ["sky", "mountains", "hills-far", "hills-near", "pines-left-back", "pines-right-back", "pines-left", "pines-right"];

const plate = await rgb("plate-day");
const night = await rgb("plate-night");
const removed = {
  [FAR]: await rgb("remove-far"),
  [MID]: await rgb("remove-mid"),
  [GL]: await rgb("remove-grove-left"),
  [GR]: await rgb("remove-grove-right"),
  [LEFT]: await rgb("remove-left"),
  [RIGHT]: await rgb("remove-right"),
};
const genSky = await rgb("layer-sky-day");
const genMid = await rgb("layer-hills-far-day");
const genNear = await rgb("layer-hills-near-day");
const band = await rgb("band-top-day");

/** how far an edit's colour stands from the plate's, inside `roi` (see distance) */
const dist = (img, roi) => distance(plate, img, roi);

// each band's outline, nearest first (regions of interest read off the plate)
const mask = new Array(8);
mask[RIGHT] = solid(dist(removed[RIGHT], [1180, 220, W - 1, H - 1]), 70, 400, 6000);
mask[LEFT] = solid(dist(removed[LEFT], [0, 290, 520, H - 1]), 70, 400, 6000);
// the right grove's removal also took the slate peak behind it: only the
// green and wood of the plate are the grove, the slate stays in the mountains
mask[GR] = solid(
  Float32Array.from(dist(removed[GR], [1280, 0, W - 1, 760]), (v, i) => (plate[i * 4 + 1] >= plate[i * 4 + 2] - 6 ? v : 0)),
  70, 400, 6000,
);
mask[GL] = solid(dist(removed[GL], [0, 0, 330, 640]), 70, 400, 6000);
// a hole in the right band that opens only onto the frame's foot is a gap in
// the removal's difference (the leaves there match the plate), not a gap in
// the band, and `solid` leaves it open: a square notch in the layer's foot
// (round 8, M3), seen when the band slides
components(Uint8Array.from(mask[RIGHT], (v) => 1 - v), (px) => {
  const [foot, side] = [px.some((i) => i >= N - W), px.some((i) => i % W === 0 || i % W === W - 1 || i < W)];
  if (px.length < 1500 && foot && !side) px.forEach((i) => (mask[RIGHT][i] = 1));
});
mask[NEAR] = Uint8Array.from({ length: N }, (_, i) => (genNear[i * 4 + 3] > 127 ? 1 : 0));
mask[MID] = solid(dist(removed[MID], [0, 200, W - 1, 800]), 70, 3000, 40000);
mask[FAR] = solid(dist(removed[FAR], [0, 60, W - 1, 520]), 70, 3000, 40000);

// The lettered stone (bottom right) and the torn band (top) are sprites on
// the page, laid over the interface: the scene is cut without them. The
// stone goes from the signpost's band to the foreground hills, coloured as
// its removal continues them; the sky under the band is the generated sky.
//
// Its outline is the stone's own, found by its colour (the plate's stone-pink
// paper, right of the mid boulder, opened so the boulder's tip, which touches
// it, stays out; closed over the stone's cracks). It was once every pixel of
// the right band right of x 1460 and under y 730: a straight vertical cut
// through the leaves and the mid boulder, which showed as a hard edge once
// the page had scrolled the sprite away (round 8, M3).
const stonePx = (() => {
  const grow = (m, r) => Uint8Array.from(blur(Float32Array.from(m), r, 1), (v) => (v > 0.001 ? 1 : 0));
  const shrink = (m, r) => Uint8Array.from(blur(Float32Array.from(m), r, 1), (v) => (v > 0.999 ? 1 : 0));
  const pink = new Uint8Array(N);
  for (let y = 730; y < H; y++)
    for (let x = 1440; x < W; x++) {
      const i = y * W + x, p = i * 4;
      if (mask[RIGHT][i] && plate[p] >= 110 && plate[p] - plate[p + 2] >= 18 && plate[p] >= plate[p + 1] + 8) pink[i] = 1;
    }
  const core = new Uint8Array(N);
  const seed = 880 * W + 1620;
  const opened = shrink(pink, 4);
  components(opened, (px) => px.includes(seed) && px.forEach((i) => (core[i] = 1)));
  // grown back over the stone's own pixels, closed over its cracks and
  // lettering, and 2px past its edge (its dark rim)
  const back = grow(core, 5);
  const whole = new Uint8Array(N);
  for (let i = 0; i < N; i++) whole[i] = back[i] & pink[i];
  const closed = shrink(grow(whole, 4), 4);
  // (only the stone itself: a patch of pink leaf-vein at its foot is not it)
  const fin = new Uint8Array(N);
  components(grow(closed, 2), (px) => px.includes(seed) && px.forEach((i) => (fin[i] = mask[RIGHT][i])));
  // and the specks of the right band the stone leaves floating over its edge
  const rest = new Uint8Array(N);
  for (let y = 730; y < H; y++)
    for (let x = 1440; x < W; x++) {
      const i = y * W + x;
      if (mask[RIGHT][i] && !fin[i]) rest[i] = 1;
    }
  components(rest, (px) => {
    const free = px.every((i) => i % W < W - 1 && i < N - W);
    if (px.length < 1500 && free) px.forEach((i) => (fin[i] = 1));
  });
  return fin;
})();
const stone = (i) => stonePx[i] === 1;
const underBand = blur(Float32Array.from({ length: N }, (_, i) => (band[i * 4 + 3] > 24 ? 1 : 0)), 6, 1);
const nearer = (k, i) => {
  for (let j = k + 1; j < 8; j++) if (j !== NEAR && j !== MID && j !== FAR && mask[j][i]) return true;
  return k < NEAR && mask[NEAR][i] === 1;
};

/** The far bands stand on the ground: opaque from their outline down. Their
 *  outline, per column, is the first row of a solid run of the band; where
 *  something nearer covers the column before the band shows, the outline is
 *  hidden there, and runs on between the columns either side (as do columns
 *  past either end). A median over a few columns drops a stray spike. */
const outline = (k) => {
  const t = new Int32Array(W).fill(-1);
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H - 6; y++) {
      const i = y * W + x;
      if (nearer(k, i)) break;
      let run = true;
      for (let r = 0; r < 6 && run; r++) run = mask[k][i + r * W] === 1;
      if (run) {
        t[x] = y;
        break;
      }
    }
  const med = Int32Array.from(t, (v, x) => {
    if (v < 0) return v;
    const w = [];
    for (let d = -3; d <= 3; d++) if (t[x + d] >= 0) w.push(t[x + d]);
    return w.sort((a, b) => a - b)[w.length >> 1];
  });
  const known = [...med.keys()].filter((x) => med[x] >= 0);
  return Int32Array.from(med, (v, x) => {
    if (v >= 0) return v;
    const l = known.findLast((q) => q < x), r = known.find((q) => q > x);
    return l === undefined ? med[r] : r === undefined ? med[l] : Math.round(med[l] + ((med[r] - med[l]) * (x - l)) / (r - l));
  });
};
const topMid = outline(MID);
const topFar = outline(FAR);

// the label: the nearest band that shows at each pixel
const label = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  const x = i % W, y = (i / W) | 0;
  label[i] = stone(i) ? NEAR
    : mask[RIGHT][i] ? RIGHT
    : mask[LEFT][i] ? LEFT
    : mask[GR][i] ? GR
    : mask[GL][i] ? GL
    : mask[NEAR][i] ? NEAR
    : y >= topMid[x] ? MID
    : y >= topFar[x] ? FAR
    : SKY;
}

/** the first row a grove shows in, per column (-1 where it never does) */
const groveTop = (k) => {
  const t = new Int32Array(W).fill(-1);
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++)
      if (label[y * W + x] === k) {
        t[x] = y;
        break;
      }
  return t;
};
const top = { [MID]: topMid, [FAR]: topFar, [GL]: groveTop(GL), [GR]: groveTop(GR) };

/** is band k there at pixel i, shown or covered by something nearer? */
const present = (k, i) => {
  if (k === SKY) return true;
  if (k === NEAR) return mask[NEAR][i] === 1 || label[i] === NEAR;
  if (k === LEFT || k === RIGHT) return label[i] === k;
  const x = i % W, y = (i / W) | 0;
  return top[k][x] >= 0 && y >= top[k][x] && label[i] >= k;
};

/** what lies behind the nearer band \`f\`, for band k (< f) */
const behind = (k, f) => {
  if (f >= GL) return fill[f];
  if (f === NEAR) return k === MID ? fillMid : k === FAR ? fill[MID] : fillSky;
  if (f === MID) return k === FAR ? fill[MID] : fillSky;
  return k === SKY ? fill[FAR] : fillSky;
};

/** where the scene shows in the mock: away from everything of the
 *  interface (where the mock and the plate part by more than the
 *  generation's noise, over a few px), feathered */
const mock = await rgb(null, null, "art/raw/originals/paper.png");
const chan = (img, c) => Float32Array.from({ length: N }, (_, i) => img[i * 4 + c]);
const apart = new Float32Array(N);
for (let c = 0; c < 3; c++) {
  const [m, p] = [blur(chan(mock, c), 6), blur(chan(plate, c), 6)];
  for (let i = 0; i < N; i++) apart[i] += Math.abs(m[i] - p[i]);
}
const covered = Float32Array.from(blur(Float32Array.from(apart, (v) => (v > 45 ? 1 : 0)), 6, 1), (v) => (v > 0.01 ? 1 : 0));
const open = Float32Array.from(blur(covered, 3, 1), (v) => 1 - v);

/** the plate with the mock's fine detail where the scene shows in it: the
 *  mock's high frequencies (over ~2px) for the plate's, scaled by `scale`
 *  (per channel, per pixel: the night's grade), on `onto`'s colour */
const highs = (img) => [0, 1, 2].map((c) => {
  const v = chan(img, c), b = blur(v, 2);
  return Float32Array.from(v, (x, i) => x - b[i]);
});
const [hm, hp] = [highs(mock), highs(plate)];
const detailed = (onto, scale = null) => {
  const out = Buffer.from(onto);
  for (let i = 0; i < N; i++) {
    if (!open[i]) continue;
    for (let c = 0; c < 3; c++) {
      const k = scale ? scale[c][i] : 1;
      out[i * 4 + c] = Math.max(0, Math.min(255, Math.round(onto[i * 4 + c] + open[i] * k * (hm[c][i] - hp[c][i]))));
    }
  }
  return out;
};
const nightGrade = [0, 1, 2].map((c) => {
  const [d, n] = [blur(chan(plate, c), 6), blur(chan(night, c), 6)];
  return Float32Array.from(d, (v, i) => Math.min(1.6, n[i] / Math.max(1, v)));
});

/** sharpened once, on the whole opaque picture (sigma ~0.8px, gentle on
 *  flat paper, firmer on edges), against the two resamplings to the screen */
const crisp = async (px) =>
  (await sharp(px, { raw: { width: W, height: H, channels: 4 } }).sharpen({ sigma: 0.8, m1: 0.4, m2: 1.5 }).raw().toBuffer({ resolveWithObject: true })).data;
const dayShown = await crisp(detailed(plate));
const nightShown = await crisp(detailed(night, nightGrade));
const fill = {};
for (const [k, px] of Object.entries(removed)) fill[k] = await crisp(px);
const [fillSky, fillMid] = [await crisp(genSky), await crisp(genMid)];

// the day frames, and each pixel's source, for the night's grade
const frames = NAMES.map(() => Buffer.alloc(N * 4));
const shown = NAMES.map(() => new Uint8Array(N)); // 1 where the band shows (the plate's colour)
for (let i = 0; i < N; i++) {
  const p = i * 4;
  for (let k = 0; k < 8; k++) {
    if (!present(k, i)) continue;
    const out = frames[k];
    if (label[i] === k) {
      // the plate's colour where the band shows; under the band at the top,
      // the sky without it; where the stone was, the hills its removal
      // continues
      for (let c = 0; c < 3; c++) {
        let v = dayShown[p + c];
        if (stone(i)) v = fill[RIGHT][p + c];
        else if (k === SKY) v = dayShown[p + c] * (1 - underBand[i]) + fillSky[p + c] * underBand[i];
        out[p + c] = Math.min(255, Math.max(0, Math.round(v)));
      }
      out[p + 3] = 255;
      shown[k][i] = stone(i) || (k === SKY && underBand[i] > 0.5) ? 0 : 1;
    } else {
      // covered by a nearer band: what that band's removal shows behind it
      const src = behind(k, label[i]);
      for (let c = 0; c < 3; c++) out[p + c] = src[p + c];
      out[p + 3] = 255;
    }
  }
}

// By night: each band's grade, day to night, measured where it shows (a
// normalised blur of the two plates over its own pixels, so a band's dark
// neighbour never darkens its fill), applied to its hidden fill.
const gradeOf = (k) => {
  const w = Float32Array.from(shown[k]);
  const sw = blur(w, 24);
  return [0, 1, 2].map((c) => {
    const d = blur(Float32Array.from({ length: N }, (_, i) => w[i] * plate[i * 4 + c]), 24);
    const n = blur(Float32Array.from({ length: N }, (_, i) => w[i] * night[i * 4 + c]), 24);
    return { d, n, sw };
  });
};
// where a band shows nowhere near (a fill far from its visible pixels), the
// whole band's mean grade stands in
const nights = [];
for (let k = 0; k < 8; k++) {
  const day = frames[k];
  const out = Buffer.from(day);
  const g = gradeOf(k);
  const [td, tn] = [[0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < N; i++)
    if (shown[k][i])
      for (let c = 0; c < 3; c++) {
        td[c] += plate[i * 4 + c];
        tn[c] += night[i * 4 + c];
      }
  const mean = [0, 1, 2].map((c) => (td[c] ? tn[c] / td[c] : 0.45));
  for (let i = 0; i < N; i++) {
    const p = i * 4;
    if (!day[p + 3]) continue;
    for (let c = 0; c < 3; c++) {
      if (shown[k][i]) {
        out[p + c] = nightShown[p + c];
        continue;
      }
      const { d, n, sw } = g[c];
      const local = sw[i] > 0.02 && d[i] > 1 ? n[i] / d[i] : mean[c];
      out[p + c] = Math.min(255, Math.round(day[p + c] * Math.min(2, local)));
    }
  }
  nights.push(out);
}

for (const [finish, set] of [["alpenglow", frames], ["night", nights]])
  for (let k = 0; k < 8; k++) {
    const dir = `${RAW}/layer-${NAMES[k]}-${finish}`;
    mkdirSync(dir, { recursive: true });
    await sharp(set[k], { raw: { width: W, height: H, channels: 4 } }).png().toFile(`${dir}/registered.png`);
  }
console.log("scene layers cut:", NAMES.join(", "), "(alpenglow, night)");
