// Cyanotype's masking tape (cyanotype.mjs tapeClear): the one piece every
// print, sheet and card is taped down with, drawn once as a sprite with its
// own alpha, so it takes the colour of whatever it lies on.
//
// The original's tape (art/originals/cyanotype*.webp, sampled round 10) is one
// material seen over two grounds: warm beige masking tape at fairly high
// opacity, blotchy where the film is thin and the print shows through. Over
// the print's blue it reads a neutral grey-blue with strong mottle: the home
// page's pieces average 170, 171, 170 (sd 27-30) and the project page's
// 150-160; over the cream border of a mounted print it reads a shade darker
// and warmer than the paper (206-208, 196, 178-180 on paper of 217, 209,
// 196). Solving the two for a single film (normal alpha compositing) gives a
// tone of about 201-203, 192-193, 176-180 at a mean alpha of 0.81-0.83, so
// those are the film's; its mottle is a two-level one, thick (0.88) with
// patches of thin film (0.48) over a quarter of it, which gives the grey
// over the blue the original's variance (sd 25, 19, 12 here). Its ends are
// torn off by hand into short fibres, its length creased across and along, a
// second layer folded over its lower part, a hairline of shadow along its cut
// edges (the film is near-opaque now, so it casts one; round 8's, at 0.62
// and a neutral grey, had none, and over cream it vanished into a smudge).
//
// Procedural: the image model draws tape as opaque paper. 2x the size it is
// drawn at, 340 long by 150 wide before its fringe.
import sharp from "sharp";

export const TAPE = { w: 440, h: 200, len: 340, wid: 150, seed: 83, tone: [202, 193, 178], alpha: 0.88 };

// `h`: the recipe's helpers (noiseOf, smoothstep, wobble, lowField), which
// this module shares rather than copies
export const tapeSprite = async ({ noiseOf, smoothstep, wobble, lowField }) => {
  const { w: W, h: H, len, wid, seed, tone, alpha: A } = TAPE;
  const [x0, x1] = [(W - len) / 2, (W + len) / 2];
  const [y0, y1] = [(H - wid) / 2, (H + wid) / 2];
  // the mottle (a blotch 56 px, a smaller 21), a streak along the tape (a fibre
  // of the film, 8 px long) and a grain
  const along = async (cx, seedN) => {
    const [w, h] = [Math.ceil(W / cx) + 2, H + 2];
    const up = await sharp(noiseOf(w * h, seedN), { raw: { width: w, height: h, channels: 1 } })
      .resize({ width: w * cx, height: h, kernel: "cubic" })
      .extract({ left: cx, top: 1, width: W, height: H })
      .extractChannel(0)
      .raw()
      .toBuffer();
    return Float32Array.from(up, (q) => (q - 127.5) / 74);
  };
  const [low, mid, streak, fine] = await Promise.all([lowField(W, H, 56, seed), lowField(W, H, 21, seed + 1), along(8, seed + 2), lowField(W, H, 1, seed + 3)]);
  // the ends torn off by hand: a long wander, a short one and a fibre's, and the
  // odd loose fibre standing out past the tear
  const [tl, tr] = [wobble(H, seed + 5, [[64, 9], [20, 5], [6, 2.2]]), wobble(H, seed + 6, [[60, 9], [18, 5], [5.5, 2.2]])];
  const fibre = (s) => Float32Array.from(noiseOf(H, s), (v) => Math.pow(v / 255, 3) * 5);
  const [fibL, fibR] = [fibre(seed + 7), fibre(seed + 8)];
  const [top, bot] = [wobble(W, seed + 9, [[150, 1.3], [34, 0.7]]), wobble(W, seed + 10, [[150, 1.3], [34, 0.7]])];
  // a second layer of tape over its lower part, its upper edge a hair wavy and
  // its end torn
  const fold = wobble(W, seed + 11, [[120, 2.2], [27, 1]]);
  const foldTo = x0 + 0.74 * len;

  // The creases: lines the film was pressed into, most of them across the tape
  // (it is folded round a corner or smoothed down by a thumb), a few long ones
  // slanting along it. Each is a dark line with a pale one beside it, as a
  // crease in a film is (the ridge catches light, its far side shades), fading
  // out toward its ends. Stamped as soft dots along a gently bending path.
  const dark = new Float32Array(W * H);
  const pale = new Float32Array(W * H);
  const rnd = (i) => noiseOf(1, seed + 300 + i)[0] / 255;
  const creases = [];
  for (let c = 0; c < 6; c++) {
    const across = c < 4;
    const cx = x0 + 28 + rnd(c * 4) * (len - 56);
    const cy = (y0 + y1) / 2 + (rnd(c * 4 + 1) - 0.5) * wid * 0.5;
    // across: within 38 degrees of square to the tape; along: within 24 of its length
    const theta = across ? Math.PI / 2 + (rnd(c * 4 + 2) - 0.5) * 1.3 : (rnd(c * 4 + 2) - 0.5) * 0.85;
    const length = across ? wid * (0.55 + 0.5 * rnd(c * 4 + 3)) : len * (0.2 + 0.22 * rnd(c * 4 + 3));
    creases.push({ cx, cy, theta, length, bend: wobble(Math.ceil(length) + 4, seed + 400 + c, [[length * 0.8, 3.2], [length * 0.3, 1.1]]), strong: across ? 1 : 0.6 });
  }
  const stamp = (field, x, y, r, v) => {
    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++)
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
        const [px, py] = [Math.round(x) + dx, Math.round(y) + dy];
        if (px < 0 || py < 0 || px >= W || py >= H) continue;
        const d = Math.hypot(px - x, py - y) / r;
        if (d < 1) field[py * W + px] = Math.min(1, field[py * W + px] + v * (1 - d * d) ** 2);
      }
  };
  for (const { cx, cy, theta, length, bend, strong } of creases) {
    const [ux, uy] = [Math.cos(theta), Math.sin(theta)];
    for (let t = 0; t < length; t += 0.6) {
      const along = t - length / 2;
      const fade = Math.sin((Math.PI * t) / length) ** 0.7 * strong;
      const b = bend[Math.floor(t)];
      const [px, py] = [cx + ux * along - uy * b, cy + uy * along + ux * b];
      stamp(dark, px, py, 2.8, 0.36 * fade);
      stamp(pale, px - uy * 3.8, py + ux * 3.8, 2.8, 0.36 * fade);
    }
  }

  // the edge's own hairline of shadow is cast by the cut film's outline: how
  // much film covers each px (below), blurred and let fall to the lower right
  const cover = new Float32Array(W * H);
  const out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const loose = fine[i] > 0 ? 1 : 0.4;
      const dEnd = Math.min(x - x0 - tl[y] + fibL[y] * loose, x1 - x - tr[y] + fibR[y] * loose);
      const dSide = Math.min(y - y0 - top[x], y1 - y - bot[x]);
      cover[i] = smoothstep(-0.7, 1.4, dSide) * smoothstep(-1, 2.6 + 1.6 * Math.abs(streak[i]), dEnd);
      if (cover[i] <= 0.003) continue;
      // how thin the film is here (the print shows through), a little clearer
      // out to the cut, where it is cut: the film's rim is a hair more opaque
      // and paler, the line a cut edge catches
      // (mostly even; here and there a patch of it thin, where the print's blue
      // and grid lines come through grey)
      let a = A + 0.025 * low[i] + 0.02 * mid[i] + 0.025 * streak[i] + 0.02 * fine[i];
      a -= 0.4 * smoothstep(0.3, 0.9, 0.8 * low[i] + 0.6 * mid[i]);
      const [rimSide, rimEnd] = [1 - smoothstep(0, 2.6, dSide), 1 - smoothstep(0, 5, dEnd)];
      a += 0.07 * rimSide + 0.06 * rimEnd;
      const fy = y - (y0 + 0.56 * wid + fold[x]);
      const inFold = smoothstep(-0.6, 0.9, fy) * (1 - smoothstep(-1.2, 1.2, x - (foldTo + 0.5 * tr[y])));
      const line = Math.exp(-(fy ** 2) / 2.4);
      a = a + (1 - a) * 0.4 * inFold + 0.07 * line;
      // the creases: a dark line lowers the film's tone and thickens it, a
      // pale one lifts it
      a += 0.09 * dark[i] + 0.03 * pale[i];
      for (let k = 0; k < 3; k++) {
        const v = tone[k] + 5 * streak[i] + 3 * fine[i] + 6 * inFold + 9 * line - 16 * dark[i] + 14 * pale[i] + 7 * (rimSide + 0.6 * rimEnd);
        out[i * 4 + k] = Math.round(Math.min(255, Math.max(0, v)));
      }
      out[i * 4 + 3] = Math.round(255 * Math.min(0.94, Math.max(0.42, a)) * cover[i]);
    }

  // the shadow, outside the film only: one under its body would show through
  // it as dirt
  const cov8 = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) cov8[i] = Math.round(255 * cover[i]);
  const blurred = await sharp(cov8, { raw: { width: W, height: H, channels: 1 } }).blur(2.4).extractChannel(0).raw().toBuffer();
  const [sdx, sdy, SHADE] = [1, 2, [8, 20, 42]];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const [sx, sy] = [x - sdx, y - sdy];
      if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
      const as = (blurred[sy * W + sx] / 255) * 0.34 * (1 - cover[i]);
      if (as <= 0.004) continue;
      const at = out[i * 4 + 3] / 255;
      const ao = at + as * (1 - at);
      for (let k = 0; k < 3; k++) out[i * 4 + k] = Math.round((out[i * 4 + k] * at + SHADE[k] * as * (1 - at)) / ao);
      out[i * 4 + 3] = Math.round(255 * ao);
    }
  return { data: out, info: { width: W, height: H, channels: 4 } };
};
