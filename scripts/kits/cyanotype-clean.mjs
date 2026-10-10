// Things painted out of the Cyanotype plates (art/briefs/cyanotype.md): the
// keyboards (each is redrawn in code, cyanotype-keyboard.mjs), and the project
// print's corridor etching and its notes (which are the Ashen Cathedral's, not
// every project's: CORRIDOR below).
// The image model is good at "the same picture without the keyboard" and bad
// at keeping everything else where it was, so each edit (art/prompts/
// cyanotype/keyboard-*.txt -> art/raw/cyanotype/<name>-nokbd, by
// scripts/gen-asset.sh) is used only for what it was asked for: its pixels
// replace the original's inside the old keyboard's footprint, and nowhere
// else. The footprint is found, not drawn: where the edit differs from the
// original (a keyboard against bare ground is a large difference, the model's
// re-synthesis of the rest a small one), inside a region round the old board
// that leaves out what must not change (a note's arrow that touches the
// case). Its tone is matched to the original's round it and the seam feathered.
// (A region is one polygon or several: a painted-out thing may be in pieces.)
import sharp from "sharp";

const rgbOf = async (src, w, h) => {
  const img = sharp(src).removeAlpha();
  const { data, info } = await (w ? img.resize(w, h, { fit: "fill", kernel: "lanczos3" }) : img).raw().toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height };
};

/** Gaussian blur of a float field (separable, edge clamped). */
export const blurField = (src, W, H, sigma) => {
  const r = Math.max(1, Math.ceil(sigma * 3));
  const k = Array.from({ length: 2 * r + 1 }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)));
  const s = k.reduce((a, v) => a + v, 0);
  for (let i = 0; i < k.length; i++) k[i] /= s;
  const tmp = new Float32Array(W * H);
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let a = 0;
      for (let j = -r; j <= r; j++) a += k[j + r] * src[y * W + Math.min(W - 1, Math.max(0, x + j))];
      tmp[y * W + x] = a;
    }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let a = 0;
      for (let j = -r; j <= r; j++) a += k[j + r] * tmp[Math.min(H - 1, Math.max(0, y + j)) * W + x];
      out[y * W + x] = a;
    }
  return out;
};

/** A polygon (px) as a 0/1 field. */
export const polygonField = (poly, W, H) => {
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    const xs = [];
    for (let i = 0; i < poly.length; i++) {
      const [[x0, y0], [x1, y1]] = [poly[i], poly[(i + 1) % poly.length]];
      if (y0 <= y !== y1 <= y) xs.push(x0 + ((y - y0) / (y1 - y0)) * (x1 - x0));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2)
      for (let x = Math.max(0, Math.ceil(xs[i])); x <= Math.min(W - 1, Math.floor(xs[i + 1])); x++) out[y * W + x] = 1;
  }
  return out;
};

/** Distance (px, chamfer 3-4) from each pixel to the nearest set pixel of a 0/1 field. */
const distanceTo = (set, W, H) => {
  const d = new Float32Array(W * H).fill(1e6);
  for (let i = 0; i < d.length; i++) if (set[i]) d[i] = 0;
  const [a, b] = [1, Math.SQRT2];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (x > 0) d[i] = Math.min(d[i], d[i - 1] + a);
      if (y > 0) {
        d[i] = Math.min(d[i], d[i - W] + a);
        if (x > 0) d[i] = Math.min(d[i], d[i - W - 1] + b);
        if (x < W - 1) d[i] = Math.min(d[i], d[i - W + 1] + b);
      }
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (x < W - 1) d[i] = Math.min(d[i], d[i + 1] + a);
      if (y < H - 1) {
        d[i] = Math.min(d[i], d[i + W] + a);
        if (x < W - 1) d[i] = Math.min(d[i], d[i + W + 1] + b);
        if (x > 0) d[i] = Math.min(d[i], d[i + W - 1] + b);
      }
    }
  return d;
};
/** A 0/1 field with every hole (a run of 0s not connected to the frame) filled. */
const fillHoles = (set, W, H) => {
  const seen = new Uint8Array(W * H);
  const stack = [];
  const push = (i) => {
    if (set[i] || seen[i]) return;
    seen[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < W; x++) {
    push(x);
    push((H - 1) * W + x);
  }
  for (let y = 0; y < H; y++) {
    push(y * W);
    push(y * W + W - 1);
  }
  while (stack.length) {
    const i = stack.pop();
    const [x, y] = [i % W, (i / W) | 0];
    if (x > 0) push(i - 1);
    if (x < W - 1) push(i + 1);
    if (y > 0) push(i - W);
    if (y < H - 1) push(i + W);
  }
  return set.map((v, i) => (v || !seen[i] ? 1 : 0));
};
/** A 0/1 field grown by r px (negative r: shrunk). */
const grow01 = (set, W, H, r) => {
  if (r >= 0) return distanceTo(set, W, H).map((v) => (v <= r ? 1 : 0));
  return distanceTo(set.map((v) => 1 - v), W, H).map((v) => (v > -r ? 1 : 0));
};
const luma = (d, i) => 0.299 * d[i * 3] + 0.587 * d[i * 3 + 1] + 0.114 * d[i * 3 + 2];

/**
 * The original with the edit's pixels inside the old keyboard's footprint.
 *   region   polygon (the source's px) the footprint lies within, or a list of them
 *   diff     luminance difference (blurred) that counts as the keyboard
 *   close    px a gap in the footprint is closed over
 *   grow     px the footprint is grown by (its soft shadow, the edit's edge)
 *   feather  px the seam is feathered over
 * Returns the RGB buffer and what was measured.
 */
export const cleanPatch = async ({ original, edited, region, diff = 16, close = 24, grow = 8, feather = 8 }) => {
  const O = await rgbOf(original);
  const { W, H } = O;
  const E = await rgbOf(edited, W, H);
  const n = W * H;
  const polygons = Array.isArray(region[0][0]) ? region : [region];
  const inRegion = polygons.map((poly) => polygonField(poly, W, H)).reduce((all, f) => all.map((v, i) => v || f[i]));
  // where the edit differs from the original
  const dl = new Float32Array(n);
  for (let i = 0; i < n; i++) dl[i] = Math.abs(luma(O.data, i) - luma(E.data, i));
  const d = blurField(dl, W, H, 2.5);
  const core = new Float32Array(n);
  for (let i = 0; i < n; i++) core[i] = d[i] > diff && inRegion[i] ? 1 : 0;
  // closed (the dark gaps between keys differ little from the ground: a hole
  // is not ground), grown, then feathered
  const closed = fillHoles(grow01(grow01(core, W, H, close), W, H, -close), W, H);
  const grown = grow01(closed, W, H, grow);
  const mask = blurField(grown, W, H, feather * 0.5);
  for (let i = 0; i < n; i++) mask[i] *= inRegion[i];
  // tone: the edit's colours onto the original's by an offset per channel that
  // varies slowly across the patch, measured on the ring just outside the
  // footprint (where both show the same ground) and spread inward
  const ring = new Float32Array(n);
  const near = grow01(grown, W, H, 40);
  for (let i = 0; i < n; i++) ring[i] = mask[i] < 0.01 && near[i] ? 1 : 0;
  const den = blurField(ring, W, H, 30);
  const off = [0, 1, 2].map((c) => {
    const diffc = new Float32Array(n);
    for (let i = 0; i < n; i++) if (ring[i]) diffc[i] = O.data[i * 3 + c] - E.data[i * 3 + c];
    const num = blurField(diffc, W, H, 30);
    let [m, s] = [0, 0];
    for (let i = 0; i < n; i++)
      if (ring[i]) {
        m++;
        s += diffc[i];
      }
    const mean = m ? s / m : 0;
    return num.map((v, i) => (den[i] > 0.02 ? v / den[i] : mean));
  });
  const out = Buffer.from(O.data);
  for (let i = 0; i < n; i++) {
    const t = mask[i];
    if (t <= 0) continue;
    for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(Math.min(255, Math.max(0, O.data[i * 3 + c] * (1 - t) + (E.data[i * 3 + c] + off[c][i]) * t)));
  }
  let area = 0;
  for (let i = 0; i < n; i++) if (mask[i] > 0.5) area++;
  return { data: out, info: { width: W, height: H, channels: 3 }, mask, area };
};

/* ====================== the plates that carry a keyboard ====================== */
// Each edit and where its original's keyboard lay. `region` is a polygon in
// the print's canvas px (the bleed's 320 px at the left included: the home and
// project prints' canvas is 2312 x 1261, core at x 320, the generations laid
// over all of it at 1672 x 941), generous round the old board and leaving out
// what touches it that must not change; `at` takes a canvas point to the
// source's px. The launch print's keyboard is wholly inside its core, so only
// its core is edited (its generation never shows there).
const BLEED = 320;
const GEN = [1672 / 2312, 941 / 1300];
const toCore = ([x, y]) => [x - BLEED, y];
const toGen = ([x, y]) => [x * GEN[0], y * GEN[1]];
const HOME = [[0, 180], [470, 60], [585, 410], [0, 590]];
const PROJECT = [[0, 660], [330, 720], [625, 815], [675, 845], [655, 925], [595, 990], [480, 1040], [345, 1110], [0, 985]];
// (the launch note's arrow touches the case's left end: the region stops short of it)
const LAUNCH = [[236, 562], [568, 470], [655, 650], [655, 668], [300, 790], [262, 778], [232, 650], [232, 600]].map(([x, y]) => [x + BLEED, y]);
const PHONE = [[0, 455], [325, 570], [375, 598], [372, 660], [225, 900], [0, 830]];
// What the project print carries of the Ashen Cathedral's own (the mock's
// placeholder, not any project's): the dungeon-corridor etching with its note
// "deeper always deeper" (down the left, pillars rising from the left margin
// too, its perspective lines running out under the gears), "geometry from
// logic -not files" above the gears, and "rooms() enemies() loot() repeat()"
// with its bracket beside them. The gears, their dimension lines, the keycap
// box and the ferns stay, so the region keeps clear of them (the dimension
// lines stand at x 522). The print's canvas px, the core at x 320.
const CORRIDOR = [
  [[0, 400], [838, 400], [838, 830], [900, 830], [900, 1300], [0, 1300]],
  [[1005, 535], [1150, 535], [1150, 640], [1005, 640]],
  [[1110, 675], [1245, 675], [1245, 785], [1110, 785]],
];
const PLAIN = { diff: 12, close: 40, grow: 14, feather: 14 };
// What the plain print is given back: a fern frond, a pair of meshing gears
// with their dimension lines, registration crosses, all generic, in the band
// of open ground below the figure on the project page's right (art/prompts/
// cyanotype/ornaments-plate-bleed-project.txt). The model drew them where
// asked; its edit is used inside this band only (core px), which stops above
// the text that stands under the figure (its tick rule is left out). The
// footprints are found as the keyboards' are; a frond's gaps are closed.
const ORNAMENTS = [[798, 500], [1350, 500], [1350, 682], [798, 682]];
const ADDED = { diff: 12, close: 18, grow: 10, feather: 10 };
// ... and, in the open ground at the lower left (where the corridor stood, and
// under the pitch's copy, which now sits in the left column), the same kind of
// thing: a frond, a plain circle with its dimension lines, crosses and a
// tick rule (art/prompts/cyanotype/ornaments2-plate-bleed-project.txt). The
// region keeps clear of the left edge's dimension line (x 40) and the gears'
// (x 522).
const ORNAMENTS_LEFT = [[70, 590], [500, 590], [500, 800], [70, 800]];
export const CLEANS = [
  { name: "plate-bleed-clean", original: "plate-bleed", edited: "plate-bleed-nokbd", region: HOME.map(toCore) },
  { name: "bleed-day-clean", original: "bleed-day", edited: "bleed-day-nokbd", region: HOME.map(toGen) },
  { name: "plate-bleed-project-clean", original: "plate-bleed-project", edited: "plate-bleed-project-nokbd", region: PROJECT.map(toCore) },
  { name: "bleed-project-clean", original: "bleed-project", edited: "bleed-project-nokbd", region: PROJECT.map(toGen) },
  { name: "plate-bleed-launch-clean", original: "plate-bleed-launch", edited: "plate-bleed-launch-nokbd", region: LAUNCH.map(toCore) },
  { name: "plate-bleed-phone-clean", original: "plate-bleed-phone", edited: "plate-bleed-phone-nokbd", region: PHONE, grow: 20 },
  // the project print without the Ashen Cathedral's marginalia: the clean
  // plates above with the corridor and the notes painted out (art/prompts/
  // cyanotype/corridor-*.txt)
  { name: "plate-bleed-project-plain", original: "plate-bleed-project-clean", edited: "plate-bleed-project-nocorr", region: CORRIDOR.map((poly) => poly.map(toCore)), ...PLAIN },
  { name: "bleed-project-plain", original: "bleed-project-clean", edited: "bleed-project-nocorr", region: CORRIDOR.map((poly) => poly.map(toGen)), ...PLAIN },
  // ... and, in its core, the ornaments of the band below the figure
  { name: "plate-bleed-project-dense", original: "plate-bleed-project-plain", edited: "plate-bleed-project-orn", region: ORNAMENTS, ...ADDED },
  { name: "plate-bleed-project-full", original: "plate-bleed-project-dense", edited: "plate-bleed-project-orn2", region: ORNAMENTS_LEFT, ...ADDED },
];

/* ====================== what the original keeps ====================== */
// The painted-out plate is the model's re-drawing of the original, and where
// it re-draws a photogram it draws it cleaner and glossier than the print: the
// right column's two polaroids, their notes and the gears come back smooth
// (a third less fine detail, a bloom round the leaflets and teeth), where the
// original's whites are matte, grainy and speckled with the emulsion's tooth.
// Where the plate's layout is the original's (the model kept these where they
// stood), the original's own pixels are used: inside REGION, except what the
// page draws itself or the plate took out on purpose (the tape on the
// window's corner, the window's shadow and the cards' block, the stamp's
// words), and never the torn paper edge (the page lays its own round the
// viewport, which is not registered to the print's at every aspect). The seam
// is feathered. (The left ferns are not: the plate took the leaflets behind
// the heading and the cards out, so it is not the original's frond there.)
const disc = (cx, cy, r, steps = 48) => Array.from({ length: steps }, (_, i) => [cx + r * Math.cos((2 * Math.PI * i) / steps), cy + r * Math.sin((2 * Math.PI * i) / steps)]);
export const RESTORE = {
  // the right column in core px: the note under the top edge, the polaroids,
  // the column of words, the gears and the compass, clear of the window's
  // shadow and tape at its left and the cards' block below it
  region: [[1480, 0], [1672, 0], [1672, 941], [1535, 941], [1535, 558], [1497, 558], [1497, 152], [1512, 152], [1512, 100], [1480, 100]],
  except: [disc(1611, 880, 62)],
  feather: 6,
  paperGrow: 10,
};
/** Lay the original's pixels into `sky` (RGB, W x H) where RESTORE says; `paperLuma` is the empty print's luminance (its torn edge is the bright). */
export const restoreOriginal = ({ sky, O, W, H, paperLuma }) => {
  let inside = polygonField(RESTORE.region, W, H);
  for (const hole of RESTORE.except) {
    const f = polygonField(hole, W, H);
    inside = inside.map((v, i) => (f[i] ? 0 : v));
  }
  const paper = grow01(paperLuma.map((l) => (l > 150 ? 1 : 0)), W, H, RESTORE.paperGrow);
  inside = inside.map((v, i) => (paper[i] ? 0 : v));
  const w = blurField(inside, W, H, RESTORE.feather * 0.5);
  let area = 0;
  for (let i = 0; i < W * H; i++) {
    if (w[i] <= 0.003) continue;
    if (w[i] > 0.5) area++;
    for (let k = 0; k < 3; k++) sky[i * 3 + k] = Math.round(sky[i * 3 + k] * (1 - w[i]) + O[i * 3 + k] * w[i]);
  }
  return area;
};
