// The print's clean ground (art/briefs/cyanotype.md, "text knocks out the
// linework"). The print is a fixed backdrop and the page's copy flows over it,
// so wherever the copy is longer than the mock's, or the frame another size,
// a rule or a prop of the print can land under a word. The page therefore
// lays, under every block of type, a feathered patch of this: the same print
// with everything drawn on it taken out, registered to it pixel for pixel
// (cyanotype.css, `--knock`), so what shows through the patch is the print's
// own blue, mottle and grain, and the linework fades out before it reaches a
// glyph, as the clear zones the mock leaves round its words.
//
// It is the print itself wherever the print is bare, and only where something
// is drawn (a rule, a mark, a gear, a fern, a keyboard, a note) is it made:
// the blue's tone there is carried in smoothly from the bare ground round it,
// and its texture is the print's own, copied from bare ground nearby, so a
// patch has the mottle and the tooth of the paper and no seam. Everything is
// in floats: an 8-bit blur of a masked colour steps its mean in bands.
import { blurField } from "./cyanotype-clean.mjs";

const luma = (b, i) => 0.299 * b[i * 3] + 0.587 * b[i * 3 + 1] + 0.114 * b[i * 3 + 2];

/** A gaussian blur of a float field. A wide one is done on a coarser grid
 *  (box-averaged down, blurred, interpolated back up): its result is as
 *  smooth as the kernel is wide, and a 90 px kernel at full size costs
 *  minutes. */
const blurWide = (src, W, H, sigma) => {
  const f = Math.floor(sigma / 5);
  if (f < 2) return blurField(src, W, H, sigma);
  const [w, h] = [Math.ceil(W / f), Math.ceil(H / f)];
  const small = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let [acc, c] = [0, 0];
      for (let yy = y * f; yy < Math.min(H, (y + 1) * f); yy++) for (let xx = x * f; xx < Math.min(W, (x + 1) * f); xx++, c++) acc += src[yy * W + xx];
      small[y * w + x] = acc / c;
    }
  const b = blurField(small, w, h, sigma / f);
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    const gy = Math.min(h - 1, Math.max(0, (y + 0.5) / f - 0.5));
    const [y0, ty] = [Math.floor(gy), gy - Math.floor(gy)];
    const y1 = Math.min(h - 1, y0 + 1);
    for (let x = 0; x < W; x++) {
      const gx = Math.min(w - 1, Math.max(0, (x + 0.5) / f - 0.5));
      const [x0, tx] = [Math.floor(gx), gx - Math.floor(gx)];
      const x1 = Math.min(w - 1, x0 + 1);
      out[y * W + x] = (b[y0 * w + x0] * (1 - tx) + b[y0 * w + x1] * tx) * (1 - ty) + (b[y1 * w + x0] * (1 - tx) + b[y1 * w + x1] * tx) * ty;
    }
  }
  return out;
};

/** The mean of `field` over the pixels where `valid` (0 to 1), at the finest
 *  of `sigmas` at which enough of what lies round a pixel is valid, blended
 *  into the next coarser one as it thins (the coarsest always): a normalised
 *  gaussian, so a hole is filled from what lies round it, smoothly. */
const toneOf = (field, valid, W, H, sigmas) => {
  const n = W * H;
  const levels = sigmas.map((s) => {
    const num = new Float32Array(n);
    for (let i = 0; i < n; i++) num[i] = field[i] * valid[i];
    return { num: blurWide(num, W, H, s), den: blurWide(valid, W, H, s) };
  });
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let [acc, rest] = [0, 1];
    for (let s = 0; s < levels.length; s++) {
      const { num, den } = levels[s];
      const t = s === levels.length - 1 ? 1 : Math.min(1, Math.max(0, (den[i] - 0.25) / 0.3));
      const v = den[i] > 1e-5 ? num[i] / den[i] : 0;
      acc += rest * t * v;
      rest *= 1 - t;
      if (rest < 1e-4) break;
    }
    out[i] = acc;
  }
  return out;
};

/** A W x H field's grayscale opening by a (2r+1) px square: what is
 *  brighter than the field round it and narrower than that, taken off. */
const opened = (src, W, H, r) => {
  const pass = (from, horizontal, pick) => {
    const out = new Float32Array(W * H);
    const [len, lines, at] = horizontal ? [W, H, (l, k) => l * W + k] : [H, W, (l, k) => k * W + l];
    for (let l = 0; l < lines; l++)
      for (let k = 0; k < len; k++) {
        let v = from[at(l, k)];
        for (let j = Math.max(0, k - r); j <= Math.min(len - 1, k + r); j++) v = pick(v, from[at(l, j)]);
        out[at(l, k)] = v;
      }
    return out;
  };
  const [lo, hi] = [Math.min, Math.max];
  return pass(pass(pass(pass(src, true, lo), false, lo), true, hi), false, hi);
};

/** Where the print is drawn on, as a 0/1 field: what stands brighter than the
 *  ground's tone round it and is either narrow (a stroke, a rule, a mark: a
 *  white top-hat, the field less its opening, which the ground's broad stains
 *  do not pass) or plainly not ground (a fern, a gear, a keyboard, a note,
 *  anything bright or not blue). Grown by `grow` px, past the soft edge of
 *  everything drawn. */
export const drawnOn = (P, W, H, { thin = 6.5, bright = 34, reach = 6, grow = 3 } = {}) => {
  const n = W * H;
  const L = new Float32Array(n);
  const blue = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    L[i] = luma(P, i);
    blue[i] = P[i * 3 + 2] - P[i * 3] > 25 ? 1 : 0;
  }
  // the ground's tone, found by asking what is ground and then where, twice:
  // first anything dark and blue, then what stands no brighter than the tone
  // so found
  let valid = Float32Array.from({ length: n }, (_, i) => (blue[i] && L[i] < 100 ? 1 : 0));
  let T = toneOf(L, valid, W, H, [10, 30, 90]);
  valid = Float32Array.from({ length: n }, (_, i) => (blue[i] && L[i] < T[i] + 16 ? 1 : 0));
  T = toneOf(L, valid, W, H, [8, 24, 70]);
  const Ls = blurField(L, W, H, 1.2); // (a grain's speck is as narrow as a rule: seen through a little blur)
  const top = opened(Ls, W, H, reach);
  const drawn = new Float32Array(n);
  for (let i = 0; i < n; i++) if (!blue[i] || L[i] - T[i] > bright || Ls[i] - top[i] > thin) drawn[i] = 1;
  // an object drawn densely (a keyboard, a fern, a gear: its fill, its glass,
  // the haze round it are not bright enough to be told from ground one pixel
  // at a time) is taken whole: what lies among enough drawn pixels is drawn
  const density = blurField(drawn, W, H, 9);
  for (let i = 0; i < n; i++) if (density[i] > 0.3) drawn[i] = 1;
  // grown: a blur and a threshold, a box's reach in a round shape
  const soft = blurField(drawn, W, H, grow * 0.8);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = soft[i] > 0.12 ? 1 : 0;
  return { drawn: out, tone: T };
};

// where to copy texture from, nearest first: rings of vectors, each ring's
// directions turned from the last so that no direction repeats
const RINGS = [23, 37, 53, 71, 97, 131, 173, 223, 293, 383, 503, 653].flatMap((r, k) =>
  Array.from({ length: 11 }, (_, j) => {
    const a = ((j + (k % 2 ? 0.5 : 0) + k * 0.37) / 11) * 2 * Math.PI;
    return [Math.round(r * Math.cos(a)), Math.round(r * Math.sin(a))];
  }),
);

/** The print with everything drawn on it taken out: a W x H RGB buffer. */
export const groundOf = (P, W, H, opts = {}) => {
  const n = W * H;
  const { drawn } = drawnOn(P, W, H, opts);
  const bare = Float32Array.from(drawn, (d) => 1 - d);
  // the tone, carried in over what is drawn on (colour: three fields), and
  // each bare pixel's texture, its colour less that tone
  const tone = [0, 1, 2].map((k) => {
    const f = new Float32Array(n);
    for (let i = 0; i < n; i++) f[i] = P[i * 3 + k];
    return toneOf(f, bare, W, H, [9, 26, 80]);
  });
  // a source pixel is one whose whole neighbourhood is bare
  const clear = blurField(bare, W, H, 2.2);
  const out = Buffer.alloc(n * 3);
  const feather = blurField(drawn, W, H, 1.2);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const a = Math.min(1, feather[i] * 1.6);
      if (a < 0.01) {
        out[i * 3] = P[i * 3];
        out[i * 3 + 1] = P[i * 3 + 1];
        out[i * 3 + 2] = P[i * 3 + 2];
        continue;
      }
      // the nearest bare pixel, by the ring that first finds one
      let [sx, sy] = [x, y];
      for (const [dx, dy] of RINGS) {
        const [xx, yy] = [x + dx, y + dy];
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        if (clear[yy * W + xx] > 0.97) {
          [sx, sy] = [xx, yy];
          break;
        }
      }
      const j = sy * W + sx;
      for (let k = 0; k < 3; k++) {
        const made = tone[k][i] + (P[j * 3 + k] - tone[k][j]);
        out[i * 3 + k] = Math.min(255, Math.max(0, Math.round(P[i * 3 + k] * (1 - a) + made * a)));
      }
    }
  return { data: out, drawn };
};
