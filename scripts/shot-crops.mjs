// Cut the Tauri Explorer page's screenshots from the raw captures, one set per
// app theme the site wears (src/components/launch/appTheme.ts). The raws come
// from scripts/capture-tauri-shots.mjs: art/raw/tauri-shots/<theme>/<scene>.png,
// a 1280x800 window at 2x (2560x1600), plus <scene>-720.png (720x460, for
// the hero: the smallest window whose quick open shows all six results, so
// the whole of it shows near its real size),
// <scene>-440.png (440x340, the hero on phones) and
// app-1440.png (the live demo's own size, for its still), and
// quick-open-full-880.png (an 880x645 window at 3x, zoomed, the Paper
// Diorama launch window). Every crop is exported at the raw's own resolution,
// never upscaled, so it stays sharp on HiDPI screens; the regions are recorded
// here so the crops can be redone.
//   node scripts/shot-crops.mjs
// CROPS=a,b cuts only those images (by name, without the theme), e.g.
// CROPS=hero-quick-open-wide.
import sharp from "sharp";

const RAW = "art/raw/tauri-shots";
const OUT = "public/tauri";
const THEMES = ["solarized", "dracula", "tokyo-night", "aurora"];

/**
 * [name, scene, left, top, width, height, options?] in raw pixels. Paired
 * desktop crops are 3:2. The options are { width, webp }: resize to that width
 * and encode with those webp options, in place of the default (the raw's own
 * resolution, quality 88).
 */
const CROPS = [
  // the hero: the whole app window (a 720px window, edge to edge) with
  // quick open over it, so the app's text reads near its real size
  ["hero-quick-open", "quick-open-720", 22, 22, 1396, 876],
  // the Paper Diorama launch window (art/briefs/paper.md, device 7 of the
  // launch page): Tauri Explorer with quick open over it, as the mock's window
  // shows it: the app at the mock's scale and proportions (736 x 530, 1.39:1,
  // ~31px rows), crisp round a palette 54% of its width, a light dim and no
  // blur behind it. The hero above is a 720px window, in which quick open's
  // 600px palette fills 86% of the width and the app is a blurred margin
  // round it; a style cannot resize a palette inside a picture. So this is
  // the web build captured zoomed and staged (quick-open-full-880, see the
  // scene in capture-tauri-shots.mjs: 880x645 at 3x, its window 840 x 605 CSS
  // px at (20, 20), 2520 x 1815 raw at (60, 60)). Cut to the page's frame
  // (globals.css `.launch-shot .screen-face`, paper.css gives it this shape),
  // inside the window's own edge (20 raw px, ~7 CSS, which clears its 16 CSS px
  // rounded corners and its 1px border) so the gutter round it and the
  // corners stay out of the picture: 2480 x 1775 at (80, 80). Resized to 1800
  // wide (the window is ~845 css px across at the widest stage).
  ["hero-quick-open-wide", "quick-open-full-880", 80, 80, 2480, 1775, { width: 1800, webp: { quality: 82, smartSubsample: true } }],
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

const only = process.env.CROPS?.split(",");
const wanted = (name) => !only || only.includes(name);

for (const theme of THEMES) {
  const raw = (scene) => `${RAW}/${theme}/${scene}.png`;
  for (const [name, scene, left, top, width, height, options] of CROPS.filter(([name]) => wanted(name))) {
    const cut = sharp(raw(scene)).extract({ left, top, width, height });
    const out = await (options ? cut.resize({ width: options.width }) : cut).webp(options?.webp ?? { quality: 88 }).toFile(`${OUT}/${name}-${theme}.webp`);
    console.log(`${name}-${theme}.webp ${out.width}x${out.height}`);
  }
  for (const scene of FULL.filter((scene) => wanted(`live-${scene}`))) {
    await sharp(raw(scene)).webp({ quality: 86 }).toFile(`${OUT}/live-${scene}-${theme}@2x.webp`);
    await sharp(raw(scene)).resize({ width: 1600 }).webp({ quality: 84 }).toFile(`${OUT}/live-${scene}-${theme}.webp`);
    console.log(`live-${scene}-${theme}{,@2x}.webp`);
  }
  // the live demo's still, until the app paints: the app untouched, at the
  // size the demo renders (1440x900), so the swap to the running app is seamless
  if (wanted("live-app")) {
    await sharp(raw("app-1440")).resize({ width: 1440 }).webp({ quality: 84 }).toFile(`${OUT}/live-app-${theme}.webp`);
    console.log(`live-app-${theme}.webp`);
  }
}
