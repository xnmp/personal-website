// Registration check for the raster kit: every state of a 9-slice asset must
// share the normal state's canvas and silhouette, or the corners and screws
// jump when the state changes.
//   node scripts/check-kit.mjs            (exit 1 on any drift)
import sharp from "sharp";
import { readdirSync } from "node:fs";

const DIR = "public/kit";
const MAX_DRIFT = 0.004; // fraction of pixels whose opacity class may differ (edge antialiasing)
// For the light-only states, each 9-slice corner's edge map must register
// with the normal's at zero offset: lighting may change, geometry may not.
// Pressed art is allowed to change the bevel (the cap travels), so it is held
// to the silhouette check alone.
const LIGHT_ONLY = new Set(["hover", "focus"]);
const SEARCH = 28; // px searched each way; must exceed any plausible drift
// slice insets from kit.css; the corners are the part a 9-slice never stretches
const SLICE = { plate: 96, key: 38 };

// Sobel magnitude of the silhouette (alpha) plus a little of the luminance.
// Alpha carries the chamfers and screw-free outline independent of lighting
// or printed focus lines; the luminance term catches moved screws.
const edges = async (file) => {
  const img = sharp(`${DIR}/${file}`).ensureAlpha();
  const [{ data: alpha, info }, { data: lum }] = await Promise.all([
    img.clone().extractChannel(3).raw().toBuffer({ resolveWithObject: true }),
    img.clone().flatten({ background: "#808080" }).greyscale().raw().toBuffer({ resolveWithObject: true }),
  ]);
  const data = Uint8Array.from(alpha, (a, i) => a * 0.8 + lum[i] * 0.2);
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
  return { w: info.width, h: info.height, opaque: Uint8Array.from(data, (a) => (a > 127 ? 1 : 0)) };
};

const families = new Map();
for (const f of readdirSync(DIR)) {
  const m = f.match(/^(.+)-(normal|hover|pressed|focus)\.webp$/);
  if (m) families.set(m[1], [...(families.get(m[1]) ?? []), { state: m[2], file: f }]);
}

let failed = false;
for (const [family, states] of families) {
  const normal = states.find((s) => s.state === "normal");
  if (!normal) continue;
  const ref = await alphaMask(normal.file);
  for (const s of states.filter((s) => s !== normal)) {
    const m = await alphaMask(s.file);
    if (m.w !== ref.w || m.h !== ref.h) {
      console.log(`FAIL ${family}-${s.state}: canvas ${m.w}x${m.h} != ${ref.w}x${ref.h}`);
      failed = true;
      continue;
    }
    let diff = 0;
    for (let i = 0; i < ref.opaque.length; i++) diff += ref.opaque[i] ^ m.opaque[i];
    const drift = diff / ref.opaque.length;
    const slice = SLICE[family.split("-")[0]];
    const offset = slice && LIGHT_ONLY.has(s.state) ? cornerOffset(await edges(normal.file), await edges(s.file), slice) : null;
    const ok = drift <= MAX_DRIFT && (offset ?? 0) <= 1;
    failed ||= !ok;
    console.log(`${ok ? "ok  " : "FAIL"} ${family}-${s.state}: silhouette drift ${(drift * 100).toFixed(2)}%, ${offset === null ? "silhouette only" : `corner offset ${offset}px`}`);
  }
}
process.exit(failed ? 1 : 0);
