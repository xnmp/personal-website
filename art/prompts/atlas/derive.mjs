// Celestial Atlas: the raws that are not generated but derived, from the
// original mock (art/raw/originals/atlas.png) and the generated plates.
//
//   node art/prompts/atlas/derive.mjs <frame|dials|sky|quiet|foil|tiles|frames|compass|canvas|bleed|stars|mat|moon>...
//
// Each writes art/raw/atlas/<name>/<name>.png, which scripts/kits/atlas.mjs
// builds into the kit like any raw.
//
// - frame: the page's border, the mock's own px cut out of it (the gilt's
//   alpha and colour over the sky: rails, ladder, cartouches, the top's marks,
//   the corners' scrolls, the junction under the nav's rule), a 9-slice laid
//   at the viewport's edge. `sky` takes the same px out of the plate, so the
//   border is drawn once.
// - dials: the lower corners' quarter-dials (page-dial-bl/-br), the frame's:
//   sprites pinned to the viewport's corners (atlas.css body::after), the gilt
//   cut from the mock at the weight `sky` takes out of the plate, so a frame
//   taller than 16:9 has no dial cut flat at the plate's foot.
// - compass: the brand's mark, the mock's thin-line rose.
// - sky: the night plate the page stands on: plate-night (the mock's own sky,
//   its stars small and crisp, its grain fine) where the page hangs nothing;
//   the mock's own px where it does (the border's bands, the foot under the
//   cards, the constellation above the tagline's end and the right side with
//   its moon: each wholly the mock's, so no arc prints twice), the border, the
//   moon and the lower dials (the frame's: `dials`) taken out of them; the repaint that
//   removed the page (layer-sky-night-clear) only where the compass rose and
//   the top left scrolls stand; the bear and the bird laid back from the mock,
//   whose fine line the repaint blurred (clear of the "P" of "Projects",
//   which is in the mock's px); the foot under the row, and the gap above it, quieted.
// - quiet: both plates with the glints and lines taken out (each pixel held
//   to within a little of its neighbourhood's median), the sky the page
//   shows behind its words (atlas.css, the quiet field).
// - foil: the headline's gold leaf, the face of the gold button's plate.
// - tiles: the buttons, drawn on clear with their corners cut: the neutral,
//   by night and by day, its field (the generated button's) in two fine
//   gold rules, as the mock's "Try it live" (tile-*-fine), and the primary,
//   a plate of weathered parchment-gold leaf in the mock's rules, as its
//   "Join the alpha" (tile-signal-fine).
// - canvas: the night's generated continuation with the core laid back over
//   it (sky-night-canvas), the picture the day's edit is made from.
// - bleed: the plates by night and by day (sky-night, layer-sky-day-clear)
//   laid in their generated continuations past the mock's edges, the
//   scene's sky (sky-*-plate); the night's foot smoothed across the core's
//   edge, and the chart's constellation lines run on under it (CHART). Run
//   after sky.
// - frames: the sheet and the mat, worn as the mock's (sheet-fine, mat-fine).
// - stars: the status markers, the chart's own four-point star in four
//   inks (pins-star).
// - moon: the night's moon sprite from the mock's own px: its disc, and its
//   bloom as the sprite's alpha (moon-night-mock).
// - mat: the mat the cards' pictures stand on, as the mock's: the card's
//   navy (the ivory by day) strewn with gold dust, small engraved marks and
//   the odd dotted constellation, a seamless tile (card-mat-night/-day).
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const RAW = "art/raw/atlas";
const MOCK = "art/raw/originals/atlas.png";
const raw = (name) => `${RAW}/${name}/${name}.png`;
const out = (name) => (mkdirSync(`${RAW}/${name}`, { recursive: true }), raw(name));
const rgb = async (f) => {
  const { data, info } = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height };
};
const png = (px, W, H, channels, file) => sharp(px, { raw: { width: W, height: H, channels } }).png().toFile(file);

// the mock's gilt, measured on its border's rules (their brightest px)
const GILT = [214, 174, 102];
const W0 = 1672;
const H0 = 941;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smoothstep = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** The page's border, as the mock engraves it: heavier than a drawn rule,
 *  distressed, with its own marks (a band of small ones along the top, a
 *  ladder and cartouches down the sides) and a scroll in each corner. The
 *  generator drew it as a gilt moulding and an earlier build redrew it from
 *  measured profiles, which came out as a clean vector rule; the page now
 *  wears the mock's own px, cut out of it: `frame` is its alpha and colour
 *  over the sky (below), and `sky` takes the same px out of the plate (so
 *  the border is drawn once). Where the px are, in the mock's coordinates:
 *  `rails`, the zone along each edge ([from, to) in px: a few px wider than
 *  the rules, whose ladder, cartouches and marks lie in it), and `devices`,
 *  boxes ([x0, y0, x1, y1)) round the corner scrolls at the top and the
 *  junction hung under the nav's rule, each less what the page draws itself
 *  in it (`own`: the compass rose and its needle's barb, a star of the
 *  sky's). The lower dials' hubs are the dials', not the border's: they stay
 *  in the plate with the dial, whole but for the arc of a ring that lies in
 *  the rails' zone. */
const BORDER = {
  rails: { top: [4, 19], bottom: [H0 - 21, H0 - 3], left: [4, 26], right: [W0 - 24, W0 - 4] },
  devices: [
    // top left: the arrow and ring, the swirl along the top (to x~140), the scroll down the side
    [0, 0, 60, 50],
    [60, 0, 146, 40],
    [0, 0, 52, 84],
    // top right: the swirl, the scroll down the side, the junction under the nav's rule
    [1560, 0, W0, 46],
    [1604, 0, W0, 84],
    [1606, 102, W0, 150],
  ],
  own: (x, y) => Math.hypot(x - 92.5, y - 85) < 52 || (Math.abs(x - 92.5) < 7 && y < 40) || (x >= 1606 && x < 1642 && y >= 140),
};

const inBorder = (x, y) => {
  const { rails: r, devices } = BORDER;
  if ((y >= r.top[0] && y < r.top[1]) || (y >= r.bottom[0] && y < r.bottom[1]) || (x >= r.left[0] && x < r.left[1]) || (x >= r.right[0] && x < r.right[1])) return true;
  return devices.some(([x0, y0, x1, y1]) => x >= x0 && x < x1 && y >= y0 && y < y1) && !BORDER.own(x, y);
};

/** The weight of a px in a box [x0, y0, x1, y1), each side feathered by its
 *  own width (left, top, right, bottom: 0 is a hard edge): 1 well inside,
 *  rising smoothly from 0 across the feather. */
const rectW = (x, y, [x0, y0, x1, y1], [fl = 0, ft = 0, fr = 0, fb = 0] = []) => {
  const edge = (d, f) => (f ? smoothstep((d + 1) / f) : d >= 0 ? 1 : 0);
  return edge(x - x0, fl) * edge(y - y0, ft) * edge(x1 - 1 - x, fr) * edge(y1 - 1 - y, fb);
};

/** The lower corners' dials, the border's own corner pieces: the bottom left
 *  quarter-dial (x10-172 y800-930) and the bottom right one with the arcs
 *  that run into it down the right edge (x1488-1656 y700-940). They are the
 *  frame's, pinned to the viewport's corners (atlas.css body::after), not the
 *  plate's: the plate is registered to the stage, whose foot is above the
 *  viewport's on a frame taller than 16:9, and a dial left in it was cut flat
 *  there (and its continuation drew other arcs). `parts` are the boxes each
 *  holds, feathered where its arcs run on (the top edge): they leave out the
 *  first card's and the last card's footprints (the cards' own rules and
 *  corners are the page's, and the dials run under them) and the rule above
 *  the motto, and stop at the rails' zone, which the frame holds. At the
 *  mock's size the sprite (the gilt at that weight) and the plate (what is
 *  left of it, `sky`, by `dialErase`) give the mock's px back but for a short
 *  dip across each feather. */
const DIALS = {
  bl: { box: [0, 788, 184, H0], parts: [[[0, 788, 75, H0], [0, 12, 3, 0], [0, 6, 3, 0]], [[0, 851, 184, H0], [0, 8, 8, 0], [0, 0, 8, 0]]] },
  br: { box: [1484, 700, W0, H0], parts: [[[1596, 700, W0, H0], [0, 14, 0, 0], [0, 7, 0, 0]], [[1541, 851, W0, H0], [6, 8, 0, 0], [6, 0, 0, 0]], [[1484, 878, W0, H0], [6, 8, 0, 0], [6, 0, 0, 0]]] },
};
const dialW = (x, y, d, k = 1) => Math.max(...d.parts.map((p) => rectW(x, y, p[0], p[k])));
/** how much of a px belongs to a dial (0 where the frame's rails hold it) */
const dialAt = (x, y) => (inBorder(x, y) ? 0 : Math.max(dialW(x, y, DIALS.bl), dialW(x, y, DIALS.br)));
/** how much of a px the plate lets go of: its sprite's weight, where the
 *  feather is a long one (arcs running on) a faster one, so no stub of an arc
 *  is left in the plate where the sprite stands lower (on a frame taller than
 *  16:9); where the arcs run out from under a card, none at all */
const dialErase = (x, y) => (inBorder(x, y) ? 0 : Math.max(dialW(x, y, DIALS.bl, 2), dialW(x, y, DIALS.br, 2)));

/** The mock's page at its foot, which the plate must not keep: the hairline
 *  above the motto with the stars that tip it (x185-1540 y858-878) and the
 *  motto with its rules (x395-1275 y876-908). The page draws them. */
const FOOT_UI = [[185, 858, 1541, 878], [395, 876, 1276, 908]];
const inFootUI = (x, y) => FOOT_UI.some(([x0, y0, x1, y1]) => x >= x0 && x < x1 && y >= y0 && y < y1);
/** The mock's last 3 px at its left, right and lower edges, which the frame
 *  does not reach (it starts 4 px in) and where its sky is darkest: the
 *  plate's fill takes them too, so no rim shows where the plate goes on. */
const inEdge = (x, y) => x < 3 || x >= W0 - 3 || y >= H0 - 3;
/** every px the matte and the sky's fill work on */
const inFill = (x, y) => inBorder(x, y) || inFootUI(x, y) || dialAt(x, y) > 0 || dialErase(x, y) > 0;

/** The sky as the mock has it round its border: each px's median over 15x15
 *  (its thin gilt lines are a minority of any window, so they drop out). */
const skyOf = async () => {
  const [M, S] = [await rgb(MOCK), await rgb(await sharp(MOCK).removeAlpha().median(15).png().toBuffer())];
  // where the border lies a window's median is not always the sky's: at a
  // corner, where the dial's strokes crowd the rails, it is gilt-tinged, and
  // a worn rule there is matted too faint (and its px lost from the plate
  // with nothing drawn for them): the border's own px take the median of the
  // window's px that are not gilt (a window of 25px, widened if it is all gilt)
  const dark = (j) => (M.data[j * 3] + M.data[j * 3 + 1]) / 2 - M.data[j * 3 + 2] < -8;
  for (let y = 0; y < H0; y++)
    for (let x = 0; x < W0; x++) {
      if (!inFill(x, y)) continue;
      for (let r = 12; r <= 36; r += 12) {
        const v = [[], [], []];
        for (let yy = Math.max(0, y - r); yy <= Math.min(H0 - 1, y + r); yy++)
          for (let xx = Math.max(0, x - r); xx <= Math.min(W0 - 1, x + r); xx++) {
            const j = yy * W0 + xx;
            if (dark(j)) for (let c = 0; c < 3; c++) v[c].push(M.data[j * 3 + c]);
          }
        if (v[0].length > 40) {
          v.forEach((a, c) => (S.data[(y * W0 + x) * 3 + c] = a.sort((p, q) => p - q)[Math.floor(a.length / 2)]));
          break;
        }
      }
    }
  return S;
};

/** How much of each border px is gilt, and which gilt: a px's gold (R+G over
 *  two, less B) against the sky's, up to the leaf's lit gold (`LEAF`), less a
 *  floor for the paint's grain; the colour is what, laid over the sky at that
 *  alpha, gives the px back (so a worn rule keeps its wear as alpha, and its
 *  colour its own). */
const LEAF = 95;
async function borderMatte() {
  const [M, S] = [await rgb(MOCK), await skyOf()];
  const alpha = new Float32Array(W0 * H0);
  const color = Buffer.alloc(W0 * H0 * 3);
  const gold = (d, i) => (d[i] + d[i + 1]) / 2 - d[i + 2];
  for (let y = 0; y < H0; y++)
    for (let x = 0; x < W0; x++) {
      if (!inFill(x, y)) continue;
      const i = y * W0 + x;
      const gs = gold(S.data, i * 3);
      const a = clamp01((clamp01((gold(M.data, i * 3) - gs) / (LEAF - gs)) - 0.06) / 0.94);
      if (!a) continue;
      alpha[i] = a;
      for (let c = 0; c < 3; c++) color[i * 3 + c] = a >= 0.2 ? Math.max(0, Math.min(255, Math.round((M.data[i * 3 + c] - (1 - a) * S.data[i * 3 + c]) / a))) : GILT[c];
    }
  return { alpha, color };
}

/** The page's border: the mock's own px, cut out (borderMatte), from 4px in
 *  (the page lays it 4 of its px in from the viewport: atlas.css
 *  body::before), a 9-slice whose corners hold the scrolls whole and whose
 *  edges are the mock's own runs, so at 1672x941 it is the mock's border and
 *  on any other shape the same border lengthened. The four extreme px carry a
 *  hair of alpha, so the kit's trim keeps the canvas whole. */
async function frame() {
  const { alpha, color } = await borderMatte();
  const [w, h] = [W0 - 8, H0 - 8];
  const px = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [i, o] = [(y + 4) * W0 + x + 4, (y * w + x) * 4];
      if (alpha[i] < 0.02 || !inBorder(x + 4, y + 4)) continue;
      for (let c = 0; c < 3; c++) px[o + c] = color[i * 3 + c];
      px[o + 3] = Math.round(255 * alpha[i]);
    }
  for (const o of [0, (w - 1) * 4, ((h - 1) * w) * 4, ((h - 1) * w + w - 1) * 4]) {
    if (px[o + 3] >= 3) continue;
    for (let c = 0; c < 3; c++) px[o + c] = GILT[c];
    px[o + 3] = 3;
  }
  await png(px, w, h, 4, out("page-frame-engraved"));
}

/** The lower corners' dials (DIALS), the mock's own px cut out as the border
 *  is (borderMatte): the gilt's alpha, less the weight the plate keeps of
 *  each px (`dialW`: the same weight, so the sprite and the plate's remainder
 *  give the mock's px back), and its colour unmixed from the sky. One sprite
 *  a corner, at the mock's size and cut to the dial's box; the four extreme
 *  px carry a hair of alpha, so the kit's trim keeps the canvas whole. */
async function dials() {
  const { alpha, color } = await borderMatte();
  for (const [name, d] of Object.entries({ "page-dial-bl": DIALS.bl, "page-dial-br": DIALS.br })) {
    const [x0, y0, x1, y1] = d.box;
    const [w, h] = [x1 - x0, y1 - y0];
    const px = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const [gx, gy, o] = [x0 + x, y0 + y, (y * w + x) * 4];
        const a = alpha[gy * W0 + gx] * dialAt(gx, gy);
        if (a < 0.02) continue;
        for (let c = 0; c < 3; c++) px[o + c] = color[(gy * W0 + gx) * 3 + c];
        px[o + 3] = Math.round(255 * a);
      }
    for (const o of [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4]) {
      if (px[o + 3] >= 3) continue;
      for (let c = 0; c < 3; c++) px[o + c] = GILT[c];
      px[o + 3] = 3;
    }
    await png(px, w, h, 4, out(name));
  }
}

/** The mock's own px laid back over the plate where the plate lost them: the
 *  plate was repainted from the mock with its page taken out, and what the
 *  repaint did to the two figures at the left (the bear and the bird: their
 *  fine engraved line, the hatching of their coats) was to blur it and shift
 *  it by a few px. Each box is the figure alone (clear of the page's compass
 *  rose, which the page draws, and of its border and copy), feathered at its
 *  edges. */
const FIGURES = [
  { x0: 40, y0: 126, x1: 198, y1: 268, feather: 12 },
  { x0: 28, y0: 286, x1: 198, y1: 512, feather: 14 },
  // the dial at the left edge, whose centre the repaint flared (its box
  // reaches down to the page's "Projects" heading, whose P is in the mock's
  // px: `UI` keeps it out)
  { x0: 32, y0: 440, x1: 104, y1: 548, feather: 10 },
];
/** Where the mock's px carry its page (its words): a figure's box must not
 *  lift them back into the plate. The P of "Projects" (x82-108, y529-573 in
 *  the mock), with room round it for its halo; the figures are laid back
 *  clear of it, feathered out over `feather`. */
const UI = [{ x0: 76, y0: 516, x1: 116, y1: 580, feather: 8 }];
/** How far a px is clear of the page's words in the mock: 0 inside one of
 *  `UI`, rising to 1 `feather` px out. */
const clearOfUI = (x, y) =>
  UI.reduce((c, r) => {
    const d = Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.y0 - y, 0, y - r.y1));
    const k = Math.min(1, d / r.feather);
    return Math.min(c, k * k * (3 - 2 * k));
  }, 1);
/** The figures' fine line comes through the page's encode a little softer
 *  than the mock's: their px are sharpened by this much (unsharp, 1.2px). */
const FIGURE_GAIN = 0.08;
const COMPASS = { x: 92.5, y: 85, inner: 62, outer: 74 };

/** The corner of the plate under the first card that the repaint left the
 *  lower left dial's arcs in, and under the last card the lower right one's
 *  ([x0, y0, x1, y1, feather]; the card's own foot at y853 is a hard edge): the
 *  frame holds the dials, so these are taken out (sky: median filter). */
const UNDER_CARD = [[62, 780, 196, 853, 6], [1470, 820, 1596, 853, 6]];

/** What the repaint left in the compass rose's clear sky that the mock has
 *  none of (the glint on its upper point, held down by `GLINT`, still a
 *  grey star; a spark with a short stroke under its hub; the stars the
 *  repaint left where the masthead's rule hangs its pendant and ends, which the
 *  page draws): sunk into the sky round it, each px held to within `slack` of the median there
 *  ([x0, y0, x1, y1, feather]). */
const STRAYS = { slack: 8, patches: [[78, 26, 96, 46, 5], [77, 94, 96, 126, 5], [1154, 106, 1180, 126, 4], [1374, 106, 1398, 126, 4]] };

/** The foot of the plate, under the row and the motto, as the mock keeps it:
 *  calm, a fine dust of stars. The plate's glints there (broad four-point
 *  flares and dotted lines) are sunk into the sky round them, each px held
 *  to within `slack` of its neighbourhood's median (`sink`), so the flares
 *  go and the dust stays; the corners' dials, which the mock draws there,
 *  stay. */
const FOOT = { y: 832, feather: 16, xl: 178, xr: 1494, xfeather: 32, slack: 7 };
/** The gap between the "Projects" rule and the cards, calm in the mock too
 *  (a dot where the plate flares a star): sunk as the foot is, less hard,
 *  for the constellation's dotted lines run through it. */
const GAP = { y0: 568, y1: 588, feather: 4, xl: 190, xr: 1484, xfeather: 32, slack: 9 };

/** The repaint's glint on the compass rose's upper point, held down as the
 *  foot's are. */
const GLINT = { x0: 78, y0: 22, x1: 100, y1: 46, feather: 6, t: 70 };

/** A glint held down to a lum of `t`, in its own hue: scaled, not clamped a
 *  channel at a time (a gold glint with its blue held above its red goes
 *  grey-green, the ghost stars the page had in its lower sky), and a warm
 *  glint's white core, which scaling leaves grey, taken to the gilt at that
 *  lum. A cool (blue-white) star keeps its own tone. */
const hold = (px, i, t) => {
  const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
  const lum = (r + g + b) / 3;
  if (lum <= t) return [r, g, b];
  const smooth = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
  const w = smooth((lum - 120) / 110) * smooth((r - b) / 50);
  const gl = (GILT[0] + GILT[1] + GILT[2]) / 3;
  return [r, g, b].map((v, c) => Math.round(v * (t / lum) * (1 - w) + GILT[c] * (t / gl) * w));
};

/** What the page draws itself, or hangs on its own, is taken out of the
 *  plate (layer-sky-night-clear: the repaint that took the mock's border, its
 *  compass rose and its moon out of plate-night): the plate keeps the mock's
 *  own sky everywhere else. The repaint is not the mock: it draws the dials
 *  and the chart's arcs differently, and flares glints the mock does not
 *  have. It stands only where the page's compass rose does (a clear sky);
 *  the rest of what the page draws is taken out of the mock's own px
 *  (`MOCK_ZONES`). */
const PAGE = { compass: { x: 92.5, y: 85, r: 56, feather: 8 } };

/** How much of the repainted plate stands at (x, y): 1 where the page draws
 *  its compass rose, 0 where the mock's sky stands, feathered. */
function repaintAt(x, y) {
  const { compass } = PAGE;
  return 1 - smoothstep((Math.hypot(x - compass.x, y - compass.y) - compass.r) / compass.feather);
}

/** The mock's moon (art/raw/originals/atlas.png): its centre and disc
 *  radius, measured on its px (the limb fitted as a circle at 4 degree
 *  steps: 1499.7, 186.4 in px indices, 40.9 to the half-way of its limb),
 *  `R` the radius that is the disc's alone, its limb a px or so more. Its
 *  bloom (a soft pale-blue light about it, 70px out) is what the mock's sky
 *  has there over the sky's own: measured as the median over angle of the
 *  px at each radius, less the sky 100-130px out (`base`). */
const MOON = { cx: 1499.7, cy: 186.4, R: 41.2, edge: 1.2, end: 80, fill: 44 };

/** The bloom of the mock's moon, per channel, at each half px of radius: how
 *  much lighter the mock's sky is than its own sky (`base`), smoothed along
 *  the radius and run out to nothing by `MOON.end`. */
function bloomOf(M) {
  const at = (x, y, c) => {
    const [x0, y0] = [Math.floor(x), Math.floor(y)];
    const [tx, ty] = [x - x0, y - y0];
    const g = (xx, yy) => M.data[(yy * M.W + xx) * 3 + c];
    return (g(x0, y0) * (1 - tx) + g(x0 + 1, y0) * tx) * (1 - ty) + (g(x0, y0 + 1) * (1 - tx) + g(x0 + 1, y0 + 1) * tx) * ty;
  };
  const median = (r, c, angles) => {
    const v = angles.map((a) => at(MOON.cx + r * Math.cos((a * Math.PI) / 180), MOON.cy + r * Math.sin((a * Math.PI) / 180), c)).sort((p, q) => p - q);
    return v[Math.floor(v.length / 2)];
  };
  const range = (a, b, s) => Array.from({ length: Math.round((b - a) / s) + 1 }, (_, i) => a + i * s);
  // the sky beside the moon, out of reach of its bloom and clear of the nav above it
  const side = [...range(150, 230, 2), ...range(-35, 25, 2)];
  const base = [0, 1, 2].map((c) => {
    const v = range(100, 130, 1).map((r) => median(r, c, side));
    return v.sort((p, q) => p - q)[Math.floor(v.length / 2)];
  });
  const all = range(0, 358.5, 1.5);
  const raw = range(0, 100, 0.5).map((r) => [0, 1, 2].map((c) => Math.max(0, median(r, c, all) - base[c])));
  // smoothed over 5 half-px, monotone from the limb out, tapered to nothing
  const sm = raw.map((_, i) => [0, 1, 2].map((c) => [-2, -1, 0, 1, 2].reduce((a, d) => a + raw[Math.min(raw.length - 1, Math.max(0, i + d))][c], 0) / 5));
  const B = sm.map((v, i) => {
    const r = i / 2;
    const taper = 1 - smoothstep((r - (MOON.end - 12)) / 12);
    return v.map((x) => x * taper);
  });
  for (let i = 1; i < B.length; i++) if (i / 2 > 44) for (let c = 0; c < 3; c++) B[i][c] = Math.min(B[i][c], B[i - 1][c]);
  return { base, at: (r) => { const i = Math.min(B.length - 2, Math.max(0, r * 2)); const [i0, t] = [Math.floor(i), i - Math.floor(i)]; return [0, 1, 2].map((c) => B[i0][c] * (1 - t) + B[i0 + 1][c] * t); } };
}

/** Where the mock's px stand in the plate in place of the repaint's or the
 *  generator's (boxes [x0, y0, x1, y1), each feathered inward over `f`; the
 *  sky outside them is plate-night's, which matches the mock's but for its
 *  fine line, which it draws differently). What the page draws itself is
 *  taken out of these px (the border: borderMatte; the moon: bloomOf). Where
 *  the zones meet plate-night the seam runs through plain sky, or under a
 *  card, never across a dial: a dial is wholly one or the other.
 *   - the border's bands (a strip along each edge, the corners' devices);
 *   - the lower dials, each wholly (down to the cards' feet, and the strip
 *     beside the first and last card, which the cards cover);
 *   - the right side, from under the nav's rule to above the Projects rule:
 *     the moon, the observatory, the chart's arcs there. */
const INF = 1e4;
const MOCK_ZONES = [
  { box: [-INF, -INF, INF, 30], f: 8 }, // the top
  { box: [425, 28, 560, 74], f: 6 }, // the constellation above the tagline's end (the plate's repaint of it left a dim ghost; the page's tagline stands below, from y84)
  { box: [-INF, -INF, 150, 100], f: 8 }, // the top left corner's scrolls (the compass rose, which the page draws, is the repaint's: `PAGE`)
  { box: [-INF, 851, INF, INF], f: 3 }, // the foot, under the cards' rules (the page's rule above the motto and the motto are filled: `inFootUI`)
  { box: [-INF, -INF, 38, INF], f: 8 }, // the left
  { box: [W0 - 38, -INF, INF, INF], f: 8 }, // the right
  { box: [1560, -INF, INF, 48], f: 6 }, // the top right corner's swirl
  { box: [1604, -INF, INF, 150], f: 8 }, // its scroll and the junction under the nav's rule
  { box: [-INF, 590, 76, INF], f: 6 }, // left of the first card, down to the lower left dial (which the frame holds)
  { box: [1596, 590, INF, INF], f: 4 }, // and right of the last card (its rule is the page's)
  { box: [1290, 126, INF, 550], f: 10 }, // the moon, the dome, the chart's arcs on the right
  // (the moon's bloom reaches above that box, to the nav's rule: all of it is taken off)
  { disc: [MOON.cx, MOON.cy, MOON.end], f: 6 },
];

const zoneAt = (x, y) =>
  MOCK_ZONES.reduce((m, z) => {
    if (z.disc) return Math.max(m, 1 - smoothstep((Math.hypot(x - z.disc[0], y - z.disc[1]) - z.disc[2] + z.f) / z.f));
    const [x0, y0, x1, y1] = z.box;
    return Math.max(m, smoothstep((x - x0) / z.f) * smoothstep((x1 - 1 - x) / z.f) * smoothstep((y - y0) / z.f) * smoothstep((y1 - 1 - y) / z.f));
  }, 0);

async function sky() {
  const [C, Q, M] = [await rgb(raw("layer-sky-night-clear")), await rgb(raw("plate-night")), await rgb(MOCK)];
  const { W, H } = C;
  const px = Buffer.alloc(Q.data.length);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = repaintAt(x, y);
      const i = (y * W + x) * 3;
      for (let c = 0; c < 3; c++) px[i + c] = Math.round(Q.data[i + c] * (1 - t) + C.data[i + c] * t);
    }
  // the figures: the mock's own px, sharpened a touch (FIGURE_GAIN)
  const Mb = await rgb(await sharp(MOCK).removeAlpha().blur(1.2).png().toBuffer());
  const Ms = Buffer.from(M.data);
  for (let i = 0; i < Ms.length; i++) Ms[i] = Math.max(0, Math.min(255, Math.round(M.data[i] + FIGURE_GAIN * (M.data[i] - Mb.data[i]))));
  for (const f of FIGURES)
    for (let y = f.y0; y < f.y1; y++)
      for (let x = f.x0; x < f.x1; x++) {
        const edge = Math.min(x - f.x0, f.x1 - 1 - x, y - f.y0, f.y1 - 1 - y);
        const away = smoothstep((Math.hypot(x - COMPASS.x, y - COMPASS.y) - COMPASS.inner) / (COMPASS.outer - COMPASS.inner));
        const t = smoothstep(edge / f.feather) * away * clearOfUI(x, y);
        if (!t) continue;
        const i = (y * W + x) * 3;
        for (let c = 0; c < 3; c++) px[i + c] = Math.round(px[i + c] * (1 - t) + Ms[i + c] * t);
      }
  // the foot, quieted
  const calm = (x, y, t, limit) => {
    if (!t) return;
    const i = (y * W + x) * 3;
    const held = hold(px, i, limit);
    for (let c = 0; c < 3; c++) px[i + c] = Math.round(px[i + c] * (1 - t) + held[c] * t);
  };
  // each px held to within `slack` of its neighbourhood's median (never
  // raised): a flare's core and rays sink into the sky round them
  // (a flare's halo is wide: the median runs over 31px, on the two strips
  // sunk)
  const Pm = { data: Buffer.from(px) };
  for (const [y0, y1] of [[FOOT.y - 16, H], [GAP.y0 - 16, GAP.y1 + 16]]) {
    const strip = await sharp(px, { raw: { width: W, height: H, channels: 3 } }).extract({ left: 0, top: y0, width: W, height: y1 - y0 }).median(31).raw().toBuffer();
    strip.copy(Pm.data, y0 * W * 3);
  }
  const sink = (x, y, t, slack) => {
    if (!t) return;
    const i = (y * W + x) * 3;
    for (let c = 0; c < 3; c++) px[i + c] = Math.round(px[i + c] * (1 - t) + Math.min(px[i + c], Pm.data[i + c] + slack) * t);
  };
  for (let y = FOOT.y; y < H; y++)
    for (let x = FOOT.xl - FOOT.xfeather; x < FOOT.xr + FOOT.xfeather; x++)
      sink(x, y, smoothstep((y - FOOT.y) / FOOT.feather) * smoothstep((x - (FOOT.xl - FOOT.xfeather)) / FOOT.xfeather) * smoothstep((FOOT.xr + FOOT.xfeather - x) / FOOT.xfeather), FOOT.slack);
  for (let y = GAP.y0; y < GAP.y1; y++)
    for (let x = GAP.xl - GAP.xfeather; x < GAP.xr + GAP.xfeather; x++)
      sink(x, y, smoothstep(Math.min(y - GAP.y0 + 1, GAP.y1 - y) / GAP.feather) * smoothstep((x - (GAP.xl - GAP.xfeather)) / GAP.xfeather) * smoothstep((GAP.xr + GAP.xfeather - x) / GAP.xfeather), GAP.slack);
  // (the repaint's glint on the compass rose's upper point is a flare, the
  // mock's a small star: its core, too lit for the median to hold, is
  // gilded, taken to the gilt of the lines it sits on)
  for (let y = GLINT.y0; y < GLINT.y1; y++)
    for (let x = GLINT.x0; x < GLINT.x1; x++) {
      const t = smoothstep(Math.min(x - GLINT.x0 + 1, GLINT.x1 - x, y - GLINT.y0 + 1, GLINT.y1 - y) / GLINT.feather);
      calm(x, y, t, GLINT.t);
      const i = (y * W + x) * 3;
      const w = t * smoothstep((Math.min(px[i], px[i + 1], px[i + 2]) - 90) / 90);
      for (let c = 0; c < 3; c++) px[i + c] = Math.round(px[i + c] * (1 - w) + GILT[c] * w);
    }
  // The mock's own sky where the page hangs or draws things of its own: with
  // the border's px taken out (filled with the sky's own, `S`, and its
  // grain) and the moon's disc and bloom (the sprite carries them: filled
  // flat to the sky's, the bloom taken off the px round it).
  const [S, bloom, border] = [await skyOf(), bloomOf(M), await borderMatte()];
  const near = new Uint8Array(W * H);
  // (the fringe is taken out 2px round the matte, but never outside the
  // border's zone: a dial's stroke that crosses the zone's edge stands in the
  // plate up to it, as the frame draws it from there on)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (border.alpha[y * W + x] > 0.06)
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const [xx, yy] = [Math.min(W - 1, Math.max(0, x + dx)), Math.min(H - 1, Math.max(0, y + dy))];
            if (inFill(xx, yy)) near[yy * W + xx] = 1;
          }
  // the sky's grain, from its own px: the px's departure from its
  // neighbourhood's median, over the clear sky beside the moon
  let [gn, gs] = [0, 0];
  for (let y = 150; y < 230; y++) for (let x = 1360; x < 1400; x++) for (let c = 0; c < 3; c++) { const d = M.data[(y * W + x) * 3 + c] - S.data[(y * W + x) * 3 + c]; if (Math.abs(d) < 8) { gn++; gs += d * d; } }
  const grain = Math.sqrt(gs / gn);
  const rand = rng(97);
  const noise = await noiseField(W, H, 2, rand);
  // the sky a border px stood on: the median of the window's px that are not
  // gilt (a corner's strokes crowd a window, and their median is gilt-tinged,
  // a smear), at the px's own place (a window of 25px, widened if it is all gilt)
  const dark = (j) => (M.data[j * 3] + M.data[j * 3 + 1]) / 2 - M.data[j * 3 + 2] < -8;
  const skyAt = (x0, y0) => {
    // (the window stands 40px in from the mock's left, right and lower edges,
    // where its sky darkens, a few levels, in a vignette the plate must not
    // carry: the plate goes on past those edges, and a darker rim there is
    // a seam)
    const [x, y] = [Math.min(W - 41, Math.max(40, x0)), Math.min(H - 41, y0)];
    for (let r = 12; r <= 36; r += 12) {
      const v = [[], [], []];
      for (let yy = Math.max(0, y - r); yy <= Math.min(H - 1, y + r); yy++)
        for (let xx = Math.max(0, x - r); xx <= Math.min(W - 1, x + r); xx++) {
          const j = yy * W + xx;
          if (dark(j)) for (let c = 0; c < 3; c++) v[c].push(M.data[j * 3 + c]);
        }
      if (v[0].length > 40) return v.map((a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)]);
    }
    return [S.data[(y0 * W + x0) * 3], S.data[(y0 * W + x0) * 3 + 1], S.data[(y0 * W + x0) * 3 + 2]];
  };
  const filled = new Map();
  const fill = (i, c) => {
    if (!filled.has(i)) filled.set(i, skyAt(i % W, Math.floor(i / W)));
    return Math.max(0, Math.min(255, Math.round(filled.get(i)[c] + (noise[i] - 0.5) * grain * 3.4)));
  };
  const sky0 = bloom.base;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = zoneAt(x, y) * (1 - repaintAt(x, y));
      if (t < 0.003) continue;
      const i = y * W + x;
      // the mock's px here
      // (a dial's px are filled by the weight the frame takes of them)
      const fw = inEdge(x, y) ? 1 : near[i] ? (inBorder(x, y) || inFootUI(x, y) ? 1 : dialErase(x, y)) : 0;
      const m = [0, 1, 2].map((c) => (fw ? Math.round(M.data[i * 3 + c] * (1 - fw) + fill(i, c) * fw) : M.data[i * 3 + c]));
      const r = Math.hypot(x - MOON.cx, y - MOON.cy);
      if (r < MOON.end) {
        const b = bloom.at(r);
        const k = smoothstep((r - MOON.fill) / 3);
        for (let c = 0; c < 3; c++) {
          const flat = Math.max(0, Math.min(255, Math.round(sky0[c] + (noise[i] - 0.5) * grain * 3.4)));
          m[c] = Math.round(flat * (1 - k) + Math.max(0, m[c] - b[c]) * k);
        }
      }
      for (let c = 0; c < 3; c++) px[i * 3 + c] = Math.round(px[i * 3 + c] * (1 - t) + m[c] * t);
    }
  // what the repaint left of the lower left dial under the first card (the
  // card covers it at the mock's size; on another shape it shows past the
  // card's rule): that corner of the plate's own px, median-filtered, so its
  // thin gilt drops out
  for (const [x0, y0, x1, y1, f] of UNDER_CARD) {
    const m = 8;
    const patch = await sharp(px, { raw: { width: W, height: H, channels: 3 } }).extract({ left: x0 - m, top: y0 - m, width: x1 - x0 + 2 * m, height: y1 - y0 + 2 * m }).median(15).raw().toBuffer();
    const pw = x1 - x0 + 2 * m;
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const t = rectW(x, y, [x0, y0, x1, y1], [f, f, f, 0]);
        const [i, j] = [(y * W + x) * 3, ((y - y0 + m) * pw + (x - x0 + m)) * 3];
        for (let c = 0; c < 3; c++) px[i + c] = Math.round(px[i + c] * (1 - t) + patch[j + c] * t);
      }
  }
  for (const [x0, y0, x1, y1, f] of STRAYS.patches) {
    const m = 8;
    const pw = x1 - x0 + 2 * m;
    const patch = await sharp(px, { raw: { width: W, height: H, channels: 3 } }).extract({ left: x0 - m, top: y0 - m, width: pw, height: y1 - y0 + 2 * m }).median(15).raw().toBuffer();
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const t = rectW(x, y, [x0, y0, x1, y1], [f, f, f, f]);
        const [i, j] = [(y * W + x) * 3, ((y - y0 + m) * pw + (x - x0 + m)) * 3];
        for (let c = 0; c < 3; c++) px[i + c] = Math.round(px[i + c] * (1 - t) + Math.min(px[i + c], patch[j + c] + STRAYS.slack) * t);
      }
  }
  await png(px, W, H, 3, out("sky-night"));
}

/** Where the quiet field keeps the plate's own line: the constellation above
 *  the tagline's end, which the brand's field (it reaches up round the name)
 *  covers but no word stands under (the tagline starts at y84): quieted, it
 *  showed as a dim ghost of itself where the mock's is bright. */
const QUIET_KEEP = [
  { x0: 425, y0: -20, x1: 565, y1: 70, feather: 8 },
  // (and the star above the nav's rule, in the nav's field's feather)
  { x0: 1176, y0: 78, x1: 1222, y1: 112, feather: 6 },
];

async function quiet() {
  // star reduction, as an astrophotographer quiets a field: each pixel held
  // within `t` of its neighbourhood's median, so a glint's core and rays and
  // a constellation's line (a few px across, brighter by day too: darker
  // there, on the pale sky) sink into the sky round them while its tone and
  // its finest dust stay
  for (const [src, name, t] of [
    ["sky-night", "sky-quiet-night", 18],
    ["layer-sky-day-clear", "sky-quiet-day", 12],
  ]) {
    const C = await rgb(raw(src));
    const M = await rgb(await sharp(raw(src)).removeAlpha().median(13).png().toBuffer());
    const px = Buffer.alloc(C.data.length);
    for (let i = 0; i < px.length; i++) px[i] = Math.min(M.data[i] + t, Math.max(M.data[i] - t, C.data[i]));
    // the two figures keep their line: the field reaches over them (no word
    // stands there), and the reduction would blur them
    for (const f of [...FIGURES, ...QUIET_KEEP])
      for (let y = Math.max(0, f.y0); y < f.y1; y++)
        for (let x = f.x0; x < f.x1; x++) {
          const k = Math.min(x - f.x0, f.x1 - 1 - x, y - f.y0, f.y1 - 1 - y) / f.feather;
          const w = k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
          const i = (y * C.W + x) * 3;
          for (let c = 0; c < 3; c++) px[i + c] = Math.round(px[i + c] * (1 - w) + C.data[i + c] * w);
        }
    await png(px, C.W, C.H, 3, out(name));
  }
}

/** The night's moon sprite, from the mock's own px (art/raw/originals/
 *  atlas.png): its disc as the mock has it, to the limb, and its bloom, which
 *  the mock's sky has about it out to 70px (`bloomOf`), as the sprite's
 *  alpha. The disc is the mock's px lifted 4x (lanczos), so its craters keep
 *  the mock's contrast; beyond the limb the sprite is one pale-blue light
 *  whose alpha is the bloom's strength (its colour, over the plate's sky
 *  without the moon, gives the mock's px back at the mock's place: `sky`
 *  takes the same bloom off the plate). The sprite is square, 192 mock px
 *  across (`SPRITE`: the bloom runs out well inside it), at 4 px to a mock
 *  px; the kit sets the disc's size (atlas.css --a-moon-d, the disc's
 *  diameter in mock px: 2R). */
const SPRITE = { size: 192, up: 4, light: 110 };

async function moon() {
  const M = await rgb(MOCK);
  const { base, at } = bloomOf(M);
  const { size: S, up: U } = SPRITE;
  const N = S * U;
  const [x0, y0] = [Math.round(MOON.cx) - S / 2, Math.round(MOON.cy) - S / 2];
  const disc = await sharp(MOCK).removeAlpha().extract({ left: x0, top: y0, width: S, height: S }).resize(N, N, { kernel: "lanczos3" }).raw().toBuffer();
  // (the limb's centre in the crop's px: the mock's centre is its px index, a px's own centre being half in)
  const [ccx, ccy] = [(MOON.cx + 0.5 - x0) * U, (MOON.cy + 0.5 - y0) * U];
  // the bloom's light: one colour at each radius (the sky's own lifted by
  // the bloom's direction to a luminance of `SPRITE.light`), its alpha the
  // bloom's strength over that light, so over the sky without the moon
  // it gives the mock's px back
  const tone = (r) => {
    // (held at the bloom's colour 60px out, where its light is faint and its ratios noisy)
    const b = at(r);
    const dir = at(Math.min(r, 60));
    const lum = (v) => (v[0] + v[1] + v[2]) / 3;
    const k = lum(dir) > 0 ? SPRITE.light / lum(dir) : 0;
    return { alpha: Math.min(0.9, lum(b) / SPRITE.light), rgb: [0, 1, 2].map((c) => Math.max(0, Math.min(255, base[c] + dir[c] * k))) };
  };
  const px = Buffer.alloc(N * N * 4);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const r = Math.hypot(i + 0.5 - ccx, j + 0.5 - ccy) / U;
      if (r > MOON.end) continue;
      const t = smoothstep((r - MOON.R) / MOON.edge); // 0 on the disc, 1 beyond its limb
      const g = tone(Math.max(r, 42));
      const [a, o] = [(1 - t) + t * g.alpha, (j * N + i) * 4];
      for (let c = 0; c < 3; c++) px[o + c] = Math.round(disc[(j * N + i) * 3 + c] * (1 - t) + g.rgb[c] * t);
      px[o + 3] = Math.round(255 * a);
    }
  // (a hair of alpha at the canvas's corners keeps the kit's trim from
  // cropping it to the bloom's last visible px: the sprite stays 4 px to a mock px)
  for (const o of [0, (N - 1) * 4, (N - 1) * N * 4, ((N - 1) * N + N - 1) * 4]) {
    for (let c = 0; c < 3; c++) px[o + c] = Math.round(base[c]);
    px[o + 3] = 3;
  }
  await png(px, N, N, 4, out("moon-night-mock"));
}

async function foil() {
  // the gold button's face inside its inner rule (tile-signal), the mottled
  // leaf alone; the kit tiles it seamless and sets its tone (atlas.mjs fills)
  await sharp(raw("tile-signal")).extract({ left: 210, top: 250, width: 1750, height: 220 }).png().toFile(out("foil"));
}

/** The buttons, as the mock's, drawn at 4x their base (the kit prints a
 *  tile at 120px tall, half of that on the page: 1 page px is 8 of these px,
 *  `SP`). Their silhouettes are cut (chamfered at the corners, clear outside:
 *  the generated buttons were drawn on a square), so nothing shows round the
 *  rules. Measured on the mock at 1672x941 (its "Join the alpha" and "Try it
 *  live", 236x55 and 171x56px): the neutral's outer rule is 1.9px with the
 *  corners cut 6px, a 4px gap of the field, then a 1.3px inner rule 6px in,
 *  its corners cut 5px; the primary's is a 2px bright gilt rule, the corners
 *  cut 4px, then a navy keyline 1px wide 3.5px in, and a small curl (a ring
 *  ~4px across) in each corner inside it; no other rule crosses its face. */
const SP = 8;
const TILE_H = 480;
const chamfer = (x0, y0, x1, y1, c) => `M${x0 + c} ${y0} H${x1 - c} L${x1} ${y0 + c} V${y1 - c} L${x1 - c} ${y1} H${x0 + c} L${x0} ${y1 - c} V${y0 + c} Z`;

async function tiles() {
  // the neutral button: the field (the generated button's face, cropped to
  // the plate) in two fine gold rules, both chamfered
  const w = 300 * 4;
  const h = TILE_H;
  // (the mock's night rules are two lines of the window's gold, worn: its
  // px run 150-198 / 115-166 / 72-108 along both; the day's keep their one
  // ink, unworn)
  for (const [src, name, ink, inner, wear] of [
    ["tile-night", "tile-night-fine", "#c29b58", "#b08b50", true],
    ["tile-day", "tile-day-fine", "#a37c36", "#a37c36", false],
  ]) {
    const face = await sharp(raw(src)).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    const { width: fw, height: fh } = face.info;
    const field = await sharp(face.data).extract({ left: 90, top: 90, width: fw - 180, height: fh - 180 }).resize(w, h, { fit: "cover" }).removeAlpha().png().toBuffer();
    const rule = (at, width) => [at * SP, width * SP];
    const [oa, ow] = rule(0.95, 1.9); // the outer rule, centred on its own middle
    const [ia, iw] = rule(6.65, 1.3);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs><clipPath id="c"><path d="${chamfer(0, 0, w, h, 6 * SP)}"/></clipPath></defs>
      <g clip-path="url(#c)">
        <path d="${chamfer(oa, oa, w - oa, h - oa, 6 * SP - oa * 0.41)}" fill="none" stroke="${ink}" stroke-width="${ow}" stroke-linejoin="miter"/>
        <path d="${chamfer(ia, ia, w - ia, h - ia, 5 * SP - ia * 0.41)}" fill="none" stroke="${inner}" stroke-width="${iw}" stroke-linejoin="miter"/>
      </g></svg>`;
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><path d="${chamfer(0, 0, w, h, 6 * SP)}" fill="#fff"/></svg>`);
    const cut = await sharp(field).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
    const lines = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (wear) {
      // the leaf worn as the mock's: mottled in tone along the rule, flecked
      // through in places (the same recipe as the frames', `worn`)
      const rand = rng(211);
      const [nMottle, nWear, nGrain] = [await noiseField(w, h, 36, rand), await noiseField(w, h, 12, rand), await noiseField(w, h, 3, rand)];
      for (let i = 0; i < w * h; i++) {
        const o = i * 4;
        if (!lines.data[o + 3]) continue;
        const t = 0.84 + 0.32 * nMottle[i] + 0.12 * (nGrain[i] - 0.5);
        for (let c = 0; c < 3; c++) lines.data[o + c] = Math.max(0, Math.min(255, Math.round(lines.data[o + c] * t)));
        lines.data[o + 3] = Math.round(lines.data[o + 3] * (1 - 0.75 * smooth01(0.72, 0.84, nWear[i] * 0.7 + nGrain[i] * 0.3)));
      }
    }
    const rules = await sharp(lines.data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
    await sharp(cut).composite([{ input: rules }]).png().toFile(out(name));
  }
  await signal();
}

/** The primary: a plate of weathered parchment-gold leaf. The generated leaf
 *  (the foil raw, a smooth saturated yellow) is toned to the mock's plate
 *  (its px at the left of the words: 214,172,91, 8-9 of spread), its mottle
 *  kept, under the mock's rules: a bright rim, a navy keyline just inside
 *  it, and a small curl in each corner (no second rule across the face). */
const PLATE_LEAF = { mean: [213, 171, 88], spread: 14 };

async function signal() {
  const w = 430 * 4;
  const h = TILE_H;
  const F = await sharp(raw("foil")).removeAlpha().resize({ height: 440, kernel: "lanczos3" }).extract({ left: 300, top: 0, width: w, height: 440 }).extend({ top: 20, bottom: 20, extendWith: "mirror" }).raw().toBuffer({ resolveWithObject: true });
  const n = w * h;
  const mu = [0, 0, 0];
  for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) mu[c] += F.data[i * 3 + c] / n;
  let v = 0;
  for (let i = 0; i < n; i++) v += (0.3 * (F.data[i * 3] - mu[0]) + 0.59 * (F.data[i * 3 + 1] - mu[1]) + 0.11 * (F.data[i * 3 + 2] - mu[2])) ** 2;
  const g = PLATE_LEAF.spread / Math.sqrt(v / n);
  const px = Buffer.alloc(n * 3);
  for (let i = 0; i < n * 3; i++) {
    const c = i % 3;
    px[i] = Math.max(0, Math.min(255, Math.round(PLATE_LEAF.mean[c] + g * (F.data[i] - mu[c]) * [1, 1, 0.9][c])));
  }
  const edge = (c) => chamfer(0, 0, w, h, c * SP);
  // (the mock's, measured on it: a rim of pale gilt, a keyline of warm black
  // 3.5px in with a gilt hairline inside it, the corners cut and an inset
  // bracket in each, no rivets)
  const KEYLINE = "#2a1b0a";
  const bracket = ([sx, sy]) => {
    // (its elbow 7px in from the corner, its arms 5px along the rules)
    const [cx, cy] = [sx > 0 ? 7 * SP : w - 7 * SP, sy > 0 ? 7 * SP : h - 7 * SP];
    return `<path d="M${cx + sx * 5 * SP} ${cy} H${cx} V${cy + sy * 5 * SP}" stroke="${KEYLINE}" stroke-width="${0.85 * SP}" stroke-linejoin="miter"/>`;
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><clipPath id="c"><path d="${edge(4)}"/></clipPath></defs>
    <g clip-path="url(#c)" fill="none">
      <path d="${chamfer(1 * SP, 1 * SP, w - 1 * SP, h - 1 * SP, 3 * SP)}" stroke="#eccf8c" stroke-width="${2 * SP}"/>
      <path d="${chamfer(3.55 * SP, 3.55 * SP, w - 3.55 * SP, h - 3.55 * SP, 3.1 * SP)}" stroke="${KEYLINE}" stroke-width="${1.3 * SP}" stroke-linejoin="miter"/>
      <path d="${chamfer(4.9 * SP, 4.9 * SP, w - 4.9 * SP, h - 4.9 * SP, 3.5 * SP)}" stroke="#f4dd9f" stroke-opacity="0.8" stroke-width="${0.65 * SP}" stroke-linejoin="miter"/>
      ${[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(bracket).join("")}
    </g></svg>`;
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><path d="${edge(4)}" fill="#fff"/></svg>`);
  const face = await sharp(px, { raw: { width: w, height: h, channels: 3 } }).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  await sharp(face).composite([{ input: Buffer.from(svg) }]).png().toFile(out("tile-signal-fine"));
}

/** The plate's bleed (kit.css registers a plate style's sky to the stage,
 *  and a frame wider or taller than the stage shows past the plate): 320px
 *  each side and below, the core at (320, 0). The core is pasted back over
 *  its continuation with a feather of 2px only (`feather`): the continuation
 *  draws the chart's arcs and the dials differently from the core (the
 *  mock's), so across a wide feather they print twice, and on a 16:9 screen,
 *  where the viewport's edge is the core's, that is the first thing seen
 *  (a second copy of each arc, a few px off, spilling past the border's
 *  line). The continuation's tone is brought to the core's along the seam,
 *  fading out over 200px (`reach`). `canvas`, which lays the night's core
 *  over its continuation as the picture the day's edit is made from, keeps
 *  its own wide feather (`CANVAS_FEATHER`). */
const BLEED = { x: 320, bottom: 320, feather: 2, band: 16, sigma: 32, reach: 200 };
const CANVAS_FEATHER = 24;

/** The core's tone less the continuation's along the seam, per channel, as
 *  a smooth field over the core: a normalized convolution of the
 *  difference within `band` px of the left, right and bottom edges (the
 *  structure the two paint differently averages out; what is left is the
 *  tone the seam would show), worked at a quarter scale. Returns a sampler
 *  at core px (clamped to the core). */
const seamTone = (C, G, W) => {
  const q = 4;
  const [w, h] = [Math.ceil(C.W / q), Math.ceil(C.H / q)];
  // the sky's own luminance in each canvas, along the seam (its median there)
  const mid = { C: 0, G: 0 };
  for (const [key, A, at] of [["C", C, (x, y) => (y * C.W + x) * 3], ["G", G, (x, y) => (y * W + x + BLEED.x) * 3]]) {
    const v = [];
    for (let y = 0; y < C.H; y += 3) for (let x = 0; x < C.W; x += 3) if (Math.min(x, C.W - 1 - x, C.H - 1 - y) < BLEED.band) { const i = at(x, y); v.push((A.data[i] + A.data[i + 1] + A.data[i + 2]) / 3); }
    mid[key] = v.sort((p, q) => p - q)[v.length >> 1];
  }
  const dm = new Float32Array(w * h * 3);
  const m = new Float32Array(w * h);
  for (let y = 0; y < C.H; y++)
    for (let x = 0; x < C.W; x++) {
      if (Math.min(x, C.W - 1 - x, C.H - 1 - y) >= BLEED.band) continue;
      const [i, j, k] = [(y * C.W + x) * 3, (y * W + x + BLEED.x) * 3, Math.floor(y / q) * w + Math.floor(x / q)];
      // (the sky's tone, not its stars': the dust of each canvas lifts its mean, and a
      // seam toned by the means is left a step in the sky between them)
      if (Math.abs((C.data[i] + C.data[i + 1] + C.data[i + 2]) / 3 - mid.C) > 20 || Math.abs((G.data[j] + G.data[j + 1] + G.data[j + 2]) / 3 - mid.G) > 20) continue;
      for (let c = 0; c < 3; c++) dm[k * 3 + c] += C.data[i + c] - G.data[j + c];
      m[k] += 1;
    }
  // a separable gaussian, the edges held
  const s = BLEED.sigma / q;
  const r = Math.ceil(3 * s);
  const kern = Array.from({ length: 2 * r + 1 }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * s * s)));
  const blur = (src, n) => {
    const pass = (a, dx, dy) => {
      const o = new Float32Array(a.length);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++)
          for (let t = -r; t <= r; t++) {
            const [xx, yy] = [Math.min(w - 1, Math.max(0, x + t * dx)), Math.min(h - 1, Math.max(0, y + t * dy))];
            for (let c = 0; c < n; c++) o[(y * w + x) * n + c] += kern[t + r] * a[(yy * w + xx) * n + c];
          }
      return o;
    };
    return pass(pass(src, 1, 0), 0, 1);
  };
  const [bd, bm] = [blur(dm, 3), blur(m, 1)];
  return (x, y) => {
    // bilinear, at the quarter grid's centres
    const [fx, fy] = [Math.min(w - 1, Math.max(0, (x + 0.5) / q - 0.5)), Math.min(h - 1, Math.max(0, (y + 0.5) / q - 0.5))];
    const [x0, y0] = [Math.floor(fx), Math.floor(fy)];
    const [x1, y1] = [Math.min(w - 1, x0 + 1), Math.min(h - 1, y0 + 1)];
    const [tx, ty] = [fx - x0, fy - y0];
    const at = (xx, yy, c) => (bm[yy * w + xx] > 1e-3 ? bd[(yy * w + xx) * 3 + c] / bm[yy * w + xx] : 0);
    return [0, 1, 2].map((c) => (at(x0, y0, c) * (1 - tx) + at(x1, y0, c) * tx) * (1 - ty) + (at(x0, y1, c) * (1 - tx) + at(x1, y1, c) * tx) * ty);
  };
};

/** The night's generated canvas, 2312 x 1301 (BLEED's frame and the lower
 *  40px past it), from its two generations: the sides' (the half-dial
 *  completed, the grid, the forest and clouds past the dome, the corners'
 *  dials) and the foot's, which runs the starfield on under the painting
 *  where the sides' generation ran a rippled lake, a second horizon under
 *  the cards. The foot's is laid over the sides' across the middle,
 *  middle of the core's width: the
 *  corners' dials stay the sides': the foot's takes over `left` px in from
 *  the core's left edge and gives back `right` px short of its right one,
 *  each across `ramp` px (the dials' arcs differ between the two, so a short
 *  ramp, clear of the dials, keeps the ghosting off the page). */
const NIGHT_GENS = { sides: "sky-night-bleed", foot: "sky-night-bleed-foot", left: 180, right: 42, ramp: 80 };

const generated = (name, W, H) => sharp(raw(name)).resize(W, H, { fit: "fill", kernel: "lanczos3" }).png().toBuffer().then(rgb);

async function nightCanvas(W, H) {
  const [A, B] = [await generated(NIGHT_GENS.sides, W, H), await generated(NIGHT_GENS.foot, W, H)];
  const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const px = Buffer.alloc(A.data.length);
  const [x0, x1] = [BLEED.x, W - BLEED.x];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const m = smooth((x - x0 - NIGHT_GENS.left) / NIGHT_GENS.ramp) * smooth((x1 - NIGHT_GENS.right - x) / NIGHT_GENS.ramp);
      const i = (y * W + x) * 3;
      for (let c = 0; c < 3; c++) px[i + c] = Math.round(A.data[i + c] * (1 - m) + B.data[i + c] * m);
    }
  return { data: px, W, H };
}

/** The core laid back over a generated canvas, feathered on its left, right
 *  and bottom edges: the picture the day's edit is made from. */
async function canvas() {
  const [W, H] = [1672 + 2 * BLEED.x, Math.round(((1672 + 2 * BLEED.x) * 941) / 1672)];
  const G = await nightCanvas(W, H);
  const C = await rgb(raw("sky-night"));
  const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const px = Buffer.from(G.data);
  for (let y = 0; y < C.H; y++)
    for (let x = 0; x < C.W; x++) {
      const t = smooth(Math.min(x, C.W - 1 - x, C.H - 1 - y) / CANVAS_FEATHER);
      if (!t) continue;
      const [i, j] = [(y * C.W + x) * 3, (y * W + x + BLEED.x) * 3];
      for (let c = 0; c < 3; c++) px[j + c] = Math.round(px[j + c] * (1 - t) + C.data[i + c] * t);
    }
  await png(px, W, H, 3, out("sky-night-canvas"));
}

/** The generated canvases' lower corners, plain: the generator drew a full
 *  ring dial in each (the left's at x0-495 y780-1260, the right's from x1900)
 *  and a cliff with water beside the right frame, and the border's own dials
 *  are the frame's now (DIALS), pinned to the viewport's corners. A dial left
 *  here would stand beside the frame's, and on a frame taller than 16:9 the
 *  one under the core's foot is cut by the core's edge. Each corner is the
 *  canvas mirrored about `axis` (the starfield beside it: dust, a few stars,
 *  a faint arc), weighted in over `f` px from the box's inner edges; the
 *  core is pasted back over the middle after, so only what lies past the
 *  core's own edges (the sides, the foot) shows. Boxes are in canvas px. */
const CLEAN = [
  { box: [-1e4, 740, 600, 1e4], axis: 640, f: [0, 40, 70, 0] },
  { box: [1700, 770, 1e4, 1e4], axis: 1700, f: [70, 40, 0, 0] },
];
function cleanCorners(data, W, H) {
  const src = Buffer.from(data);
  for (const { box, axis, f } of CLEAN)
    for (let y = Math.max(0, box[1]); y < H; y++)
      for (let x = Math.max(0, box[0]); x < Math.min(W, box[2]); x++) {
        const t = rectW(x, y, box, f);
        const xs = Math.min(W - 1, Math.max(0, 2 * axis - x));
        if (!t) continue;
        const [i, j] = [(y * W + x) * 3, (y * W + xs) * 3];
        for (let c = 0; c < 3; c++) data[i + c] = Math.round(src[i + c] * (1 - t) + src[j + c] * t);
      }
}

/** The night canvas under the core's foot: the generated starfield there is
 *  denser, in larger and brighter dots, than the mock's foot above it, which is
 *  calm (a fine dust, a few stars: 4 of grain against 10 in the canvas), so
 *  the core's edge showed as a line where the dust thickened. The dust comes
 *  in over `reach` px, from `from` px under the foot: the canvas with its
 *  stars, dots and thin arcs taken out (`lit` and its halo) and the mock's
 *  grain laid on it, mixed into the canvas by distance. The grain is 3 (the
 *  first build's 3.6 left the grain a fifth rougher under the foot than on
 *  it, a line a taller frame shows when its brightness is raised). */
const FOOT_DUST = { from: 16, reach: 150, lit: 33, halo: 4, blur: 12, grain: 3 };

/** An image's sky without what stands out of it: the px of `lit` (0..1, a
 *  float field), grown by `halo` px, are left out, and the rest blurred over
 *  them (a normalized convolution by `blur` px, worked at a quarter scale).
 *  Returns the sky as RGB, whole image; where nothing is left to blur from,
 *  black. */
function skyWithout(data, W, H, lit, halo, blur) {
  const keep = erode(lit, W, H, -halo).map((v) => 1 - v);
  const q = 4;
  const [w, h] = [Math.ceil(W / q), Math.ceil(H / q)];
  const [sum, cnt] = [new Float32Array(w * h * 3), new Float32Array(w * h)];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const [k, i] = [Math.floor(y / q) * w + Math.floor(x / q), y * W + x];
      if (!keep[i]) continue;
      cnt[k] += 1;
      for (let c = 0; c < 3; c++) sum[k * 3 + c] += data[i * 3 + c];
    }
  const s0 = blur / q;
  const r0 = Math.ceil(3 * s0);
  const kern = Array.from({ length: 2 * r0 + 1 }, (_, i) => Math.exp(-((i - r0) ** 2) / (2 * s0 * s0)));
  const gauss = (src, n) => {
    const pass = (a, dx, dy) => {
      const o = new Float32Array(a.length);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++)
          for (let t = -r0; t <= r0; t++) {
            const [xx, yy] = [Math.min(w - 1, Math.max(0, x + t * dx)), Math.min(h - 1, Math.max(0, y + t * dy))];
            for (let c = 0; c < n; c++) o[(y * w + x) * n + c] += kern[t + r0] * a[(yy * w + xx) * n + c];
          }
      return o;
    };
    return pass(pass(src, 1, 0), 0, 1);
  };
  const [bs, bc] = [gauss(sum, 3), gauss(cnt, 1)];
  const calm = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      // bilinear, at the quarter grid's centres
      const [fx, fy] = [Math.min(w - 1, Math.max(0, (x + 0.5) / q - 0.5)), Math.min(h - 1, Math.max(0, (y + 0.5) / q - 0.5))];
      const [x0, y0] = [Math.floor(fx), Math.floor(fy)];
      const [x1, y1] = [Math.min(w - 1, x0 + 1), Math.min(h - 1, y0 + 1)];
      const [tx, ty] = [fx - x0, fy - y0];
      for (let c = 0; c < 3; c++) {
        const at = (xx, yy) => (bc[yy * w + xx] > 1e-3 ? bs[(yy * w + xx) * 3 + c] / bc[yy * w + xx] : 0);
        calm[(y * W + x) * 3 + c] = Math.round((at(x0, y0) * (1 - tx) + at(x1, y0) * tx) * (1 - ty) + (at(x0, y1) * (1 - tx) + at(x1, y1) * tx) * ty);
      }
    }
  return { calm, keep };
}

async function calmFoot(full, W, H) {
  // the sky without its stars: the px that stand out of it, with their halos
  const lit = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) lit[i] = (full.data[i * 3] + full.data[i * 3 + 1] + full.data[i * 3 + 2]) / 3 > FOOT_DUST.lit ? 1 : 0;
  const { calm } = skyWithout(full.data, W, H, lit, FOOT_DUST.halo, FOOT_DUST.blur);
  const noise = await noiseField(W, H, 2, rng(53));
  let [mean, sq] = [0, 0];
  for (const v of noise) mean += v / noise.length;
  for (const v of noise) sq += (v - mean) ** 2 / noise.length;
  const k = FOOT_DUST.grain / Math.sqrt(sq);
  for (let y = 941; y < H; y++) {
    const r = smoothstep((y - 941 - FOOT_DUST.from) / FOOT_DUST.reach);
    if (r >= 1) continue;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      const n = (noise[y * W + x] - mean) * k;
      for (let c = 0; c < 3; c++) full.data[i + c] = Math.max(0, Math.min(255, Math.round((calm[i + c] + n * [0.8, 1, 1.1][c]) * (1 - r) + full.data[i + c] * r)));
    }
  }
}

/** The day core's lower corner dials, taken out as the night's are (they are
 *  the frame's: DIALS). The day edit drew them as the night's but not to the
 *  px, bigger at the right (an armillary over the cliff), so the boxes have
 *  room round the mock's, and stop short of the cliff's rock (a smear of
 *  sky where its lines are painted out): the lines over it stay, as the
 *  armillary the plate draws there. In them the gilt (the brown of the engraving: red over blue, in
 *  px and in a halo of 3) is painted over with the sky round it (skyWithout):
 *  the lake's blue and the cream of the foot stay, as the rock does. */
const DAY_DIALS = [
  { box: [-1e4, 776, 214, 1e4], f: [0, 26, 26, 0] },
  { box: [1592, 826, 1e4, 1e4], f: [0, 30, 0, 0] },
  { box: [1440, 856, 1e4, 1e4], f: [26, 26, 0, 0] },
];

function clearDayDials(C) {
  const { data, W, H } = C;
  const lit = new Float32Array(W * H);
  // (the engraving: brown, red over green over blue; a lake or a rock is not)
  for (let i = 0; i < W * H; i++) {
    const [r, g, b] = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
    lit[i] = r - b > 58 && r > g - 6 ? 1 : 0;
  }
  const { calm, keep } = skyWithout(data, W, H, lit, 3, 10);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = Math.max(...DAY_DIALS.map(({ box, f }) => rectW(x, y, box, f))) * (1 - keep[y * W + x]);
      if (!t) continue;
      const i = (y * W + x) * 3;
      for (let c = 0; c < 3; c++) data[i + c] = Math.round(data[i + c] * (1 - t) + calm[i + c] * t);
    }
}

/** The core's foot, where a frame taller than 16:9 shows it: the mock's last
 *  rows are the sky under its border, and keep the shade the border's rails
 *  cast (two rows a few levels darker than the sky, 4 px under each rail),
 *  and the continuation under them starts a level or so darker than the core
 *  ends, so a taller frame shows a hairline and a step across the sky about
 *  where the core ends (the frame hides both at 16:9, where the foot is the
 *  viewport's). The night's only: the day's foot is one smooth wash. The
 *  sky's tone there is smoothed along y: each row's tone
 *  (the px that stand out of it left out, a gaussian of `sx` px along the
 *  row) is brought to its own gaussian over `sy` rows, `above` rows into
 *  the core and `below` under it, by an offset that fades to nothing at the
 *  zone's ends. Only the sky's tone moves (a few levels at most: the rails'
 *  shade rows by 3, the step by a level either side of it); stars, lines and
 *  grain stay as they are, a seeded dither keeping the offset from banding. */
const FOOT_SEAM = { above: 26, below: 64, sx: 48, sy: 16, taper: 14, thr: 7 };

async function smoothFootSeam(px, W) {
  const { above, below, sx, sy, taper, thr } = FOOT_SEAM;
  const [y0, y1] = [H0 - above, H0 + below];
  const n = y1 - y0;
  const strip = Buffer.from(px.subarray(y0 * W * 3, y1 * W * 3));
  const med = (await sharp(strip, { raw: { width: W, height: n, channels: 3 } }).median(15).raw().toBuffer());
  const lum = (b, i) => (b[i] + b[i + 1] + b[i + 2]) / 3;
  // what stands out of the sky: a px more than `thr` off its neighbourhood's median, and the px beside it
  const lit = new Uint8Array(W * n);
  for (let i = 0; i < W * n; i++) lit[i] = Math.abs(lum(strip, i * 3) - lum(med, i * 3)) > thr ? 1 : 0;
  const keep = new Float32Array(W * n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < W; x++) {
      let on = 1;
      for (let dx = -1; dx <= 1 && on; dx++) {
        const xx = Math.min(W - 1, Math.max(0, x + dx));
        if (lit[y * W + xx] || (y > 0 && lit[(y - 1) * W + xx]) || (y < n - 1 && lit[(y + 1) * W + xx])) on = 0;
      }
      keep[y * W + x] = on;
    }
  const kx = Array.from({ length: 6 * sx + 1 }, (_, i) => Math.exp(-((i - 3 * sx) ** 2) / (2 * sx * sx)));
  // each row's tone as a smooth function of x (normalized convolution over the sky px)
  const T = new Float32Array(W * n * 3);
  for (let y = 0; y < n; y++) {
    for (let c = 0; c < 3; c++) {
      const [num, den] = [new Float32Array(W), new Float32Array(W)];
      for (let x = 0; x < W; x++) {
        const k = keep[y * W + x];
        if (k) { num[x] = strip[(y * W + x) * 3 + c]; den[x] = 1; }
      }
      // prefix sums make the gaussian a few passes of box sums: a plain loop is cheap enough at this size
      for (let x = 0; x < W; x++) {
        let [a, b] = [0, 0];
        for (let t = -3 * sx; t <= 3 * sx; t++) {
          const xx = x + t;
          if (xx < 0 || xx >= W) continue;
          const w = kx[t + 3 * sx];
          a += w * num[xx];
          b += w * den[xx];
        }
        T[(y * W + x) * 3 + c] = b > 1e-3 ? a / b : strip[(y * W + x) * 3 + c];
      }
    }
  }
  // the same, smoothed down the rows (the zone's ends held)
  const ky = Array.from({ length: 6 * sy + 1 }, (_, i) => Math.exp(-((i - 3 * sy) ** 2) / (2 * sy * sy)));
  const rand = rng(97);
  const [lo, hi] = [0, n - 1];
  for (let x = 0; x < W; x++)
    for (let c = 0; c < 3; c++) {
      for (let y = 0; y < n; y++) {
        let [a, b] = [0, 0];
        for (let t = -3 * sy; t <= 3 * sy; t++) {
          const yy = Math.min(hi, Math.max(lo, y + t));
          const w = ky[t + 3 * sy];
          a += w * T[(yy * W + x) * 3 + c];
          b += w;
        }
        const S = a / b;
        const fade = Math.min(smoothstep(y / taper), smoothstep((n - 1 - y) / taper));
        const d = (S - T[(y * W + x) * 3 + c]) * fade;
        const j = ((y0 + y) * W + x) * 3 + c;
        px[j] = Math.max(0, Math.min(255, Math.round(px[j] + d + (rand() - 0.5))));
      }
    }
}

/** The chart run on under the core's foot. The continuation there is the
 *  starfield going on (the generation drew it so, with no water: the foot
 *  brief), which is calm beside the mock's top half, all arcs and
 *  constellation lines. The chart's own device is added to it: constellation
 *  lines, thin gold runs from star to star (dashed as the chart's dotted
 *  lines are, or fine and unbroken), a run of 3 to 5 stars, with the small
 *  gold dot the mock sets at each star of a figure. A run's stars are the
 *  plate's own where there is one within `snap` px of where the run goes,
 *  else a new small star. Runs start on a jittered grid (seeded: a rebuild is
 *  the same chart, and no run repeats another), turn by no more than `bend`,
 *  and are left out where the way is not clear of the plate's own lines or
 *  of another run. They start `from` px under the foot, clear of its calm.
 *  The runs are found on the night plate and laid on the day's (the two
 *  register) each in its own ink: the night's gold, the day's bronze. */
const CHART = {
  from: 64, // px under the core's foot where the runs may begin
  edge: 16, // px kept clear at the canvas's foot
  seed: 131,
  cell: [240, 120], // the grid the runs start on, px
  fill: 0.75, // the share of its cells that start a run
  steps: [3, 5], // a run's stars, fewest and most
  reach: [75, 180], // a run's step, px
  bend: 70, // the most a run turns at a star, degrees
  snap: 26, // a star this near where a run goes is the run's
  minStar: 600, // its glow (mass), at least, to be snapped to
  gap: 5, // a line stops this short of a star's centre
  night: { rgb: [226, 182, 92], core: "#fff1c4", alpha: 0.8 },
  day: { rgb: [122, 84, 34], core: "#5b3e14", alpha: 0.85 },
};

/** The plate's stars: the local peaks of its red channel (a star's gold or
 *  white; the sky's blue has none), each with its mass, the glow about it.
 *  Returns them with the blurred channel (what is lit on the plate). */
async function chartStars(px, W, H) {
  const L = await sharp(px, { raw: { width: W, height: H, channels: 3 } }).extractChannel(0).blur(1.4).raw().toBuffer();
  const R = 8;
  const found = [];
  for (let y = H0 + CHART.from - 20; y < H - CHART.edge + 20 && y < H - R; y++)
    for (let x = R; x < W - R; x++) {
      const v = L[y * W + x];
      if (v < 90) continue;
      let top = true;
      for (let dy = -R; dy <= R && top; dy++)
        for (let dx = -R; dx <= R; dx++) {
          const o = L[(y + dy) * W + x + dx];
          if ((dx || dy) && (o > v || (o === v && (dy < 0 || (dy === 0 && dx < 0))))) { top = false; break; }
        }
      if (!top) continue;
      let mass = 0;
      for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) if (dx * dx + dy * dy <= 81) mass += Math.max(0, L[(y + dy) * W + x + dx] - 60);
      if (mass >= CHART.minStar) found.push({ x, y, mass });
    }
  return { stars: found, L };
}

/** Whether the way from a to b is clear of the plate's own lines: its px, but
 *  for the stars' ends, are sky (a few small stars lying on the way do no harm). */
const clearWay = (L, W, a, b) => {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  let hits = 0;
  for (let t = 14; t < len - 14; t += 2) {
    const [x, y] = [Math.round(a.x + ((b.x - a.x) * t) / len), Math.round(a.y + ((b.y - a.y) * t) / len)];
    let m = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) m = Math.max(m, L[(y + dy) * W + x + dx]);
    if (m > 95) hits++;
  }
  return hits <= 3;
};

/** whether the segments pq and rs cross, or come within `near` px of it */
const meets = (p, q, r, s, near = 10) => {
  const side = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  if (side(p, q, r) * side(p, q, s) < 0 && side(r, s, p) * side(r, s, q) < 0) return true;
  const toSeg = (c, a, b) => {
    const [dx, dy] = [b.x - a.x, b.y - a.y];
    const t = Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(c.x - (a.x + t * dx), c.y - (a.y + t * dy));
  };
  return Math.min(toSeg(p, r, s), toSeg(q, r, s), toSeg(r, p, q), toSeg(s, p, q)) < near;
};

/** The runs: segments between nodes, each node a star of the plate or a new
 *  one (`own: true`), see CHART. */
function chartRuns({ stars, L }, W, H) {
  const rand = rng(CHART.seed);
  const segs = [];
  const nodes = [];
  const taken = new Set();
  const [x0, x1, y0, y1] = [28, W - 28, H0 + CHART.from, H - CHART.edge];
  const snap = (p) => {
    let best = null;
    for (const c of stars) {
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d <= CHART.snap && !taken.has(c) && (!best || d < best.d)) best = { c, d };
    }
    if (best) { taken.add(best.c); return { x: best.c.x, y: best.c.y }; }
    return { x: Math.round(p.x), y: Math.round(p.y), own: true };
  };
  const inside = (p) => p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1;
  for (let gy = y0; gy < y1; gy += CHART.cell[1])
    for (let gx = x0; gx < x1; gx += CHART.cell[0]) {
      const start = { x: gx + rand() * CHART.cell[0], y: gy + rand() * CHART.cell[1] };
      if (rand() > CHART.fill || !inside(start)) continue;
      let p = snap(start);
      const first = p;
      let dir = rand() * 2 * Math.PI;
      const count = CHART.steps[0] + Math.floor(rand() * (CHART.steps[1] - CHART.steps[0] + 1));
      const mine = [];
      let placed = 1;
      while (placed < count) {
        let next = null;
        let ang = dir;
        for (let tries = 0; tries < 10 && !next; tries++) {
          ang = dir + ((rand() * 2 - 1) * CHART.bend * Math.PI) / 180;
          const d = CHART.reach[0] + rand() * (CHART.reach[1] - CHART.reach[0]);
          const q = { x: p.x + Math.cos(ang) * d, y: p.y + Math.sin(ang) * d };
          if (!inside(q)) continue;
          const cand = snap(q);
          if (!clearWay(L, W, p, cand) || segs.some((g) => meets(p, cand, g.a, g.b, g.a === p || g.b === p ? 0 : 12)) || nodes.some((n) => n !== p && Math.hypot(n.x - cand.x, n.y - cand.y) < 45)) continue;
          next = cand;
        }
        if (!next) break;
        segs.push({ a: p, b: next, solid: rand() < 0.25 });
        mine.push(next);
        dir = Math.atan2(next.y - p.y, next.x - p.x);
        p = next;
        placed++;
      }
      if (mine.length) nodes.push(first, ...mine);
    }
  return { segs, nodes: nodes.filter((n) => n.own) };
}

/** The runs, laid over a plate (raw RGB) in an ink, drawn as an SVG overlay
 *  at the plate's own size: thin, dashed as the chart's dotted lines are
 *  (a quarter of them fine and unbroken), stopping short of the stars so
 *  their glints stand clear of the line, with a small dot at each new star. */
async function chartDraw(px, W, H, { segs, nodes }, ink) {
  const { rgb: [r, g, b], alpha } = ink;
  const gap = CHART.gap;
  const lines = segs
    .map(({ a, b: e, solid }) => {
      const len = Math.hypot(e.x - a.x, e.y - a.y);
      const [ux, uy] = [(e.x - a.x) / len, (e.y - a.y) / len];
      const [x1, y1, x2, y2] = [a.x + ux * gap, a.y + uy * gap, e.x - ux * gap, e.y - uy * gap];
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="${solid ? 1 : 1.3}" ${solid ? 'stroke-opacity="0.6"' : 'stroke-dasharray="6 2.6"'}/>`;
    })
    .join("");
  // a new star is a small four-point sparkle of the chart's own sort: a long
  // thin cross about a bright core, its size varied by where it stands
  const stars = nodes
    .map(({ x, y }) => {
      const [arm, w] = [6 + ((x * 7 + y * 13) % 5), 1.1];
      const d = [[0, -arm], [w, -w], [arm, 0], [w, w], [0, arm], [-w, w], [-arm, 0], [-w, -w]].map(([px_, py]) => `${(x + px_).toFixed(1)},${(y + py).toFixed(1)}`).join(" ");
      return `<circle cx="${x}" cy="${y}" r="6.5" fill="url(#node)"/><polygon points="${d}" fill="url(#core)"/><circle cx="${x}" cy="${y}" r="1.7" fill="${ink.core}"/>`;
    })
    .join("");
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><g stroke="rgb(${r},${g},${b})" stroke-opacity="${alpha}" stroke-linecap="round" fill="none">${lines}</g><defs><radialGradient id="node"><stop offset="0" stop-color="rgb(${r},${g},${b})" stop-opacity="0.35"/><stop offset="1" stop-color="rgb(${r},${g},${b})" stop-opacity="0"/></radialGradient><linearGradient id="core"><stop offset="0" stop-color="${ink.core}"/><stop offset="1" stop-color="rgb(${r},${g},${b})"/></linearGradient></defs><g>${stars}</g></svg>`,
  );
  const out = await sharp(px, { raw: { width: W, height: H, channels: 3 } }).composite([{ input: svg, blend: "over" }]).removeAlpha().raw().toBuffer();
  out.copy(px);
}

async function bleed() {
  // the generated canvas (night: the sides' and the foot's, nightCanvas; the
  // day one an edit of the night canvas, sky-day-bleed.txt), registered to
  // its ref at scale 1 and laid out at the ref's 2312 x 1301 (its lower 40px
  // past the bleed, cut), toned to the core along the seam, with the core
  // pasted back over it, feathered on its left, right and bottom edges, so
  // the stage shows the plate itself to the pixel
  const W = 1672 + 2 * BLEED.x;
  const H = 941 + BLEED.bottom;
  const Hfull = Math.round((W * 941) / 1672);
  const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  let runs = { segs: [], nodes: [] };
  for (const [gen, core, name] of [
    ["night", "sky-night", "sky-night-plate"],
    ["sky-day-bleed", "layer-sky-day-clear", "sky-day-plate"],
  ]) {
    const full = gen === "night" ? await nightCanvas(W, Hfull) : await generated(gen, W, Hfull);
    cleanCorners(full.data, W, Hfull);
    if (gen === "night") await calmFoot(full, W, Hfull);
    const G = { data: full.data.subarray(0, W * H * 3), W, H };
    const C = await rgb(raw(core));
    if (gen !== "night") clearDayDials(C);
    const tone = seamTone(C, G, W);
    const px = Buffer.alloc(G.data.length);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        // the nearest core px, how far out of the core, and how far into it
        const [cx, cy] = [Math.min(C.W - 1, Math.max(0, x - BLEED.x)), Math.min(C.H - 1, y)];
        const past = Math.hypot(Math.max(0, BLEED.x - x, x - BLEED.x - (C.W - 1)), Math.max(0, y - (C.H - 1)));
        const t = past > 0 ? 0 : smooth((Math.min(cx, C.W - 1 - cx, C.H - 1 - cy) + 1) / BLEED.feather);
        const lift = 1 - smooth(past / BLEED.reach);
        const d = lift > 0 ? tone(cx, cy) : [0, 0, 0];
        const [i, j] = [(cy * C.W + cx) * 3, (y * W + x) * 3];
        for (let c = 0; c < 3; c++) {
          const g = Math.min(255, Math.max(0, G.data[j + c] + d[c] * lift));
          px[j + c] = Math.round(g * (1 - t) + C.data[i + c] * t);
        }
      }
    // (the day's foot has no hairline or step: its sky there is already one smooth wash)
    if (gen === "night") await smoothFootSeam(px, W);
    if (gen === "night") runs = chartRuns(await chartStars(px, W, H), W, H);
    await chartDraw(px, W, H, runs, gen === "night" ? CHART.night : CHART.day);
    await png(px, W, H, 3, out(name));
  }
}

/** The frames, worn as the mock's are (art/briefs/atlas.md, the cards): the
 *  generated frames are chunky bevelled leaf in a bright flat yellow; the
 *  mock's are fine rules of antique gold, weathered, with flecks of the leaf
 *  gone and dust of it about. Each frame's silhouette is taken from the
 *  generation (its dark bevels dropped, its leaf thinned: the outer rule
 *  the most, the inner thickened a little, the flourishes to the mock's
 *  finer line), then coloured as the mock's gilt (its card rules' px:
 *  234,187,96 at their brightest, mottled along their length) and broken
 *  here and there (less on the rails than on the flourishes). Seeded, so a
 *  rebuild is the same frame. */
const WORN = { gilt: [238, 190, 98], seed: 7 };

/** A seeded generator (mulberry32), so a rebuild is the same frame. */
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Smooth noise, 0..1, as a W x H field: random values on a grid of `cell`
 *  px, bicubic between. */
const noiseField = async (W, H, cell, rand) => {
  const [gw, gh] = [Math.ceil(W / cell) + 2, Math.ceil(H / cell) + 2];
  const g = Buffer.alloc(gw * gh);
  for (let i = 0; i < g.length; i++) g[i] = Math.floor(rand() * 256);
  const big = await sharp(g, { raw: { width: gw, height: gh, channels: 1 } }).resize(gw * cell, gh * cell, { kernel: "cubic" }).extract({ left: cell, top: cell, width: W, height: H }).extractChannel(0).raw().toBuffer();
  return Float32Array.from(big, (v) => v / 255);
};

const smooth01 = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Erosion of a field by a square of radius r (separable running minimum);
 *  a negative r dilates it (running maximum) by -r. A fractional radius is
 *  blended between the two nearest whole ones. */
const erode = (a, W, H, r) => {
  const grow = r < 0;
  const pass = (src, dx, dy, k) => {
    const o = new Float32Array(src.length);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let m = grow ? 0 : 1;
        for (let t = -k; t <= k; t++) {
          const [xx, yy] = [Math.min(W - 1, Math.max(0, x + t * dx)), Math.min(H - 1, Math.max(0, y + t * dy))];
          m = grow ? Math.max(m, src[yy * W + xx]) : Math.min(m, src[yy * W + xx]);
        }
        o[y * W + x] = m;
      }
    return o;
  };
  const at = (k) => (k <= 0 ? a : pass(pass(a, 1, 0, k), 0, 1, k));
  const q = Math.abs(r);
  const [lo, hi] = [Math.floor(q), Math.ceil(q)];
  const [A, B] = [at(lo), hi === lo ? null : at(hi)];
  return B ? A.map((v, i) => v * (1 - (q - lo)) + B[i] * (q - lo)) : A;
};

/** One frame, worn. `depths` are the zones by how deep a px lies from the
 *  frame's outer edge: how far each is eroded (`r`, px of the raw) and how
 *  much it is worn (`wear`, 0..1); `hold` raises the leaf's resistance to
 *  wear. */
async function worn(src, name, { depths, hold }) {
  const { data, info } = await sharp(raw(src)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const rand = rng(WORN.seed + name.length);
  // the leaf: opaque and bright (the bevels' shade and the glow are dropped)
  const leaf = new Float32Array(W * H);
  const luma = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    luma[i] = 0.3 * data[i * 4] + 0.59 * data[i * 4 + 1] + 0.11 * data[i * 4 + 2];
    leaf[i] = (data[i * 4 + 3] / 255) * smooth01(104, 146, luma[i]);
  }
  // the frame's outer edge, to know how deep a px lies
  let [x0, y0, x1, y1] = [W, H, 0, 0];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 40) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  const depth = (x, y) => Math.min(x - x0, x1 - x, y - y0, y1 - y);
  // eroded by the zone each px is in
  const radii = [...new Set(depths.map((d) => d.r))];
  const eroded = new Map(radii.map((r) => [r, erode(leaf, W, H, r)]));
  const thin = new Float32Array(W * H);
  // how much the leaf is worn at each px: its zone's
  const wear = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const d = depth(x, y);
      const z = depths.find((z) => d < z.to) ?? depths[depths.length - 1];
      thin[y * W + x] = eroded.get(z.r)[y * W + x];
      wear[y * W + x] = z.wear ?? 1;
    }
  // soften the edge (one px of air), then colour, mottle and wear
  const soft = await sharp(Buffer.from(thin.map((v) => Math.round(v * 255))), { raw: { width: W, height: H, channels: 1 } }).blur(0.9).extractChannel(0).raw().toBuffer();
  const [nMottle, nWear, nGrain, nSpeck] = [await noiseField(W, H, 38, rand), await noiseField(W, H, 14, rand), await noiseField(W, H, 3, rand), await noiseField(W, H, 5, rand)];
  const px = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    let a = soft[i] / 255;
    if (a < 0.01) continue;
    // the leaf worn through in flecks (more where the wear noise runs high)
    const lift = (1 - wear[i]) * 0.3;
    a *= 1 - smooth01(0.72 - hold + lift, 0.78 - hold + lift, nWear[i] * 0.7 + nGrain[i] * 0.3);
    if (a < 0.02) continue;
    const t = 0.88 + 0.26 * nMottle[i] + 0.1 * (nGrain[i] - 0.5) + 0.1 * (luma[i] / 255 - 0.7);
    for (let c = 0; c < 3; c++) px[i * 4 + c] = Math.max(0, Math.min(255, Math.round(WORN.gilt[c] * t)));
    px[i * 4 + 3] = Math.round(255 * Math.min(1, a));
  }
  // dust of the leaf about the frame: single flecks on the clear, near it
  const dust = Math.round(W * H * 0.0004);
  for (let n = 0; n < dust; n++) {
    const [x, y] = [Math.floor(rand() * W), Math.floor(rand() * H)];
    const d = depth(x, y);
    // (in a corner's square only: elsewhere the 9-slice would stretch it)
    const inCorner = (x - x0 < 150 || x1 - x < 150) && (y - y0 < 150 || y1 - y < 150);
    if (!inCorner || d < 6 || d > 150 || data[(y * W + x) * 4 + 3] > 8) continue;
    const r = 1 + Math.floor(rand() * 2);
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const [xx, yy] = [x + dx, y + dy];
        if (xx < 0 || yy < 0 || xx >= W || yy >= H || dx * dx + dy * dy > r * r + 0.5) continue;
        const i = yy * W + xx;
        if (px[i * 4 + 3]) continue;
        const t = 0.85 + 0.3 * nSpeck[i];
        for (let c = 0; c < 3; c++) px[i * 4 + c] = Math.min(255, Math.round(WORN.gilt[c] * t));
        px[i * 4 + 3] = Math.round(255 * (0.55 + 0.4 * rand()));
      }
  }
  await png(px, W, H, 4, out(name));
}

async function frames() {
  // a frame's rules (its outer 14 px: the outer rule, thinned from 11 to 8;
  // then the inner rule to 30, thickened a little) and its flourishes (to 7
  // or so); the rails little worn
  await worn("sheet-day", "sheet-fine", { depths: [{ to: 15, r: 0.6, wear: 0.35 }, { to: 31, r: -0.8, wear: 0.35 }, { to: 1e9, r: 0.7 }], hold: 0.08 });
  // a screen's single rule and its small scrolls
  await worn("mat-day", "mat-fine", { depths: [{ to: 1e9, r: 0.6 }], hold: 0.04 });
}

/** The compass rose, drawn as the mock's (measured at 6x on it): a needle of
 *  eight points, the four cardinal ones long (54px from the centre, to a
 *  small barb) and the others to 38, each lit on one side and shaded on the
 *  other as an engraving is, a dark eye at the centre, three fine rings
 *  (48, 42 and 40px) and a small cross in each wedge. One unit is a mock
 *  px; drawn at 6x. */
async function compass() {
  const U = 6;
  const gold = "#e8b95e";
  const lit = "#f3cd78";
  const shade = "#bf8f3e";
  // a needle pointing up from the centre, half-width `w` at `r0`; `side` is its
  // lit half (left) and shaded half (right)
  const needle = (len, w, r0) => `<path d="M0 ${-len} L${-w} ${-r0} L0 0Z" fill="${lit}"/><path d="M0 ${-len} L${w} ${-r0} L0 0Z" fill="${shade}"/>`;
  const rot = (deg, inner) => `<g transform="rotate(${deg})">${inner}</g>`;
  const barb = (r) => `<path d="M-2.6 ${-r} H2.6" stroke="${gold}" stroke-width="1.1"/><circle cy="${-r - 2.2}" r="1.15" fill="${gold}"/>`;
  const cross = (deg, r) => rot(deg, `<g transform="translate(0 ${-r})" stroke="${gold}" stroke-width="0.9" stroke-linecap="round" fill="none"><path d="M-2.4 -2.4 L2.4 2.4 M2.4 -2.4 L-2.4 2.4"/><path d="M-1.4 3.4 L1.6 4.6" stroke-width="0.7" opacity="0.8"/></g>`);
  const body = [0, 90, 180, 270].map((d) => rot(d, needle(54, 4.4, 5) + barb(51))).join("") + [45, 135, 225, 315].map((d) => rot(d, needle(38, 2.8, 5))).join("");
  const crosses = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((d) => cross(d, 24)).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${120 * U}" height="${120 * U}" viewBox="-60 -60 120 120">
    <g fill="none" stroke="${gold}">
      <circle r="48.3" stroke-width="1.3"/><circle r="42.3" stroke-width="0.9"/><circle r="40.3" stroke-width="0.8" opacity="0.85"/>
    </g>
    ${crosses}${body}
    <circle r="5.4" fill="#0c1830" stroke="${gold}" stroke-width="1.3"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(out("compass-line"));
}

/** The status markers: the chart's four-point star (atlas.css --a-sparkle),
 *  the kit's four heads (brass: unlit; green: live; amber; signal), printed
 *  by day in the plate's bronze gilt and its tints; the kit lifts them for
 *  the night (atlas.mjs STAR_NIGHT) to the leaf the stars are by night. */
const STAR = "M10 0 11.3 8.7 20 10 11.3 11.3 10 20 8.7 11.3 0 10 8.7 8.7Z";
const STAR_INKS = ["#8a6e37", "#9a7430", "#9a5e1a", "#9a4e23"];

async function stars() {
  const [size, gap] = [128, 64];
  const heads = STAR_INKS.map((ink, i) => `<path transform="translate(${i * (size + gap)} 0) scale(${size / 20})" d="${STAR}" fill="${ink}"/>`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${4 * size + 3 * gap}" height="${size}">${heads.join("")}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(out("pins-star"));
}

/** The mat under a card's picture (art/briefs/atlas.md, the cards): the
 *  mock's cards set their picture on the card's own field strewn with gold
 *  dust and small engraved marks, here and there a dotted constellation.
 *  Drawn as a seamless 640px tile (at 2x: 1 unit is a mock px), seeded, so a
 *  rebuild is the same mat; each element is drawn at the tile's nine
 *  neighbours, so what crosses an edge wraps. By night the field is the
 *  card's navy and the dust the chart's gilt, dimmed (a mat, not the sky's
 *  stars); by day an ivory with bronze. */
const MAT = {
  size: 640,
  night: { field: [11, 22, 37], gilt: "#d4ab5c", dust: 0.9, mark: 0.82, line: 0.45 },
  day: { field: [245, 237, 218], gilt: "#8f6a2c", dust: 0.8, mark: 0.7, line: 0.4 },
};

async function mat() {
  const U = 2;
  const N = MAT.size;
  for (const [name, m] of Object.entries({ "card-mat-night": MAT.night, "card-mat-day": MAT.day })) {
    const rand = rng(31 + name.length);
    // the field: its colour with a faint mottle (a flat fill reads as plastic)
    const [mottle, grain] = [await noiseField(N * U, N * U, 90, rand), await noiseField(N * U, N * U, 2, rand)];
    const px = Buffer.alloc(N * U * N * U * 3);
    const dark = name.endsWith("night");
    for (let p = 0; p < mottle.length; p++) {
      const k = (mottle[p] - 0.5) * (dark ? 5 : 7) + (grain[p] - 0.5) * (dark ? 4 : 5);
      for (let c = 0; c < 3; c++) px[p * 3 + c] = Math.max(0, Math.min(255, Math.round(m.field[c] + k * (c === 2 ? 1.15 : 1))));
    }
    const els = [];
    const at = (x, y, inner) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(rand() * 360).toFixed(0)})">${inner}</g>`;
    const lo = (a, b) => a + rand() * (b - a);
    // where the leaf has flaked about: dust gathers in patches, as the
    // mock's mats show it, sparse between
    const gather = await noiseField(N, N, 70, rand);
    // (between a dull copper-gold and the leaf's own)
    const leaf = [1, 3, 5].map((i) => parseInt(m.gilt.slice(i, i + 2), 16));
    const tone = (t) => `rgb(${leaf.map((v) => Math.round(v * (0.78 + 0.3 * t))).join(",")})`;
    // dust: flecks of the leaf, mostly a px or two of scratch, some dots
    for (let i = 0; i < 6500; i++) {
      const [x, y] = [lo(0, N), lo(0, N)];
      if (rand() > 0.25 + 0.9 * gather[Math.floor(y) * N + Math.floor(x)] ** 2) continue;
      const a = m.dust * lo(0.4, 1);
      els.push(
        rand() < 0.62
          ? at(x, y, `<path d="M${(-lo(0.5, 1.8)).toFixed(1)} 0H${lo(0.5, 1.8).toFixed(1)}" stroke-width="${lo(0.55, 0.95).toFixed(2)}" stroke="${tone(rand())}" stroke-opacity="${a.toFixed(2)}" fill="none"/>`)
          : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${lo(0.3, 0.55).toFixed(2)}" fill="${tone(rand())}" fill-opacity="${a.toFixed(2)}" stroke="none"/>`,
      );
    }
    // small engraved marks: a few scratched strokes together
    const marks = [
      () => `<path d="M-3.5 0H3.5M0-3.5V3.5" stroke-width="0.8"/>`,
      () => `<path d="M-3-3L3 3M3-3L-3 3M0-4V4" stroke-width="0.75"/>`,
      () => `<path d="M0 5V0L-3.5-3.5M0 0L3.5-3.5" stroke-width="0.8"/>`,
      () => `<path d="M-4.5 0H4.5M-4.5-2V2M4.5-2V2" stroke-width="0.7"/>`,
      () => `<path d="M-4 3.5 0-4 4 3.5M-2.2 0.8H2.2" stroke-width="0.75"/>`,
      () => `<path d="M-5 1 5-1M-3-3L-1 4M2-4L4 3" stroke-width="0.7"/>`,
      () => `<path d="M0-6V6M-4-4L4 4M4-4L-4 4M-6 0H6" stroke-width="0.6"/>`,
      () => `<path d="M-2.5 3C-4 0-2-3 1-3.2M2.5-3C4 0 2 3-1 3.2" stroke-width="0.75" fill="none"/>`,
    ];
    for (let i = 0; i < 170; i++) {
      const [x, y] = [lo(0, N), lo(0, N)];
      if (rand() > 0.3 + 0.9 * gather[Math.floor(y) * N + Math.floor(x)]) continue;
      els.push(at(x, y, marks[Math.floor(rand() * marks.length)]()).replace("<g ", `<g fill="none" stroke-opacity="${lo(0.5, 0.9).toFixed(2)}" `));
    }
    // constellations: a few dotted lines between stars
    for (let i = 0; i < 12; i++) {
      let [x, y, a] = [lo(0, N), lo(0, N), rand() * Math.PI * 2];
      const pts = [[x, y]];
      for (let k = 0, n = 3 + Math.floor(rand() * 3); k < n; k++) {
        a += lo(-0.9, 0.9);
        [x, y] = [x + Math.cos(a) * lo(18, 44), y + Math.sin(a) * lo(18, 44)];
        pts.push([x, y]);
      }
      els.push(`<polyline points="${pts.map((q) => q.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="none" stroke-width="0.7" stroke-dasharray="1.3 2.4" stroke-opacity="${m.line}"/>`);
      for (const [px_, py_] of pts) els.push(at(px_, py_, rand() < 0.4 ? `<path d="M0-3 0.6-0.6 3 0 0.6 0.6 0 3-0.6 0.6-3 0-0.6-0.6Z" stroke="none"/>` : `<circle r="${lo(0.8, 1.4).toFixed(1)}" stroke="none"/>`));
    }
    const wrap = [-N, 0, N].flatMap((dx) => [-N, 0, N].map((dy) => `<g transform="translate(${dx} ${dy})">${els.join("")}</g>`));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${N * U}" height="${N * U}" viewBox="0 0 ${N} ${N}"><g fill="${m.gilt}" stroke="${m.gilt}">${wrap.join("")}</g></svg>`;
    await sharp(px, { raw: { width: N * U, height: N * U, channels: 3 } }).composite([{ input: Buffer.from(svg) }]).png().toFile(out(name));
  }
}

const jobs = { frame, dials, sky, quiet, foil, tiles, frames, compass, canvas, bleed, stars, mat, moon };
for (const job of process.argv.slice(2)) {
  if (!jobs[job]) throw new Error(`unknown job ${job}: ${Object.keys(jobs).join(", ")}`);
  await jobs[job]();
  console.log(`derived ${job}`);
}
