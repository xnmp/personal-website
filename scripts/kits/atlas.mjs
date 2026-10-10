// Celestial Atlas (art/briefs/atlas.md): a plate of an antique celestial
// atlas, gold engraved on deep navy by night, on a pale day sky by day. Every
// surface wears the mock's frame: a fine double rule of gold leaf with a
// scroll flourish in each corner round a field the page paints (navy by
// night, ivory by day); a screen sits in a single fine rule with a small
// scroll at each corner; the buttons are a plate of gold leaf (the primary)
// or the field in two fine gold rules, the inner one notched. Raws in
// art/raw/atlas: generated from art/prompts/atlas/*.txt, or derived from the
// mock and the generated plates by art/prompts/atlas/derive.mjs (the page's
// border, the quiet sky, the leaf, the neutral buttons, the plates laid in
// their bleed).
//
// The gilt is one metal in both finishes: each frame is generated once and
// graded for each, a shade warmer under the lamp by night (`gain`, LAMP), a
// deeper gilt by day (DAY_GILT), as the day plate's engraving is. The scene
// is the original mock with the page painted out (plate-night), its border
// and compass rose taken out too (layer-sky-night: both must hold against
// the page at any aspect, which a plate fitted to cover cannot), and the same
// scene by day, an edit of it, so the two register (layer-sky-day). The
// border and the compass are sprites of their own (props), the moon too
// (scene.sun). One focus language: a band laid in along the inside of the
// gilt, bright gold on the navy by night, bronze on the ivory by day, with a
// keyline of the field beside it.

// lamplight on gilt: a hair warmer, never darker (the mock's gold is bright
// on the navy)
const LAMP = [1.0, 0.97, 0.9];
// the gilt printed by day: the day plate's engraving came back a deeper
// bronze-gold (#9a7430), and bright leaf on the pale sky would read pale
const DAY_GILT = [0.78, 0.72, 0.6];
// the stars by night: the day's bronze gilt (#9a7430) lifted to the leaf the
// chart's stars are on the navy (#f0cf86)
const STAR_NIGHT = [240 / 154, 207 / 116, 134 / 48];
// the compass by day: the brand's mark, small on the palest of the sky
const COMPASS_DAY = [0.58, 0.5, 0.38];
// a label's gilt under the lamp: warmed, not darkened, so its navy holds
const LAMPLIT_LABEL = [1.0, 0.96, 0.88];
// a label strip's gilt, burnished light enough for its small navy lettering
const TAPE_GILT = [1.22, 1.2, 1.12];
// the field is the page's, not glass: no glint and no shade cast on it
const FIELD = { shadeColor: "2a1d08", shadeAlpha: 0, glintAlpha: 0 };
// the primary's focus band: laid in just inside its hairline rule (the rule
// sits 17 to 19 of the button's 120px in; its corners curled), between
// keylines of `key`
const FOCUS = (key) => ["--ring=21:25", "--ring-radius=4", "--halo=20:21,25:26.5", `--halo-color=${key}`, "--crown=0.15"];

// The frame: the mock's card frame, a fine double rule and a scroll flourish
// tucked into each corner inside the rules, the rails plain between. The
// generation (sheet-day: chunky bevelled leaf, a bright flat yellow) is worn
// to the mock's (sheet-fine, art/prompts/atlas/derive.mjs frames): its bevels
// dropped, its rules and scrolls thinned, the leaf antique gold, broken in
// flecks. Based at 450px the flourish reaches 53px in, inside the 56px corner
// a 9-slice keeps whole, and the inner rule ends 11px in: the field the page
// paints begins there (and, under the rules, at the outer rule: kit.css
// --plate-fill-in). Its rails are not smoothed along their length: the wear
// is the point, and a 9-slice stretches it only by the card's width.
const PLATE = {
  src: "sheet-fine",
  width: 450,
  frame: { t: 11, r: 11, b: 11, l: 11 },
  // the art is clear inside its rules already; marking it cleared keeps every
  // flourish reaching into the field as frame, in every state
  window: true,
  rivets: false,
  glass: FIELD,
};
// focus: a band laid in up to the gilt (following the inner rule and round
// the flourishes, scripts/framed-pane.mjs fillet on a cleared window), with a
// keyline of the field on its inner side, so it parts from the field it lies
// on: bronze on the ivory by day, bright gold on the navy by night
// (The night's band is the lamplit gilt's own hue (the rules are amber,
// 250,193,93), a shade deeper, with no grain, so the gilt reads on it by its
// light, as the day's bronze band does. The rules are 2px wide and the band
// lies against them: lossy WebP shares one chroma sample over 2x2 px, so a
// band paler or greyer than the gilt (the mock's champagne f0d48c) desaturates
// the rules it touches, and the grain, read off the cleared window's colours,
// brightens the band along the metal's edge and rings into them. The normal's
// gilt then comes back recoloured in the focus, though both hold the same
// pixels there as drawn (check-kit.mjs, "adds to the sheet").)
const BAND_DAY = { side: "pane", width: 6, key: 2, keyColor: "13213f", color: "7a5718", grain: 0.2, crown: 0.12 };
const BAND_NIGHT = { side: "pane", width: 6, key: 2, keyColor: "0b1626", color: "c89a48", grain: 0, crown: 0.12 };
// the strips (the running head, shelf heads, feet, picker): the same frame,
// its flourishes and all, printed smaller (kit.css: a strip's --plate-k), so
// a strip carries the corner devices every other panel does
const STRIP = { ...PLATE, states: ["normal"] };
// the neutral button's focus band, laid in clear of its inner rule (the rule
// 12 to 14.6 of the button's 120px in, its corners cut 10px deep:
// art/prompts/atlas/derive.mjs tiles), between keylines of `key`
const FOCUS_FINE = (key) => ["--ring=18:22", "--ring-radius=3", "--halo=17:18,22:23.5", `--halo-color=${key}`, "--crown=0.15"];
// no shadow: an engraved line lies in the paper
const ENGRAVED = ["0:0:1:0", "0:0:1:0"];

const kit = {
  raw: "atlas",
  sheet: {
    // a frame of fine rules casts only a faint shadow of them on the field
    // and the sky
    normal: ["2:4:6:0.30", "0.5:1:1.5:0.40"],
    // lifted toward the lamp: its shadow widens, the gilt's lit sides catch
    // the light
    hover: ["6:12:12:0.42", "1:2:3:0.40"],
    pressed: ["1:2:3:0.24", "0.5:1:1:0.42"],
    flat: ["2:4:6:0.26", "0.5:1:1.5:0.36"],
    hoverFlags: ["--catch=0.4", "--catch-width=6", "--sheen=0.06", "--light=ffd98a"],
    // set back: the gilt drops out of the light, the field a shade dimmer
    // (atlas.css --plate-press-dim)
    pressedFlags: ["--catch=0.2", "--catch-width=6", "--dim=0.9"],
  },
  sheets: [
    {
      ...PLATE,
      name: "sheet-day",
      gain: DAY_GILT,
      fillet: BAND_DAY,
      light: { color: "fff3d6", alpha: 0.12 },
      sheen: { color: "fff4dc", alpha: 0.24 },
    },
    {
      ...PLATE,
      name: "sheet-night",
      gain: LAMP,
      fillet: BAND_NIGHT,
      light: { color: "ffd9a0", alpha: 0.06 },
      sheen: { color: "ffe2b0", alpha: 0.12 },
    },
    { ...STRIP, name: "sheet-strip-day", gain: DAY_GILT, light: { color: "fff3d6", alpha: 0.12 } },
    { ...STRIP, name: "sheet-strip-night", gain: LAMP, light: { color: "ffd9a0", alpha: 0.06 } },
  ],
  // a button casts a soft shade only: the mock's have no hard line under them
  tile: {
    normal: ["0:2:5:0.26", "0:0:1:0"],
    hover: ["1:5:8:0.34", "0:0:1:0"],
    pressed: ["0:1:2:0.2", "0:0:1:0"],
    // into the light: the gilt's lit edges catch it, warm
    hoverFlags: ["--catch=0.4", "--catch-width=6", "--sheen=0.05", "--light=ffd98a"],
    // pushed down: the plate dims, its lit edges go dark
    pressedFlags: ["--catch=0.3", "--catch-width=8", "--dim=0.92"],
  },
  // The buttons, chamfered as the mock's: the primary a plate of weathered
  // parchment-gold leaf in a bright gilt rule, a dark rule and a hairline
  // one; the neutral the field (navy by night, ivory by day) in two fine gold
  // rules (derive.mjs tiles, drawn on clear, so nothing shows round their
  // corners). No screws or jewels: a jewel is a status, never a button's
  // ornament.
  tiles: [
    { name: "tile-day", src: "tile-day-fine", ring: "7a5718", focusFlags: FOCUS_FINE("f3ead6") },
    { name: "tile-night", src: "tile-night-fine", ring: "f0d48c", focusFlags: FOCUS_FINE("0d1a2c") },
    { name: "tile-signal", src: "tile-signal-fine", ring: "13213f", focusFlags: FOCUS("f0d48c") },
    // (the leaf is toned to the mock's plate in derive.mjs: no lamp's gain
    // on it, which took the plate's blue 10 under the mock's)
    { name: "tile-signal-night", src: "tile-signal-fine", ring: "13213f", focusFlags: FOCUS("f0d48c") },
  ],
  // a screen in the double gilt rule the cards' frames have, a scroll at each
  // corner over the screen's own (atlas.css slices the corners whole): the
  // sheet's worn frame (sheet-fine), so the picture on a project's page is
  // framed as the cards' are (the generated single rule, mat-fine, wore to a
  // dashed line)
  mats: [
    { name: "mat-day", src: "sheet-fine", gain: DAY_GILT, shadow: ["1:2:3:0.30", "0:1:1:0.36"] },
    { name: "mat-night", src: "sheet-fine", gain: LAMP, shadow: ["1:2:3:0.36", "0:1:1:0.40"] },
  ],
  // status markers: jewels in brass settings (clear, emerald, amber,
  // crimson); by night, under the lamp
  // the status markers are the chart's four-point stars (derive.mjs stars),
  // printed flat on the plate, so they cast nothing
  pins: { src: "pins-star", night: STAR_NIGHT, shadow: ENGRAVED },
  tapes: [
    // labels engraved on a narrow gilt strip, filled with deep navy: the
    // strip's gilt burnished a shade lighter than the frames' (the strip
    // came back a mid brass, 3.8:1 under navy), to 4.8:1 on its mean; under
    // the lamp the strip warms, but keeps its light
    { name: "tape-day", src: "tape-day", gain: TAPE_GILT },
    { name: "tape-night", src: "tape-day", gain: TAPE_GILT.map((g, i) => g * LAMPLIT_LABEL[i]) },
    // inline code on a slip of ivory enamel
    { name: "chip-day", src: "chip-day" },
    { name: "chip-night", src: "chip-day", gain: 0.9 },
  ],
  // the field inside the frames, tiled by the page: its fine surface only (a
  // broad cloud of tone would repeat from tile to tile), at the mock's navy
  // (the cards' field, a shade under the sky) and the day's ivory
  fills: [
    { name: "enamel-day", src: "enamel-day", size: 768, alpha: 1, highpass: 48, soften: 0.6, mean: "f3ead6", gain: 0.6 },
    { name: "enamel-night", src: "enamel-day", size: 768, alpha: 1, highpass: 48, soften: 0.6, mean: "0a1727", gain: 1.9 },
    // the headline's gold leaf (atlas.css .launchpad-title), the gold
    // button's mottled face: pale champagne by night (measured on the mock's
    // letters: 230,201,133 on average, lit px 254,237,170, its mottle 65 of
    // luma wide), and a deep gilt by day, which holds on the pale sky
    { name: "foil-night", src: "foil", size: 512, alpha: 1, highpass: 96, mean: "eec87e", gain: 3.1 },
    { name: "foil-day", src: "foil", size: 512, alpha: 1, highpass: 96, mean: "6e4f1c", gain: 1.2 },
  ],
  props: [
    // the page's border, round the viewport (atlas.css body::before): the
    // mock's own px, cut out of it (derive.mjs frame), from 4px in: a 9-slice
    // of 152px corners (the scrolls, the hubs and the junction under the nav's
    // rule whole) and the mock's own runs of its edges between them, at the
    // mock's own size, so at 1672x941 it prints 1:1 as the mock has it and on
    // any other shape it is the same border lengthened
    { name: "page-frame", srcs: [{ src: "page-frame-engraved" }], resize: { width: 1664 }, pad: 0, shadow: ENGRAVED },
    // the compass rose, the brand's mark (atlas.css .masthead .brand .led):
    // the mock's thin-line rose, drawn (derive.mjs compass)
    { name: "compass", srcs: [{ src: "compass-line" }], resize: { width: 320 }, pad: 6, shadow: ["1:2:3:0.40", "0:1:1:0.40"] },
    // by day both in the plate's deeper gilt (DAY_GILT), so they read on the
    // pale sky as its engraving does; the compass a shade deeper again
    // (COMPASS_DAY), as a mark of its size must hold on the palest sky
    { name: "page-frame-day", srcs: [{ src: "page-frame-engraved", gain: DAY_GILT }], resize: { width: 1664 }, pad: 0, shadow: ENGRAVED },
    { name: "compass-day", srcs: [{ src: "compass-line", gain: COMPASS_DAY }], resize: { width: 320 }, pad: 6, shadow: ["1:1:2:0.30", "0:1:1:0.30"] },
    // the border's lower corners: the quarter-dials, the mock's own px at its
    // size (derive.mjs dials), pinned to the viewport's corners (atlas.css
    // body::after) with the frame they belong to; the plate has none of them
    { name: "dial-bl", srcs: [{ src: "page-dial-bl" }], resize: { width: 184 }, pad: 0, shadow: ENGRAVED },
    { name: "dial-br", srcs: [{ src: "page-dial-br" }], resize: { width: 188 }, pad: 0, shadow: ENGRAVED },
    { name: "dial-bl-day", srcs: [{ src: "page-dial-bl", gain: DAY_GILT }], resize: { width: 184 }, pad: 0, shadow: ENGRAVED },
    { name: "dial-br-day", srcs: [{ src: "page-dial-br", gain: DAY_GILT }], resize: { width: 188 }, pad: 0, shadow: ENGRAVED },
    // The plate (sky-*-plate, derive.mjs bleed) at its own size, 2312 px for
    // its 2312 mock px, as a prop of its own: the scene's sky layer is
    // resampled to 1.15x and encoded at quality 78 without smart chroma
    // subsampling (scripts/build-kit.mjs), which smears the chart's thin gilt
    // lines to a pale tan fringed pink and green (every arc looks printed
    // twice) and softens the dome; a prop is encoded at 90 with it. atlas.css
    // names these as --k-sky.
    { name: "sky-plate-night", srcs: [{ src: "sky-night-plate" }], resize: { width: 2312 }, pad: 0, shadow: ENGRAVED },
    { name: "sky-plate-day", srcs: [{ src: "sky-day-plate" }], resize: { width: 2312 }, pad: 0, shadow: ENGRAVED },
    // the sky quieted (derive.mjs quiet), shown behind the words on the
    // scene (atlas.css, the quiet field): the plate's core alone, in its
    // frame, hung where the plate hangs its core (the words always stand
    // on the core)
    // the mat under a card's picture (atlas.css .card .screen-face): the
    // card's field strewn with gold dust and small marks, a seamless tile
    // (derive.mjs mat)
    { name: "card-mat-night", srcs: [{ src: "card-mat-night" }], resize: { width: 640, height: 640, fit: "fill" }, pad: 0, shadow: ENGRAVED },
    { name: "card-mat-day", srcs: [{ src: "card-mat-day" }], resize: { width: 640, height: 640, fit: "fill" }, pad: 0, shadow: ENGRAVED },
    { name: "sky-quiet-night", srcs: [{ src: "sky-quiet-night" }], resize: { width: 1920, height: 1080, fit: "fill" }, pad: 0, shadow: ENGRAVED },
    { name: "sky-quiet-day", srcs: [{ src: "sky-quiet-day" }], resize: { width: 1920, height: 1080, fit: "fill" }, pad: 0, shadow: ENGRAVED },
  ],
  // The scene is the plate alone, but for its moon. Fitted to cover, the
  // plate drifts against the page at another aspect than the mock's (at 2:1
  // its top is cropped by a tenth, which put the moon behind the nav), so
  // the moon hangs on its own (kit.css .scene-sun), placed on the stage
  // where the mock has it (atlas.css --sun-x/-y/-d): the plates are painted
  // without it (layer-sky-*-clear, edits of the plates) and the moon by
  // night and by day is drawn alone (moon-*). A moon casts no shadow on the
  // sky. The plates are painted on past the mock's sides and foot, 320 mock
  // px (sky-*-bleed, the core pasted back: derive.mjs bleed), so on a
  // desktop kit.css registers the plate to the stage.
  scene: {
    finishes: ["day", "night"],
    layers: ["sky"],
    bleed: { x: 320, bottom: 320 },
    sun: {
      // (the core by night with its lower left dial taken back crisp:
      // derive.mjs sky)
      sky: { night: "sky-night-plate", day: "sky-day-plate" },
      // (the night's moon from the mock's own px, its bloom the sprite's
      // alpha: derive.mjs moon)
      sprites: { night: "moon-night-mock", day: "moon-day" },
      size: 384,
      pad: 4,
      shadow: ["0:0:1:0", "0:0:1:0"],
    },
  },
};

export default kit;
