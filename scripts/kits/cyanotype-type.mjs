// The print on the page's own lettering (the wordmark, the flagship's name:
// cyanotype.css): the original's letters are a flat chalk off-white (about
// 203, 204, 204 where it is solid, with no tonal drift across a stroke)
// eroded by letterpress. The wordmark's erosion is chipped and heavy: fine,
// soft, bluish bites inside the strokes and along their edges, a pixel or
// three across, clustered where the ink starved and streaked a little with the
// paper's grain (28% of its strokes below luma 140). The flagship's name is
// crisp: its edges clean and no hole in it, only a faint, fine, greyish
// speckle inside the strokes (round 9, measured against the mock's letters at
// 8x: a speck is one or two px, its luma ~160-185 in a chalk of ~200, never a
// navy bite). So a tile is a flat colour with a fine grain whose alpha is cut
// by that erosion: a seamless tile, laid by the page at --u. Round 8: it was a
// mottled silver with broad thinning (a grey gradient across each letter),
// then flat chalk with hard, chunky holes (a bite there is a navy hole: the
// mock's are translucent, 70% at most, with a soft edge and a faint haze of
// them between).
export const TYPE = {
  size: 384,
  day: [209, 209, 205],
  night: [216, 205, 186],
  // the wordmark's tile: the share of its field that is bitten, how deep a
  // bite goes (0 to 1 of the chalk), how soft its edge is (in z), and the
  // haze of thin places between bites
  worn: { share: 0.25, depth: 0.72, soft: 0.8, mottle: 0.1 },
  // the flagship's name: the same field, cut by a lighter hand
  clean: { share: 0.09, depth: 0.24, soft: 1.1, mottle: 0.03 },
  speck: 0.6,
  clump: 4,
  streak: [0.5, 3],
  weights: [0.7, 0.55],
};

// the z of a normal field above which `share` of it lies
const erf = (x) => {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
};
const zAbove = (share) => {
  // bisection on the normal tail
  const tail = (z) => 0.5 * (1 - erf(z / Math.SQRT2));
  let [lo, hi] = [-4, 4];
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (tail(mid) > share) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
/** A float field blurred along one axis (edge clamped). */
const blurAxis = (src, W, H, sigma, horizontal) => {
  if (sigma < 0.3) return src;
  const r = Math.max(1, Math.ceil(sigma * 3));
  const k = Array.from({ length: 2 * r + 1 }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)));
  const sum = k.reduce((a, v) => a + v, 0);
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let a = 0;
      for (let j = -r; j <= r; j++) {
        const i = horizontal ? y * W + Math.min(W - 1, Math.max(0, x + j)) : Math.min(H - 1, Math.max(0, y + j)) * W + x;
        a += k[j + r] * src[i];
      }
      out[y * W + x] = a / sum;
    }
  return out;
};

/** The tiles, `type-{day,night}` (the wordmark's) and `type-clean-{day,night}`
 *  (the flagship's name's): [{ name, data (RGBA), info }]. `noiseOf` is the
 *  recipe's seeded white noise, `smoothstep` its own. */
export const typeTiles = ({ noiseOf, smoothstep }) => {
  const S = TYPE.size;
  // seamless: noise on a torus (three tiles a side, blurred, the middle kept),
  // at its own scale along each axis, as a unit normal field
  const field = (sx, sy, seed) => {
    const t = noiseOf(S * S, seed);
    const big = new Float32Array(9 * S * S);
    for (let y = 0; y < 3 * S; y++) for (let x = 0; x < 3 * S; x++) big[y * 3 * S + x] = t[(y % S) * S + (x % S)];
    const b = blurAxis(blurAxis(big, 3 * S, 3 * S, sx, true), 3 * S, 3 * S, sy, false);
    const out = new Float32Array(S * S);
    let [m, v] = [0, 0];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) m += out[y * S + x] = b[(y + S) * 3 * S + x + S];
    m /= S * S;
    for (let i = 0; i < out.length; i++) v += (out[i] - m) ** 2;
    const sd = Math.sqrt(v / out.length) || 1;
    return out.map((q) => (q - m) / sd);
  };
  const [speck, clump, streak, grain] = [field(TYPE.speck, TYPE.speck, 3), field(TYPE.clump, TYPE.clump, 11), field(...TYPE.streak, 17), field(0.6, 0.6, 5)];
  // a bite is where a fine speck lands on a cluster and a streak: the score
  // is a unit normal field, so its tail is the share asked for
  const [wc, ws] = TYPE.weights;
  const norm = Math.sqrt(1 + wc * wc + ws * ws);
  const score = Float32Array.from(speck, (z, i) => (z + wc * clump[i] + ws * streak[i]) / norm);
  const tiles = [];
  for (const fin of ["day", "night"]) {
    for (const [name, { share, depth, soft, mottle }] of [["type", TYPE.worn], ["type-clean", TYPE.clean]]) {
      const cut = zAbove(share);
      const data = Buffer.alloc(S * S * 4);
      for (let i = 0; i < S * S; i++) {
        const bite = depth * smoothstep(cut - soft, cut + soft, score[i]);
        const a = Math.max(0.03, 1 - bite - mottle * (0.5 + 0.5 * Math.tanh(clump[i])));
        for (let k = 0; k < 3; k++) data[i * 4 + k] = Math.min(255, Math.round(TYPE[fin][k] * (1 + 0.012 * grain[i])));
        data[i * 4 + 3] = Math.round(a * 255);
      }
      tiles.push({ name: `${name}-${fin}`, data, info: { width: S, height: S, channels: 4 } });
    }
  }
  return tiles;
};
