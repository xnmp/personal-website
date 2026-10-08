// Sumi-e Ink (art/briefs/sumi.md): hanging scrolls of kozo washi in pale
// silk mounts, washi cards ringed in dry-brush ink, lacquer beads, over a
// sumi-e landscape. Raws in art/raw/sumi; prompts in art/prompts/sumi.
//
// The art is authored lit from the upper left, so no rim is relit here. One
// focus language throughout: a band of vermilion silk laid in on the paper
// just inside the gold line (a scroll's, round its washi; a card's), with an
// ink keyline on its inner side where the paper is light.
// a card's focus band inside its gold line, and its keyline (if any)
const CARD_FOCUS = (key) => ["--ring=11.5:17", "--ring-radius=8", "--crown=0.15", ...(key ? ["--halo=17:18.4", `--halo-color=${key}`] : [])];

// By night a card came back lit evenly, a flat navy slab: its edge takes the
// moon from the upper left at rest, as the scrolls' silk does, and it casts
// a deeper shadow, which on the dark wall would otherwise not show.
const MOONLIT = ["--catch=0.6", "--catch-width=6", "--sheen=0", "--light=dfe6f0"];
const NIGHT_SHADOW = {
  normal: ["2:5:5:0.55", "0:1:1.2:0.6"],
  hover: ["4:10:5:0.7", "1:2.5:1.5:0.45"],
  pressed: ["1:2:2.5:0.45", "0:1:1:0.65"],
};

// The night silk came back a neutral grey speckle (stone, not silk): it keeps
// a trace of its celadon, and takes the moon on its upper and left edges and
// falls away on the lower and right (scripts/relight-edge.mjs), as a satin
// does, where the generated one was lit evenly.
const MOON_SILK = { gain: [0.88, 1, 0.91], shade: 0.3, lift: 0.16 };

const kit = {
  raw: "sumi",
  sheet: {
    normal: ["8:14:18:0.26", "1:2:2.5:0.32"],
    // lifted off the wall: a longer, wider, softer shadow
    hover: ["16:34:28:0.52", "4:8:8:0.22"],
    pressed: ["3:5:8:0.20", "0.5:1:1.5:0.38"],
    flat: ["5:9:12:0.22", "0.5:1.5:2:0.34"],
    // the silk and the lacquered rods catch the light; the washi takes a
    // faint sheen (-sheen.webp)
    hoverFlags: ["--catch=0.3", "--catch-width=22", "--sheen=0", "--light=fff4dc"],
    // pressed back to the wall: the mount drops out of the light
    pressedFlags: ["--catch=0.5", "--catch-width=22", "--dim=0.78"],
  },
  // Each scroll's washi is cleared for the page's own (washi-*.webp, kit.css
  // --plate-fill), so its fibres keep their scale at any size. The mount
  // (silk-wrapped rollers, their knobs, the silk, the gold line) must fit in
  // the 56px a corner keeps unstretched: at a 770px base it does, with the
  // silk as wide as it can be; `frame` is where the washi begins inside the
  // gold line, per side, at that width (the line is ruled straight; one px
  // of margin). The generator painted a soft shadow under the mounts,
  // although asked for none: `alphaFloor` clears it (the kit bakes its own).
  sheets: [
    {
      name: "sheet-day",
      src: "sheet-day",
      width: 770,
      alphaFloor: 150,
      frame: { t: 50, r: 54, b: 50, l: 54 },
      rivets: false,
      // vermilion silk laid in on the washi inside the gold line, woven like
      // the mount's (its texture mirrored from the silk beside it), with an
      // ink keyline against the light washi; the gold line stays whole
      fillet: { side: "pane", width: 12, key: 2, keyColor: "1d1d1f", color: "c8371e", weave: 6 },
      // pressed back to the wall: out of the light, the washi dims with its silk
      // the silk stands a hair proud of the washi
      glass: { dx: 1, dy: 1.5, soft: 2, shadeColor: "5a4a2e", shadeAlpha: 0.14, glintAlpha: 0 },
      light: { color: "fff8ea", alpha: 0.18 },
      sheen: { color: "fffaf0", alpha: 0.2 },
    },
    {
      name: "sheet-night",
      src: "sheet-night",
      width: 770,
      alphaFloor: 150,
      ...MOON_SILK,
      frame: { t: 51, r: 54, b: 50, l: 54 },
      rivets: false,
      // no keyline: the washi is near black
      fillet: { side: "pane", width: 12, color: "d9532e", weave: 6 },
      glass: { dx: 1, dy: 1.5, soft: 2, shadeColor: "000000", shadeAlpha: 0.3, glintAlpha: 0 },
      // moonlight, cool, from the upper left
      light: { color: "c9d3e6", alpha: 0.06 },
      sheen: { color: "dfe6f0", alpha: 0.1 },
      hoverFlags: ["--catch=0.3", "--catch-width=22", "--sheen=0", "--light=dfe6f0"],
    },
    // The strips (masthead, shelf heads, feet, picker): the same mount
    // without its rollers, so no heading outranks the scrolls it heads. Their
    // silk runs to the art's edge (kit.css --strip-fill-in). A strip runs
    // many times its art's length, so its silk is cut seamless and repeated
    // (sumi.css --strip-repeat), its corners mitred from it (scripts/mitre.mjs).
    {
      name: "sheet-strip-day",
      src: "sheet-strip-day",
      width: 680,
      alphaFloor: 150,
      frame: { t: 53, r: 41, b: 55, l: 41 },
      rivets: false,
      // printed at 0.24 on a desk (the scrolls at 0.5), 0.4 on a phone (the
      // scrolls too): a grain 1.7 times as broad sits between the two
      mitre: { tile: true, joint: 0.08, grain: 1.7 },
      states: ["normal"],
      glass: { dx: 1, dy: 1.5, soft: 2, shadeColor: "5a4a2e", shadeAlpha: 0.14, glintAlpha: 0 },
      light: { color: "fff8ea", alpha: 0.18 },
    },
    {
      name: "sheet-strip-night",
      src: "sheet-strip-night",
      width: 680,
      alphaFloor: 150,
      ...MOON_SILK,
      frame: { t: 52, r: 41, b: 53, l: 41 },
      rivets: false,
      // printed at 0.24 on a desk (the scrolls at 0.5), 0.4 on a phone (the
      // scrolls too): a grain 1.7 times as broad sits between the two
      mitre: { tile: true, joint: 0.08, grain: 1.7 },
      states: ["normal"],
      glass: { dx: 1, dy: 1.5, soft: 2, shadeColor: "000000", shadeAlpha: 0.3, glintAlpha: 0 },
      light: { color: "c9d3e6", alpha: 0.06 },
    },
  ],
  tile: {
    normal: ["2:5:5:0.30", "0:1:1.2:0.35"],
    // (the contact light: the cards' edges are soft, and a heavy contact
    // under them would thicken their silhouette)
    hover: ["4:10:5:0.46", "1:2.5:1.5:0.24"],
    pressed: ["1:2:2.5:0.22", "0:1:1:0.40"],
    // lifted toward the light: matte card, so no bevel catch, only the face
    // a little brighter from the upper left (the lift is in its shadow)
    hoverFlags: ["--catch=0.2", "--catch-width=5", "--sheen=0.12"],
    // pressed into the wall: the face dims
    pressedFlags: ["--dim=0.86"],
  },
  // The cards are matte washi with the mounts' hair-thin gold line inset
  // round them. Focus: a band of vermilion silk laid in along the inside of
  // that line, its corners as round as the line's, with an ink keyline inside
  // it where the card is light; on a vermilion card the band is cream.
  tiles: [
    { name: "tile-day", src: "tile-day", ring: "c8371e", focusFlags: CARD_FOCUS("1d1d1f") },
    { name: "tile-night", src: "tile-night", ring: "d9532e", focusFlags: CARD_FOCUS(null), lit: MOONLIT, shadow: NIGHT_SHADOW },
    { name: "tile-signal", src: "tile-signal", ring: "f3ecdc", focusFlags: CARD_FOCUS("4a1206") },
    { name: "tile-signal-night", src: "tile-signal-night", ring: "f3ecdc", focusFlags: CARD_FOCUS("4a1206"), lit: MOONLIT, shadow: NIGHT_SHADOW },
  ],
  mats: [
    { name: "mat-day", src: "mat-day" },
    { name: "mat-night", src: "mat-night" },
  ],
  pins: { src: "pins" },
  tapes: [
    { name: "tape-day", src: "tape-day" },
    { name: "tape-night", src: "tape-night" },
    // inline code: a straight-cut slip of washi
    { name: "chip-day", src: "chip-day" },
    { name: "chip-night", src: "chip-night" },
  ],
  // the scrolls' washi, tiled by the page inside the mount (grain only: a
  // broad cloud of tone would repeat from tile to tile)
  fills: [
    { name: "washi-day", src: "washi-day", size: 512, alpha: 1, highpass: 24, mean: "f3ecdc", gain: 1 },
    // the night fibres held down and softened: crisp pale strokes on near black
  // read as scratches on slate
    { name: "washi-night", src: "washi-night", size: 512, alpha: 1, highpass: 24, mean: "1e2024", gain: 0.32, soften: 0.9 },
  ],
  scene: {
    finishes: ["day", "night"],
    layers: ["sky", "far", "mid", "near", "left", "right"],
    // the sun (the moon at night) on its own, so the page can keep it whole
    // in the margin (kit.css .scene-sun): the sky painted without it, the
    // disc generated alone (the moon's glow defeats a lift from the sky)
    sun: {
      sky: { day: "sky-day-clear", night: "sky-night-clear" },
      sprites: { day: "sun-day", night: "sun-night" },
      size: 160,
      pad: 16,
      // painted into the wash, not cut and stood off it: no shadow
      shadow: ["0:0:1:0", "0:0:1:0"],
    },
    // the night layers came back lit like snow; the brief's night is dark
    // indigo washes, and the mist must meet the sky it parts to show (the
    // valley between the mid ridges) in the same tone
    gain: {
      "far-night": [0.74, 0.76, 0.8],
      "mid-night": [0.54, 0.56, 0.6],
      "near-night": [0.62, 0.64, 0.7],
      "left-night": [0.6, 0.62, 0.68],
      "right-night": [0.6, 0.62, 0.68],
    },
  },
};

export default kit;
