// Cut the Tauri Explorer page's screenshot crops from the raw captures
// (art/raw/tauri-shots/*.png, 2560x1600: a 1280x800 window at 2x). Every crop
// is exported at the raw's own resolution, never upscaled, so it stays sharp
// on HiDPI screens; the regions are recorded here so the crops can be redone.
//   node scripts/shot-crops.mjs
import sharp from "sharp";

const RAW = "art/raw/tauri-shots";
const OUT = "public/tauri";

/** [name, left, top, width, height] in raw pixels. Paired desktop crops are 3:2. */
const CROPS = [
  // the gallery (shown up to ~860 CSS px wide; 2x wants ~1720)
  ["crop-content-search", "content-search", 625, 170, 1320, 880],
  ["crop-command-palette", "command-palette", 625, 170, 1320, 880],
  // the graph's feature-work rows (Theme from Image .. v1.0.1), the panel's
  // full width: a strip that spans the gallery's last row
  ["crop-git-graph", "git-graph", 400, 838, 1740, 436],
  // phones: the panel's left side, text near its real size (~266 CSS px wide)
  ["crop-content-search-phone", "content-search", 652, 187, 648, 432],
  ["crop-command-palette-phone", "command-palette", 679, 216, 714, 476],
  ["crop-git-graph-phone", "git-graph", 425, 838, 667, 436],
];

/** the lightbox's whole window: 1600w for 1x screens, the full raw for 2x */
const FULL = ["content-search", "command-palette", "git-graph"];

for (const [name, raw, left, top, width, height] of CROPS) {
  await sharp(`${RAW}/${raw}.png`).extract({ left, top, width, height }).webp({ quality: 88 }).toFile(`${OUT}/${name}.webp`);
  console.log(`${name}.webp ${width}x${height}`);
}
for (const raw of FULL) {
  await sharp(`${RAW}/${raw}.png`).webp({ quality: 86 }).toFile(`${OUT}/live-${raw}@2x.webp`);
  console.log(`live-${raw}@2x.webp 2560x1600`);
}
