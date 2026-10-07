// Cut the Tauri Explorer page's screenshots from the raw captures, one set per
// app theme the site wears (src/components/launch/appTheme.ts). The raws come
// from scripts/capture-tauri-shots.mjs: art/raw/tauri-shots/<theme>/<scene>.png,
// a 1280x800 window at 2x (2560x1600), plus <scene>-720.png (720x460, for
// the hero: the smallest window whose quick open shows all six results, so
// the whole of it shows near its real size),
// <scene>-440.png (440x340, the hero on phones) and
// app-1440.png (the live demo's own size, for its still). Every crop
// is exported at the raw's own resolution, never upscaled, so it stays sharp
// on HiDPI screens; the regions are recorded here so the crops can be redone.
//   node scripts/shot-crops.mjs
import sharp from "sharp";

const RAW = "art/raw/tauri-shots";
const OUT = "public/tauri";
const THEMES = ["solarized", "dracula", "tokyo-night", "aurora"];

/** [name, scene, left, top, width, height] in raw pixels. Paired desktop crops are 3:2. */
const CROPS = [
  // the hero: the whole app window (a 720px window, edge to edge) with
  // quick open over it, so the app's text reads near its real size
  ["hero-quick-open", "quick-open-720", 22, 22, 1396, 876],
  // phones: the app at a phone's width (quick-open-440, 440x340), cut to
  // the palette with a thin margin of the app behind it, down to the gap between the palette's third and fourth
  // results, so no line is cut and the shot stays on a phone's first screen
  ["hero-quick-open-strip", "quick-open-440", 34, 76, 812, 324],
  // the gallery: every shot is shown at the app's real size (1 CSS px per
  // app px), so its text matches its siblings'. Search and the palette are
  // cut to their panel (x 682..1877, from y 192), inside its rounded corners,
  // ending in the gap after a whole row.
  ["crop-content-search", "content-search", 692, 204, 1176, 708],
  ["crop-command-palette", "command-palette", 692, 204, 1176, 784],
  // the graph panel's first six rows, the panel's width inside its border (it
  // spans x 422..2140 from y 194), from just under its head's rule (whose
  // "click a commit" promises what a still can't do), with the first row's
  // headroom, to the gap after a whole row; it
  // spans the gallery's last row
  ["crop-git-graph", "git-graph", 432, 286, 1696, 374],
  // phones: the panel's left side, text near its real size (~266 CSS px wide)
  ["crop-content-search-phone", "content-search", 652, 187, 648, 432],
  ["crop-command-palette-phone", "command-palette", 679, 216, 714, 476],
  ["crop-git-graph-phone", "git-graph", 432, 286, 652, 374],
];

/** the lightbox's whole window: 1600w for 1x screens, the full raw for 2x */
const FULL = ["content-search", "command-palette", "git-graph"];

for (const theme of THEMES) {
  const raw = (scene) => `${RAW}/${theme}/${scene}.png`;
  for (const [name, scene, left, top, width, height] of CROPS) {
    await sharp(raw(scene)).extract({ left, top, width, height }).webp({ quality: 88 }).toFile(`${OUT}/${name}-${theme}.webp`);
    console.log(`${name}-${theme}.webp ${width}x${height}`);
  }
  for (const scene of FULL) {
    await sharp(raw(scene)).webp({ quality: 86 }).toFile(`${OUT}/live-${scene}-${theme}@2x.webp`);
    await sharp(raw(scene)).resize({ width: 1600 }).webp({ quality: 84 }).toFile(`${OUT}/live-${scene}-${theme}.webp`);
    console.log(`live-${scene}-${theme}{,@2x}.webp`);
  }
  // the live demo's still, until the app paints: the app untouched, at the
  // size the demo renders (1440x900), so the swap to the running app is seamless
  await sharp(raw("app-1440")).resize({ width: 1440 }).webp({ quality: 84 }).toFile(`${OUT}/live-app-${theme}.webp`);
  console.log(`live-app-${theme}.webp`);
}
