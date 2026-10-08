// Celestial Atlas (art/briefs/atlas.md): enamel plates in engraved, gilded
// brass over a great engraved star chart, gilt buttons, crimson the one
// accent, jewels in brass, gilt label strips, ivory enamel slips. Raws in
// art/raw/atlas; prompts in art/prompts/atlas.
//
// Only the day finish of the surfaces is generated. Night is the same brass
// under the lamp: the gilt graded from the day's (`gain`, LAMP), so the two
// finishes are one metal by construction; the enamel inside each frame is
// the page's (enamel-*.webp, kit.css --plate-fill), ivory by day and navy by
// night. The chart has its own layers per finish (cut from scene-day, the
// daylight plate, and scene-night, the gilt chart). One focus language: a
// band of crimson enamel laid in along the inside of the gilt (a plate's
// frame, a button's border), with a dark keyline beside it where the
// enamel is light; ivory on the crimson plate.

// lamplight on gilt: a shade down, a little warmer
const LAMP = [0.9, 0.85, 0.76];
// a label's gilt under the lamp: warmed, not darkened, so its navy holds
const LAMPLIT_LABEL = [1.0, 0.96, 0.88];
// a label strip's gilt, burnished light enough for its small navy lettering
const TAPE_GILT = [1.22, 1.2, 1.12];
// enamel, not glass: no glint, and no shade cast on it (the window's
// corners are round, the cast shade square: it would leave each corner a
// lighter patch); the gilt's own bevel sets it back
const ENAMEL = { shadeColor: "2a1d08", shadeAlpha: 0, glintAlpha: 0 };
// a button's focus band, as a plate's: crimson enamel (ivory on the crimson
// button) laid in along the enamel's edge, just inside the slim gilt bezel
// (the enamel's window opens 13 to 14 of the button's px in, its corners
// round to about 16), between keylines of `key`
const FOCUS = (key) => ["--ring=14:21", "--ring-radius=15.5", "--halo=13:14,21:23", `--halo-color=${key}`, "--crown=0.2"];

// The plates: a frame of engraved gilt round the enamel, a screw at each
// corner and a degree arc engraved beside it. The frame's rails came back
// stamped with a row of stars at an even beat, which a 9-slice stretches
// or repeats as a printed trim; the brief keeps the rails calm (the
// graduations only where an instrument has them, the corners), so the
// rails are smoothed along their length (scripts/mitre.mjs smoothRails
// `along`): the row of stars goes, the rules and mouldings that run the
// rail's length stay, and the rail, the same all along, stretches clean.
// `frame` is where the enamel begins, per side, at the 430px base: the
// frame and the focus band inside it fit the 56px corner, and so does each
// screw whole (a screw the corner cut through would stretch with the rail).
const PLATE = {
  src: "sheet-day",
  width: 430,
  frame: { t: 36, r: 34, b: 32, l: 35 },
  smoothRails: { depth: 40, size: 23, along: true },
  // the enamel's window has round corners, inside a square cut: cleared to
  // the gilt, so the page's enamel (navy by night) meets the metal
  window: true,
  // the screws are the gilt's, clear of the enamel: none pins the pane
  rivets: false,
  glass: ENAMEL,
};
// focus: the primary's crimson enamel laid in up to the gilt (following its
// inner edge round the window's corners and the arcs that reach into it,
// scripts/framed-pane.mjs fillet on a cleared window), with a keyline on its
// inner side against the pane's enamel: navy on the ivory by day, gilt on
// the navy by night (the crimson alone would barely part from the navy)
const CRIMSON_DAY = { side: "pane", width: 7, key: 2, keyColor: "13213f", color: "992229", grain: 0.3, crown: 0.14 };
const CRIMSON_NIGHT = { side: "pane", width: 7, key: 2, keyColor: "e9c97a", color: "8a1d1f", grain: 0.3, crown: 0.14 };
// the strips (masthead, shelf heads, feet, picker): the plates' own frame
// (the same art, the same gilt and engraved rules, its rails smoothed the
// same) without screws, its corners mitred from its rails (scripts/mitre.mjs
// mitre: the screws and degree arcs are the plates' alone). Printed at the
// plates' scale, so the two are one moulding; the smoothed rails stretch
// clean, as the plates' do
const STRIP = { ...PLATE, mitre: true, states: ["normal"] };

const kit = {
  raw: "atlas",
  sheet: {
    normal: ["8:14:18:0.28", "1:2:2.5:0.34"],
    // lifted toward the lamp: its shadow widens, the gilt's lit sides catch
    // the light, the enamel takes its sheen
    hover: ["18:38:30:0.6", "5:10:9:0.26"],
    pressed: ["2:4:6:0.22", "0.5:1:1.2:0.42"],
    flat: ["5:9:12:0.24", "0.5:1.5:2:0.34"],
    hoverFlags: ["--catch=0.45", "--catch-width=26", "--sheen=0.1", "--light=ffcf78"],
    // set back: the gilt drops out of the light, the enamel a shade dimmer
    // (atlas.css --plate-press-dim)
    pressedFlags: ["--catch=0.2", "--catch-width=26", "--dim=0.88"],
  },
  sheets: [
    {
      ...PLATE,
      name: "sheet-day",
      fillet: CRIMSON_DAY,
      // the lamp's pool on the enamel, at rest and lifted into it
      light: { color: "fff3d6", alpha: 0.14 },
      sheen: { color: "fff4dc", alpha: 0.32 },
    },
    {
      ...PLATE,
      name: "sheet-night",
      gain: LAMP,
      fillet: CRIMSON_NIGHT,
      hoverFlags: ["--catch=0.4", "--catch-width=26", "--sheen=0.08", "--light=ffc870"],
      light: { color: "ffd9a0", alpha: 0.1 },
      sheen: { color: "ffe2b0", alpha: 0.2 },
    },
    { ...STRIP, name: "sheet-strip-day", light: { color: "fff3d6", alpha: 0.14 } },
    { ...STRIP, name: "sheet-strip-night", gain: LAMP, light: { color: "ffd9a0", alpha: 0.1 } },
  ],
  tile: {
    normal: ["2:5:5:0.30", "0:1:1.2:0.35"],
    hover: ["7:16:9:0.56", "1:3:2:0.28"],
    pressed: ["0.5:1.5:2:0.18", "0:1:1:0.46"],
    // into the light: the bezel's lit edges catch it, warm, and the enamel
    // takes a sheen
    hoverFlags: ["--catch=0.45", "--catch-width=8", "--sheen=0.05", "--light=ffd27a"],
    // pushed down: the plate dims, its lit edges go dark
    pressedFlags: ["--catch=0.3", "--catch-width=10", "--dim=0.92"],
  },
  // The buttons are the plates' language small: a field of enamel in a slim
  // gilt bezel, the same gilt, no screws (a jewel is a status, never a
  // button's ornament). The neutral's enamel is the plates' (ivory by day,
  // navy by night, lettered navy and ivory), the primary's crimson.
  tiles: [
    { name: "tile-day", src: "tile-day", ring: "9e2b2f", focusFlags: FOCUS("13213f") },
    // (by night a gilt keyline: the crimson alone would barely part from the
    // navy; the crimson the day's, a lighter one lifted by the band's crown
    // reads as salmon)
    { name: "tile-night", src: "tile-night", gain: LAMP, ring: "9e2b2f", focusFlags: FOCUS("e9c97a") },
    // (the ivory a shade down: the band's crown lifts its middle, and the
    // ivory itself lifted reads as a stock white outline)
    { name: "tile-signal", src: "tile-signal", ring: "e2d6bb", focusFlags: FOCUS("2a0c0d") },
    { name: "tile-signal-night", src: "tile-signal", gain: LAMP, ring: "e2d6bb", focusFlags: FOCUS("1c0708") },
  ],
  // a screen behind a slim gilt bezel
  mats: [
    { name: "mat-day", src: "mat-day" },
    { name: "mat-night", src: "mat-day", gain: LAMP },
  ],
  // status markers: jewels in brass settings (clear, emerald, amber,
  // crimson); by night, under the lamp
  pins: { src: "pins", night: LAMP },
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
  // the plates' enamel, tiled by the page inside the frame: its fine
  // surface only (a broad cloud of tone would repeat from tile to tile), at
  // the brief's ivory and navy
  fills: [
    { name: "enamel-day", src: "enamel-day", size: 768, alpha: 1, highpass: 48, soften: 0.6, mean: "f1e8d2", gain: 0.85 },
    { name: "enamel-night", src: "enamel-day", size: 768, alpha: 1, highpass: 48, soften: 0.6, mean: "13213f", gain: 0.8 },
  ],
  scene: {
    finishes: ["day", "night"],
    layers: ["sky", "left", "right", "near"],
  },
};

export default kit;
