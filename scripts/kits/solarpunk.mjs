// Solarpunk (art/briefs/solarpunk.md): frosted glass panes in riveted brass,
// enamel-and-brass plates and studs, in a golden-hour glasshouse. Raws in
// art/raw/solarpunk; prompts in art/prompts/solarpunk.
//
// The brass is authored lit from the upper left, so no rim is relit here.
// One focus language throughout: a strip of marigold enamel laid in along
// the inside of a frame (the sheets' brass, the plates' bezels).
// a tile's focus strip on its bezel lip, between keylines of `key`
const FOCUS = (key) => ["--ring=10.2:17", "--ring-radius=12", "--halo=8:10.2,17:18.6", `--halo-color=${key}`, "--crown=0.3"];

const kit = {
  raw: "solarpunk",
  sheet: {
    normal: ["8:14:18:0.26", "1:2:2.5:0.32"],
    hover: ["18:38:30:0.62", "5:10:9:0.26"],
    pressed: ["2:4:6:0.20", "0.5:1:1.2:0.42"],
    flat: ["5:9:12:0.22", "0.5:1.5:2:0.34"],
    // lifted into the low sun: the frame's lit sides catch it, the pane
    // takes its sheen (-sheen.webp)
    hoverFlags: ["--catch=1", "--catch-width=30", "--sheen=0.14", "--light=ffc25c"],
    // pressed flat: the frame drops out of the light (still brass: a deep
    // shade, not a grey one)
    pressedFlags: ["--catch=0.45", "--catch-width=30", "--dim=0.8"],
  },
  // Each pane is cleared for the page's frost (frost-*.webp, kit.css
  // --plate-fill); `frame` is where its glass begins, per side, measured on
  // the 1000px base (the frame's inner edge wanders a pixel or two; this is
  // its 95th percentile, so the cut never bites the brass).
  sheets: [
    {
      name: "sheet-day",
      src: "sheet-day",
      under: "de8a2c",
      frame: { t: 30, r: 29, b: 28, l: 30 },
      fillet: { width: 14, key: 3, color: "c8701e", keyColor: "3d2408" },
      glass: { shadeColor: "3b2a10", shadeAlpha: 0.42, glintColor: "fff6e0", glintAlpha: 0.75, glintWidth: 6 },
      // the low sun's pool on the pane, at rest and lifted into it, and the
      // reflection that says glass
      light: { color: "ffe6a8", alpha: 0.3, streak: 0.12 },
      sheen: { color: "fff0c8", alpha: 0.6 },
    },
    {
      name: "sheet-night",
      src: "sheet-night",
      under: "c9792a",
      frame: { t: 29, r: 33, b: 34, l: 32 },
      fillet: { width: 14, key: 3, color: "ec8a24", keyColor: "120a03" },
      // the glint is the lanterns', warm, like every light the brass takes
      glass: { shadeColor: "050302", shadeAlpha: 0.55, glintColor: "ffd59a", glintAlpha: 0.45, glintWidth: 5 },
      // the moon's pool on the pane, cool, from the upper left, and its
      // reflection across the glass
      light: { color: "c9d6e8", alpha: 0.14, streak: 0.1 },
      sheen: { color: "ffe2b0", alpha: 0.3 },
    },
    // The strips (masthead, shelf heads, feet, picker): the same glazing
    // without the corner rivets, so a heading never outranks the content.
    // With no rivet over its corners, a strip's corners are cut from its
    // rails as a joiner would (scripts/mitre.mjs).
    {
      name: "sheet-strip-day",
      src: "sheet-strip-day",
      frame: { t: 32, r: 33, b: 35, l: 33 },
      rivets: false,
      mitre: { joint: 0.15 },
      states: ["normal"],
      glass: { shadeColor: "3b2a10", shadeAlpha: 0.42, glintColor: "fff6e0", glintAlpha: 0.75, glintWidth: 6 },
      light: { color: "ffe6a8", alpha: 0.3, streak: 0.12 },
    },
    {
      name: "sheet-strip-night",
      src: "sheet-strip-night",
      frame: { t: 31, r: 36, b: 37, l: 37 },
      rivets: false,
      mitre: { joint: 0.15 },
      states: ["normal"],
      glass: { shadeColor: "050302", shadeAlpha: 0.55, glintColor: "ffd59a", glintAlpha: 0.45, glintWidth: 5 },
      light: { color: "c9d6e8", alpha: 0.14, streak: 0.1 },
    },
  ],
  tile: {
    normal: ["2:5:5:0.30", "0:1:1.2:0.35"],
    // the plates' dark brass foot already reads as contact, so the lifted
    // contact line is lighter than the paper's
    hover: ["7:16:9:0.6", "1:3:2:0.28"],
    pressed: ["0.5:1.5:2:0.18", "0:1:1:0.46"],
    // into the light: the bezel's lit sides catch it and the enamel takes a
    // sheen from the upper left
    hoverFlags: ["--catch=1", "--catch-width=12", "--sheen=0.5", "--light=ffcf78"],
    // pushed down into the panel: the enamel dims, the lit bevels go dark
    pressedFlags: ["--catch=0.9", "--catch-width=12", "--dim=0.86"],
  },
  // focus: a strip of enamel laid in on the bezel's lip, round the face,
  // its corners as round as the bezel's (not the silhouette's offset, which
  // comes out square), between two dark keylines, so it holds against the
  // brass outside it and the face inside it. Marigold on the cream plate.
  // Where marigold would vanish it is cream enamel (the neutral plate's): on
  // a marigold plate, and by night on the moss one, where the lamplit brass
  // beside it is as bright and as yellow as marigold. The face keeps its
  // own gloss.
  tiles: [
    { name: "tile-day", src: "tile-day", ring: "de8a2c", focusFlags: FOCUS("2a1804") },
    { name: "tile-night", src: "tile-night", ring: "fbf1d8", focusFlags: FOCUS("0d0802") },
    { name: "tile-signal", src: "tile-signal", ring: "fbf1d8", focusFlags: FOCUS("2a1804") },
    { name: "tile-signal-night", src: "tile-signal-night", ring: "fbf1d8", focusFlags: FOCUS("2a1804") },
  ],
  // a screen's bezel is a lesser mount than its pane's frame: the same brass
  // (its hue kept: a greener or browner one reads as a third metal) and slim,
  // its flat face narrowed between its lip and its window's bevel (`slim`,
  // on the 1200px base), so the frame leads at every size a mount is printed
  // (each component sets its own --mat-k: a scale would shrink the bevel)
  mats: [
    { name: "mat-day", src: "mat-day", slim: { at: 30, cut: 48 } },
    { name: "mat-night", src: "mat-night", slim: { at: 30, cut: 48 } },
  ],
  pins: { src: "pins" },
  tapes: [
    // a label's plate has no screws: a kicker that wraps stretches the
    // plate's ends (a 3-slice), and a screw would stretch into a capsule
    { name: "tape-day", src: "tape-plain-day" },
    { name: "tape-night", src: "tape-plain-night" },
    // inline code is etched into the glass (a plate in a line of prose
    // reads as brackets round it); at night a shade deeper, for the cream ink
    { name: "chip-day", src: "chip-day" },
    { name: "chip-night", src: "chip-night", gain: 0.8 },
  ],
  // the panes' glass, tiled by the page under a backdrop blur
  // (grain only: the light across a pane is its -light pool, not the tile)
  // (a fine grain: a broad mottle reads as plaster or slate, not frost; thin
  // enough that the lit house glows through it, blurred, by day as by night)
  fills: [
    { name: "frost-day", src: "frost-day", size: 512, alpha: 0.7, highpass: 10, mean: "dde3cf", gain: 1.1 },
    // by night thinner still and its grain softened, so the lanterns and the
    // lit beds behind a pane bloom through it (denser, it reads as slate)
    { name: "frost-night", src: "frost-night", size: 512, alpha: 0.56, highpass: 10, soften: 0.8, mean: "1f2e28", gain: 0.7 },
  ],
  scene: {
    finishes: ["day", "night"],
    layers: ["sky", "mid", "near", "left", "right"],
  },
};

export default kit;
