// The monitor's stand (neck and wide foot), cut from the original mock's own
// pixels: the page frames the live window as a monitor of its own (the
// bezel is CSS) and stands it on this, at the mock's coordinates, on the desk
// the plate leaves bare. The polygon is the neck and foot in mock px, read
// off a 4x crop of art/originals/solarpunk.webp (the neck runs up under the
// bezel's chin); its edge is feathered by 0.8px. Writes
// art/raw/solarpunk/monitor-stand/monitor-stand.png (the kit trims it).
//   node scripts/kits/solarpunk-stand.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const MOCK = "art/originals/solarpunk.webp";
const OUT = "art/raw/solarpunk/monitor-stand";
// 4x crop coordinates (crop at 940,440), as read: neck top left and right,
// the neck's foot, the foot's far-right, near-right, near-left and far-left
const POLY = [[490, 100], [733, 100], [735, 270], [912, 286], [920, 325], [800, 345], [136, 326], [122, 296], [490, 270]];
const [CX, CY, S] = [940, 440, 4];
const pts = POLY.map(([x, y]) => [CX + x / S, CY + y / S]);
const [x0, y0] = [Math.floor(Math.min(...pts.map((p) => p[0]))) - 2, Math.floor(Math.min(...pts.map((p) => p[1]))) - 2];
const [x1, y1] = [Math.ceil(Math.max(...pts.map((p) => p[0]))) + 2, Math.ceil(Math.max(...pts.map((p) => p[1]))) + 2];
const [w, h] = [x1 - x0, y1 - y0];
// the mask drawn at 8x, blurred, and scaled down: a clean, soft edge
const K = 8;
const poly = pts.map(([x, y]) => `${((x - x0) * K).toFixed(1)},${((y - y0) * K).toFixed(1)}`).join(" ");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * K}" height="${h * K}"><rect width="100%" height="100%" fill="#000"/><polygon points="${poly}" fill="#fff"/></svg>`;
const mask = await sharp(Buffer.from(svg)).blur(0.8 * K / 2).resize(w, h, { kernel: "lanczos3" }).greyscale().raw().toBuffer();
const { data } = await sharp(MOCK).extract({ left: x0, top: y0, width: w, height: h }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const rgba = Buffer.alloc(w * h * 4);
for (let i = 0; i < w * h; i++) {
  rgba[i * 4] = data[i * 3];
  rgba[i * 4 + 1] = data[i * 3 + 1];
  rgba[i * 4 + 2] = data[i * 3 + 2];
  rgba[i * 4 + 3] = mask[i];
}
mkdirSync(OUT, { recursive: true });
await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png().toFile(`${OUT}/monitor-stand.png`);
console.log(`monitor-stand: ${w}x${h} at ${x0},${y0}`);
