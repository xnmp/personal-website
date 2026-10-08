// Framed panes: a sheet that is a frame round a material (Solarpunk's brass
// round frosted glass, Sumi-e's silk mount round washi). The page paints the
// pane itself (kit.css --plate-fill, tiled, over a backdrop blur where it's
// glass), so it keeps its grain at any size instead of smearing across a
// 9-slice's stretched edges. The sheet art keeps only the frame, any rivets
// fixing its corners, and the light the frame throws on the pane:
//
//   frameMask  where the frame is: a band per side (the pane's edge, measured
//              per raw) plus, where the frame is riveted, a disc per rivet,
//              fitted to the rivet's rim near each inner corner
//   fillet     the focus state: a band laid in along the pane's edge, on
//              the pane under the rivets that pin it (an enamel strip in
//              brass), or over the frame's inner edge (a scroll's silk)
//   glaze      clears the pane, then lays on it the frame's shade (falling
//              to the lower right, from the upper-left key light) and a glint
//              where the pane's edge turns to the light (glass)
//
// All of it stays within the 56px a sheet's 9-slice keeps unstretched at
// each corner (kit.css --slice-plate 152 = 96 pad + 56), and runs straight
// along the edges between, so nothing it adds smears when the edges stretch.
import sharp from "sharp";
import { renameSync } from "node:fs";
import { webpOptions } from "./webp.mjs";

const SLICE = 56;
const RIM = 3.5; // a rivet's dark rim, past the dome the fit finds

const load = async (path) => {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height };
};
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const hex = (h) => h.match(/../g).map((c) => parseInt(c, 16));

/** Separable Gaussian blur of a W×H field. */
const blur = (src, W, H, sigma) => {
  const r = Math.ceil(sigma * 3);
  const k = Array.from({ length: 2 * r + 1 }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)));
  const sum = k.reduce((a, b) => a + b, 0);
  const tmp = new Float32Array(W * H);
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let a = 0;
      for (let i = -r; i <= r; i++) a += k[i + r] * src[y * W + Math.min(W - 1, Math.max(0, x + i))];
      tmp[y * W + x] = a / sum;
    }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let a = 0;
      for (let i = -r; i <= r; i++) a += k[i + r] * tmp[Math.min(H - 1, Math.max(0, y + i)) * W + x];
      out[y * W + x] = a / sum;
    }
  return out;
};

/** A field moved by (dx, dy), by any fraction of a pixel (bilinear), what
 *  comes in from the edge taken from the edge. */
const shift = (src, W, H, dx, dy) => {
  const out = new Float32Array(W * H);
  const at = (x, y) => src[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  const [ix, iy] = [Math.floor(dx), Math.floor(dy)];
  const [fx, fy] = [dx - ix, dy - iy];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const [sx, sy] = [x - ix, y - iy];
      // the sample point is (x - dx, y - dy): between sx-1 and sx by fx
      const top = at(sx, sy) * (1 - fx) + at(sx - 1, sy) * fx;
      const bot = at(sx, sy - 1) * (1 - fx) + at(sx - 1, sy - 1) * fx;
      out[y * W + x] = top * (1 - fy) + bot * fy;
    }
  return out;
};

/** 1 well inside a corner's unstretched square, falling to 0 at its slice lines. */
const inCorner = (x, y, W, H) => {
  const ex = Math.min(x, W - 1 - x);
  const ey = Math.min(y, H - 1 - y);
  return (1 - smooth(SLICE - 8, SLICE - 1, ex)) * (1 - smooth(SLICE - 8, SLICE - 1, ey));
};

/** The rivet at one inner corner: the disc whose rim the luminance rises
 *  across, inward (a lit dome inside a dark rim), best along its whole
 *  circumference. Straight bevels cross a circle both ways and cancel. */
const fitRivet = (L, W, H, [ox, oy, sx, sy], [fx, fy]) => {
  const gx = (x, y) => L[y * W + x + 1] - L[y * W + x - 1];
  const gy = (x, y) => L[(y + 1) * W + x] - L[(y - 1) * W + x];
  let best = { score: -Infinity };
  for (let a = fx - 2; a <= fx + 10; a++)
    for (let b = fy - 2; b <= fy + 10; b++)
      for (let r = 12; r <= 22; r += 0.5) {
        const cx = ox + sx * a;
        const cy = oy + sy * b;
        let s = 0;
        for (let t = 0; t < 72; t++) {
          const th = (t / 72) * 2 * Math.PI;
          const x = Math.round(cx + r * Math.cos(th));
          const y = Math.round(cy + r * Math.sin(th));
          if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
          s += (gx(x, y) * (cx - x) + gy(x, y) * (cy - y)) / r;
        }
        if (s > best.score) best = { score: s, cx, cy, r };
      }
  return best;
};

/**
 * Where a framed sheet's frame is, as coverage fields over its base art
 * (1 = frame): `band`, the frame's sides, square inside (frame = {t, r, b, l},
 * the pane's edge in px from the art's edge), and `rivet`, the discs fixing
 * its corners, kept within the corners' unstretched squares.
 *
 * A frame drawn round its field (`field`, the field's coverage: a clear-line
 * panel, scripts/ink.mjs) is exactly what is not its field.
 *
 * A frame that is a moulding ends in a line, so the band ends square. One
 * that is the material itself brushed thin toward the paper (a cyanotype's
 * emulsion) has no line to end on: with `feather`, the band hands over to
 * the page's material over that many px inside the frame's edge, so the
 * art's own material fades into the page's instead of meeting it in a seam.
 */
/**
 * A frame of the same material as its pane, its light held to the pane's.
 * A generated stone tablet lights its worn edge as a material of its own:
 * the slope that faces the sun near white and yellower than the face, the
 * one turned from it a saturated brown, so the edge reads as a moulded rim
 * round a card rather than the slab's own stone rolling over. Here every
 * pixel outside the pane (`frame` px in from each side) is drawn toward the
 * face's colour (the mean of the pane within `ring` px of the frame), what
 * is lighter than the face by `light` of its difference, what is darker by
 * `shade`: the form keeps its light and shade, the material its colour.
 * Works on the base art, in place.
 */
export async function temper(path, frame, { light = 1, shade = 1, ring = 24 } = {}) {
  const { data, W, H } = await load(path);
  const inPane = (x, y) => x >= frame.l && x < W - frame.r && y >= frame.t && y < H - frame.b;
  const face = [0, 0, 0];
  let n = 0;
  for (let y = frame.t; y < H - frame.b; y++)
    for (let x = frame.l; x < W - frame.r; x++) {
      const p = (y * W + x) * 4;
      if (data[p + 3] < 250 || Math.min(x - frame.l, W - frame.r - 1 - x, y - frame.t, H - frame.b - 1 - y) >= ring) continue;
      for (let k = 0; k < 3; k++) face[k] += data[p + k];
      n++;
    }
  if (!n) throw new Error(`temper: no face inside the frame of ${path}`);
  const F = face.map((v) => v / n);
  const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const fl = lum(...F);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4;
      if (!data[p + 3] || inPane(x, y)) continue;
      const f = lum(data[p], data[p + 1], data[p + 2]) > fl ? light : shade;
      for (let k = 0; k < 3; k++) data[p + k] = Math.round(Math.min(255, Math.max(0, F[k] + (data[p + k] - F[k]) * f)));
    }
  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path + ".tmp.png");
  renameSync(path + ".tmp.png", path);
}

/**
 * A window cleared out of its frame before the frame is measured: the face
 * the frame holds (an enamel plate's) found from the art's centre, every
 * pixel reached through what is not the frame's metal (its saturation
 * under `metal`, or too dark or too light to be lit metal), made clear,
 * its edge against the metal softened over the saturation between
 * `metal - soft` and `metal`. For a frame whose window's corners are round
 * and whose face the page paints in another colour by night: the band and
 * corners of face a square cut leaves inside the frame (and the lossy
 * block alignment moves the cut further in) would show the art's face
 * there, ivory round a navy pane. In place, on the base art.
 */
export async function clearWindow(path, { metal = 0.3, soft = 0.08, gain = 1 } = {}) {
  const { data, W, H } = await load(path);
  // judged as painted: a finish graded from the art (`gain`, a lamp's warm
  // grade) saturates the face toward the metal
  const g = Array.isArray(gain) ? gain : [gain, gain, gain];
  const sat = (p) => {
    const [r, g0, b] = [data[p] / g[0], data[p + 1] / g[1], data[p + 2] / g[2]];
    return saturation(r, g0, b);
  };
  const saturation = (r, g, b) => {
    const mx = Math.max(r, g, b);
    return mx ? (mx - Math.min(r, g, b)) / mx : 0;
  };
  const isMetal = (p) => data[p + 3] > 127 && sat(p) >= metal;
  const seen = new Uint8Array(W * H);
  const stack = [((H >> 1) * W + (W >> 1))];
  seen[stack[0]] = 1;
  while (stack.length) {
    const i = stack.pop();
    const p = i * 4;
    // softened against the metal: the less saturated, the clearer
    const keep = smooth(metal - soft, metal, sat(p));
    data[p + 3] = Math.round(data[p + 3] * keep);
    const [x, y] = [i % W, (i / W) | 0];
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx;
      if (seen[j] || isMetal(j * 4)) continue;
      seen[j] = 1;
      stack.push(j);
    }
  }
  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path + ".tmp.png");
  renameSync(path + ".tmp.png", path);
}

export async function frameMask(path, frame, { rivets = true, feather = 0, cleared = false, field = null } = {}) {
  const { data, W, H } = await load(path);
  const band = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      // how far inside the pane, past its nearest edge (<= 0 on the frame)
      const d = Math.min(x - frame.l, W - 1 - frame.r - x, y - frame.t, H - 1 - frame.b - y) + 1;
      // a window already cleared out of its frame (clearWindow, `cleared`):
      // the frame is the art's own metal wherever it reaches, past the
      // frame's line too (a window's rounded corner, an arc engraved into
      // it), so no state cuts it square
      const own = cleared && data[(y * W + x) * 4 + 3] > 0 ? 1 : 0;
      band[y * W + x] = d <= 0 ? 1 : Math.max(own, feather > 0 ? 1 - smooth(0, feather, d) : 0);
      // a frame drawn round its field (scripts/ink.mjs, `field` its
      // coverage): the frame is all that is not the field, wherever the
      // line runs (a pen's line gives inside the frame's line)
      if (field) band[y * W + x] = 1 - field[y * W + x];
    }
  const rivet = new Float32Array(W * H);
  const discs = [];
  if (rivets) {
    const L = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) L[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    const corners = [
      [[0, 0, 1, 1], [frame.l, frame.t]],
      [[W - 1, 0, -1, 1], [frame.r, frame.t]],
      [[0, H - 1, 1, -1], [frame.l, frame.b]],
      [[W - 1, H - 1, -1, -1], [frame.r, frame.b]],
    ];
    for (const [o, f] of corners) {
      const d = fitRivet(L, W, H, o, f);
      discs.push(d);
      const R = d.r + RIM;
      for (let y = Math.max(0, Math.floor(d.cy - R - 1)); y <= Math.min(H - 1, Math.ceil(d.cy + R + 1)); y++)
        for (let x = Math.max(0, Math.floor(d.cx - R - 1)); x <= Math.min(W - 1, Math.ceil(d.cx + R + 1)); x++) {
          const ex = Math.min(x, W - 1 - x);
          const ey = Math.min(y, H - 1 - y);
          if (ex >= SLICE || ey >= SLICE) continue;
          const c = clamp01(R + 0.5 - Math.hypot(x - d.cx, y - d.cy));
          rivet[y * W + x] = Math.max(rivet[y * W + x], c);
        }
    }
  }
  // the metal's edge a band laid in along it follows (fillet), where the
  // window was cleared
  const metal = cleared ? Float32Array.from({ length: W * H }, (_, i) => data[i * 4 + 3] / 255) : null;
  return { W, H, frame, band, rivet, discs, metal };
}

/**
 * The focus state's base art: `path` with a band of enamel or silk laid in
 * along the pane's edge, `width` px wide in `color`, taking the grain of
 * what it covers. On the pane's `side` (the default) it runs just inside the
 * frame, under any rivets, with a `key` px keyline of `keyColor` on its inner
 * side (two tones, so it holds on a light pane and a dark one), and the
 * returned coverage is what the glaze must keep of the cleared pane. Where
 * the window was cleared out of its frame (frameMask `cleared`), the band
 * is enamel laid in up to the metal: its depth is the distance to the
 * metal's own edge, round a rounded corner or an arc reaching into the
 * pane, and the metal is laid over it, its soft edge on the enamel. On the
 * frame's side it re-dyes the frame's inner `width` px (a scroll mount's
 * silk), adds nothing to the sheet, and returns null.
 *
 * The band carries `grain` of the texture of what it covers (enamel takes a
 * little of the brass's). A band of the frame's own material (silk laid in
 * on a scroll's washi) takes its texture from the frame instead (`weave`):
 * from the frame beside it, mirrored across the pane's edge from `weave` px
 * out (past a line along the edge), at full strength unless `grain` says.
 * Writes `out`.
 */
export async function fillet(path, mask, { width, key = 0, color, keyColor = "000000", side = "pane", grain: carry, weave = null, crown: proud = 0.08, radius = 0 }, out) {
  const { data, W, H } = await load(path);
  const { frame, rivet, metal } = mask;
  const [C, K] = [hex(color), hex(keyColor)];
  const inPane = (x, y) => x >= frame.l && x < W - frame.r && y >= frame.t && y < H - frame.b;
  // the pane as a rounded rectangle (`radius`, pane side): a band laid along
  // the inside of a frame whose inner corners are rounded (a stone's worn
  // arris) follows them round, concentric, rather than cutting across them
  // square; depth is then the signed distance into it (negative in the
  // pane's corners outside the rounding, which the band leaves bare)
  const [cx, cy, hx, hy] = [(frame.l + W - frame.r) / 2, (frame.t + H - frame.b) / 2, (W - frame.r - frame.l) / 2, (H - frame.b - frame.t) / 2];
  const rounded = (x, y) => {
    const [qx, qy] = [Math.abs(x + 0.5 - cx) - (hx - radius), Math.abs(y + 0.5 - cy) - (hy - radius)];
    return radius - Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - Math.min(Math.max(qx, qy), 0);
  };
  // depth from the pane's edge, in px: into the pane (pane side) or into
  // the frame (frame side), Chebyshev, so the band is square-cornered
  const reach = width + key + 2;
  const depth =
    side === "pane"
      ? radius
        ? (x, y) => (inPane(x, y) ? rounded(x, y) : Infinity)
        : (x, y) => (inPane(x, y) ? Math.min(x - frame.l, W - frame.r - 1 - x, y - frame.t, H - frame.b - 1 - y) + 0.5 : Infinity)
      : (x, y) => (inPane(x, y) ? Infinity : Math.max(frame.l - x, x - (W - frame.r - 1), frame.t - y, y - (H - frame.b - 1)) - 0.5);
  // where a pixel's texture comes from: under it, or mirrored out of the
  // frame across the nearest edge of the pane
  const source =
    side === "pane" && weave !== null
      ? (x, y) => {
          const [dl, dr, dt, db] = [x - frame.l, W - frame.r - 1 - x, y - frame.t, H - frame.b - 1 - y];
          const m = Math.min(dl, dr, dt, db);
          if (m === dl) return [frame.l - 1 - weave - dl, y];
          if (m === dr) return [W - frame.r + weave + dr, y];
          if (m === dt) return [x, frame.t - 1 - weave - dt];
          return [x, H - frame.b + weave + db];
        }
      : (x, y) => [x, y];
  const lum = (x, y) => {
    const [sx, sy] = source(x, y);
    const p = (Math.min(H - 1, Math.max(0, sy)) * W + Math.min(W - 1, Math.max(0, sx))) * 4;
    return data[p] + data[p + 1] + data[p + 2];
  };
  const strength = carry ?? (weave !== null ? 1 : 0.35);
  const [x0, x1, y0, y1] = metal ? [0, W, 0, H] : side === "pane" ? [frame.l, W - frame.r, frame.t, H - frame.b] : [Math.max(0, frame.l - reach), Math.min(W, W - frame.r + reach), Math.max(0, frame.t - reach), Math.min(H, H - frame.b + reach)];
  const D = metal ? fromWindowEdge(metal, W, H, reach) : new Float32Array(W * H).fill(Infinity);
  if (!metal) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) D[y * W + x] = depth(x, y);
  // what the band is laid on (not the metal, where it is laid under that)
  const bare = (i) => !metal || metal[i] < 0.5;
  // the grain's mean, over what the band covers
  let lumSum = 0;
  let n = 0;
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++)
      if (D[y * W + x] < width && bare(y * W + x)) {
        lumSum += lum(x, y);
        n++;
      }
  const mean = lumSum / Math.max(1, n);
  const keep = side === "pane" ? new Float32Array(W * H) : null;
  // the texture is read from the art as it was, before the band is laid in
  const grainAt = new Float32Array(W * H);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (D[y * W + x] < width + key + 1) grainAt[y * W + x] = 1 + strength * (lum(x, y) / mean - 1);
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const i = y * W + x;
      const d = D[i];
      if (d === Infinity) continue;
      // (rounded, the band's outer edge is antialiased too)
      const strip = (1 - smooth(width - 0.75, width + 0.75, d)) * (radius ? smooth(-0.75, 0.75, d) : 1);
      const line = key ? smooth(width - 0.75, width + 0.75, d) * (1 - smooth(width + key - 0.75, width + key + 0.75, d)) : 0;
      const cover = (strip + line) * (1 - rivet[i]);
      if (cover <= 0) continue;
      const p = i * 4;
      // the texture carried into the band (see `grain`, `weave`)
      const grain = grainAt[i];
      // a laid band is a little proud: brighter along its middle (`crown`;
      // 0 for a band of flat colour)
      const crown = 1 + proud * Math.sin(Math.PI * clamp01(d / width));
      const ink = [0, 1, 2].map((k) => (Math.min(255, C[k] * grain * crown) * strip + K[k] * line) / Math.max(1e-6, strip + line));
      if (metal) {
        // the metal over the enamel (straight alpha: the art over the band)
        const a = data[p + 3] / 255;
        const under = cover * (1 - a);
        const out = a + under;
        for (let k = 0; k < 3; k++) data[p + k] = Math.round((data[p + k] * a + ink[k] * under) / Math.max(1e-6, out));
        data[p + 3] = Math.round(out * 255);
        keep[i] = under;
        continue;
      }
      for (let k = 0; k < 3; k++) data[p + k] = Math.round(data[p + k] * (1 - cover) + ink[k] * cover);
      // the band is laid on whatever is under it, cleared or not (a window
      // cleared to its frame, scripts/framed-pane.mjs clearWindow)
      data[p + 3] = Math.round(data[p + 3] * (1 - cover) + 255 * cover);
      if (keep) keep[i] = cover;
    }
  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(out);
  return keep;
}

/**
 * How deep each pixel of a window cleared out of its frame lies from the
 * metal's edge (`metal`, the frame's coverage), in px, Euclidean, up to
 * `reach` (Infinity past it and outside the window). The window is what of
 * the art is less metal than not, reached from its centre; the metal's soft
 * edge on it (partly clear, beside the window) lies at 0.
 */
function fromWindowEdge(metal, W, H, reach) {
  const D = new Float32Array(W * H).fill(Infinity);
  const inWindow = new Uint8Array(W * H);
  const stack = [(H >> 1) * W + (W >> 1)];
  inWindow[stack[0]] = 1;
  while (stack.length) {
    const i = stack.pop();
    const [x, y] = [i % W, (i / W) | 0];
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      const j = ny * W + nx;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || inWindow[j] || metal[j] >= 0.5) continue;
      inWindow[j] = 1;
      stack.push(j);
    }
  }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (inWindow[i]) {
        let best = Infinity;
        for (let v = Math.max(0, y - reach); v <= Math.min(H - 1, y + reach); v++)
          for (let u = Math.max(0, x - reach); u <= Math.min(W - 1, x + reach); u++)
            if (metal[v * W + u] >= 0.5) best = Math.min(best, Math.hypot(u - x, v - y));
        D[i] = best - 0.5;
      } else if (metal[i] < 1) {
        // the metal's soft edge, where it meets the window
        const touches = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inWindow[(y + dy) * W + x + dx] && x + dx >= 0 && x + dx < W && y + dy >= 0 && y + dy < H);
        if (touches) D[i] = 0;
      }
    }
  return D;
}

/**
 * The light the frame throws on the pane, as two fields over the base art:
 * `shade`, the frame's (and rivets') shadow on the glass, offset down-right
 * from the upper-left key light, and `glint`, a thin catch along the pane's
 * edge where it faces that light (the bottom and right edges).
 */
export function paneLight(mask, { dx = 3, dy = 4, soft = 4, glintWidth = 2 } = {}) {
  const { W, H, band, rivet } = mask;
  const bandShade = blur(shift(band, W, H, dx, dy), W, H, soft);
  const rivetShade = blur(shift(rivet, W, H, dx, dy), W, H, soft * 0.75);
  const shade = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      shade[i] = Math.max(bandShade[i], rivetShade[i] * inCorner(x, y, W, H));
    }
  const { frame } = mask;
  const glint = new Float32Array(W * H);
  // along each lit edge the catch is brightest nearest the light and dies
  // away toward the far, shaded corner (the lower right), entering softly
  // where the edge leaves the frame's shadow
  const [pw, ph] = [W - frame.l - frame.r, H - frame.t - frame.b];
  const along = (u) => smooth(0, 0.06, u) * (1 - 0.75 * smooth(0.1, 1, u));
  for (let y = frame.t; y < H - frame.b; y++)
    for (let x = frame.l; x < W - frame.r; x++) {
      const fromBottom = H - frame.b - 1 - y + 0.5;
      const fromRight = W - frame.r - 1 - x + 0.5;
      const bottom = (1 - smooth(glintWidth * 0.5, glintWidth + 0.5, fromBottom)) * along((x - frame.l) / pw);
      const right = (1 - smooth(glintWidth * 0.5, glintWidth + 0.5, fromRight)) * along((y - frame.t) / ph);
      const g = Math.max(bottom, right);
      glint[y * W + x] = g * (1 - rivet[y * W + x]);
    }
  return { shade, glint };
}

/**
 * Clear a framed sheet's pane, from a state's finished art (`file`, lossless,
 * `pad` px of shadow round the base) to the kit's bitmap (`out`): the frame and rivets stay, as does `keep` (the
 * focus strip), and the rest of the pane goes clear for the page's own glass,
 * under the frame's shade (`shadeColor` at up to `shadeAlpha`) and its glint
 * (`glintColor` at up to `glintAlpha`). A state that dims the whole pane does
 * it on the page (kit.css --plate-press-wash): the art's centre is never
 * drawn, so a veil here would only reach the band inside the frame.
 */
export async function glaze(file, out, pad, mask, light, { keep, shadeColor, shadeAlpha, glintColor = "fff4dc", glintAlpha = 0 }) {
  const { data, W, H } = await load(file);
  const { W: bw, H: bh, band, rivet } = mask;
  if (W !== bw + 2 * pad || H !== bh + 2 * pad) throw new Error(`${file}: ${W}x${H} is not the base ${bw}x${bh} plus ${pad}px`);
  const [S, G] = [hex(shadeColor), hex(glintColor)];
  for (let by = 0; by < bh; by++)
    for (let bx = 0; bx < bw; bx++) {
      const i = by * bw + bx;
      const frameCover = Math.max(band[i], rivet[i]);
      if (frameCover >= 1) continue;
      const p = ((by + pad) * W + bx + pad) * 4;
      // what of the art stays: the frame's own soft edge, and the strip
      const art = Math.max(frameCover, keep ? keep[i] : 0) * (data[p + 3] / 255);
      // over it, the frame's light on the glass (not on the frame itself)
      const sa = shadeAlpha * light.shade[i] * (1 - frameCover);
      const ga = glintAlpha * light.glint[i] * (1 - frameCover) * (1 - (keep ? keep[i] : 0));
      // composite: art, then shade, then glint (straight alpha)
      let a = art;
      let rgb = [data[p], data[p + 1], data[p + 2]].map((c) => c * art);
      rgb = rgb.map((c, k) => S[k] * sa + c * (1 - sa));
      a = sa + a * (1 - sa);
      rgb = rgb.map((c, k) => G[k] * ga + c * (1 - ga));
      a = ga + a * (1 - ga);
      for (let k = 0; k < 3; k++) data[p + k] = a > 0 ? Math.round(Math.min(255, rgb[k] / a)) : 0;
      data[p + 3] = Math.round(a * 255);
    }
  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).webp(webpOptions(92)).toFile(out);
}

/**
 * A pane's sheen when its sheet is lifted into the key light: a pool of
 * warm light from the upper left, fading across the pane (`size` px square,
 * stretched over the pane, which a smooth field survives). The page lays it
 * a little inside the frame, so it fades in from every edge of its square
 * (no edge of the layer shows on the glass). With `streak`, glass also
 * carries a soft diagonal reflection across it, `alpha` strong.
 */
export async function sheen(size, { color, alpha, streak = 0 }, out) {
  const [C] = [hex(color)];
  const buf = Buffer.alloc(size * size * 4);
  const fadeIn = (u) => smooth(0, 0.14, u) * smooth(0, 0.14, 1 - u);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size); // 0 at the upper-left corner, 1 at the lower right
      // the reflection: a band along the other diagonal's direction, a third of the way across
      const band = streak * Math.exp(-(((t - 0.36) / 0.05) ** 2)) * 0.6 + streak * Math.exp(-(((t - 0.46) / 0.022) ** 2)) * 0.4;
      const a = (alpha * Math.exp(-((t / 0.42) ** 2)) + band) * fadeIn(x / (size - 1)) * fadeIn(y / (size - 1));
      const p = (y * size + x) * 4;
      buf[p] = C[0];
      buf[p + 1] = C[1];
      buf[p + 2] = C[2];
      buf[p + 3] = Math.round(a * 255);
    }
  await sharp(buf, { raw: { width: size, height: size, channels: 4 } }).webp(webpOptions(90)).toFile(out);
}
