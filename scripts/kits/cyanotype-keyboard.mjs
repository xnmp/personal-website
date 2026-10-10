// The keyboards of the Cyanotype prints (art/briefs/cyanotype.md, "the
// keyboards"). The image model drew all four photograms wrong (four rows, a
// Caps Lock where Enter belongs, legends from no alphabet), and cannot draw a
// keyboard, so they are code: a standard ANSI 60% board as a pure layout
// table, drawn as vector keycaps in the print's own materials, posed with an
// affine transform onto the place of the board it replaces, and printed into
// the plate with the plate's own grain.
//
//   ANSI_60 / keysOf()  the layout: five rows, each 15u wide (KLE widths)
//   BOARDS              where each print carries one, and in what material
//   paintKeyboard()     lays a board into an RGB canvas (the build's `res`)
//
// Nothing here needs a font: the legends are a small stroke face (a slab
// typewriter capital and lowercase), so the output is the same on every
// machine.
import sharp from "sharp";

/* ============================ the layout ============================ */

// [legend, width in u]; a bare string is a 1u key. Shifted legends of the
// punctuation and digits are listed below.
const row1 = ["Esc", ..."1234567890-=", ["Backspace", 2]];
const row2 = [["Tab", 1.5], ..."QWERTYUIOP[]", ["\\", 1.5]];
const row3 = [["Caps Lock", 1.75], ..."ASDFGHJKL;'", ["Enter", 2.25]];
const row4 = [["Shift", 2.25], ..."ZXCVBNM,./", ["Shift", 2.75]];
const row5 = [["Ctrl", 1.25], ["Win", 1.25], ["Alt", 1.25], ["", 6.25], ["Alt", 1.25], ["Fn", 1.25], ["Menu", 1.25], ["Ctrl", 1.25]];
const asKey = (c) => (Array.isArray(c) ? { label: c[0], w: c[1] } : { label: c, w: 1 });
export const ANSI_60 = [row1, row2, row3, row4, row5].map((r) => r.map(asKey));

// what Shift gives a key (printed above its own legend)
export const SHIFTED = { 1: "!", 2: "@", 3: "#", 4: "$", 5: "%", 6: "^", 7: "&", 8: "*", 9: "(", 0: ")", "-": "_", "=": "+", "[": "{", "]": "}", "\\": "|", ";": ":", "'": '"', ",": "<", ".": ">", "/": "?" };

/** The width of a row, in u. */
export const rowWidth = (row) => row.reduce((a, k) => a + k.w, 0);

/** Every key of a layout with its place: x, y (its top left) and w, h in u. */
export const keysOf = (rows) =>
  rows.flatMap((r, y) => {
    let x = 0;
    return r.map((k) => {
      const key = { ...k, x, y, h: 1, row: y };
      x += k.w;
      return key;
    });
  });

/* ===================== a stroke face for the legends ===================== */
// Glyphs on a 4 x 6 grid (cap height 6, x-height 4, baseline 6, advance 5):
// strokes of M/L/Q, drawn with a round pen. A slab serif on I, J, T, i, l, r, f
// keeps it a typewriter's.
const G = {
  A: "M0 6L2 0L4 6M0.9 3.9L3.1 3.9",
  B: "M0 0L0 6M0 0L2.4 0Q3.8 0 3.8 1.5Q3.8 3 2.4 3L0 3M2.4 3Q4 3 4 4.5Q4 6 2.4 6L0 6",
  C: "M3.8 1.2Q3.2 0 2 0Q0 0 0 3Q0 6 2 6Q3.2 6 3.8 4.8",
  D: "M0 0L0 6L1.8 6Q4 6 4 3Q4 0 1.8 0Z",
  E: "M3.8 0L0 0L0 6L3.8 6M0 3L3 3",
  F: "M3.8 0L0 0L0 6M0 3L3 3",
  G: "M3.8 1.2Q3.2 0 2 0Q0 0 0 3Q0 6 2 6Q4 6 4 3.6L2.2 3.6",
  H: "M0 0L0 6M4 0L4 6M0 3L4 3",
  I: "M0.8 0L3.2 0M2 0L2 6M0.8 6L3.2 6",
  J: "M2.4 0L4 0M3.6 0L3.6 4Q3.6 6 2 6Q0.6 6 0.2 4.6",
  K: "M0 0L0 6M3.8 0L0 3.6M1.4 2.6L4 6",
  L: "M0 0L0 6L3.8 6",
  M: "M0 6L0 0L2 3.6L4 0L4 6",
  N: "M0 6L0 0L4 6L4 0",
  O: "M2 0Q0 0 0 3Q0 6 2 6Q4 6 4 3Q4 0 2 0Z",
  P: "M0 6L0 0L2.2 0Q4 0 4 1.7Q4 3.4 2.2 3.4L0 3.4",
  Q: "M2 0Q0 0 0 3Q0 6 2 6Q4 6 4 3Q4 0 2 0ZM2.4 4.2L4.2 6.6",
  R: "M0 6L0 0L2.2 0Q4 0 4 1.7Q4 3.4 2.2 3.4L0 3.4M1.8 3.4L4 6",
  S: "M3.8 1Q3 0 2 0Q0.2 0 0.2 1.5Q0.2 2.8 2 3Q3.8 3.2 3.8 4.5Q3.8 6 2 6Q0.8 6 0.1 5",
  T: "M0 0L4 0M2 0L2 6M1 6L3 6",
  U: "M0 0L0 4Q0 6 2 6Q4 6 4 4L4 0",
  V: "M0 0L2 6L4 0",
  W: "M0 0L1 6L2 2.4L3 6L4 0",
  X: "M0 0L4 6M4 0L0 6",
  Y: "M0 0L2 3L4 0M2 3L2 6",
  Z: "M0 0L4 0L0 6L4 6",
  0: "M2 0Q0 0 0 3Q0 6 2 6Q4 6 4 3Q4 0 2 0Z",
  1: "M0.8 1.2L2.2 0L2.2 6M1 6L3.4 6",
  2: "M0.2 1.4Q0.6 0 2 0Q3.8 0 3.8 1.7Q3.8 3 2 4L0 6L4 6",
  3: "M0.2 0.8Q1 0 2 0Q3.8 0 3.8 1.5Q3.8 2.8 1.6 3Q4 3.1 4 4.5Q4 6 2 6Q0.8 6 0 5.2",
  4: "M3 6L3 0L0 4.2L4 4.2",
  5: "M3.8 0L0.6 0L0.3 2.8Q1 2.4 2 2.4Q4 2.4 4 4.2Q4 6 2 6Q0.8 6 0 5",
  6: "M3.6 0.6Q3 0 2 0Q0 0 0 3.5Q0 6 2 6Q4 6 4 4.2Q4 2.6 2 2.6Q0.4 2.6 0.05 3.8",
  7: "M0 0L4 0L1.4 6",
  8: "M2 3Q0.2 3 0.2 1.5Q0.2 0 2 0Q3.8 0 3.8 1.5Q3.8 3 2 3Q0 3 0 4.5Q0 6 2 6Q4 6 4 4.5Q4 3 2 3",
  9: "M0.4 5.4Q1 6 2 6Q4 6 4 2.5Q4 0 2 0Q0 0 0 1.8Q0 3.4 2 3.4Q3.6 3.4 3.95 2.2",
  "-": "M0.6 3L3.4 3",
  "=": "M0.6 2.2L3.4 2.2M0.6 3.8L3.4 3.8",
  "[": "M3 0L1 0L1 6L3 6",
  "]": "M1 0L3 0L3 6L1 6",
  "\\": "M0.6 0L3.4 6",
  "/": "M3.4 0L0.6 6",
  ";": "M2 2.2L2 2.3M2 4.6L2 5.2L1.4 6.4",
  "'": "M2 0L2 1.6",
  ",": "M2 5L2 5.8L1.4 7",
  ".": "M2 5.6L2 5.7",
  "!": "M2 0L2 3.8M2 5.5L2 5.6",
  "@": "M3.8 4.6Q3.9 3.4 3.9 3Q3.9 0.4 2 0.4Q0.1 0.4 0.1 3Q0.1 5.6 2 5.6Q3 5.6 3.5 5M2 2Q1 2 1 3Q1 4 2 4Q3 4 3 3L3 2",
  "#": "M1.2 0.4L0.8 5.6M3.2 0.4L2.8 5.6M0 2L4 2M0 4L4 4",
  $: "M3.8 1.2Q3 0.4 2 0.4Q0.3 0.4 0.3 1.7Q0.3 2.8 2 3Q3.7 3.2 3.7 4.4Q3.7 5.6 2 5.6Q0.9 5.6 0.2 4.8M2 -0.4L2 6.4",
  "%": "M0.2 5.6L3.8 0.4M0.4 0.4L1.6 0.4L1.6 1.8L0.4 1.8ZM2.4 4.2L3.6 4.2L3.6 5.6L2.4 5.6Z",
  "^": "M0.6 2L2 0L3.4 2",
  "&": "M4 6L1 2.4Q0 1.2 0.8 0.5Q2 -0.3 2.8 0.8Q3.2 2 1.6 3Q0 4 0 5Q0 6 1.6 6Q3.2 6 4 4",
  "*": "M2 0.6L2 4.2M0.4 1.6L3.6 3.2M3.6 1.6L0.4 3.2",
  "(": "M3 0Q1 1.5 1 3Q1 4.5 3 6",
  ")": "M1 0Q3 1.5 3 3Q3 4.5 1 6",
  _: "M0 6.6L4 6.6",
  "+": "M0.6 3L3.4 3M2 1.4L2 4.6",
  "{": "M3 0Q1.6 0 1.6 1.4L1.6 2.4Q1.6 3 0.8 3Q1.6 3 1.6 3.6L1.6 4.6Q1.6 6 3 6",
  "}": "M1 0Q2.4 0 2.4 1.4L2.4 2.4Q2.4 3 3.2 3Q2.4 3 2.4 3.6L2.4 4.6Q2.4 6 1 6",
  "|": "M2 -0.4L2 6.4",
  ":": "M2 1.6L2 1.7M2 4.8L2 4.9",
  '"': "M1.2 0L1.2 1.6M2.8 0L2.8 1.6",
  "<": "M3.4 0.6L0.6 3L3.4 5.4",
  ">": "M0.6 0.6L3.4 3L0.6 5.4",
  "?": "M0.4 1.2Q0.8 0 2 0Q3.6 0 3.6 1.5Q3.6 2.6 2 3.4L2 4.2M2 5.5L2 5.6",
  // lowercase (x-height 4: from y 2)
  a: "M3.4 2L3.4 6M3.4 3.2Q2.8 2 1.8 2Q0.1 2 0.1 4Q0.1 6 1.8 6Q2.8 6 3.4 4.9M3.4 6L4 6",
  b: "M0.4 0L0.4 6M0 0L0.4 0M0.4 3.2Q1 2 2.2 2Q4 2 4 4Q4 6 2.2 6Q1 6 0.4 4.8",
  c: "M3.6 3Q3 2 2 2Q0 2 0 4Q0 6 2 6Q3 6 3.6 5",
  e: "M0.1 4L3.9 4Q3.9 2 2 2Q0 2 0 4Q0 6 2 6Q3.2 6 3.8 5.2",
  f: "M3.6 0.4Q3 0 2.4 0Q1.6 0 1.6 1.2L1.6 6M0.4 2.2L3.2 2.2M0.4 6L2.8 6",
  h: "M0.4 0L0.4 6M0 0L0.4 0M0.4 3.4Q1 2 2.2 2Q3.6 2 3.6 3.6L3.6 6M0 6L0.8 6M3 6L4 6",
  i: "M2 2.2L2 6M0.8 2.2L2 2.2M0.8 6L3.2 6M2 0.5L2 0.6",
  k: "M0.4 0L0.4 6M0 0L0.4 0M3.4 2L0.4 4.2M1.4 3.6L3.8 6",
  l: "M0.8 0L2 0L2 6M0.8 6L3.2 6",
  n: "M0.4 2L0.4 6M0 2L0.4 2M0.4 3.4Q1 2 2.2 2Q3.6 2 3.6 3.6L3.6 6M0 6L0.8 6M3 6L4 6",
  o: "M2 2Q0 2 0 4Q0 6 2 6Q4 6 4 4Q4 2 2 2Z",
  p: "M0.4 2L0.4 8M0 2L0.4 2M0.4 3.2Q1 2 2.2 2Q4 2 4 4Q4 6 2.2 6Q1 6 0.4 4.8",
  r: "M0.4 2L0.4 6M0 2L0.4 2M0.4 3.6Q0.8 2 2 2Q2.8 2 3.2 2.4M0 6L1.6 6",
  s: "M3.4 2.8Q2.8 2 1.8 2Q0.3 2 0.4 3.2Q0.5 4 2 4.1Q3.7 4.3 3.7 5Q3.7 6 2 6Q0.8 6 0.2 5.2",
  t: "M1.6 0.6L1.6 5Q1.6 6 2.8 6Q3.4 6 3.8 5.6M0.4 2.2L3.4 2.2",
  u: "M0.4 2L0.4 4.4Q0.4 6 2 6Q3.4 6 3.6 4.6M3.6 2L3.6 6M3.6 6L4 6",
};
// the Windows key's legend is a window, not a word
const WINDOW = "M0.4 0.6L1.8 0.4L1.8 2.8L0.4 2.8ZM2.2 0.4L3.8 0.2L3.8 2.8L2.2 2.8ZM0.4 3.4L1.8 3.4L1.8 5.8L0.4 5.6ZM2.2 3.4L3.8 3.4L3.8 5.8L2.2 6Z";

/** A legend (one or two lines of text) as stroked paths, its top left at
 *  (x, y) in the caller's units; `size` is the cap height; `anchor` where
 *  `x` is in the block: "start", "middle". */
const legendSvg = (text, { x, y, size, anchor = "start", color, pen, opacity = 1 }) => {
  if (!text) return "";
  const f = size / 6;
  if (text === "Win") {
    const w = 4 * f;
    const ox = anchor === "middle" ? x - w / 2 : x;
    return `<g transform="translate(${ox.toFixed(4)} ${y.toFixed(4)}) scale(${f.toFixed(5)})"><path d="${WINDOW}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${((pen * 0.55) / f).toFixed(3)}" stroke-linejoin="round" stroke-linecap="round"/></g>`;
  }
  const set = (line, ox, oy, stroke, width, o) => {
    const d = [...line].map((c, j) => (G[c] ? `<path transform="translate(${j * 5} 0)" d="${G[c]}"/>` : "")).join("");
    return `<g transform="translate(${ox.toFixed(4)} ${oy.toFixed(4)}) scale(${f.toFixed(5)})" fill="none" stroke="${stroke}" stroke-opacity="${o}" stroke-width="${(width / f).toFixed(3)}" stroke-linejoin="round" stroke-linecap="round">${d}</g>`;
  };
  return text
    .split("\n")
    .map((line, i) => {
      const w = (line.length * 5 - 1) * f;
      const ox = anchor === "middle" ? x - w / 2 : x;
      const oy = y + i * size * 1.55;
      return set(line, ox, oy, color, pen, opacity);
    })
    .join("");
};

const CENTRED = new Set(["Ctrl", "Alt", "Fn", "Menu", "Win", "Enter"]);

/** Can every character of a legend be drawn by the stroke face? */
export const legendDrawable = (text) => text === "Win" || [...text].every((c) => c === "\n" || c in G);

/** What is printed on a key: its legend, and what Shift gives it above it
 *  where it has one (the digits and the punctuation); a word wraps. */
export const legendOf = (key) => {
  const word = key.label === "Caps Lock" ? "Caps\nLock" : key.label;
  const shifted = SHIFTED[key.label];
  return { text: shifted ? `${shifted}\n${key.label}` : word, word: word.length > 1 && !shifted };
};

/* ============================== palette ============================== */
// The print's ramp (the duotone every plate is put on: scripts/kits/
// cyanotype.mjs duotoneRamp), luminance -> colour, so whatever is drawn is
// already on it.
const RAMP = [[0, [0, 14, 44]], [20, [0, 23, 59]], [40, [8, 47, 84]], [60, [27, 68, 105]], [80, [50, 87, 123]], [100, [74, 106, 139]], [120, [99, 125, 153]], [140, [123, 143, 166]], [160, [148, 163, 179]], [180, [173, 181, 191]], [200, [198, 200, 202]], [220, [220, 220, 218]], [240, [238, 241, 240]], [255, [250, 253, 251]]];
export const ramp = (l) => {
  const v = Math.min(255, Math.max(0, l));
  let i = 1;
  while (i < RAMP.length - 1 && RAMP[i][0] < v) i++;
  const [[l0, c0], [l1, c1]] = [RAMP[i - 1], RAMP[i]];
  const t = (v - l0) / (l1 - l0);
  return c0.map((c, k) => Math.round(c + (c1[k] - c) * t));
};
const hex = (l) => `#${ramp(l).map((c) => c.toString(16).padStart(2, "0")).join("")}`;

/* =============================== looks =============================== */
// The materials the originals' keyboards are in, photograms all of them: a cap
// is a tone step (a wall, a lighter or darker top), the case a rim round a
// tray, the legends fine (the tone of the cap top against the tone of the
// print; round 8 sets them a third larger and a third heavier, white: at the
// ~1.6 px pen they had, the print's two resamplings (the scene's, the
// browser's) smeared them, where the mock's are crisp). Luminances are on the ramp (about 50 is the print's
// ground, 215 its paper white).
//
// The two frosted looks are the home mock's and the phone mock's boards,
// whose plastic is frosted and translucent. Measured on those mocks (the
// luminance inside the board's footprint): the case is a pale band (~135, 12 px
// wide on the home board) with a bright rim (150-190) round it; a cap's top is
// slate (66-122, mottled) with a bright edge on its lit sides (150-180) and a
// wall in deep navy (~35) on the shaded ones; the board's median is 83, its
// 90th percentile 145, its 97th 180 (the mock's legends peak ~210). The phone's
// caps are dark navy tops (50-70) standing in a haze of their own pale
// walls (150-230 at the lit side), in a clear case with a thick bright rim.
const LOOKS = {
  // the home page's: slate caps with a lit edge and a navy wall, in a pale
  // frosted case with a bright rim
  frosted: {
    case: { fill: 138, fillOpacity: 0.85, rim: 228, rimOpacity: 1, rimWidth: 0.06, wall: 90, tray: 32, trayOpacity: 0.95, thick: 0.1, inset: 0.2 },
    skirt: { lit: 140, shade: 22, opacity: 1 },
    top: { lit: 116, shade: 66, dish: 0.05, opacity: 1, rim: 208, rimOpacity: 0.95, rimWidth: 0.045, under: 74, lift: 0.16, inset: [0.1, 0.1] },
    legend: { color: 232, opacity: 1, pen: 0.044, size: 0.2, word: 0.84 },
    shadow: { opacity: 0.4 },
    mottle: 0.1,
  },
  // the phone's: dark navy tops in the haze of their own translucent walls,
  // in a clear case with a thick bright rim
  frostedInk: {
    case: { fill: 96, fillOpacity: 0.35, rim: 244, rimOpacity: 1, rimWidth: 0.07, wall: 170, tray: 30, trayOpacity: 0.55, thick: 0.12, inset: 0.2, lip: 0.05 },
    skirt: { lit: 200, shade: 56, opacity: 0.95 },
    top: { lit: 72, shade: 46, dish: 0.05, opacity: 1, rim: 214, rimOpacity: 0.85, rimWidth: 0.035, under: 170, lift: 0.14, inset: [0.12, 0.12] },
    halo: { opacity: 0.75, color: 226, grow: 0.07, lean: 0.09 },
    legend: { color: 255, opacity: 1, pen: 0.056, size: 0.25, word: 0.84 },
    shadow: { opacity: 0.45 },
    mottle: 0.07,
  },
  // the launch page's: a frosted glass board (round 10 made it ghostly; round
  // 11, measured again on the original's, finds it crisp): caps of frosted
  // white glass, bright and blotchy where the print's blue shows through,
  // standing on tall navy walls, every edge of them a crisp white hairline
  // (the top, the four edges up to it, the foot), in a clear case that is
  // only its outline, doubled at the right where its wall shows; the legends
  // small dark smudges on the caps, the switch stems barely there. Nothing is
  // blurred (`soft`: 0): the original's lines are sharp and its frost is only
  // in the caps' blotches.
  clear: {
    wire: true,
    case: { fill: 90, fillOpacity: 0.05, rim: 232, rimOpacity: 1, rimWidth: 0.034, wall: 150, tray: 26, trayOpacity: 0.3, thick: 0.12, inset: 0.15, lip: 0.06 },
    skirt: { lit: 52, shade: 26, opacity: 0.92 },
    top: { lit: 206, shade: 164, dish: 0.05, opacity: 0.92, rim: 232, rimOpacity: 1, rimWidth: 0.034, footRim: 0.85, under: 140, lift: 0.3, inset: [0.12, 0.11] },
    legend: { color: 36, opacity: 0.7, pen: 0.046, size: 0.22 },
    shadow: { opacity: 0.22 },
    switches: true,
    switchOpacity: 0.16,
    mottle: 0.13,
    wobble: 0.25,
    soft: 0,
    glow: { sigma: 1.3, gain: 0.14, color: 214 },
  },
  // the project page's (round 11, from the original's): a technical drawing
  // in white line on the print. Flat dark caps the colour of the ground, every
  // edge of them (the foot, the four edges up to the top face, the top) a
  // crisp white hairline, the walls a pale haze between the lines, a wide
  // pale case with a line at each edge and its wall a thickness away with the
  // corners joined; no blur and nothing soft, as the original's line is.
  line: {
    wire: true,
    case: { fill: 92, fillOpacity: 0.95, rim: 252, rimOpacity: 1, rimWidth: 0.066, wall: 64, wallOpacity: 0.55, tray: 34, trayOpacity: 1, trayRim: 0.95, thick: 0.17, reach: 0.06, glow: 178, lip: 0 },
    skirt: { lit: 112, shade: 72, opacity: 0.95 },
    top: { lit: 66, shade: 58, dish: 0, opacity: 1, rim: 252, rimOpacity: 1, rimWidth: 0.062, footRim: 1, under: 150, lift: 0.06, inset: [0.06, 0.06] },
    legend: { color: 250, opacity: 1, pen: 0.032, size: 0.22, word: 0.84 },
    shadow: { opacity: 0.2 },
    mottle: 0.05,
    wobble: 0.2,
    soft: 0,
    grain: 3,
    glow: { sigma: 1.6, gain: 0.8, color: 236 },
  },
};

/* ============================== the boards ============================== */
// Where each print carries its keyboard: the case's top right corner `tr`, and
// the canvas-pixel vectors for one u along a row (`u`) and one row down (`v`),
// in the canvas the build paints (the print's px with the bleed's 320 px round
// it for the three that bleed; the phone's own). Every one of the originals
// shows the board's right end (Backspace, \\ and Enter down the side of the
// case) with the rest running off the left, so that is the end a viewer sees
// here too. The vectors are the old board's pose and scale (the originals are
// photographs from an angle: rows turned, columns leaning, rows a little
// taller than wide), so the board lies where the old one lay.
const BLEED = 320;
export const BOARDS = {
  // the home page: the board lying across the upper left, turned 16.5 degrees
  // anticlockwise, its end left of the headline
  home: { name: "home", canvas: [1672 + 2 * BLEED, 941 + BLEED], look: "frosted", tr: [BLEED + 137, 85], u: [56.2, -16.6], v: [16.8, 56.0], light: [0.6, 0.8], seed: 3 },
  // the launch page: the clear board beside the note "mechanical minds
  // build better tools" (its arrow points at the board's left end). Round 10,
  // measured on the original's: its keys are ~37 px a pitch along a row (the
  // first pose's were 24) and it lies 13 degrees from the horizontal; it is a
  // short board in the original (some ten columns, then its end), so the first
  // four and a bit columns of this 15-wide one fade into the print (`fade`,
  // in u from the first row's left) rather than run on under the note.
  // Round 11: the original's rows are shorter than its keys are wide (the
  // board is seen from the front: 31 px a row, 37 along it), so four rows
  // stand above the cream sheet's tear at the right end where round 10's 37
  // px rows showed three and a bit; and the case's corner stands 28 px lower
  // than the original's (510), under the facts' hairline, which the real
  // copy's two lines of facts put at 527 where the original's one line puts
  // it at 501
  launch: { name: "launch", canvas: [1672 + 2 * BLEED, 941 + BLEED], look: "clear", tr: [BLEED + 563, 538], u: [36, -8.9], v: [12.5, 31], light: [0.6, 0.8], seed: 5, fade: [4.2, 5.6] },
  // the project page: the board's end at the lower left, under the corridor
  // etching, its rows falling to the right. Round 10, measured on the
  // original's: its case's top edge runs from (0, 748) to the corner at
  // (308, 845), 17 degrees, and its keys are ~37 px a pitch, so four rows
  // stand above the page's foot; the first pose's were 43 px, 30 px lower,
  // 2.5 rows
  project: { name: "project", canvas: [1672 + 2 * BLEED, 941 + BLEED], look: "line", tr: [BLEED + 309.5, 842.6], u: [36.09, 11.59], v: [-21.92, 28.76], margin: { x: 0.65, top: 0.38, bottom: 0.4 }, light: [0.6, 0.8], seed: 7 },
  // the phone: the board's end at the left edge, behind the calls, at the
  // mock's key pitch along a row (~62 px). Round 9, measured on the mock's
  // case: its top edge runs at 20.5 degrees from the horizontal (the rows'
  // centres at 21.5) from the same top right corner, and its foot edge lies
  // 307 px under the top edge at the left margin, where the first pose's lay
  // 353 under it and its rows ran too far down the page (behind the "Try it
  // live" box): the rows are shorter (51 px a row, foreshortened) and lean
  // as the mock's right edge does (29 degrees from the vertical)
  phone: { name: "phone", canvas: [899, 1750], look: "frostedInk", tr: [322, 596], u: [58.3, 22.4], v: [-24.5, 44.5], light: [0.6, 0.8], seed: 11 },
};

// the case's margin round the keys (u)
const MARGIN = { x: 0.3, top: 0.3, bottom: 0.34 };
const BOARD_W = 15;
const BOARD_H = 5;

/* ============================= geometry ============================= */
const inv2 = ([[a, b], [c, d]]) => {
  const det = a * d - b * c;
  return [[d / det, -b / det], [-c / det, a / det]];
};
const mul = ([[a, b], [c, d]], [x, y]) => [a * x + b * y, c * x + d * y];
const norm = ([x, y]) => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};
const f4 = (n) => n.toFixed(4);
const specOf = (board) => (typeof board === "string" ? BOARDS[board] : board);

// A pose's case margin round the keys (u): the original's cases differ (the
// project page's is deep at its right end, where the viewer sees it)
const marginOf = (spec) => ({ ...MARGIN, ...spec.margin });
/** The case's top right corner, in the keys' frame (the pose is anchored there).
 *  @returns {[number, number]} */
export const cornerOf = (spec) => {
  const m = marginOf(spec);
  return [BOARD_W + m.x, -m.top];
};

/** Where a point of the board (u, from the first row's left, the keys'
 *  frame) lands in the canvas. */
export const placeOf = (spec, [bx, by]) => {
  const [cx, cy] = cornerOf(spec);
  return [spec.tr[0] + spec.u[0] * (bx - cx) + spec.v[0] * (by - cy), spec.tr[1] + spec.u[1] * (bx - cx) + spec.v[1] * (by - cy)];
};

const roundRect = (x, y, w, h, r) => `<rect x="${f4(x)}" y="${f4(y)}" width="${f4(w)}" height="${f4(h)}" rx="${f4(r)}" ry="${f4(r)}"`;

/* ============================== the drawing ============================== */
// The board as SVG in its own frame (1 unit = 1u, the keys' top left at the
// origin), under `matrix(a b c d e f)` onto the tile: lit from the upper left
// of the PRINT, whatever the board's turn, so the light is carried through the
// pose into the board's frame.
export const boardSvg = (board, tile) => {
  const spec = specOf(board);
  const id = spec.name;
  const look = LOOKS[spec.look];
  const { left, top, width, height, ss } = tile;
  const M = [[spec.u[0], spec.v[0]], [spec.u[1], spec.v[1]]];
  const Mi = inv2(M);
  const uPx = Math.hypot(...spec.u);
  // the print's light, as the direction shading grows in (image) -> board frame
  const L = norm(mul(Mi, norm(spec.light)));
  const px = (n) => n / uPx; // image px -> u
  const shade = (n) => mul(Mi, [spec.light[0] * n, spec.light[1] * n]); // an offset of n image px along the shading
  const [ox, oy] = placeOf(spec, [0, 0]);
  const matrix = [spec.u[0], spec.u[1], spec.v[0], spec.v[1], ox - left, oy - top].map((n) => n * ss);
  const out = [];
  const defs = [];
  const gid = (name) => `${name}-${id}`;
  const grad = (name, lit, shd, opacity = 1) =>
    defs.push(`<linearGradient id="${gid(name)}" x1="${f4(0.5 - 0.5 * L[0])}" y1="${f4(0.5 - 0.5 * L[1])}" x2="${f4(0.5 + 0.5 * L[0])}" y2="${f4(0.5 + 0.5 * L[1])}"><stop offset="0" stop-color="${hex(lit)}" stop-opacity="${opacity}"/><stop offset="1" stop-color="${hex(shd)}" stop-opacity="${opacity}"/></linearGradient>`);
  grad("skirt", look.skirt.lit, look.skirt.shade, look.skirt.opacity);
  grad("top", look.top.lit, look.top.shade, look.top.opacity);
  grad("rim", look.case.rim, look.top.under, look.case.rimOpacity);
  grad("keyrim", look.top.rim, look.top.under, look.top.rimOpacity);
  // a shallow dish in a cap's top: lighter at the lit lip, darker at the foot
  defs.push(`<radialGradient id="${gid("dish")}" cx="${f4(0.5 + 0.08 * L[0])}" cy="${f4(0.5 + 0.08 * L[1])}" r="0.62" fx="${f4(0.5 - 0.18 * L[0])}" fy="${f4(0.5 - 0.18 * L[1])}"><stop offset="0" stop-color="#fff" stop-opacity="${look.top.dish}"/><stop offset="0.7" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${look.top.dish * 1.4}"/></radialGradient>`);
  defs.push(`<filter id="${gid("blur-s")}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${f4(px(1.6))}"/></filter>`);
  defs.push(`<filter id="${gid("blur-m")}" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="${f4(px(4.5))}"/></filter>`);

  const mg = marginOf(spec);
  const cw = { x: -mg.x, y: -mg.top, w: BOARD_W + 2 * mg.x, h: BOARD_H + mg.top + mg.bottom };
  const [sdx, sdy] = shade(5);
  const [wdx, wdy] = shade(look.case.thick * uPx);
  // is a box (u, board frame) within reach of the tile (image px, with `pad`)?
  const visible = (x, y, w, h, pad) => {
    const pts = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map((p) => placeOf(spec, p));
    const [x0, x1] = [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0]))];
    const [y0, y1] = [Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))];
    return x1 + pad >= left && x0 - pad <= left + width && y1 + pad >= top && y0 - pad <= top + height;
  };

  // --- the case: its cast shadow on the paper, its wall (its thickness at
  // the shaded side), the frame, the tray the keys stand in
  out.push(`<g filter="url(#${gid("blur-m")})" opacity="${look.shadow.opacity}">${roundRect(cw.x + sdx * 2.2, cw.y + sdy * 2.2, cw.w, cw.h, 0.22)} fill="${hex(10)}"/></g>`);
  if (look.wire) {
    // a clear case is its edges: the rim, and the wall's lower edge a thickness
    // away, joined at the corners (the far ones fainter)
    const rimLine = `stroke="${hex(look.case.rim)}" stroke-width="${look.case.rimWidth}"`;
    out.push(`${roundRect(cw.x + wdx, cw.y + wdy, cw.w, cw.h, 0.2)} fill="${hex(look.case.wall)}" fill-opacity="${look.case.wallOpacity ?? 0.12}" ${rimLine} stroke-opacity="${look.case.rimOpacity * 0.8}"/>`);
    for (const [cx, cy, o] of [[cw.x, cw.y, 0.35], [cw.x + cw.w, cw.y, 0.8], [cw.x, cw.y + cw.h, 0.8], [cw.x + cw.w, cw.y + cw.h, 1]])
      out.push(`<line x1="${f4(cx)}" y1="${f4(cy)}" x2="${f4(cx + wdx)}" y2="${f4(cy + wdy)}" ${rimLine} stroke-opacity="${look.case.rimOpacity * o}"/>`);
  } else out.push(`${roundRect(cw.x + wdx, cw.y + wdy, cw.w, cw.h, 0.2)} fill="${hex(look.case.wall)}" fill-opacity="${look.case.fillOpacity + 0.3}"/>`);
  out.push(`${roundRect(cw.x, cw.y, cw.w, cw.h, 0.2)} fill="${hex(look.case.fill)}" fill-opacity="${look.case.fillOpacity}" stroke="url(#${gid("rim")})" stroke-width="${look.case.rimWidth}"/>`);
  // the inner lip of the frame
  // (a case's tray is the case inset by `inset`, or, where the pose's margin is
  // deep and the keys stand close in it, the keys' own box grown by `reach`)
  const ins = look.case.inset ?? 0.1;
  const tray = look.case.reach !== undefined ? { x: -look.case.reach, y: -look.case.reach, w: BOARD_W + 2 * look.case.reach, h: BOARD_H + 2 * look.case.reach } : { x: cw.x + ins, y: cw.y + ins, w: cw.w - 2 * ins, h: cw.h - 2 * ins };
  // the band is brightest along the tray's edge (the plastic's thickness catching the light)
  if (look.case.glow)
    out.push(`<g filter="url(#${gid("blur-s")})" opacity="0.85">${roundRect(tray.x, tray.y, tray.w, tray.h, 0.12)} fill="none" stroke="${hex(look.case.glow)}" stroke-width="0.34"/></g>`);
  out.push(`${roundRect(tray.x, tray.y, tray.w, tray.h, 0.12)} fill="${hex(look.case.tray)}" fill-opacity="${look.case.trayOpacity}" stroke="${hex(look.case.rim)}" stroke-opacity="${look.case.rimOpacity * (look.case.trayRim ?? 0.45)}" stroke-width="${look.case.rimWidth * (look.case.trayRim ? 0.9 : 0.6)}"/>`);

  if (look.case.lip) out.push(`${roundRect(cw.x + look.case.lip, cw.y + look.case.lip, cw.w - 2 * look.case.lip, cw.h - 2 * look.case.lip, 0.14)} fill="none" stroke="${hex(look.case.rim)}" stroke-opacity="${look.case.rimOpacity * 0.7}" stroke-width="${look.case.rimWidth * 0.8}"/>`);
  const keys = keysOf(ANSI_60).filter((k) => visible(k.x, k.y, k.w, 1, 12));
  const gap = 0.07;
  // a cap is a frustum: its top smaller than its foot (the sculpt) and raised
  // toward the light
  const lift = shade(-look.top.lift * uPx);
  const keyShapes = keys.map((k) => {
    const sk = { x: k.x + gap / 2, y: k.y + gap / 2, w: k.w - gap, h: 1 - gap };
    const [ix, iy] = look.top.inset;
    const tp = { x: sk.x + ix + lift[0], y: sk.y + iy + lift[1], w: sk.w - 2 * ix, h: sk.h - 2 * iy };
    return { k, sk, tp };
  });
  // shadows of every cap first, so no neighbour's shadow lands on a cap
  for (const { sk } of keyShapes) out.push(`<g filter="url(#${gid("blur-s")})" opacity="${look.shadow.opacity}">${roundRect(sk.x + sdx * 0.5, sk.y + sdy * 0.5, sk.w, sk.h, 0.1)} fill="${hex(8)}"/></g>`);
  // a translucent cap is lit through its walls: a pale haze round its foot,
  // under every cap (so a neighbour's haze does not wash over a cap's top)
  if (look.halo)
    for (const { sk } of keyShapes) {
      const g = look.halo.grow;
      // heavier on the lit side, where the wall catches the light
      const [hx, hy] = shade(-look.halo.lean * uPx);
      out.push(`<g filter="url(#${gid("blur-s")})" opacity="${look.halo.opacity}">${roundRect(sk.x - g + hx, sk.y - g + hy, sk.w + 2 * g, sk.h + 2 * g, 0.16)} fill="${hex(look.halo.color)}"/></g>`);
    }
  for (const { k, sk, tp } of keyShapes) {
    // the wall: the foot, in the shaded side's dark, a keyline round it
    out.push(`${roundRect(sk.x, sk.y, sk.w, sk.h, 0.1)} fill="url(#${gid("skirt")})" stroke="${hex(look.top.rim)}" stroke-opacity="${look.top.rimOpacity * (look.top.footRim ?? 0.55)}" stroke-width="${look.top.rimWidth * 0.7}"/>`);
    if (look.wire) {
      // the cap's edges: the four from the foot up to the top face
      const edge = `stroke="${hex(look.top.rim)}" stroke-width="${look.top.rimWidth * 0.7}"`;
      for (const [fx, fy, tx, ty] of [[sk.x, sk.y, tp.x, tp.y], [sk.x + sk.w, sk.y, tp.x + tp.w, tp.y], [sk.x, sk.y + sk.h, tp.x, tp.y + tp.h], [sk.x + sk.w, sk.y + sk.h, tp.x + tp.w, tp.y + tp.h]])
        out.push(`<line x1="${f4(fx)}" y1="${f4(fy)}" x2="${f4(tx)}" y2="${f4(ty)}" ${edge} stroke-opacity="0.75"/>`);
    }
    // the switch's housing and stem, seen through the cap's walls and top
    if (look.switches) {
      const [cx, cy] = [k.x + k.w / 2, k.y + 0.5];
      out.push(`${roundRect(cx - 0.27, cy - 0.27, 0.54, 0.54, 0.05)} fill="none" stroke="${hex(224)}" stroke-width="0.026" stroke-opacity="${look.switchOpacity ?? 0.95}"/>`);
      out.push(`<path d="M${f4(cx - 0.11)} ${f4(cy)}H${f4(cx + 0.11)}M${f4(cx)} ${f4(cy - 0.11)}V${f4(cy + 0.11)}" fill="none" stroke="${hex(224)}" stroke-width="0.06" stroke-opacity="${look.switchOpacity ?? 1}"/>`);
    }
    // the top
    out.push(`${roundRect(tp.x, tp.y, tp.w, tp.h, 0.11)} fill="url(#${gid("top")})"/>`);
    out.push(`${roundRect(tp.x, tp.y, tp.w, tp.h, 0.11)} fill="url(#${gid("dish")})"/>`);
    out.push(`${roundRect(tp.x, tp.y, tp.w, tp.h, 0.11)} fill="none" stroke="url(#${gid("keyrim")})" stroke-width="${look.top.rimWidth}"/>`);
    // the legend, where a real cap carries it: top left, or centred on the
    // modifiers; a word and a shifted pair are set a size down
    const { text, word } = legendOf(k);
    const centred = CENTRED.has(k.label);
    const size = look.legend.size * (text.includes("\n") || word ? (look.legend.word ?? 0.78) : 1);
    const pad = 0.16;
    out.push(
      legendSvg(text, {
        x: centred ? tp.x + tp.w / 2 : tp.x + pad,
        y: tp.y + (centred ? (tp.h - size) / 2 : pad * 0.9),
        size,
        anchor: centred ? "middle" : "start",
        color: hex(look.legend.color),
        opacity: look.legend.opacity,
        pen: look.legend.pen,
      }),
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width * ss}" height="${height * ss}" viewBox="0 0 ${width * ss} ${height * ss}"><defs>${defs.join("")}</defs><g transform="matrix(${matrix.map((n) => n.toFixed(5)).join(" ")})">${out.join("")}</g></svg>`;
};

/** The pixels a board covers in its canvas: the case's corners and the
 *  shadow's reach, clipped to the canvas. */
export const tileOf = (board, { ss = 4 } = {}) => {
  const spec = specOf(board);
  const [W, H] = spec.canvas;
  const mg = marginOf(spec);
  const corners = [[-mg.x, -mg.top], [BOARD_W + mg.x, -mg.top], [-mg.x, BOARD_H + mg.bottom], [BOARD_W + mg.x, BOARD_H + mg.bottom]].map((p) => placeOf(spec, p));
  const pad = 0.9 * Math.hypot(...spec.u);
  const x0 = Math.max(0, Math.floor(Math.min(...corners.map((p) => p[0])) - pad));
  const y0 = Math.max(0, Math.floor(Math.min(...corners.map((p) => p[1])) - pad));
  const x1 = Math.min(W, Math.ceil(Math.max(...corners.map((p) => p[0])) + pad));
  const y1 = Math.min(H, Math.ceil(Math.max(...corners.map((p) => p[1])) + pad));
  return { left: x0, top: y0, width: x1 - x0, height: y1 - y0, ss };
};

/** The board drawn clean (RGBA, straight alpha) over its tile. */
export const drawBoard = async (board, opts) => {
  const tile = tileOf(board, opts);
  // a board wholly off its canvas draws nothing
  if (tile.width <= 0 || tile.height <= 0) return { ...tile, width: 0, height: 0, data: Buffer.alloc(0) };
  const svg = boardSvg(board, tile);
  const big = await sharp(Buffer.from(svg), { density: 72 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const small = await sharp(big.data, { raw: big.info }).resize(tile.width, tile.height, { kernel: "lanczos3" }).ensureAlpha().raw().toBuffer();
  return { ...tile, data: small };
};

/* ============================ the print's grain ============================ */
// seeded noise (mulberry32 steps), uniform, as floats about 0 with unit sd
const noiseField = (len, seed) => {
  let t = seed >>> 0;
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    out[i] = ((((r ^ (r >>> 14)) >>> 0) & 0xffff) / 0xffff - 0.5) * 3.4641; // uniform, unit sd
  }
  return out;
};
const blur = (src, W, H, sigma) => {
  const r = Math.max(1, Math.ceil(sigma * 3));
  const k = Array.from({ length: 2 * r + 1 }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)));
  const s = k.reduce((a, v) => a + v, 0);
  const tmp = new Float32Array(W * H);
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let a = 0;
      for (let j = -r; j <= r; j++) a += k[j + r] * src[y * W + Math.min(W - 1, Math.max(0, x + j))];
      tmp[y * W + x] = a / s;
    }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let a = 0;
      for (let j = -r; j <= r; j++) a += k[j + r] * tmp[Math.min(H - 1, Math.max(0, y + j)) * W + x];
      out[y * W + x] = a / s;
    }
  return out;
};
// a noise band: blurred white noise rescaled to unit sd
const band = (W, H, sigma, seed) => {
  const f = blur(noiseField(W * H, seed), W, H, sigma);
  let [m, v] = [0, 0];
  for (let i = 0; i < f.length; i += 5) m += f[i];
  m /= Math.ceil(f.length / 5);
  for (let i = 0; i < f.length; i += 5) v += (f[i] - m) ** 2;
  const sd = Math.sqrt(v / Math.ceil(f.length / 5)) || 1;
  return f.map((q) => (q - m) / sd);
};
const smooth = (a, b, t) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

/**
 * What makes the drawn board a print: its edges wavering a little as paper
 * fibre and emulsion do (a displacement of a px or so), a softness (a lens, the
 * exposure's scatter), the emulsion's mottle across the caps, and the plate's
 * own tooth. `grain` is the tooth's sd in luminance levels (the ground's, at 1 px).
 */
export const finish = (tile, seedOf, { grain = 4.5, mottle = 0.05, wobble = 0.3, soft = 0.12, glow } = {}) => {
  const { width: W, height: H, data } = tile;
  const seed = seedOf * 101;
  // premultiplied floats
  const ch = [0, 1, 2, 3].map(() => new Float32Array(W * H));
  for (let i = 0; i < W * H; i++) {
    const a = data[i * 4 + 3] / 255;
    for (let k = 0; k < 3; k++) ch[k][i] = data[i * 4 + k] * a;
    ch[3][i] = a;
  }
  // wavering edges: sample each channel through a smooth displacement
  const [dx, dy] = [band(W, H, 3.5, seed + 1), band(W, H, 3.5, seed + 2)];
  const [fx, fy] = [band(W, H, 1.2, seed + 3), band(W, H, 1.2, seed + 4)];
  const warped = ch.map((c) => {
    const out = new Float32Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const [sx, sy] = [x + wobble * dx[i] + 0.4 * wobble * fx[i], y + wobble * dy[i] + 0.4 * wobble * fy[i]];
        const [x0, y0] = [Math.min(W - 2, Math.max(0, Math.floor(sx))), Math.min(H - 2, Math.max(0, Math.floor(sy)))];
        const [tx, ty] = [Math.min(1, Math.max(0, sx - x0)), Math.min(1, Math.max(0, sy - y0))];
        out[i] = c[y0 * W + x0] * (1 - tx) * (1 - ty) + c[y0 * W + x0 + 1] * tx * (1 - ty) + c[(y0 + 1) * W + x0] * (1 - tx) * ty + c[(y0 + 1) * W + x0 + 1] * tx * ty;
      }
    return out;
  });
  const soft4 = warped.map((c) => (soft > 0 ? blur(c, W, H, soft) : c));
  // a line drawing's bloom: where the lines are white, their light spreads a
  // little into what is round them (the exposure's scatter), laid back as white
  if (glow) {
    const hot = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) {
      const a = soft4[3][i];
      if (a > 0.05) hot[i] = a * smooth(150, 235, (0.299 * soft4[0][i] + 0.587 * soft4[1][i] + 0.114 * soft4[2][i]) / a);
    }
    const lit = blur(hot, W, H, glow.sigma);
    for (let i = 0; i < W * H; i++) {
      const [a, ga] = [soft4[3][i], Math.min(1, glow.gain * lit[i])];
      for (let k = 0; k < 3; k++) soft4[k][i] += ga * (1 - a) * glow.color;
      soft4[3][i] = a + ga * (1 - a);
    }
  }
  const [m1, m2] = [band(W, H, 7, seed + 5), band(W, H, 2.2, seed + 6)];
  const g = band(W, H, 0.7, seed + 7);
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const a = Math.min(1, soft4[3][i]);
    if (a <= 0.002) continue;
    // luminance gain: broad mottle and a finer one, the tooth riding on both
    const gain = 1 + mottle * (0.7 * m1[i] + 0.5 * m2[i]);
    for (let k = 0; k < 3; k++) {
      const c = soft4[k][i] / a; // un-premultiplied
      out[i * 4 + k] = Math.round(Math.min(255, Math.max(0, c * gain + grain * g[i] * Math.min(1, a * 2))));
    }
    out[i * 4 + 3] = Math.round(a * 255);
  }
  return { ...tile, data: out };
};

/** Pale shapes already printed on the plate (the ferns), as a 0..1 matte: what
 *  stands in front of the board. A grayscale opening (erode then dilate, 3 px)
 *  takes the hairline grid rules out, leaving the fronds. */
const frontMatte = (rgb, W, tile) => {
  const { left, top, width: w, height: h } = tile;
  const L = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const o = ((top + y) * W + left + x) * 3;
      L[y * w + x] = 0.299 * rgb[o] + 0.587 * rgb[o + 1] + 0.114 * rgb[o + 2];
    }
  const rank = (src, r, pick) => {
    const tmp = new Float32Array(w * h);
    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let v = src[y * w + x];
        for (let j = -r; j <= r; j++) v = pick(v, src[y * w + Math.min(w - 1, Math.max(0, x + j))]);
        tmp[y * w + x] = v;
      }
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let v = tmp[y * w + x];
        for (let j = -r; j <= r; j++) v = pick(v, tmp[Math.min(h - 1, Math.max(0, y + j)) * w + x]);
        out[y * w + x] = v;
      }
    return out;
  };
  const opened = rank(rank(L, 1, Math.min), 2, Math.max);
  return blur(opened.map((v) => smooth(112, 150, v)), w, h, 0.8);
};

/**
 * Lay a board into an RGB canvas (W x H x 3, in place): drawn, finished as a
 * print, over the plate with the plate's own pixels showing through its clear
 * parts, and the plate's fronds standing in front of it.
 */
export const paintKeyboard = async (rgb, W, H, board, opts = {}) => {
  const spec = specOf(board);
  if (spec.canvas[0] !== W || spec.canvas[1] !== H) throw new Error(`${spec.name}: the board is placed on a ${spec.canvas.join("x")} canvas, not ${W}x${H}`);
  const drawn = await drawBoard(spec, opts);
  if (!drawn.data.length) return drawn;
  const { mottle, wobble, soft, grain, glow } = LOOKS[spec.look];
  const tile = finish(drawn, spec.seed, { mottle, ...(wobble !== undefined && { wobble }), ...(soft !== undefined && { soft }), ...(grain !== undefined && { grain }), ...(glow && { glow }), ...opts });
  const front = frontMatte(rgb, W, tile);
  const { left, top, width: w, height: h, data } = tile;
  // where the board fades into the print: how far along its rows (u) a pixel is
  const along = spec.fade && inv2([[spec.u[0], spec.v[0]], [spec.u[1], spec.v[1]]]);
  const [ox, oy] = placeOf(spec, [0, 0]);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const kept = along ? smooth(spec.fade[0], spec.fade[1], mul(along, [left + x - ox, top + y - oy])[0]) : 1;
      const a = (data[i * 4 + 3] / 255) * (1 - front[i]) * kept;
      if (a <= 0) continue;
      const o = ((top + y) * W + left + x) * 3;
      for (let k = 0; k < 3; k++) rgb[o + k] = Math.round(rgb[o + k] * (1 - a) + data[i * 4 + k] * a);
    }
  return tile;
};
