// Cyanotype's screens (cyanotype.css, the cards' and the shelves' 1-bit
// pictures): each is a small display set into the card's paper, as the
// original's cards hold theirs, not a white box laid on them. Two pieces, both
// printed, neither a CSS rule: the slim ink-navy bezel round it, and the
// faint grain of its own paper.
//
// The bezel is the original's: a thin band of navy ink whose edges are not
// true (the ink took unevenly, a hair of it bled in past the band's inner
// edge), drawn once as a 9-slice the page lays round the screen
// (`border-image`, slice BEZEL.slice, the band BEZEL.band of those px). Its
// sides repeat, so the wander of its edge is periodic along them. Round 8: it
// was a crisp even rule that read as a UI outline; the original's is a rough
// print, so the band is thinner, its width wanders by 40% along a side, its
// outer edge frays, and the ink wears through it in small breaks. The page
// draws a slice at 5-8 px, so features must be ~6+ of these px to show.
import sharp from "sharp";

const smooth = (a, b, t) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

// one corner's slice and the band's thickness, in the asset's own px; the
// page draws a slice at ~5 of the original's px (cyanotype.css), so the band
// is a hairline of ~2: the original's cards hold their screen flush, and ours
// (light by day) needs only a line to be told from the paper
export const BEZEL = { slice: 48, band: 17, side: 512, radius: 28 };

// the ink, by finish: the day's is the print's deepest navy; by night the
// screen is dark, so the band is a shade lighter than it, as the original's is
const INK = { day: [15, 32, 64], night: [30, 52, 92] };

// a smooth wander along an edge that comes round at `period` px: a few sines
// of whole numbers of turns, so the edge matches where the side repeats
const wander = (seed, period, harmonics) => {
  const phase = harmonics.map((_, i) => ((Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453) % 1 + 1) % 1);
  return (t) => harmonics.reduce((sum, [turns, amp], i) => sum + amp * Math.sin((2 * Math.PI * (turns * t)) / period + 2 * Math.PI * phase[i]), 0);
};

export const bezel = async (finish) => {
  const { slice: S, band: T, side, radius: R } = BEZEL;
  const N = 2 * S + side;
  const out = Buffer.alloc(N * N * 4);
  // the outer edge barely wanders (a hair of fray); the inner edge wanders
  // and breaks more, as ink does where it stops
  const outer = [wander(3, side, [[5, 3.4], [17, 2.8], [41, 1.8]]), wander(7, side, [[4, 3.4], [19, 2.8], [43, 1.8]])];
  const inner = [wander(11, side, [[3, 2.6], [9, 1.9], [23, 1.4], [61, 0.8]]), wander(13, side, [[3, 2.6], [8, 1.9], [27, 1.4], [59, 0.8]])];
  // how thick the band is along a side (its width wanders by 40%)
  const thick = [wander(17, side, [[7, 0.5], [19, 0.35], [53, 0.2]]), wander(19, side, [[6, 0.5], [21, 0.35], [47, 0.2]])];
  // the ink's wear: value noise (a cell of 16 px and one of 8, wrapping along
  // the side, so the repeat is seamless), where it is low the ink has not
  // taken
  const grid = (seed, cell) => {
    const n = side / cell;
    const v = Array.from({ length: n * 8 }, (_, i) => {
      const h = Math.sin(seed * 91.3 + i * 12.9898) * 43758.5453;
      return h - Math.floor(h);
    });
    return (t, m) => {
      const [gt, gm] = [(((t / cell) % n) + n) % n, Math.min(6.999, Math.max(0, m / cell))];
      const [t0, m0] = [Math.floor(gt), Math.floor(gm)];
      const [ft, fm] = [gt - t0, gm - m0];
      const at = (a, b) => v[(a % n) * 8 + b];
      const e = (f) => f * f * (3 - 2 * f);
      const top = at(t0, m0) * (1 - e(ft)) + at(t0 + 1, m0) * e(ft);
      const bot = at(t0, m0 + 1) * (1 - e(ft)) + at(t0 + 1, m0 + 1) * e(ft);
      return top * (1 - e(fm)) + bot * e(fm);
    };
  };
  const wear = [[grid(2, 16), grid(5, 8)], [grid(3, 16), grid(7, 8)]];
  const speck = (x, y) => {
    // fine, deterministic mottle in the ink (no seed needed past the hash)
    const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return h - Math.floor(h);
  };
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const dx = Math.min(x, N - 1 - x);
      const dy = Math.min(y, N - 1 - y);
      const m = Math.min(dx, dy);
      // the nearer edge decides which way the wander runs along it
      const vertical = dx < dy;
      const t = vertical ? y - S : x - S;
      const k = vertical ? 1 : 0;
      const [wo, wi] = [outer[k](t), inner[k](t)];
      const Te = T * (1 + 0.4 * thick[k](t));
      // the outer rounded corner
      const corner = dx < R && dy < R ? R - Math.hypot(R - dx, R - dy) : m;
      const edge = smooth(-1, 3, corner + wo);
      const band = 1 - smooth(Te - 3 + wi, Te + 1.5 + wi, m);
      // the ink that bled in past the band's inner edge
      const bleed = 0.26 * (1 - smooth(Te - 2, Te + 15, m));
      const body = Math.max(band, m >= Te - 3 ? bleed * (1 - band) : 0);
      // the ink wears through in small breaks, and is mottled
      const w = 0.65 * wear[k][0](t, m) + 0.35 * wear[k][1](t, m);
      const worn = 1 - 0.62 * smooth(0.56, 0.22, w);
      const mottle = (0.78 + 0.22 * speck(x, y)) * worn;
      const a = edge * body * mottle;
      if (a < 0.004) continue;
      const o = (y * N + x) * 4;
      const tone = 1 + 0.06 * (speck(x + 91, y + 17) - 0.5);
      for (let k = 0; k < 3; k++) out[o + k] = Math.min(255, Math.round(INK[finish][k] * tone));
      out[o + 3] = Math.round(a * 255);
    }
  return { data: out, info: { width: N, height: N, channels: 4 } };
};

// The screen's own paper: a seamless tile of faint fibre, laid over the
// cream (light) or the dark of the rice (cyanotype.css). Dark specks and
// pale ones, broad mottle under the fine; each only a few per cent of the
// face, so the picture still reads as lit, not stained.
export const GRAIN = { size: 512 };
const torus = async (S, sigma, seed, noiseOf) => {
  const t = noiseOf(S * S, seed);
  const big = Buffer.alloc(9 * S * S);
  for (let y = 0; y < 3 * S; y++) for (let x = 0; x < 3 * S; x++) big[y * 3 * S + x] = t[(y % S) * S + (x % S)];
  const b = await sharp(big, { raw: { width: 3 * S, height: 3 * S, channels: 1 } }).blur(sigma).extractChannel(0).raw().toBuffer();
  const field = new Float32Array(S * S);
  let mean = 0;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) mean += field[y * S + x] = b[(y + S) * 3 * S + x + S];
  mean /= S * S;
  let v = 0;
  for (let i = 0; i < field.length; i++) v += (field[i] - mean) ** 2;
  const sd = Math.sqrt(v / field.length) || 1;
  return field.map((q) => (q - mean) / sd);
};

export const grain = async (finish, noiseOf) => {
  const S = GRAIN.size;
  const [fine, strand, mottle] = await Promise.all([torus(S, 1.1, 5, noiseOf), torus(S, 2.4, 23, noiseOf), torus(S, 9, 41, noiseOf)]);
  const out = Buffer.alloc(S * S * 4);
  // light finish: warm-grey fibre on the cream, and bare pale fibre; dark
  // finish: the pale fibre alone shows, the dark ones only deepen
  const dark = finish === "day" ? [92, 80, 62] : [0, 0, 0];
  const pale = finish === "day" ? [255, 253, 246] : [196, 202, 222];
  const [kDark, kPale] = finish === "day" ? [0.1, 0.34] : [0.16, 0.07];
  for (let i = 0; i < S * S; i++) {
    const v = 0.55 * fine[i] + 0.35 * strand[i] + 0.3 * mottle[i];
    const [rgb, a] = v < 0 ? [dark, Math.min(0.26, -v * kDark)] : [pale, Math.min(0.5, v * kPale * 0.5)];
    out.set(rgb, i * 4);
    out[i * 4 + 3] = Math.round(a * 255);
  }
  return { data: out, info: { width: S, height: S, channels: 4 } };
};
