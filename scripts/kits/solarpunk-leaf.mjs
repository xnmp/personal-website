// The brand's leaf: the generation (art/raw/solarpunk/leaf-gen/leaf-gen.png,
// prompt art/prompts/solarpunk/leaf.txt) cleaned of the specks of stray
// alpha the generator leaves round a cut-out, so the kit's trim finds the
// leaf's own bounds: every pixel under alpha 24 is cleared, and what is not
// the leaf's one connected body is dropped. Writes art/raw/solarpunk/leaf/leaf.png.
//   node scripts/kits/solarpunk-leaf.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "art/raw/solarpunk/leaf-gen/leaf-gen.png";
const OUT = "art/raw/solarpunk/leaf";
const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const solid = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) solid[i] = data[i * 4 + 3] >= 24 ? 1 : 0;
// the largest 4-connected body
const label = new Int32Array(W * H);
let best = 0;
let bestSize = 0;
let next = 0;
const stack = [];
for (let s = 0; s < W * H; s++) {
  if (!solid[s] || label[s]) continue;
  const id = ++next;
  let size = 0;
  stack.push(s);
  label[s] = id;
  while (stack.length) {
    const p = stack.pop();
    size++;
    const [x, y] = [p % W, (p / W) | 0];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const [nx, ny] = [x + dx, y + dy];
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const q = ny * W + nx;
      if (solid[q] && !label[q]) { label[q] = id; stack.push(q); }
    }
  }
  if (size > bestSize) [best, bestSize] = [id, size];
}
// (a cleared pixel's colour is cleared too: the kit's trim compares all four channels)
for (let i = 0; i < W * H; i++) if (label[i] !== best) data.fill(0, i * 4, i * 4 + 4);
mkdirSync(OUT, { recursive: true });
await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(`${OUT}/leaf.png`);
const t = await sharp(`${OUT}/leaf.png`).trim({ threshold: 1 }).metadata();
console.log(`leaf: ${W}x${H}, trimmed to ${t.width}x${t.height} (${bestSize} px)`);
