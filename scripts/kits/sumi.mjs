// Sumi-e Ink (art/briefs/sumi.md): hanging scrolls of kozo washi in pale
// silk mounts (the flagship's in navy brocade), bands of torn washi, washi
// cards ringed in dry-brush ink and vermilion seal-stamps, round seals, ink
// brush swashes, over a sumi-e landscape inscribed in its corners. Raws in
// art/raw/sumi; prompts in art/prompts/sumi.
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

// a band of torn washi: no line round it, its paper the page's (above)
const BAND = {
  width: 900,
  alphaFloor: 0,
  rivets: false,
  feather: 6,
  tileRails: { sides: ["t", "r", "b", "l"], overlap: 32 },
  states: ["normal"],
  // paper laid flat on the paper of the painting: a close, soft shadow
  normal: ["2:4:6:0.16", "0.5:1:1.5:0.2"],
  glass: { dx: 0, dy: 0, soft: 1, shadeColor: "000000", shadeAlpha: 0, glintAlpha: 0 },
};

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
    // The flagship's mount: the same scroll (brocade-day is an edit of
    // sheet-day's art, its geometry kept) in navy brocade woven with gold
    // clouds and waves. By night it is graded as the silk is.
    {
      name: "sheet-brocade-day",
      src: "brocade-day",
      width: 770,
      alphaFloor: 150,
      frame: { t: 50, r: 54, b: 50, l: 54 },
      rivets: false,
      fillet: { side: "pane", width: 12, key: 2, keyColor: "1d1d1f", color: "c8371e", weave: 6 },
      glass: { dx: 1, dy: 1.5, soft: 2, shadeColor: "1a1f30", shadeAlpha: 0.2, glintAlpha: 0 },
      light: { color: "fff8ea", alpha: 0.18 },
      sheen: { color: "fffaf0", alpha: 0.2 },
      hoverFlags: ["--catch=0.35", "--catch-width=22", "--sheen=0", "--light=fff4dc"],
    },
    {
      name: "sheet-brocade-night",
      src: "brocade-day",
      width: 770,
      alphaFloor: 150,
      gain: [0.6, 0.64, 0.74],
      shade: 0.3,
      lift: 0.16,
      frame: { t: 50, r: 54, b: 50, l: 54 },
      rivets: false,
      fillet: { side: "pane", width: 12, color: "d9532e", weave: 6 },
      glass: { dx: 1, dy: 1.5, soft: 2, shadeColor: "000000", shadeAlpha: 0.3, glintAlpha: 0 },
      light: { color: "c9d3e6", alpha: 0.06 },
      sheen: { color: "dfe6f0", alpha: 0.1 },
      hoverFlags: ["--catch=0.3", "--catch-width=22", "--sheen=0", "--light=dfe6f0"],
    },
    // The bands (masthead, shelf heads, feet, picker): a strip of washi
    // torn along every edge, laid on the scene. Its washi is cleared for the
    // page's (as the scrolls' is), so `frame` is where solid paper begins
    // past the deepest bite on each side (measured on the base), the art
    // handing over to the page's paper over `feather` px; sumi.css starts
    // the page's paper no nearer the edge than the deepest bite
    // (--strip-fill-in), so a bite shows the scene, never the fill. The
    // torn edges repeat along a band (--strip-repeat: round), cut seamless.
    { name: "sheet-strip-day", src: "strip-day", gain: [1.034, 1.054, 1.058], frame: { t: 18, r: 14, b: 16, l: 14 }, ...BAND },
    { name: "sheet-strip-night", src: "strip-night", gain: [0.65, 0.71, 0.77], frame: { t: 20, r: 14, b: 17, l: 18 }, ...BAND },
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
  // The secondary button: a slip of washi card in a thin, dry sumi-brush
  // border (gofun white by night). Focus: a band of vermilion silk laid in
  // along the inside of the border, with an ink keyline inside it where the
  // card is light. The primary: a vermilion seal-stamp impression, its edge
  // broken and grainy, its focus band cream; by night the same stamp under
  // the moon.
  tiles: [
    { name: "tile-day", src: "tile-brush-day", ring: "c8371e", focusFlags: CARD_FOCUS("1d1d1f") },
    { name: "tile-night", src: "tile-brush-night", ring: "d9532e", focusFlags: CARD_FOCUS(null), lit: MOONLIT, shadow: NIGHT_SHADOW },
    { name: "tile-signal", src: "tile-stamp-day", ring: "f3ecdc", focusFlags: CARD_FOCUS("4a1206") },
    { name: "tile-signal-night", src: "tile-stamp-day", gain: [0.86, 0.84, 0.86], ring: "f3ecdc", focusFlags: CARD_FOCUS("4a1206"), shadow: NIGHT_SHADOW },
  ],
  mats: [
    { name: "mat-day", src: "mat-day" },
    { name: "mat-night", src: "mat-night" },
  ],
  // round seals in cinnabar paste and its kin, one per status: ink (off),
  // jade, ochre, vermilion
  pins: { src: "seals", shadow: ["0:0:1:0", "0:0:1:0"] },
  // a broad dry stroke of the brush that heads a card and a kicker: ink by
  // day, gofun white by night
  tapes: [
    { name: "tape-day", src: "swash-day", shadow: ["0:0:1:0", "0:0:1:0"] },
    { name: "tape-night", src: "swash-night", shadow: ["0:0:1:0", "0:0:1:0"] },
    // inline code: a straight-cut slip of washi
    { name: "chip-day", src: "chip-day" },
    { name: "chip-night", src: "chip-night" },
  ],
  props: [
    // the brand's seal, 重 (chóng), stamped beside the name: ink on paper
    { name: "seal-brand", srcs: [{ src: "seal-brand" }], resize: { width: 112 }, pad: 4, shadow: ["0:0:1:0", "0:0:1:0"] },
    // a jade bi disc on a vermilion cord, its tassel hanging from the
    // flagship's top roller
    { name: "pendant-day", srcs: [{ src: "pendant" }], resize: { height: 400 }, pad: 12, shadow: ["2:5:6:0.3", "0.5:1:1.2:0.3"] },
    { name: "pendant-night", srcs: [{ src: "pendant", gain: [0.62, 0.66, 0.78] }], resize: { height: 400 }, pad: 12, shadow: ["2:5:6:0.5", "0.5:1:1.2:0.5"] },
  ],
  // brushwork painted on white, lifted off it (build-kit inks): the
  // opening scroll's own painting, and the inscriptions in the scene's
  // corners (scene.overlays). By night the ink is gofun white, its seals
  // still cinnabar.
  inks: [
    { name: "vignette-day", src: "vignette", width: 720, page: true },
    { name: "vignette-night", src: "vignette", width: 720, tint: "d6d1c4", alpha: 0.5, page: true },
    { name: "calligraphy-left-day", src: "calligraphy-left", height: 172 },
    { name: "calligraphy-left-night", src: "calligraphy-left", height: 172, tint: "e8e2d4", alpha: 0.82 },
    { name: "calligraphy-right-day", src: "calligraphy-right", height: 200 },
    { name: "calligraphy-right-night", src: "calligraphy-right", height: 200, tint: "e8e2d4", alpha: 0.82 },
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
    // the inscriptions, in the corners the column leaves clear on a wide
    // screen (as the concept has them): 行遠 on the cliff's foot at the lower
    // left, 山水有相逢 at the lower right, each on bare paper the painter left
    // for it (a wash of the ground under it)
    overlays: {
      left: [{ ink: "calligraphy-left", at: [36, 840], mist: { color: { day: "ece3cf", night: "1b2130" }, alpha: 0.8, grow: 34 } }],
      right: [{ ink: "calligraphy-right", at: [1805, 866], mist: { color: { day: "ece3cf", night: "1b2130" }, alpha: 0.8, grow: 34 } }],
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
