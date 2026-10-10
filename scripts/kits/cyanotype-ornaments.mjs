// The print's generic ornaments, for the empty blue the home page shows right
// of its intro sheet under the first screen (cyanotype.css .hero-more::after):
// a meshing pair of gears drawn as an engineer's drawing, their centre lines,
// a dimension line under them, registration marks. No words and nothing of any
// project's: the print's own furniture (the originals carry the same: a gear
// pair with dimension lines, crosshairs), drawn as vector linework and
// printed as the print's white (the page lays it as a mask in the finish's
// chalk, so the night finish takes it dim and warm like the rest).
//
// A 300 x 500 drawing (the column's own proportion: ~300 wide beside a sheet
// ~500 tall), drawn at 2x. Alpha only (white at the linework's strength).

// a gear of `n` teeth: the polygon of its outline, tooth tips at `tip`, roots
// at `root`, a tooth a trapezoid, at `phase` radians
const gearPath = (cx, cy, n, tip, root, phase = 0) => {
  const pts = [];
  const step = (2 * Math.PI) / n;
  for (let i = 0; i < n; i++) {
    const a = phase + i * step;
    // root, the flank up, the tip, the flank down, root: as fractions of a
    // pitch, the tooth centred on the pitch's middle
    for (const [f, r] of [[0.0, root], [0.14, root], [0.33, tip], [0.67, tip], [0.86, root]]) {
      const t = a + f * step;
      pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
  }
  return `M${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L")}Z`;
};

const circle = (cx, cy, r, extra = "") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" ${extra}/>`;
const line = (x1, y1, x2, y2, extra = "") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;

// a gear with its rings, spokes, hub and bore, and its centre lines
const gear = ({ cx, cy, n, tip, root, phase, rings, spokes, hub, bore, centre }) => {
  const out = [`<path d="${gearPath(cx, cy, n, tip, root, phase)}" fill="none" stroke-width="1.5"/>`];
  for (const r of rings) out.push(circle(cx, cy, r, `stroke-width="1"`));
  for (let i = 0; i < spokes; i++) {
    const a = phase + (i * 2 * Math.PI) / spokes;
    out.push(line((cx + hub * Math.cos(a)).toFixed(2), (cy + hub * Math.sin(a)).toFixed(2), (cx + rings[rings.length - 1] * Math.cos(a)).toFixed(2), (cy + rings[rings.length - 1] * Math.sin(a)).toFixed(2), `stroke-width="1"`));
  }
  out.push(circle(cx, cy, hub, `stroke-width="1.3"`), circle(cx, cy, bore, `stroke-width="1.3"`));
  // the centre lines: a long dash, a short, running past the gear
  const c = centre;
  out.push(line(cx - c, cy, cx + c, cy, `stroke-width="0.8" stroke-dasharray="14 3 2 3"`), line(cx, cy - c, cx, cy + c, `stroke-width="0.8" stroke-dasharray="14 3 2 3"`));
  return out.join("");
};

// a registration mark: a ring with a cross through it
const register = (cx, cy, r) => circle(cx, cy, r, `stroke-width="1"`) + line(cx - r * 1.9, cy, cx + r * 1.9, cy, `stroke-width="0.9"`) + line(cx, cy - r * 1.9, cx, cy + r * 1.9, `stroke-width="0.9"`);

// a dimension line between two extension lines, with an arrowhead each end
const dimH = (x1, x2, y, y0, y1) =>
  [
    line(x1, y0, x1, y1, `stroke-width="0.8"`),
    line(x2, y0, x2, y1, `stroke-width="0.8"`),
    line(x1, y, x2, y, `stroke-width="0.9"`),
    `<path d="M${x1 + 9} ${y - 3.2}L${x1} ${y}L${x1 + 9} ${y + 3.2}M${x2 - 9} ${y - 3.2}L${x2} ${y}L${x2 - 9} ${y + 3.2}" fill="none" stroke-width="0.9"/>`,
  ].join("");
const dimV = (x, y1, y2, x0, x1) =>
  [
    line(x0, y1, x1, y1, `stroke-width="0.8"`),
    line(x0, y2, x1, y2, `stroke-width="0.8"`),
    line(x, y1, x, y2, `stroke-width="0.9"`),
    `<path d="M${x - 3.2} ${y1 + 9}L${x} ${y1}L${x + 3.2} ${y1 + 9}M${x - 3.2} ${y2 - 9}L${x} ${y2}L${x + 3.2} ${y2 - 9}" fill="none" stroke-width="0.9"/>`,
  ].join("");

export const ORNAMENTS = { w: 300, h: 500, scale: 2 };

// the two gears, meshing: B sits on the line from A at angle `mesh`, where A
// has a gap (a tooth is centred on its pitch's middle, so a gap is at a
// pitch's start) and B a tooth pointing back at A
const GA = { cx: 168, cy: 118, n: 16 };
const GB = { cx: 118, cy: 228, n: 9 };
const mesh = Math.atan2(GB.cy - GA.cy, GB.cx - GA.cx);
const [stepA, stepB] = [(2 * Math.PI) / GA.n, (2 * Math.PI) / GB.n];
const mod = (a, m) => ((a % m) + m) % m;
const phaseA = mod(mesh, stepA);
const phaseB = mod(mesh + Math.PI - 0.5 * stepB, stepB);

export const ornamentSvg = () => {
  const { w, h, scale } = ORNAMENTS;
  const body = [
    // the big gear, and the small one meshing with it (centres 121 apart:
    // the pitch radii, 81 and 40, sum to it)
    gear({ cx: GA.cx, cy: GA.cy, n: GA.n, tip: 88, root: 74, phase: phaseA, rings: [60, 40], spokes: 6, hub: 17, bore: 7, centre: 106 }),
    gear({ cx: GB.cx, cy: GB.cy, n: GB.n, tip: 47, root: 34, phase: phaseB, rings: [24], spokes: 3, hub: 11, bore: 5, centre: 62 }),
    // the dimension of the big gear's width, under the pair, and of its
    // height, at the right
    dimH(80, 256, 306, 280, 316),
    dimV(290, 30, 206, 262, 296),
    // registration marks
    register(46, 44, 7),
    register(238, 400, 12),
    register(66, 440, 5),
    // a short rule with ticks, as the print's margins carry
    line(40, 360, 120, 360, `stroke-width="0.9"`),
    ...[40, 60, 80, 100, 120].map((x) => line(x, 355, x, 365, `stroke-width="0.9"`)),
    line(160, 470, 280, 470, `stroke-width="0.9"`),
    ...[160, 190, 220, 250, 280].map((x) => line(x, 465, x, 475, `stroke-width="0.9"`)),
  ].join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}"><g fill="none" stroke="#fff" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
};
