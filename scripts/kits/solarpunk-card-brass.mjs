// The home cards' brass, tempered toward the home mock's: its tube is a dull,
// olive gold with a thin pale line along its lit side (measured on
// art/originals/solarpunk.webp, medians across a card's left and top edges:
// highlight rgb 153 121 65, mid 118 87 36), where the generated frame
// (art/raw/solarpunk/card-frame) carries a blown, cream highlight (240 215
// 161) over a saturated orange. The curve pulls the lights down and a little
// toward the gold, and the whole frame a shade down, from the highlights
// down: nothing is recoloured below the mids. Writes
// art/raw/solarpunk/card-brass/card-brass.png (the kit's card sheets take it).
//   node scripts/kits/solarpunk-card-brass.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "art/raw/solarpunk/card-frame/card-frame.png";
const OUT = "art/raw/solarpunk/card-brass";
const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  if (!data[i + 3]) continue;
  const hi = smooth(110, 255, Math.max(data[i], data[i + 1], data[i + 2]));
  const f = 0.92 * (1 - 0.38 * hi);
  data[i] = Math.round(data[i] * f);
  data[i + 1] = Math.round(data[i + 1] * f);
  // the lights lose their blue as gold does: pale cream reads as orange glare
  data[i + 2] = Math.round(data[i + 2] * f * (1 - 0.25 * hi));
}
mkdirSync(OUT, { recursive: true });
await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(`${OUT}/card-brass.png`);
console.log(`card-brass: ${info.width}x${info.height}`);
