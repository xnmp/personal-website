/** Straighten a tile's long edges across the span a 9-slice stretches.
 * The generated board's top and bottom edges wander by a pixel or two. A
 * 9-slice stretches the middle columns but keeps the corners, so wherever the
 * edge at the slice line differs from the edge just inside it, a 1px step
 * shows: invisible on a plain edge, plain on a focus line drawn along it.
 * Each middle column's top half (and bottom half) is shifted so its edge
 * runs straight from the left slice line to the right one, keeping the
 * material's texture. The edge is read to a fraction of a pixel and smoothed
 * along its length, and the shift is fractional, so neighbouring columns
 * move together: a whole-pixel shift that changes from one column to the
 * next breaks every highlight running along the bezel into a seam. */
export const straightenPixels = ({ data, info }, slice, density = 1) => {
  const { width: W, height: H } = info;
  const a = (x, y) => data[(y * W + x) * 4 + 3];
  // where the alpha crosses half, between the two pixels either side
  const cross = (x, y0, y1) => y0 + (128 - a(x, y0)) / Math.max(1, a(x, y1) - a(x, y0)) * (y1 - y0);
  const top = (x) => { for (let y = 1; y < H; y++) if (a(x, y) >= 128) return cross(x, y - 1, y); return 0; };
  const bot = (x) => { for (let y = H - 2; y >= 0; y--) if (a(x, y) >= 128) return cross(x, y + 1, y); return H - 1; };
  const [x0, x1] = [slice, W - 1 - slice];
  const along = (f) => {
    const raw = Array.from({ length: W }, (_, x) => (x >= x0 && x <= x1 ? f(x) : 0));
    return raw.map((_, x) => {
      let [t, n] = [0, 0];
      for (let i = -12 * density; i <= 12 * density; i++) if (x + i >= x0 && x + i <= x1) [t, n] = [t + raw[x + i], n + 1];
      return n ? t / n : 0;
    });
  };
  const [topS, botS] = [along(top), along(bot)];
  const line = (e) => (x) => e[x0] + ((e[x1] - e[x0]) * (x - x0)) / (x1 - x0);
  const [topAt, botAt] = [line(topS), line(botS)];
  const out = Buffer.from(data);
  const mid = H >> 1;
  for (let x = x0 + 1; x < x1; x++) {
    const [dt, db] = [topAt(x) - topS[x], botAt(x) - botS[x]];
    for (let y = 0; y < H; y++) {
      // sample within the row's own half: what would come in from the other
      // half is more board, off the canvas more clear
      const [lo, hi] = y < mid ? [0, mid - 1] : [mid, H - 1];
      const sy = Math.min(hi, Math.max(lo, y - (y < mid ? dt : db)));
      const ya = Math.floor(sy);
      const yb = Math.min(hi, ya + 1);
      const f = sy - ya;
      const [pa, pb] = [(ya * W + x) * 4, (yb * W + x) * 4];
      const [wa, wb] = [data[pa + 3] * (1 - f), data[pb + 3] * f];
      const o = (y * W + x) * 4;
      // the colour moves by the fraction (premultiplied, so a soft edge
      // doesn't pick up the clear pixels' colour); the silhouette by the
      // nearest row in the legacy 1x build only. Native coverage must use
      // the same fractional footprint as colour: rounding the displacement
      // makes a one-device-pixel cut whenever it crosses a half pixel
      for (let k = 0; k < 3; k++) out[o + k] = wa + wb > 0 ? Math.round((data[pa + k] * wa + data[pb + k] * wb) / (wa + wb)) : 0;
      out[o + 3] = density === 1 ? data[(f < 0.5 ? pa : pb) + 3] : Math.round(wa + wb);
    }
  }
  return out;
};

