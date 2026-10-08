// Flat shapes in the clear line: an asset drawn as nested rounded
// rectangles, each one flat colour, the ink among them at an exact width.
//
// A style whose thesis is one even ink weight everywhere (Ligne Claire)
// cannot take its line from the generated art: a generator draws the line at
// whatever weight it likes, a different one on every asset, and a 9-slice
// prints each asset at its own scale (kit.css --plate-k, --key-k, --mat-k),
// so the line comes out thinner on some surfaces than others and softer
// where a scale is fractional. Here the art's shape and colours (sampled from
// the raws, named in the style's config) are kept and the line is drawn at
// the width in bitmap px that the asset's scale prints as the style's one
// weight. Edges are antialiased by supersampling, so a band's edge that falls
// on a whole bitmap px (and, at the asset's scale, on a whole page px) stays
// crisp.
//
// The line is a pen's, not a ruler's (`hand`, below): along a side it gives
// a little of its width and takes it back, slowly, and at a corner, where
// the pen slows to turn, it is drawn full. Its outer edge, the panel's
// silhouette, stays true.
import sharp from "sharp";

const hex = (h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Does a point lie inside a convex polygon (its vertices in order)? */
const inPoly = (x, y, poly) => {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const [[ax, ay], [bx, by]] = [poly[i], poly[(i + 1) % poly.length]];
    const c = Math.sign((bx - ax) * (y - ay) - (by - ay) * (x - ax));
    if (c && sign && c !== sign) return false;
    sign ||= c;
  }
  return true;
};

/** How far inside the W x H rounded rectangle of radius R a point lies (its
 *  signed distance from the edge, negative outside). The contour at inset d
 *  of a rounded rectangle is the set of points at least d inside it. */
const depthIn = (x, y, { W, H, R }) => {
  const [qx, qy] = [Math.abs(x - W / 2) - (W / 2 - R), Math.abs(y - H / 2) - (H / 2 - R)];
  return R - Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - Math.min(Math.max(qx, qy), 0);
};

/** Does a point lie inside the contour: a convex polygon (`poly`), an
 *  ellipse (`ellipse`: centre, radii, rotation in degrees), a rounded
 *  rectangle moved in by a hand-drawn line's give (`give`: its inset from
 *  the `outer` rectangle, less the give at the point), or the rounded
 *  rectangle [x0,x1] x [y0,y1] of radius r? */
const inside = (x, y, { x0, y0, x1, y1, r, poly, ellipse, give, outer, d }) => {
  if (poly) return inPoly(x, y, poly);
  if (ellipse) {
    const { cx, cy, rx, ry, rot = 0 } = ellipse;
    const [c, s] = [Math.cos((rot * Math.PI) / 180), Math.sin((rot * Math.PI) / 180)];
    const [u, v] = [(x - cx) * c + (y - cy) * s, -(x - cx) * s + (y - cy) * c];
    return (u / rx) ** 2 + (v / ry) ** 2 <= 1;
  }
  if (give) return depthIn(x, y, outer) >= d - give(x, y);
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const dx = Math.max(x0 + r - x, 0, x - (x1 - r));
  const dy = Math.max(y0 + r - y, 0, y - (y1 - r));
  return dx * dx + dy * dy <= r * r;
};

/**
 * A pen's give along a band: how much of its width `w` the band, whose
 * inner edge lies `d` inside the W x H rectangle, gives up at a point. Along
 * each side it varies slowly (a few long waves, `seed` setting their
 * phases, a different run on every side), up to `thin` of the width; it
 * falls to nothing toward each corner, where the line is drawn full, and
 * is gone within 3 widths of the corner's turn, so the line's corners (a
 * 9-slice's unstretched squares) are the pen's at its fullest.
 */
const give = (W, H, d, w, radius, { thin, seed = 1 }) => {
  const waves = [
    [0.9, 1],
    [0.43, 0.55],
    [0.21, 0.3],
  ].map(([len, amp], i) => ({ len: len * Math.min(W, H), amp, phase: seed * (2.39 + i * 1.37) }));
  const total = waves.reduce((a, { amp }) => a + amp, 0);
  const [near, far] = [d + radius * 0.5, d + radius * 0.5 + 3 * w];
  return (x, y) => {
    const [ex, ey] = [Math.min(x, W - x), Math.min(y, H - y)];
    // along the nearest side: its run, and where on it the point lies
    const side = ey < ex ? (y < H / 2 ? 0 : 2) : x < W / 2 ? 3 : 1;
    const u = side % 2 ? y : x;
    const n = waves.reduce((a, { len, amp, phase }) => a + amp * Math.sin((2 * Math.PI * u) / len + phase + side * 1.7), 0) / total;
    const t = Math.min(1, Math.max(0, (Math.max(ex, ey) - near) / (far - near)));
    return thin * w * (0.5 + 0.5 * n) * t * t * (3 - 2 * t);
  };
};

/**
 * Concentric bands inside a W x H rounded rectangle of `radius`: `bands` from
 * the outside in, each [width, colour] or [width, colour, { hand, keep,
 * round }], then `fill` (a colour, or null for a window left clear) for
 * everything inside them. A band's corner is the outer one's offset inward
 * (its radius shrinks by its inset, to square), or, `round`, a radius of
 * its own that the bands inside it shrink from (an ink line round a rounded
 * window cut in a square band). A band drawn by `hand` ({ thin, seed })
 * gives a little of its width along its sides (see `give`): its inner edge,
 * and every band inside it with it, moves out, so what lies inside it keeps
 * its own width. A band marked `keep` is one a framed sheet's glaze must
 * keep where it runs into the pane (a focus band: drawInk reports where).
 */
export const rings = (W, H, { radius, bands, fill, tail }) => {
  const outer = { W, H, R: radius };
  let gives = null;
  const at = (d, color, r) => (gives ? { outer, d, give: gives, color } : { x0: d, y0: d, x1: W - d, y1: H - d, r, color });
  const out = [];
  let [d, r] = [0, radius];
  for (const [w, color, { hand, keep, round } = {}] of bands) {
    if (round !== undefined) r = round;
    out.push({ ...at(d, color, r), keep });
    if (tail) out.push(tailAt(H, tail, d, color));
    d += w;
    r = Math.max(0, r - w);
    if (hand) gives = give(W, H, d, w, radius, hand);
  }
  out.push(at(d, fill, r));
  if (tail) out.push(tailAt(H, tail, d, fill));
  return out;
};

/**
 * A caption's tail, a speech balloon's pointer, hung from the bottom edge
 * of the H px tall box: a triangle whose base runs along that edge from `x`
 * to `x + width` and whose tip is `depth` below it at `tip` (x), drawn `d`
 * inside the outer contour (its sides moved in by `d`, as a band's are),
 * its base `d` up inside the box, so the bands run on round it and its fill
 * runs into the box's.
 */
const tailAt = (H, { x, width, depth, tip }, d, color) => {
  const [A, B, C] = [
    [x, H],
    [x + width, H],
    [tip, H + depth],
  ];
  // each side moved in by `d`, toward the third vertex
  const moved = (P, Q, R) => {
    const [dx, dy] = [Q[0] - P[0], Q[1] - P[1]];
    const len = Math.hypot(dx, dy);
    let [nx, ny] = [-dy / len, dx / len];
    if ((R[0] - P[0]) * nx + (R[1] - P[1]) * ny < 0) [nx, ny] = [-nx, -ny];
    return { p: [P[0] + nx * d, P[1] + ny * d], v: [dx, dy] };
  };
  const meet = (l, m) => {
    const den = l.v[0] * m.v[1] - l.v[1] * m.v[0];
    const t = ((m.p[0] - l.p[0]) * m.v[1] - (m.p[1] - l.p[1]) * m.v[0]) / den;
    return [l.p[0] + t * l.v[0], l.p[1] + t * l.v[1]];
  };
  const [left, right] = [moved(A, C, B), moved(B, C, A)];
  const top = { p: [0, H - d - 0.5], v: [1, 0] };
  return { poly: [meet(top, left), meet(top, right), meet(left, right)], color };
};

/**
 * Draw `contours` (outermost first; a pixel takes the colour of the innermost
 * one it lies in, null leaving it clear) into a W x H PNG at `path`, each
 * pixel sampled `ss` x `ss` times. Returns, per pixel (0 to 1), how much of
 * it the innermost contour (a sheet's field) covers, `field`, and the
 * contours marked `keep` cover, `keep` (null if none is).
 */
export async function drawInk(path, W, H, contours, ss = 4) {
  if (!(W > 0 && H > 0)) throw new Error(`drawInk: bad size ${W}x${H}`);
  const cs = contours.map((c) => ({ ...c, rgb: c.color ? hex(c.color) : null }));
  const px = Buffer.alloc(W * H * 4);
  const keep = cs.some((c) => c.keep) ? new Float32Array(W * H) : null;
  const field = new Float32Array(W * H);
  const innermost = cs[cs.length - 1];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let [r, g, b, a, k, f] = [0, 0, 0, 0, 0, 0];
      for (let j = 0; j < ss; j++)
        for (let i = 0; i < ss; i++) {
          const [sx, sy] = [x + (i + 0.5) / ss, y + (j + 0.5) / ss];
          let hit = null;
          for (const c of cs) if (inside(sx, sy, c)) hit = c;
          if (hit === innermost) f++;
          if (!hit?.rgb) continue;
          [r, g, b, a] = [r + hit.rgb[0], g + hit.rgb[1], b + hit.rgb[2], a + 1];
          if (hit.keep) k++;
        }
      if (keep) keep[y * W + x] = k / (ss * ss);
      field[y * W + x] = f / (ss * ss);
      const o = (y * W + x) * 4;
      if (!a) continue;
      [px[o], px[o + 1], px[o + 2], px[o + 3]] = [Math.round(r / a), Math.round(g / a), Math.round(b / a), Math.round((255 * a) / (ss * ss))];
    }
  await sharp(px, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path);
  return { field, keep };
}
