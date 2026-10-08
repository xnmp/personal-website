// Mitred corners for a frame whose rails keep one profile along their length
// (a brass moulding, a band of mounting silk), and, optionally, rails that
// tile along their length.
//
// A generated frame's corners are drawn on their own: the moulding's lines
// fade, thicken or turn into a corner block there, so where a 9-slice puts a
// corner against a stretched rail, the lines step. A real frame is four
// lengths of one moulding cut at 45 degrees. So is this one: each corner is
// rebuilt from the two rails that meet in it, each mirrored at the slice
// line (so it runs on from the rail without a step) and cut on the line
// from the frame's outer corner to its inner one (45 degrees where the two
// rails are as deep), with a fine joint line where a cut would show.
//
// A rail whose material has a broad grain (mottled silk) smears when a
// 9-slice stretches it across a wide strip; such a rail is made seamless
// along its length (`tile`), so the page can repeat it instead (kit.css
// --strip-repeat: round). The corners are mirrored from the seamless rail,
// so a corner meets the first repeat and the last one without a seam.
//
// A strip is printed smaller than the sheets around it (kit.css --plate-k),
// so its material's grain comes out finer than theirs: a broad mottle turns
// into a busy stripe. `grain` enlarges the rails' grain by that factor: each
// row of a rail keeps its own mean colour (the band's profile: its edge,
// its keyline) and only the deviation from it, the material's texture, is
// scaled up, within the band of material between the edge and the keyline.
//
// Works on the base art (before its shadow is padded on), in place. The
// corner is the 56px a 9-slice keeps unstretched (kit.css --slice-plate 152
// = 96 pad + 56).
import sharp from "sharp";

const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Make one run of a rail seamless: `get(i, j)` / `set(i, j, px)` address
 * the rail by its position along the run (`i`, 0..len-1) and across it
 * (`j`, 0..depth-1). The run is cross-faded with itself shifted by half its
 * length, the shifted copy taking over toward its ends, so its last pixel
 * runs on into its first.
 */
function seamlessRun(len, depth, get, set) {
  const half = len >> 1;
  const band = Math.max(8, Math.round(len / 4));
  const out = [];
  for (let i = 0; i < len; i++) {
    // weight of the original: 1 in the middle, 0 at both ends
    const w = smooth(0, band, i) * smooth(0, band, len - 1 - i);
    const col = [];
    for (let j = 0; j < depth; j++) {
      const a = get(i, j);
      const b = get((i + half) % len, j);
      col.push(a.map((v, k) => v * w + b[k] * (1 - w)));
    }
    out.push(col);
  }
  out.forEach((col, i) => col.forEach((px, j) => set(i, j, px)));
}

/**
 * Enlarge the grain of one run of a rail by `scale`, in the rows `j0..j1`
 * (counted in from the outer edge): each row keeps its mean colour; the
 * deviation from it is resampled from a `scale` times smaller patch.
 */
function grainRun(len, j0, j1, scale, get, set) {
  const rows = j1 - j0;
  const mean = [];
  for (let j = j0; j < j1; j++) {
    const m = [0, 0, 0];
    for (let i = 0; i < len; i++) get(i, j).forEach((v, k) => k < 3 && (m[k] += v / len));
    mean.push(m);
  }
  const dev = (i, j) => {
    const px = get(i, j);
    return [0, 1, 2].map((k) => px[k] - mean[j - j0][k]);
  };
  // bilinear sample of the deviation at a fractional position in the band
  const sample = (fi, fj) => {
    const [i0, r0] = [Math.min(len - 2, Math.floor(fi)), Math.min(j1 - 2, Math.floor(fj))];
    const [a, b] = [fi - i0, fj - r0];
    const [p00, p10, p01, p11] = [dev(i0, r0), dev(i0 + 1, r0), dev(i0, r0 + 1), dev(i0 + 1, r0 + 1)];
    return [0, 1, 2].map((k) => (p00[k] * (1 - a) + p10[k] * a) * (1 - b) + (p01[k] * (1 - a) + p11[k] * a) * b);
  };
  const out = [];
  for (let j = j0; j < j1; j++)
    for (let i = 0; i < len; i++) {
      const d = sample(i / scale, j0 + (j - j0) / scale);
      const px = get(i, j);
      out.push([i, j, [...mean[j - j0].map((m, k) => m + d[k]), px[3]]]);
    }
  out.forEach(([i, j, px]) => set(i, j, px));
  return rows;
}

/**
 * Mitre the four corners of the frame at `path` (and first make its rails
 * seamless, with `tile`). `frame` is each rail's depth ({ t, r, b, l }, to
 * where the pane begins); `joint` darkens the cut line (0 for none).
 */
export async function mitre(path, { corner = 56, tile = false, joint = 0.12, grain = 1, frame }) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const C = corner;
  if (W < 3 * C || H < 3 * C) throw new Error(`mitre: ${path} is too small for ${C}px corners`);
  const at = (x, y) => (y * W + x) * 4;
  const get = (x, y) => Array.from(data.subarray(at(x, y), at(x, y) + 4));
  const put = (x, y, px) => px.forEach((v, k) => (data[at(x, y) + k] = Math.round(v)));

  if (grain !== 1) {
    const [lx, ly] = [W - 2 * C, H - 2 * C];
    // the material between the edge (its outer 3px) and the keyline (the
    // last 6px before the pane)
    const zone = (depth) => [3, Math.max(4, depth - 6)];
    grainRun(lx, ...zone(frame.t), grain, (i, j) => get(C + i, j), (i, j, px) => put(C + i, j, px));
    grainRun(lx, ...zone(frame.b), grain, (i, j) => get(C + i, H - 1 - j), (i, j, px) => put(C + i, H - 1 - j, px));
    grainRun(ly, ...zone(frame.l), grain, (i, j) => get(j, C + i), (i, j, px) => put(j, C + i, px));
    grainRun(ly, ...zone(frame.r), grain, (i, j) => get(W - 1 - j, C + i), (i, j, px) => put(W - 1 - j, C + i, px));
  }

  if (tile) {
    const [lx, ly] = [W - 2 * C, H - 2 * C];
    // top and bottom rails run along x, the side rails along y; `j` counts
    // in from the frame's outer edge
    seamlessRun(lx, C, (i, j) => get(C + i, j), (i, j, px) => put(C + i, j, px));
    seamlessRun(lx, C, (i, j) => get(C + i, H - 1 - j), (i, j, px) => put(C + i, H - 1 - j, px));
    seamlessRun(ly, C, (i, j) => get(j, C + i), (i, j, px) => put(j, C + i, px));
    seamlessRun(ly, C, (i, j) => get(W - 1 - j, C + i), (i, j, px) => put(W - 1 - j, C + i, px));
  }

  // each corner from its two rails, mirrored at the slice line: `u` runs
  // along the horizontal rail into the corner, `v` along the vertical one
  // each with the depths of its vertical rail (du) and its horizontal one (dv)
  const corners = [
    [(u) => u, (v) => v, frame.l, frame.t], // top left
    [(u) => W - 1 - u, (v) => v, frame.r, frame.t], // top right
    [(u) => u, (v) => H - 1 - v, frame.l, frame.b], // bottom left
    [(u) => W - 1 - u, (v) => H - 1 - v, frame.r, frame.b], // bottom right
  ];
  for (const [X, Y, du, dv] of corners) {
    const norm = Math.hypot(du, dv);
    const fresh = [];
    for (let v = 0; v < C; v++)
      for (let u = 0; u < C; u++) {
        // on the horizontal rail's side of the cut its pixel (its depth is
        // v), on the other the vertical rail's (its depth is u); `side` is
        // the distance from the cut, in px, with a pixel's worth of blend
        const horiz = get(X(2 * C - 1 - u), Y(v));
        const vert = get(X(u), Y(2 * C - 1 - v));
        const side = (u * dv - v * du) / norm;
        const t = smooth(-0.75, 0.75, side); // 1: horizontal rail
        const px = horiz.map((h, k) => h * t + vert[k] * (1 - t));
        // the cut: a fine dark line along it, on the material only
        const line = joint * (1 - smooth(0, 1.1, Math.abs(side)));
        for (let k = 0; k < 3; k++) px[k] *= 1 - line;
        fresh.push([X(u), Y(v), px]);
      }
    fresh.forEach(([x, y, px]) => put(x, y, px));
  }
  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path + ".tmp.png");
  const { renameSync } = await import("node:fs");
  renameSync(path + ".tmp.png", path);
}

/**
 * Where, through an overlap `n` rows long and `depth` deep, one piece should
 * hand over to the next: for each column across it, the row at which the
 * two differ least (`cost(s, j)`), on a path that moves at most a row per
 * column (Efros & Freeman's minimum error boundary cut).
 */
function minCut(n, depth, cost) {
  const acc = Array.from({ length: depth }, (_, j) => Float64Array.from({ length: n }, (_, s) => cost(s, j)));
  const from = acc.map(() => new Int32Array(n));
  for (let j = 1; j < depth; j++)
    for (let s = 0; s < n; s++) {
      let best = s;
      for (const t of [s - 1, s + 1]) if (t >= 0 && t < n && acc[j - 1][t] < acc[j - 1][best]) best = t;
      acc[j][s] += acc[j - 1][best];
      from[j][s] = best;
    }
  const cut = new Int32Array(depth);
  cut[depth - 1] = acc[depth - 1].indexOf(Math.min(...acc[depth - 1]));
  for (let j = depth - 1; j > 0; j--) cut[j - 1] = from[j][cut[j]];
  return cut;
}

/**
 * Rails that tile along their length between corners kept as drawn (a
 * print's taped corners, which a mitre would rebuild from its rails), so the
 * page can repeat a rail (border-image-repeat: round) where a stretch would
 * smear what runs across it (a brush's dry ends into streaks). Pieces are
 * joined as in image quilting (Efros & Freeman 2001): each column across the
 * rail switches from one piece to the next at the row where the two differ
 * least, on a path that moves at most a pixel per column, never cross-faded
 * (a fade doubles a ragged edge into a ghost).
 *
 * Each rail in `sides` ends as it did, running into the corner after it
 * (B), and now begins with a copy of what follows its end (B's first
 * `overlap` px), so its last pixel runs on into its first and a repeat
 * follows on from it. The corner before it (A) hands over to that copy
 * along a path through its last `overlap` px. B's first px are copied into
 * the rail, so only rails whose corner B is plain can tile (a print's tape
 * is on its top corners: its side rails, "l" and "r", run down to plain
 * ones). A rail is `depth` px deep, by default the corner's; a tile whose
 * whole face repeats along its length (a glaze's mottle) is one rail as deep
 * as the tile ("t", `depth` its height). Works on the base art, in place.
 */
export async function tileRails(path, { corner = 56, sides = ["l", "r"], overlap = 32, depth = corner, blend = 0 } = {}) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const C = corner;
  if (overlap > C) throw new Error(`tileRails: overlap ${overlap} is deeper than the ${C}px corner`);
  // `blend` (px): the art's broad tone along the rail (blurred by that much
  // along it, premultiplied; not across it, so a rim's highlight keeps its
  // own row) is cross-faded through each overlap, the cut keeping only its
  // grain: a cut finds a path through texture, but where the two sides
  // differ in tone (a glazed tile's lit end against its middle) any path is
  // a step
  const at = (x, y) => (y * W + x) * 4;
  // a rail as a run: `i` along it from its first corner, `j` across it from
  // the outer edge; `i` < 0 is in corner A, `i` >= len in corner B
  const runs = {
    t: { len: W - 2 * C, xy: (i, j) => [C + i, j] },
    b: { len: W - 2 * C, xy: (i, j) => [C + i, H - 1 - j] },
    l: { len: H - 2 * C, xy: (i, j) => [j, C + i] },
    r: { len: H - 2 * C, xy: (i, j) => [W - 1 - j, C + i] },
  };
  // A corner is where two rails meet, and each side hands a corner over:
  // its first corner to its own end, and its last to its start. Each side
  // works on the art as the sides before it left it (never on the art as
  // drawn: a later side would put back a corner an earlier one had handed
  // over, against the copy that earlier side laid beside it), and in an
  // order in which no side copies a corner that a later side then changes:
  // the right rail hands the top-right corner over before the top rail
  // copies it, the bottom rail the bottom-left before the left rail does.
  for (const side of ["r", "b", "t", "l"].filter((s) => sides.includes(s))) {
    const src = Buffer.from(data);
    const { len, xy } = runs[side];
    const px = (i, j) => at(...xy(i, j));
    const broad = blend ? broadTone(src, W, H, blend, side === "t" || side === "b" ? "x" : "y") : null;
    const diff = (p, q) => {
      let d = 0;
      for (let k = 0; k < 4; k++) d += (src[p + k] - src[q + k]) ** 2;
      return d;
    };
    // rows i0 .. i0+overlap-1: `before` up to the path, `after` from it
    const join = (i0, before, after) => {
      const N = overlap;
      const cut = minCut(N, depth, (s, j) => diff(before(i0 + s, j), after(i0 + s, j)));
      for (let j = 0; j < depth; j++)
        for (let s = 0; s < N; s++) {
          const p = s < cut[j] ? before(i0 + s, j) : after(i0 + s, j);
          const q = px(i0 + s, j);
          src.copy(data, q, p, p + 4);
          if (!broad) continue;
          const t = (s + 0.5) / N;
          const w = t * t * (3 - 2 * t);
          const [b0, b1] = [before(i0 + s, j), after(i0 + s, j)];
          for (let k = 0; k < 3; k++)
            data[q + k] = Math.min(255, Math.max(0, Math.round(src[p + k] - broad[p + k] + (1 - w) * broad[b0 + k] + w * broad[b1 + k])));
        }
    };
    // corner A's last px hand over to what precedes the copy of B's first
    join(-overlap, (i, j) => px(i, j), (i, j) => px(len + i, j));
    // the rail begins with the copy of B's first px, then runs on as drawn
    join(0, (i, j) => px(len + i, j), (i, j) => px(i, j));
  }
  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path + ".tmp.png");
  const { renameSync } = await import("node:fs");
  renameSync(path + ".tmp.png", path);
}

/** RGBA art's broad tone along one axis ("x" or "y"): a Gaussian of
 *  `sigma` px along it, premultiplied, so its clear surround lends its edge
 *  no colour (Float32, RGBA layout; alpha unused) */
function broadTone(data, W, H, sigma, axis) {
  const R = Math.ceil(3 * sigma);
  const kern = Float32Array.from({ length: 2 * R + 1 }, (_, i) => Math.exp(-((i - R) ** 2) / (2 * sigma * sigma)));
  const [step, n, lines, lineStep] = axis === "x" ? [4, W, H, W * 4] : [W * 4, H, W, 4];
  const out = new Float32Array(data.length);
  for (let l = 0; l < lines; l++)
    for (let i = 0; i < n; i++) {
      const acc = [0, 0, 0, 0];
      for (let r = -R; r <= R; r++) {
        const ii = Math.min(n - 1, Math.max(0, i + r));
        const p = l * lineStep + ii * step;
        const w = kern[r + R] * data[p + 3];
        for (let k = 0; k < 3; k++) acc[k] += w * data[p + k];
        acc[3] += w;
      }
      const q = l * lineStep + i * step;
      for (let k = 0; k < 3; k++) out[q + k] = acc[3] ? acc[k] / acc[3] : 0;
    }
  return out;
}

/** a seeded generator (mulberry32), so a kit builds to the same pixels */
const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/**
 * Rails grown (or cut down) to `length` ([along the top and bottom, down the
 * sides]; null keeps one as it is) by image quilting (Efros & Freeman 2001),
 * so a rail the page repeats (tileRails) repeats at that period, not its
 * drawn length: a short rail repeated reads as a printed trim, its every mark
 * a beat; and one the page must fit into a far shorter run (a strip's sides)
 * is not squeezed into it.
 *
 * Each rail is rebuilt from pieces of itself, `patch` px long, each the
 * piece of the drawn rail that best continues what is laid so far over
 * `overlap` px (one of those within `tolerance` of the best, chosen at
 * random), joined on the minimum error cut. It begins with its own first
 * piece (or, for a rail tileRails will repeat, `splice`, the piece that
 * best follows the copy of its far corner it will begin with) and ends with
 * its last, so it still runs out of one corner and into the next as drawn;
 * a piece never simply carries on from where the last one was cut in the
 * drawn rail, which would copy it out at length. With
 * `quiet: { share, depth }`, that share (0..1) of the drawn rail, its most
 * marked pieces (a chip, a crack: what departs most from the rail's run
 * within `depth` px of its outer edge, the frame), is never cut from:
 * a mark the eye can pick out comes round as a beat however the pieces are
 * shuffled, while grain does not; such marks stay where they were drawn,
 * by the corners, as a worn slab's chips are. The
 * corners are kept; the pane between the rails is stretched to fill (it is
 * cleared for the page's own, scripts/framed-pane.mjs, so nothing of it
 * shows). Works on the base art, in place; returns its new size.
 */
export async function lengthenRails(path, { corner = 56, length = [null, null], patch = 64, overlap = 20, tolerance = 0.2, seed = 1, pool = false, quiet = null, splice = [], spliceOverlap = 32 } = {}) {
  const { data: src, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const C = corner;
  const [lx, ly] = [length[0] ?? W - 2 * C, length[1] ?? H - 2 * C];
  const [W2, H2] = [lx + 2 * C, ly + 2 * C];
  const out = await sharp(path).resize(W2, H2, { fit: "fill" }).ensureAlpha().raw().toBuffer();
  const [inAt, outAt] = [(x, y) => (y * W + x) * 4, (x, y) => (y * W2 + x) * 4];
  // the corners as drawn
  for (let y = 0; y < C; y++)
    for (let x = 0; x < C; x++)
      for (const [sx, sy, dx, dy] of [
        [x, y, x, y],
        [W - 1 - x, y, W2 - 1 - x, y],
        [x, H - 1 - y, x, H2 - 1 - y],
        [W - 1 - x, H - 1 - y, W2 - 1 - x, H2 - 1 - y],
      ])
        src.copy(out, outAt(dx, dy), inAt(sx, sy), inAt(sx, sy) + 4);
  // a rail as a run: `i` along it from its first corner, `j` across it from the outer edge
  const runs = {
    t: { len: W - 2 * C, to: lx, from: (i, j) => inAt(C + i, j), into: (i, j) => outAt(C + i, j) },
    b: { len: W - 2 * C, to: lx, from: (i, j) => inAt(C + i, H - 1 - j), into: (i, j) => outAt(C + i, H2 - 1 - j) },
    l: { len: H - 2 * C, to: ly, from: (i, j) => inAt(j, C + i), into: (i, j) => outAt(j, C + i) },
    r: { len: H - 2 * C, to: ly, from: (i, j) => inAt(W - 1 - j, C + i), into: (i, j) => outAt(W2 - 1 - j, C + i) },
  };
  const random = seeded(seed);
  // which pieces of a rail, `P` px long, are its most marked (`quiet.share`
  // of them): a piece's mark is its worst chip, the most its pixels, to
  // `quiet.depth`, depart from the rail's median at their depth (luminance
  // and coverage) over any 12px of it (summed over the whole piece, grain
  // spread evenly would count as much as one chip)
  const marks = ({ len, from }, P) => {
    const n = len - P + 1;
    const marked = new Uint8Array(Math.max(0, n));
    if (!quiet?.share || n <= 0) return marked;
    const lum = (p) => (0.299 * src[p] + 0.587 * src[p + 1] + 0.114 * src[p + 2]) * (src[p + 3] / 255);
    const dev = new Float64Array(len);
    for (let j = 0; j < Math.min(C, quiet.depth ?? C); j++) {
      const [L, A] = [new Float64Array(len), new Float64Array(len)];
      for (let i = 0; i < len; i++) [L[i], A[i]] = [lum(from(i, j)), src[from(i, j) + 3]];
      const median = (v) => Float64Array.from(v).sort()[v.length >> 1];
      const [mL, mA] = [median(L), median(A)];
      for (let i = 0; i < len; i++) dev[i] += Math.abs(L[i] - mL) + Math.abs(A[i] - mA);
    }
    const w = Math.min(12, P);
    const chip = new Float64Array(len - w + 1);
    let run = 0;
    for (let i = 0; i < len; i++) {
      run += dev[i] - (i >= w ? dev[i - w] : 0);
      if (i >= w - 1) chip[i - w + 1] = run;
    }
    const piece = new Float64Array(n);
    for (let s = 0; s < n; s++) {
      let worst = 0;
      for (let i = s; i <= s + P - w; i++) worst = Math.max(worst, chip[i]);
      piece[s] = worst;
    }
    const cutoff = Float64Array.from(piece).sort()[Math.min(n - 1, Math.floor(n * (1 - quiet.share)))];
    for (let s = 0; s < n; s++) marked[s] = piece[s] >= cutoff ? 1 : 0;
    return marked;
  };
  for (const [side, { len, to, from, into }] of Object.entries(runs)) {
    if (to === len) {
      for (let i = 0; i < len; i++) for (let j = 0; j < C; j++) src.copy(out, into(i, j), from(i, j), from(i, j) + 4);
      continue;
    }
    const P = Math.min(patch, Math.floor(len / 2));
    const O = Math.min(overlap, Math.floor(P / 2));
    if (to < P + O) throw new Error(`lengthenRails: a ${to}px rail is shorter than two ${P}px pieces can meet in`);
    // where pieces may be cut from: this rail, or (`pool`) every rail, each
    // read along itself from its outer edge in, for art whose every edge is
    // drawn alike and lit evenly (a brushed print: its strokes run along
    // each edge), so a rail a few pieces long draws on four times the marks
    const sources = (pool ? Object.entries(runs) : [[side, runs[side]]]).map(([k, r]) => ({ k, len: r.len, from: r.from, marked: marks(r, P) }));
    const own = sources.find((q) => q.k === side);
    const diff = (p, q) => {
      let d = 0;
      for (let k = 0; k < 4; k++) d += (out[p + k] - src[q + k]) ** 2;
      return d;
    };
    // lay the piece cut at `s` along `q` at `pos`, handing over from what is
    // laid (up to `end`) on the cut through their overlap
    const lay = ({ q, s }, pos, end) => {
      const cut = end > pos ? minCut(end - pos, C, (r, j) => diff(into(pos + r, j), q.from(s + r, j))) : new Int32Array(C);
      for (let j = 0; j < C; j++)
        for (let r = cut[j]; r < P; r++) src.copy(out, into(pos + r, j), q.from(s + r, j), q.from(s + r, j) + 4);
    };
    const near = (a, b, d) => a.q === b.q && Math.abs(a.s - b.s) < d;
    // A rail tileRails will make repeat (`splice`: its sides) begins not
    // after corner A but after a copy of corner B's first px, handed over to
    // the rail's start on a cut through `spliceOverlap` px (tileRails'
    // overlap): its drawn first piece only continues corner A, and where a
    // mark crosses the cut no path hides it (a brushed edge's dry streak
    // ends square against a bite). So it begins with whichever piece, from
    // any source, splices best against that copy; the drawn first piece is
    // among them, so the splice is never worse than as drawn.
    let first = { q: own, s: 0 };
    if (splice.includes(side)) {
      const N = Math.min(spliceOverlap, P);
      const sq = (a, b) => {
        let d = 0;
        for (let k = 0; k < 4; k++) d += (src[a + k] - src[b + k]) ** 2;
        return d;
      };
      let best = Infinity;
      for (const q of sources)
        for (let s0 = 0; s0 + P <= q.len; s0++) {
          if (q.marked[s0]) continue;
          const cut = minCut(N, C, (r, j) => sq(from(len + r, j), q.from(s0 + r, j)));
          let e = 0;
          for (let j = 0; j < C; j++) e += sq(from(len + cut[j], j), q.from(s0 + cut[j], j));
          if (e < best) [best, first] = [e, { q, s: s0 }];
        }
    }
    lay(first, 0, 0);
    let [end, last] = [P, first];
    // where the last pieces were cut from: a rail drawn a few pieces long,
    // left to the best continuation alone, settles into a cycle of two or
    // three pieces (the best match for A is B, for B is A), which reads as
    // the very beat lengthening is for. So a piece is never cut from where
    // one of the last `memory` was, and is chosen at random from at least
    // `choices` distinct candidates (the minimum error cut hides a seam a
    // little worse than the best).
    const recent = [last];
    const span = sources.reduce((n, q) => n + q.len - P, 0);
    const memory = Math.max(0, Math.min(pool ? 6 : 2, Math.floor(span / P) - 1));
    const choices = 4;
    // the last piece goes at `to - P` and must overlap what precedes it
    while (end < to - P + O) {
      const pos = end - O;
      // not the piece that simply carries on from the last one
      const carry = { q: last.q, s: last.s + pos - (end - P) };
      const candidates = (avoid) => {
        const errs = [];
        for (const q of sources)
          for (let s = 0; s + P <= q.len; s++) {
            const c = { q, s };
            if (q.marked[s] || near(c, carry, P / 2) || avoid.some((a) => near(c, a, P / 2))) continue;
            let e = 0;
            for (let r = 0; r < O; r++) for (let j = 0; j < C; j++) e += diff(into(pos + r, j), q.from(s + r, j));
            errs.push([e, c]);
          }
        return errs;
      };
      let errs = candidates(recent);
      if (!errs.length) errs = candidates([]);
      if (!errs.length) throw new Error(`lengthenRails: no piece of rail ${side} is left to cut (quiet ${quiet?.share})`);
      errs.sort(([a], [b]) => a - b);
      const best = errs[0][0];
      const picks = [];
      for (const [e, c] of errs) {
        if (picks.length >= choices && e > best * (1 + tolerance)) break;
        if (picks.every((p) => !near(p, c, P / 4))) picks.push(c);
      }
      const c = picks[Math.floor(random() * picks.length)];
      lay(c, pos, end);
      [end, last] = [pos + P, c];
      recent.push(c);
      while (recent.length > memory) recent.shift();
    }
    lay({ q: own, s: len - P }, to - P, end);
  }
  await sharp(out, { raw: { width: W2, height: H2, channels: 4 } }).png().toFile(path + ".tmp.png");
  const { renameSync } = await import("node:fs");
  renameSync(path + ".tmp.png", path);
  return { width: W2, height: H2 };
}

/**
 * The frame's bottom half replaced by its top half, mirrored, so the bottom
 * rail and corners are the top's: for art whose bottom edge came back drawn
 * as a regular motif (a brush's dry ends dabbed out at an even beat, which
 * no rearranging of its own pieces hides) under a top edge drawn freely.
 * Works on the base art, in place, before its rails are lengthened or tiled.
 */
export async function mirrorBottom(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const row = W * 4;
  for (let y = Math.ceil(H / 2); y < H; y++) data.copy(data, y * row, (H - 1 - y) * row, (H - y) * row);
  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path + ".tmp.png");
  const { renameSync } = await import("node:fs");
  renameSync(path + ".tmp.png", path);
}

/**
 * Smooth the rails' small marks away, keeping the corners as drawn: a stone
 * slab's long edges worn smooth, its chips where a real one takes them, at
 * the corners. A rail's chips and pits, repeated by lengthenRails and
 * tileRails along a long strip, come round at a beat and read as a row of
 * ticks; a median filter (`size` px) takes out marks smaller than about
 * half of it and keeps the rail's profile (its arris, its shading, the
 * silhouette's line). Within `depth` px of each side, between the `corner`
 * squares; in place, on the base art.
 */
export async function smoothRails(path, { corner = 56, depth, size = 7, along = false }) {
  if (along) return smoothAlong(path, { corner, depth, size });
  const img = sharp(path).ensureAlpha();
  const [{ data, info }, { data: smooth }] = await Promise.all([
    img.clone().raw().toBuffer({ resolveWithObject: true }),
    img.clone().median(size).raw().toBuffer({ resolveWithObject: true }),
  ]);
  const { width: W, height: H } = info;
  const out = Buffer.from(data);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const inCorner = (x < corner || x >= W - corner) && (y < corner || y >= H - corner);
      const nearEdge = x < depth || x >= W - depth || y < depth || y >= H - depth;
      if (inCorner || !nearEdge) continue;
      const i = (y * W + x) * 4;
      smooth.copy(out, i, i, i + 4);
    }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path);
}

/**
 * smoothRails `along`: each rail's pixels the median of the `size` px
 * running along it (each channel), not round them: an ornament stamped
 * along a rail at a beat (an engraved row of dots) is taken out, and the
 * line-work that runs the rail's length (its engraved rules, its mouldings)
 * kept whole, as a round median would not keep a line thinner than it.
 * A rail so smoothed is the same all along, so it stretches clean. In
 * place, on the base art.
 */
async function smoothAlong(path, { corner, depth, size }) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const out = Buffer.from(data);
  const r = size >> 1;
  const win = new Uint8Array(2 * r + 1);
  const median = (n) => {
    const v = win.subarray(0, n).sort();
    return v[n >> 1];
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const inCorner = (x < corner || x >= W - corner) && (y < corner || y >= H - corner);
      const top = y < depth || y >= H - depth;
      const side = x < depth || x >= W - depth;
      if (inCorner || !(top || side)) continue;
      // along a top or bottom rail: x; along a side rail: y (the pixel is
      // between the corners, so it lies on one rail only)
      const horizontal = top && x >= corner && x < W - corner;
      for (let k = 0; k < 4; k++) {
        let n = 0;
        for (let d = -r; d <= r; d++) {
          const [sx, sy] = horizontal ? [Math.min(W - corner - 1, Math.max(corner, x + d)), y] : [x, Math.min(H - corner - 1, Math.max(corner, y + d))];
          win[n++] = data[(sy * W + sx) * 4 + k];
        }
        out[(y * W + x) * 4 + k] = median(n);
      }
    }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path + ".tmp.png");
  const { renameSync } = await import("node:fs");
  renameSync(path + ".tmp.png", path);
}
