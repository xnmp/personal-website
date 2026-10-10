// Registration check for the raster kit: every state of a 9-slice asset must
// share the normal state's canvas and silhouette, or the torn edges jump when
// the state changes.
//   node scripts/check-kit.mjs [dir]      (default: every kit in public/kit; exit 1 on any drift)
import sharp from "sharp";
import { readdirSync } from "node:fs";
import { webpOptions } from "./webp.mjs";

const DIRS = process.argv[2] ? [process.argv[2]] : readdirSync("public/kit").map((d) => `public/kit/${d}`);
let DIR = DIRS[0]; // the kit being checked
const MAX_DRIFT = 0.004; // fraction of pixels whose opacity class may differ (edge antialiasing)
// For the light-only states, each 9-slice corner's edge map must register
// with the normal's at zero offset: lighting may change, geometry may not.
// Pressed art is allowed to change the bevel (the cap travels), so it is held
// to the silhouette check alone.
const LIGHT_ONLY = new Set(["hover", "focus", "flat"]);
// A sheet's focus may add to the sheet (the paper's mount behind it, the
// brass frame's enamel strip laid in along its pane), growing its
// silhouette: then it must contain the normal's, and the normal's own pixels
// must be unmoved and unrelit. A focus that doesn't grow it (a scroll's silk
// re-dyed) is held to the light-only rules.
const ADDS = (family, state, grown) => family.startsWith("sheet-") && state === "focus" && grown > MAX_DRIFT;
// mean per-channel difference over the paper. Two states are encoded apart,
// and lossy WebP spends its bits by the whole image, so even unchanged pixels
// jitter: about 1 on matte paper, about 2 on brushed brass, more on a grained
// enamel. So the allowance is the material's own: the codec's jitter on the
// normal state's paper (it decoded and encoded again as the build encodes a
// state), times JITTER, and never under MAX_PAPER_DELTA. Two independent
// encodes of the same paper differ by about √2 of one encode's error, so 1.5
// leaves the codec its room. A relit or recoloured surface differs by more
// than that, and a moved one by tens.
const MAX_PAPER_DELTA = 2.5;
const JITTER = 1.5;
const STATE_WEBP = webpOptions(88); // scripts/build-kit.mjs, a derived state
const SEARCH = 28; // px searched each way; must exceed any plausible drift
// slice insets from kit.css; the corners are the part a 9-slice never stretches
const SLICE = { sheet: 152, tile: 60 };
// Each asset carries its cast shadow in its alpha, and a state may move the
// shadow (a sheet lifts on hover). The paper itself is opaque and the shadow
// never is, so the silhouette is the alpha above this.
const PAPER = 200;
const BAND = 20; // either side of PAPER: antialiasing, not silhouette

// Sobel magnitude of the silhouette plus a little of the luminance. The
// silhouette carries the torn outline independent of lighting or printed
// focus lines; the luminance term catches moved paper detail. Both are read
// on the paper alone (alpha above PAPER): the cast shadow is not the
// asset's geometry, and a state may move it (a flat shadow's crisp edge
// would otherwise outweigh the outline it is cast from).
const edges = async (file) => {
  const img = sharp(`${DIR}/${file}`).ensureAlpha();
  const [{ data: alpha, info }, { data: lum }] = await Promise.all([
    img.clone().extractChannel(3).raw().toBuffer({ resolveWithObject: true }),
    img.clone().flatten({ background: "#808080" }).greyscale().raw().toBuffer({ resolveWithObject: true }),
  ]);
  const paper = (a) => (255 * Math.max(0, a - PAPER)) / (255 - PAPER);
  const data = Uint8Array.from(alpha, (a, i) => paper(a) * 0.8 + (a > PAPER ? lum[i] : 128) * 0.2);
  const { width: W, height: H } = info;
  const e = new Float32Array(W * H);
  const g = (x, y) => data[y * W + x];
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const gx = g(x + 1, y - 1) + 2 * g(x + 1, y) + g(x + 1, y + 1) - g(x - 1, y - 1) - 2 * g(x - 1, y) - g(x - 1, y + 1);
      const gy = g(x - 1, y + 1) + 2 * g(x, y + 1) + g(x + 1, y + 1) - g(x - 1, y - 1) - 2 * g(x, y - 1) - g(x + 1, y - 1);
      e[y * W + x] = Math.hypot(gx, gy);
    }
  return { e, W, H };
};

// Pearson correlation of the corner tile at (ox,oy) in `a` against the same
// tile shifted by (dx,dy) in `b`.
const tileCorr = (a, b, ox, oy, size, dx, dy) => {
  let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, n = 0;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const bx = ox + x + dx, by = oy + y + dy;
      if (bx < 0 || by < 0 || bx >= b.W || by >= b.H) continue;
      const va = a.e[(oy + y) * a.W + ox + x], vb = b.e[by * b.W + bx];
      sa += va; sb += vb; saa += va * va; sbb += vb * vb; sab += va * vb; n++;
    }
  const cov = sab - (sa * sb) / n;
  return cov / Math.sqrt((saa - (sa * sa) / n) * (sbb - (sb * sb) / n) || 1);
};

// Worst corner offset (px) between two states.
const cornerOffset = (a, b, slice) => {
  const tiles = [[0, 0], [a.W - slice, 0], [0, a.H - slice], [a.W - slice, a.H - slice]];
  return Math.max(...tiles.map(([ox, oy]) => {
    let best = { r: -2, d: 0 };
    for (let dy = -SEARCH; dy <= SEARCH; dy++)
      for (let dx = -SEARCH; dx <= SEARCH; dx++) {
        const r = tileCorr(a, b, ox, oy, slice, dx, dy);
        if (r > best.r) best = { r, d: Math.max(Math.abs(dx), Math.abs(dy)) };
      }
    return best.d;
  }));
};

const alphaMask = async (file) => {
  const { data, info } = await sharp(`${DIR}/${file}`).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  return {
    w: info.width,
    h: info.height,
    opaque: Uint8Array.from(data, (a) => (a > PAPER ? 1 : 0)),
    // a pixel clearly one side or the other: an edge row whose coverage sits
    // at the threshold flips class on a hair's change of shadow under it,
    // which is not the edge moving
    clear: Uint8Array.from(data, (a) => a < PAPER - BAND),
    firm: Uint8Array.from(data, (a) => a > PAPER + BAND),
    // the material itself, without the light a pane's glass carries (a
    // framed sheet's shade and glint can stack past PAPER)
    solid: Uint8Array.from(data, (a) => (a >= 250 ? 1 : 0)),
  };
};

/** mean per-channel difference between two states over the paper's pixels */
const paperDelta = async (a, b, opaque) => {
  const [pa, pb] = await Promise.all([a, b].map((f) => sharp(`${DIR}/${f}`).removeAlpha().raw().toBuffer()));
  let sum = 0;
  let n = 0;
  for (let i = 0; i < opaque.length; i++)
    if (opaque[i]) {
      for (let k = 0; k < 3; k++) sum += Math.abs(pa[i * 3 + k] - pb[i * 3 + k]);
      n += 3;
    }
  return sum / Math.max(1, n);
};

/** the codec's own jitter on a state's paper: its decoded pixels encoded
 *  again as the build encodes a state, against themselves */
const noiseFloor = async (file, opaque) => {
  const { data, info } = await sharp(`${DIR}/${file}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const again = await sharp(await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).webp(STATE_WEBP).toBuffer())
    .ensureAlpha()
    .raw()
    .toBuffer();
  let sum = 0;
  let n = 0;
  for (let i = 0; i < opaque.length; i++)
    if (opaque[i]) {
      for (let k = 0; k < 3; k++) sum += Math.abs(data[i * 4 + k] - again[i * 4 + k]);
      n += 3;
    }
  return sum / Math.max(1, n);
};

let failed = false;
for (DIR of DIRS) {
  const families = new Map();
  for (const f of readdirSync(DIR)) {
    const m = f.match(/^(.+)-(normal|hover|pressed|focus|flat)\.webp$/);
    if (m) families.set(m[1], [...(families.get(m[1]) ?? []), { state: m[2], file: f }]);
  }

  for (const [family, states] of families) {
    const normal = states.find((s) => s.state === "normal");
    if (!normal) continue;
    const ref = await alphaMask(normal.file);
    for (const s of states.filter((s) => s !== normal)) {
      const m = await alphaMask(s.file);
      if (m.w !== ref.w || m.h !== ref.h) {
        console.log(`FAIL ${DIR.split("/").pop()}/${family}-${s.state}: canvas ${m.w}x${m.h} != ${ref.w}x${ref.h}`);
        failed = true;
        continue;
      }
      let grown = 0;
      for (let i = 0; i < ref.opaque.length; i++) grown += m.opaque[i] & (1 - ref.opaque[i]);
      if (ADDS(family, s.state, grown / ref.opaque.length)) {
        let lost = 0;
        for (let i = 0; i < ref.opaque.length; i++) lost += ref.opaque[i] & (1 - m.opaque[i]);
        const delta = await paperDelta(normal.file, s.file, ref.solid);
        const floor = await noiseFloor(normal.file, ref.solid);
        const allowed = Math.max(MAX_PAPER_DELTA, JITTER * floor);
        const ok = lost / ref.opaque.length <= MAX_DRIFT && delta <= allowed;
        failed ||= !ok;
        console.log(`${ok ? "ok  " : "FAIL"} ${DIR.split("/").pop()}/${family}-${s.state}: adds to the sheet, paper lost ${((lost / ref.opaque.length) * 100).toFixed(2)}%, paper delta ${delta.toFixed(2)} (allowed ${allowed.toFixed(2)}, codec ${floor.toFixed(2)})`);
        continue;
      }
      let diff = 0;
      for (let i = 0; i < ref.opaque.length; i++) diff += (ref.firm[i] && m.clear[i]) || (ref.clear[i] && m.firm[i]) ? 1 : 0;
      const drift = diff / ref.opaque.length;
      const slice = SLICE[family.split("-")[0]];
      const offset = slice && LIGHT_ONLY.has(s.state) ? cornerOffset(await edges(normal.file), await edges(s.file), slice) : null;
      const ok = drift <= MAX_DRIFT && (offset ?? 0) <= 1;
      failed ||= !ok;
      console.log(`${ok ? "ok  " : "FAIL"} ${DIR.split("/").pop()}/${family}-${s.state}: silhouette drift ${(drift * 100).toFixed(2)}%, ${offset === null ? "silhouette only" : `corner offset ${offset}px`}`);
    }
  }
}
process.exit(failed ? 1 : 0);
