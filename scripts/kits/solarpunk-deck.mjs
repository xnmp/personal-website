// The laptop's keyboard deck, cut from the launch mock's own pixels
// (art/originals/solarpunk-launch.webp): the page frames the live window as
// a lid of its own (the bezel is CSS, thin as the mock's) and sets it on this
// slab of brushed aluminium, the sun lying across it in patches, on the desk
// the plate leaves bare. The polygon is the deck in mock px, read off 5x
// crops of the mock with a grid (the top face, whose back edge meets the
// lid's chin, and the front lip); its edge is feathered by 0.8px. The dark
// contact shadow under it is baked by the kit's prop shadow, not cut.
// Writes art/raw/solarpunk/laptop-deck/laptop-deck.png (the kit trims it).
//   node scripts/kits/solarpunk-deck.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const MOCK = "art/originals/solarpunk-launch.webp";
const OUT = "art/raw/solarpunk/laptop-deck";
// back-left, front-left (top and bottom of the lip), front-right (bottom and
// top), back-right: the top face widens toward the viewer
const pts = [[770, 602.5], [729, 619], [729, 630.5], [1597.5, 630.5], [1600, 621], [1573, 602.5]];
const [x0, y0] = [Math.floor(Math.min(...pts.map((p) => p[0]))) - 2, Math.floor(Math.min(...pts.map((p) => p[1]))) - 2];
const [x1, y1] = [Math.ceil(Math.max(...pts.map((p) => p[0]))) + 2, Math.ceil(Math.max(...pts.map((p) => p[1]))) + 2];
const [w, h] = [x1 - x0, y1 - y0];
// the mask drawn at 8x, blurred, and scaled down: a clean, soft edge
const K = 8;
const poly = pts.map(([x, y]) => `${((x - x0) * K).toFixed(1)},${((y - y0) * K).toFixed(1)}`).join(" ");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * K}" height="${h * K}"><rect width="100%" height="100%" fill="#000"/><polygon points="${poly}" fill="#fff"/></svg>`;
const mask = await sharp(Buffer.from(svg)).blur((0.8 * K) / 2).resize(w, h, { kernel: "lanczos3" }).greyscale().raw().toBuffer();
const { data } = await sharp(MOCK).extract({ left: x0, top: y0, width: w, height: h }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const rgba = Buffer.alloc(w * h * 4);
for (let i = 0; i < w * h; i++) {
  rgba[i * 4] = data[i * 3];
  rgba[i * 4 + 1] = data[i * 3 + 1];
  rgba[i * 4 + 2] = data[i * 3 + 2];
  rgba[i * 4 + 3] = mask[i];
}
mkdirSync(OUT, { recursive: true });
await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png().toFile(`${OUT}/laptop-deck.png`);
console.log(`laptop-deck: ${w}x${h} at ${x0},${y0}`);
