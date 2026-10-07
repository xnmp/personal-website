// Rebuild a rack-rail tile from the authored rail bitmap, re-pitched to real
// EIA-310 spacing: three square cage-nut holes per U at 15.875 / 15.875 /
// 12.7 mm, so the rail reads as a rack rather than film-strip perforation.
//   node scripts/build-rail.mjs <authored-rail.webp> <out.webp>
// The material (the column profile, grain and hole bevel) all comes from the
// authored source. This script only re-lays it out. The output tiles
// seamlessly in y and holds 2U.
import sharp from "sharp";

const [, , src, out] = process.argv;
const HOLE = 38; // px square in the output (source holes are ~30)
const MM = HOLE / 9.5; // a cage-nut hole is 9.5 mm square
const U = Math.round(44.45 * MM);
const HOLES_MM = [6.35, 22.225, 38.1]; // hole centres within one U
const TILE_U = 2;

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const px = (x, y) => (y * W + x) * 4;

// Hole rows and hole columns in the source: transparent pixels down the
// centre line.
const cx = Math.floor(W / 2);
const isHole = (x, y) => data[px(x, y) + 3] < 128;
const holeRows = [...Array(H).keys()].filter((y) => isHole(cx, y));
const solidRows = [...Array(H).keys()].filter((y) => !holeRows.some((h) => Math.abs(h - y) < 8));
const runs = holeRows.reduce((acc, y) => {
  const last = acc.at(-1);
  if (last && y === last[1] + 1) last[1] = y;
  else acc.push([y, y]);
  return acc;
}, []);
const [h0, h1] = runs.filter(([a, b]) => b - a > 20)[1]; // a whole interior hole
const hy = Math.round((h0 + h1) / 2);
// the transparent run around the centre line (the rail's own edges can be transparent too)
let x0 = cx, x1 = cx;
while (x0 > 0 && isHole(x0 - 1, hy)) x0--;
while (x1 < W - 1 && isHole(x1 + 1, hy)) x1++;

// The base is the median colour per column over solid rows, plus the source's
// own grain: each row of the output borrows the residual of a solid source row.
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const profile = [...Array(W).keys()].map((x) => [0, 1, 2, 3].map((k) => median(solidRows.map((y) => data[px(x, y) + k]))));
const TH = U * TILE_U;
const outBuf = Buffer.alloc(W * TH * 4);
for (let y = 0; y < TH; y++) {
  const sy = solidRows[(y * 7) % solidRows.length];
  for (let x = 0; x < W; x++)
    for (let k = 0; k < 4; k++) {
      const grain = k < 3 ? data[px(x, sy) + k] - profile[x][k] : 0;
      outBuf[(y * W + x) * 4 + k] = Math.max(0, Math.min(255, profile[x][k] + grain * 0.6));
    }
}

// The hole patch, with its bevel ring, is scaled to HOLE and feathered into
// the base.
const M = 7; // source margin of bevel around the hole
const patchW = x1 - x0 + 1 + 2 * M, patchH = h1 - h0 + 1 + 2 * M;
const scale = HOLE / (x1 - x0 + 1);
const pw = Math.round(patchW * scale), ph = Math.round(patchH * scale);
const patch = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left: x0 - M, top: h0 - M, width: patchW, height: patchH })
  .resize(pw, ph, { kernel: "lanczos3" })
  .raw()
  .toBuffer();
const holeCx = (x0 + x1) / 2;
const feather = (d) => Math.min(1, Math.max(0, d / (M * scale * 0.7)));
for (let u = 0; u < TILE_U; u++)
  for (const mm of HOLES_MM) {
    const cy = u * U + mm * MM;
    const left = Math.round(holeCx - pw / 2), top = Math.round(cy - ph / 2);
    for (let y = 0; y < ph; y++)
      for (let x = 0; x < pw; x++) {
        const ox = left + x, oy = (top + y + TH) % TH;
        const edge = Math.min(x, y, pw - 1 - x, ph - 1 - y);
        const w = feather(edge);
        const o = (oy * W + ox) * 4, p = (y * pw + x) * 4;
        for (let k = 0; k < 4; k++) outBuf[o + k] = Math.round(outBuf[o + k] * (1 - w) + patch[p + k] * w);
      }
  }

// A U boundary tick, engraved into the outer flange (light from the upper left:
// a dark line over a light one).
for (let u = 0; u < TILE_U; u++) {
  const y = u * U;
  for (let x = 6; x < Math.round(x0 * 0.55); x++) {
    const a = (y * W + x) * 4, b = (((y + 1) % TH) * W + x) * 4;
    if (outBuf[a + 3] < 200) continue;
    for (let k = 0; k < 3; k++) {
      outBuf[a + k] = Math.round(outBuf[a + k] * 0.45);
      outBuf[b + k] = Math.min(255, Math.round(outBuf[b + k] * 1.25 + 10));
    }
  }
}

await sharp(outBuf, { raw: { width: W, height: TH, channels: 4 } }).webp({ quality: 92, alphaQuality: 100 }).toFile(out);
console.log(out, W, TH, `U=${U}px`);
