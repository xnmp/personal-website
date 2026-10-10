// The ivy on the home cards: two generations, each a sheet of four separate
// sprigs on transparency (art/prompts/solarpunk/ivy-corner.txt: corner
// overgrowths, a clump with a vine along the top and one hanging down;
// ivy-foot.txt: bunches draped over a bottom rail), cut apart here into
// art/raw/solarpunk/ivy-corner-{a..d}/ and ivy-foot-{a..d}/ (a: upper left of
// the sheet, b: upper right, c: lower left, d: lower right), each trimmed to
// its leaves. A sprig is a connected body of leaves (a gap of a few pixels
// closes); the sheet must hold exactly four, or the cut stops.
//   node scripts/kits/solarpunk-ivy.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SOLID = 8; // alpha above this is a leaf
const CELL = 4; // the mask is read at 1/4, so gaps of a few pixels close
const REACH = 1; // cells a leaf's reach is dilated by
const VARIANTS = ["a", "b", "c", "d"];

for (const sheet of ["ivy-corner", "ivy-foot"]) {
  const src = `art/raw/solarpunk/${sheet}/${sheet}.png`;
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const [w, h] = [Math.ceil(W / CELL), Math.ceil(H / CELL)];
  const cell = new Uint8Array(w * h);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > SOLID) cell[Math.floor(y / CELL) * w + Math.floor(x / CELL)] = 1;
  const near = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (cell[y * w + x]) for (let j = Math.max(0, y - REACH); j <= Math.min(h - 1, y + REACH); j++) for (let i = Math.max(0, x - REACH); i <= Math.min(w - 1, x + REACH); i++) near[j * w + i] = 1;
  // flood-fill the bodies
  const label = new Int16Array(w * h);
  let n = 0;
  for (let s = 0; s < w * h; s++) {
    if (!near[s] || label[s]) continue;
    const stack = [s];
    label[s] = ++n;
    while (stack.length) {
      const c = stack.pop();
      const [x, y] = [c % w, (c / w) | 0];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const [nx, ny] = [x + dx, y + dy];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const k = ny * w + nx;
        if (near[k] && !label[k]) { label[k] = n; stack.push(k); }
      }
    }
  }
  if (n !== 4) throw new Error(`${sheet}: found ${n} sprigs on the sheet, not four`);
  // each body's leaves (full resolution), trimmed
  const boxes = Array.from({ length: n }, () => ({ l: W, t: H, r: 0, b: 0 }));
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] <= SOLID) continue;
      const bx = boxes[label[Math.floor(y / CELL) * w + Math.floor(x / CELL)] - 1];
      [bx.l, bx.t, bx.r, bx.b] = [Math.min(bx.l, x), Math.min(bx.t, y), Math.max(bx.r, x), Math.max(bx.b, y)];
    }
  // a, b over c, d: the upper row first, each row left to right
  const order = boxes.map((bx, i) => ({ bx, i })).sort((p, q) => {
    const [pr, qr] = [p.bx.t + p.bx.b > H, q.bx.t + q.bx.b > H];
    return pr !== qr ? pr - qr : p.bx.l - q.bx.l;
  });
  for (const [k, { bx, i }] of order.entries()) {
    const name = `${sheet}-${VARIANTS[k]}`;
    const [pw, ph] = [bx.r - bx.l + 1, bx.b - bx.t + 1];
    // only this sprig's own leaves (its box may hold a tendril of a neighbour)
    const px = Buffer.alloc(pw * ph * 4);
    for (let y = 0; y < ph; y++)
      for (let x = 0; x < pw; x++) {
        const [sx, sy] = [bx.l + x, bx.t + y];
        if (label[Math.floor(sy / CELL) * w + Math.floor(sx / CELL)] !== i + 1) continue;
        data.copy(px, (y * pw + x) * 4, (sy * W + sx) * 4, (sy * W + sx) * 4 + 4);
      }
    mkdirSync(`art/raw/solarpunk/${name}`, { recursive: true });
    await sharp(px, { raw: { width: pw, height: ph, channels: 4 } }).png().toFile(`art/raw/solarpunk/${name}/${name}.png`);
    console.log(`${name}: ${pw}x${ph}`);
  }
}
