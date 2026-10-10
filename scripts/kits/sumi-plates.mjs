// Calm the Sumi-e Ink plates where the flagship's copy is written:
//   node scripts/kits/sumi-plates.mjs     (then: node scripts/build-kit.mjs sumi)
//
// The plate's edit (plate-day-clear, and plate-night after it) painted a
// skein of birds into the paper the original keeps open for "Tauri Explorer"
// and its pitch (mock 250-500, 205-295), so they thread through the title.
// Each bird is found as a small mark darker than the paper round it, and
// cloned out with paper from beside it: the nearest offset whose patch holds
// no bird, its tone matched to the paper it covers, feathered in. Both
// finishes are cleaned the same way, each on its own marks (the night is an
// edit of the day and may sit a pixel off). Writes plate-{day,night}-calm,
// the scene's sky in scripts/kits/sumi.mjs.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const RAW = "art/raw/sumi";
// the zone the copy covers at any desktop aspect, in plate px
const ZONE = { x: 250, y: 205, w: 252, h: 90 };
const PLATES = [
  { src: "plate-day-clear", out: "plate-day-calm", dark: 26 },
  { src: "plate-night", out: "plate-night-calm", dark: 28 },
];
const OFFSETS = [[-28, 0], [28, 0], [0, -22], [0, 22], [-46, 0], [46, 0], [-28, -22], [28, 22], [-28, 22], [28, -22], [0, -34], [0, 34], [-64, 0], [64, 0]];

/** a separable max (or min) filter over a w x h field, radius r */
const extreme = (src, w, h, r, pick) => {
  const a = new Float32Array(w * h);
  const b = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = src[y * w + x];
      for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + r); k++) v = pick(v, src[y * w + k]);
      a[y * w + x] = v;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = a[y * w + x];
      for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r); k++) v = pick(v, a[k * w + x]);
      b[y * w + x] = v;
    }
  return b;
};
const max = (a, b) => (a > b ? a : b);
const min = (a, b) => (a < b ? a : b);

/** the mean of each channel over a box, from the pixels `ok` allows */
const meanOf = (data, W, x0, y0, w, h, ok) => {
  const s = [0, 0, 0];
  let n = 0;
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      if (!ok(x, y)) continue;
      const p = (y * W + x) * 3;
      for (let c = 0; c < 3; c++) s[c] += data[p + c];
      n++;
    }
  return s.map((v) => v / Math.max(1, n));
};

for (const { src, out, dark } of PLATES) {
  const { data, info } = await sharp(`${RAW}/${src}/${src}.png`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  // a bird: darker than the paper round it (a grey closing wider than a bird)
  const { x: zx, y: zy, w: zw, h: zh } = ZONE;
  const L = new Float32Array(zw * zh);
  for (let y = 0; y < zh; y++)
    for (let x = 0; x < zw; x++) {
      const p = ((zy + y) * W + zx + x) * 3;
      L[y * zw + x] = Math.min(data[p], data[p + 1], data[p + 2]);
    }
  const paper = extreme(extreme(L, zw, zh, 9, max), zw, zh, 9, min);
  const mark = new Float32Array(zw * zh);
  for (let i = 0; i < mark.length; i++) mark[i] = paper[i] - L[i] > dark ? 1 : 0;
  // the open paper's tone: a mark on the mountains' wash is the painting's
  const sorted = Float32Array.from(paper).sort();
  const open = sorted[sorted.length >> 1];
  const onPaper = (x, y) => paper[(y - zy) * zw + x - zx] > open - 14;

  // each mark's connected pixels: a bird is small, and stands on open paper
  const seen = new Uint8Array(zw * zh);
  const bird = new Float32Array(zw * zh);
  const birds = [];
  for (let s = 0; s < mark.length; s++) {
    if (!mark[s] || seen[s]) continue;
    const stack = [s];
    const px = [];
    seen[s] = 1;
    let [x0, y0, x1, y1] = [zw, zh, 0, 0];
    while (stack.length) {
      const i = stack.pop();
      px.push(i);
      const x = i % zw;
      const y = (i / zw) | 0;
      [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const X = x + dx;
        const Y = y + dy;
        if (X < 0 || Y < 0 || X >= zw || Y >= zh) continue;
        const j = Y * zw + X;
        if (!mark[j] || seen[j]) continue;
        seen[j] = 1;
        stack.push(j);
      }
    }
    const small = x1 - x0 < 26 && y1 - y0 < 16 && px.length >= 4;
    if (!small || !onPaper(zx + ((x0 + x1) >> 1), zy + ((y0 + y1) >> 1))) continue;
    for (const i of px) bird[i] = 1;
    birds.push([x0, y0, x1, y1]);
  }
  // its wings' soft edge too
  const wide = extreme(bird, zw, zh, 2, max);
  const inZone = (x, y) => x >= zx && y >= zy && x < zx + zw && y < zy + zh;
  const isBird = (x, y) => inZone(x, y) && wide[(y - zy) * zw + x - zx] > 0;

  // each bird cloned over with paper from beside it
  const res = Buffer.from(data);
  for (const [x0, y0, x1, y1] of birds) {
    const pad = 3;
    const bx = zx + x0 - pad - 2;
    const by = zy + y0 - pad - 2;
    const bw = x1 - x0 + 1 + 2 * (pad + 2);
    const bh = y1 - y0 + 1 + 2 * (pad + 2);
    // a source holds no bird, and paper of the tone it covers (the night's
    // sky darkens to the left)
    const tone = paper[(((y0 + y1) >> 1) * zw) + ((x0 + x1) >> 1)];
    const clean = ([dx, dy]) => {
      for (let y = by; y < by + bh; y++)
        for (let x = bx; x < bx + bw; x++) {
          const [X, Y] = [x + dx, y + dy];
          if (!inZone(X, Y) || isBird(X, Y) || Math.abs(paper[(Y - zy) * zw + X - zx] - tone) > 30) return false;
        }
      return true;
    };
    const off = OFFSETS.find(clean);
    if (!off) throw new Error(`${src}: no clean paper beside the bird at ${bx},${by}`);
    const [dx, dy] = off;
    // the patch's tone brought to the paper it covers (the paper round the bird)
    const ring = (x, y) => !isBird(x, y);
    const here = meanOf(data, W, bx, by, bw, bh, ring);
    const there = meanOf(data, W, bx + dx, by + dy, bw, bh, () => true);
    for (let y = by; y < by + bh; y++)
      for (let x = bx; x < bx + bw; x++) {
        // feathered: whole over the bird, fading over the pad round it
        let near = Infinity;
        for (let v = -pad; v <= pad; v++) for (let u = -pad; u <= pad; u++) if (isBird(x + u, y + v)) near = Math.min(near, Math.hypot(u, v));
        const t = near === 0 ? 1 : Math.max(0, 1 - near / (pad + 0.5));
        if (t === 0) continue;
        const p = (y * W + x) * 3;
        const q = ((y + dy) * W + x + dx) * 3;
        for (let c = 0; c < 3; c++) {
          const v = data[q + c] + here[c] - there[c];
          res[p + c] = Math.round(Math.min(255, Math.max(0, data[p + c] * (1 - t) + v * t)));
        }
      }
  }
  mkdirSync(`${RAW}/${out}`, { recursive: true });
  await sharp(res, { raw: { width: W, height: info.height, channels: 3 } }).png().toFile(`${RAW}/${out}/${out}.png`);
  console.log(`${out}: ${birds.length} birds cloned out`);
}
