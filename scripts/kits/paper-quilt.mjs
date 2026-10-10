// Foliage carried on downward: a piece of the interface's paper that stands in
// the page's stage (the foreground over the cards) ends where the stage does,
// and a screen taller than the stage's 16:9 shows the scene's own foreground
// below it, at the scene's scale, so the two meet in a seam. The piece is
// therefore drawn taller than the stage, in the same foliage, and ends in
// leaf tips (never a straight cut) a good way below any screen's foot.
//
// The extension is quilted (image quilting, Efros and Freeman): blocks of
// foliage taken from a source picture of the same paper (the scene's near
// layer), each the best match for what is already laid where it overlaps, and
// joined along the minimum-error boundary through that overlap (their paper's
// own gaps and leaf edges), so it never repeats a strip and never shows a join.
// (Round 9: the join was a cross-fade over the overlap, which averaged two
// leaf patterns into a blurred green band ~20px deep where the extension
// begins, inside the first screen's last rows; a cut along the leaves'
// edges keeps both crisp.) Deterministic: the same inputs give the same pixels.

/** foliage: not the pale of a rock or a flower */
const foliage = (r, g, b) => !(r > 150 && g > 125 && b > 100);

/** a small seeded generator (mulberry32), so a rebuilt kit is the same kit */
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/**
 * The cuts through a block's overlaps (Efros and Freeman's minimum error
 * boundary): `top[x]`, for each column of the block, the row of its top overlap
 * (0 to `overlap`) from which the block's pixels show rather than what lies
 * there, and `left[y]`, for each row, the column of its left overlap from which
 * they do. Each is the cheapest path through the squared colour difference of
 * the two (a step of at most one pixel between neighbours), so it runs along
 * the gaps and edges where the two foliages already agree.
 */
function seams(out, src, w, sw, bx, y0, sx, sy, rows, left, overlap, block) {
  const diff = (y, x) => {
    const [o, s] = [(((y0 + y) * w) + bx + x) * 4, (((sy + y) * sw) + sx + x) * 4];
    if (out[o + 3] < 128) return 0;
    let d = 0;
    for (let c = 0; c < 3; c++) d += (out[o + c] - src[s + c]) ** 2;
    return d;
  };
  /** the cheapest path across `n` steps through `m` positions, as a position per step */
  const path = (n, m, cost) => {
    const acc = Array.from({ length: n }, () => new Float64Array(m));
    for (let i = 0; i < n; i++)
      for (let j = 0; j < m; j++) {
        const prev = i === 0 ? 0 : Math.min(acc[i - 1][Math.max(0, j - 1)], acc[i - 1][j], acc[i - 1][Math.min(m - 1, j + 1)]);
        acc[i][j] = cost(i, j) + prev;
      }
    const at = new Int32Array(n);
    at[n - 1] = acc[n - 1].indexOf(Math.min(...acc[n - 1]));
    for (let i = n - 2; i >= 0; i--) {
      const j = at[i + 1];
      let best = j;
      for (const k of [j - 1, j, j + 1]) if (k >= 0 && k < m && acc[i][k] < acc[i][best]) best = k;
      at[i] = best;
    }
    return at;
  };
  const top = path(block, overlap, (x, y) => diff(y, x));
  const leftCut = left ? path(rows, overlap, (y, x) => diff(y, x)) : null;
  return { top, left: leftCut };
}

/**
 * `base`: RGBA, `w` x `h`. Returns RGBA `w` x (`h` + `by`): the base, then
 * `by` more rows of foliage quilted from `src` (RGBA, `sw` wide), taken from
 * its rows [`from`, `to`), ending in leaf tips `tip` px deep (none if 0).
 */
export function quiltDown(base, w, h, by, src, sw, { from, to }, { block = 56, overlap = 20, tries = 500, tip = 34, seed = 11, keep = foliage } = {}) {
  const H = h + by;
  const out = Buffer.alloc(w * H * 4);
  base.copy(out, 0, 0, w * h * 4);
  const rand = rng(seed);

  // candidates: what `keep` allows (by default foliage only: no pale rock or
  // flower, which would repeat as a stamp), their paper wholly opaque
  const usable = (sx, sy) => {
    for (let y = 0; y < block; y += 3)
      for (let x = 0; x < block; x += 3) {
        const p = ((sy + y) * sw + sx + x) * 4;
        if (src[p + 3] < 250 || !keep(src[p], src[p + 1], src[p + 2])) return false;
      }
    return true;
  };

  const step = block - overlap;
  for (let y0 = h - overlap; y0 < H - overlap; y0 += step) {
    for (let x0 = 0, j = 0; x0 < w; x0 += step, j++) {
      const bx = Math.min(x0, w - block); // the last block of a row sits flush to the edge
      const left = j > 0 && bx > 0;
      const rows = Math.min(block, H - y0);
      let best = [];
      for (let t = 0; t < tries; t++) {
        const sx = Math.floor(rand() * (sw - block));
        const sy = from + Math.floor(rand() * (to - from - block));
        if (!usable(sx, sy)) continue;
        // how far the patch stands from what is already there, over the overlap
        let ssd = 0;
        for (let y = 0; y < overlap; y++)
          for (let x = 0; x < block; x++) {
            const [o, s] = [(((y0 + y) * w) + bx + x) * 4, (((sy + y) * sw) + sx + x) * 4];
            for (let c = 0; c < 3; c++) ssd += (out[o + c] - src[s + c]) ** 2;
          }
        if (left)
          for (let y = overlap; y < rows; y++)
            for (let x = 0; x < overlap; x++) {
              const [o, s] = [(((y0 + y) * w) + bx + x) * 4, (((sy + y) * sw) + sx + x) * 4];
              for (let c = 0; c < 3; c++) ssd += (out[o + c] - src[s + c]) ** 2;
            }
        best.push([ssd, sx, sy]);
      }
      best.sort((a, b) => a[0] - b[0]);
      // one of the few best, so neighbours differ
      const [, sx, sy] = best[Math.floor(rand() * Math.min(4, best.length))];
      const cut = seams(out, src, w, sw, bx, y0, sx, sy, rows, left, overlap, block);
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < block; x++) {
          const [o, s] = [(((y0 + y) * w) + bx + x) * 4, (((sy + y) * sw) + sx + x) * 4];
          // the patch's weight: the base's pixel above the cut through the top
          // overlap and left of the cut through the left one, the patch's
          // below and right of them (a pixel's width of feathering either side);
          // where what lies there is clear (a gap in the base's foliage), all of it
          let k = Math.min(1, Math.max(0, (y - cut.top[x] + 1) / 2), left ? Math.max(0, Math.min(1, (x - cut.left[y] + 1) / 2)) : 1);
          if (out[o + 3] < 128) k = 1;
          for (let c = 0; c < 3; c++) out[o + c] = Math.round(out[o + c] * (1 - k) + src[s + c] * k);
          out[o + 3] = 255;
        }
    }
  }

  // the base's own last rows are opaque where the quilt covers them
  // (above), and the foot ends in leaf tips: a run of pointed leaves, each
  // its own width, the lowest points `tip` px under the valleys between
  if (!tip) return out;
  const edge = new Float32Array(w);
  for (let x = 0; x < w; ) {
    const len = 38 + Math.floor(rand() * 34);
    const depth = tip * (0.55 + 0.45 * rand());
    for (let i = 0; i < len && x + i < w; i++) edge[x + i] = H - tip + depth * (1 - Math.abs((2 * i) / len - 1) ** 1.25);
    x += len;
  }
  for (let x = 0; x < w; x++)
    for (let y = H - tip - 1; y < H; y++) {
      const a = Math.min(1, Math.max(0, edge[x] - y));
      out[(y * w + x) * 4 + 3] = Math.round(out[(y * w + x) * 4 + 3] * a);
    }
  return out;
}
