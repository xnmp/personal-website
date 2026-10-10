// The torn sheet's paper with its dark flecks taken out (art/raw/paper/
// sheet-day -> sheet-day-clean), for the kit's sheets (paper.mjs `sheets`).
//   node scripts/kits/paper-speck.mjs
//
// The generation is handmade paper, and its dark seeds and short brown fibres
// (a few px long, 25-60 levels under the paper) are what the mock's paper has
// too: but the page sets type straight on this sheet (the launch and project
// pages' headline and body copy), and a fleck beside a letter reads as stray
// punctuation: a tick on an "l", an accent over "Opens" (round 10, rev 10).
// The paper's own tooth, its pale fibres and its tone stay; only what stands
// DARKER than its surroundings, by more than the tooth ever does, is replaced,
// with paper cut from a nearby part of the same sheet (so the tooth carries
// on across the patch rather than going smooth), feathered at its rim. The
// sheet's torn rim is left alone: only its interior, clear of the deckle.
import sharp from "sharp";

const SRC = "art/raw/paper/sheet-day/sheet-day.png";
const OUT = "art/raw/paper/sheet-day-clean/sheet-day-clean.png";
/** levels of lightness under the local paper that make a fleck */
const DARK = 26;
/** where the fleck is brown (red over blue stands out of the paper's), a lower bar */
const BROWN = { dark: 12, warm: 20 };
/** the donor patches, as offsets from the fleck (tried in this order) */
const DONORS = [[61, 7], [-53, 19], [11, 67], [-19, -71], [89, -37], [-97, 43]];

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const rgb = Buffer.alloc(W * H * 3);
const alpha = Buffer.alloc(W * H);
for (let i = 0; i < W * H; i++) {
  rgb[i * 3] = data[i * 4];
  rgb[i * 3 + 1] = data[i * 4 + 1];
  rgb[i * 3 + 2] = data[i * 4 + 2];
  alpha[i] = data[i * 4 + 3];
}
// (one plane back as one plane: sharp widens a grey raw to three channels on the way out)
const blurred = async (buf, ch, sigma) => {
  const { data: d, info: i } = await sharp(buf, { raw: { width: W, height: H, channels: ch } }).blur(sigma).raw().toBuffer({ resolveWithObject: true });
  if (i.channels === ch) return d;
  const plane = Buffer.alloc(W * H);
  for (let p = 0; p < W * H; p++) plane[p] = d[p * i.channels];
  return plane;
};
const around = await blurred(rgb, 3, 5);
const inner = await blurred(alpha, 1, 24); // 255 only where the sheet is solid for ~48px round
const light = (b, i) => (b[i * 3] + b[i * 3 + 1] + b[i * 3 + 2]) / 3;
const warmth = (b, i) => b[i * 3] - b[i * 3 + 2];

let hit = new Uint8Array(W * H);
let count = 0;
for (let i = 0; i < W * H; i++) {
  if (inner[i] < 250) continue;
  const d = light(around, i) - light(rgb, i);
  const w = warmth(rgb, i) - warmth(around, i);
  if (d > DARK || (d > BROWN.dark && w > BROWN.warm)) {
    hit[i] = 1;
    count++;
  }
}
// the fleck's soft rim with it: 2px round each pixel that stands out
const grown = new Uint8Array(W * H);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    if (!hit[y * W + x]) continue;
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const [px, py] = [x + dx, y + dy];
        if (px >= 0 && py >= 0 && px < W && py < H) grown[py * W + px] = 1;
      }
  }
// feathered patch: 1px blur of the mask
const mask = await blurred(Buffer.from(grown.map((v) => v * 255)), 1, 1);
const out = Buffer.from(data);
let patched = 0;
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (mask[i] < 8) continue;
    let donor = -1;
    for (const [dx, dy] of DONORS) {
      const [px, py] = [x + dx, y + dy];
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      const j = py * W + px;
      if (!grown[j] && inner[j] >= 250) {
        donor = j;
        break;
      }
    }
    if (donor < 0) continue;
    const t = mask[i] / 255;
    for (let k = 0; k < 3; k++) out[i * 4 + k] = Math.round(data[i * 4 + k] * (1 - t) + data[donor * 4 + k] * t);
    patched++;
  }
const { mkdirSync } = await import("node:fs");
mkdirSync("art/raw/paper/sheet-day-clean", { recursive: true });
await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile(OUT);
console.log(`${OUT}: ${count} fleck px, ${patched} px replaced (${((100 * patched) / (W * H)).toFixed(2)}% of the sheet)`);
