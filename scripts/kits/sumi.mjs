// Sumi-e Ink (art/briefs/sumi.md): the page brushed onto an ink-wash
// landscape, after the original mock (art/originals/sumi.webp). The scene is
// the mock's own painting with the page taken out of it; the surfaces are
// cards of deckle-edged washi; the buttons a field of madder red brushed on
// and a rectangle drawn in a thin line of ink; the marks are inked off white
// (a sun, an inscription, the cards' seals, the heading's rule). Raws in
// art/raw/sumi; prompts in art/prompts/sumi.
//
// The art is lit evenly, as paper on a painting is: no rim is relit, and a
// card's lift is all in its shadow.

// The cards' washi: its paper is cleared for the page's own (washi-*.webp,
// kit.css --plate-fill), so its fibres keep their scale on a card and on a
// page-wide sheet. There is no line for the edge: `frame` is where solid
// paper begins on each side past the deepest bite of the deckle and most of
// its aged band (measured on the 1000px base), the art handing over to the
// page's paper over `feather` px; the 56px a corner keeps unstretched holds
// it. The torn rails repeat along a side (sumi.css --plate-repeat: round),
// where a stretch would drag the tears into streaks. No shade or glint on the
// pane: it is the same sheet as its edge.
const PANE = { dx: 0, dy: 0, soft: 1, shadeColor: "000000", shadeAlpha: 0, glintAlpha: 0 };
const WASHI = { width: 1000, rivets: false, glass: PANE, feather: 6, tileRails: { sides: ["t", "r", "b", "l"], overlap: 32 } };

// By night the cards and buttons stand on a dark painting: a deeper shadow,
// which on the dark ground would otherwise not show.
const NIGHT_TILE = {
  normal: ["2:5:5:0.5", "0:1:1.2:0.55"],
  hover: ["4:10:5:0.66", "1:2.5:1.5:0.45"],
  pressed: ["1:2:2.5:0.4", "0:1:1:0.6"],
};

// The madder field brought to the mock's red (#952e2a over its grain): the
// generation's is deeper and more saturated, toward maroon.
const SIGNAL_RED = [0.99, 1.28, 1.45];

const kit = {
  raw: "sumi",
  sheet: {
    // paper laid on paper: a close, soft shadow
    normal: ["4:8:12:0.2", "0.5:1:1.5:0.26"],
    // lifted off the painting: a longer, wider, softer shadow
    hover: ["12:26:24:0.38", "3:6:6:0.2"],
    pressed: ["2:3:6:0.16", "0.5:1:1.5:0.32"],
    flat: ["3:6:10:0.18", "0.5:1:1.5:0.26"],
    hoverFlags: ["--catch=0", "--sheen=0"],
    // pressed flat: the edge dims with the face (sumi.css --plate-press-dim)
    pressedFlags: ["--catch=0", "--dim=0.92"],
  },
  // A focused card lies on an under-sheet of cinnabar paper, torn to follow
  // its deckle, that shows past its edge (scripts/paper-shadow.mjs --mount).
  sheets: [
    // brought to the mock's card paper (#e8ded2), a shade lighter than the
    // painting's
    { name: "sheet-day", src: "sheet-washi-day", ...WASHI, gain: [1.022, 1.023, 1.045], frame: { t: 30, r: 26, b: 40, l: 32 }, under: "b23a2e" },
    {
      name: "sheet-night",
      src: "sheet-washi-night",
      ...WASHI,
      frame: { t: 32, r: 32, b: 40, l: 36 },
      under: "c8452f",
      normal: ["4:8:12:0.42", "0.5:1:1.5:0.5"],
      hover: ["12:26:24:0.6", "3:6:6:0.4"],
    },
  ],
  tile: {
    normal: ["1:3:4:0.18", "0:0.5:1:0.22"],
    hover: ["3:8:6:0.3", "1:2:2:0.22"],
    pressed: ["0.5:1:1.5:0.14", "0:0.5:0.8:0.26"],
    // lifted toward the light: the face a little brighter (the lift is in
    // its shadow)
    hoverFlags: ["--catch=0", "--catch-width=5", "--sheen=0.1"],
    pressedFlags: ["--dim=0.9"],
  },
  // The primary: a field of deep madder brushed onto the paper, its edges
  // ragged where the brush lifted; focused, a cream line laid inside its
  // edge with a dark keyline. The secondary: a rectangle drawn in a line of
  // ink (gofun white by night, an edit of the day's line, so the two are one
  // shape), the painting showing inside it. Its line must be solid all the
  // way round: the build straightens a tile's long edges from where the
  // alpha first crosses half, and a dry gap in a thin line reads as the far
  // side. There is no board inside the line for a focus band to lie on, so
  // focused, the line itself turns cinnabar (a band as deep as the line,
  // following its rounded corners), and sumi.css rings it in cinnabar too.
  tiles: [
    { name: "tile-day", src: "tile-line-day", ring: "b23a2e", focusFlags: ["--ring=0:7", "--ring-radius=10"] },
    {
      name: "tile-night",
      src: "tile-line-night",
      ring: "e8604a",
      focusFlags: ["--ring=0:7", "--ring-radius=10"],
      shadow: NIGHT_TILE,
    },
    { name: "tile-signal", src: "tile-red-day", gain: SIGNAL_RED, ring: "f3ecdc", focusFlags: ["--ring=11.5:17", "--ring-radius=8", "--halo=17:18.4", "--halo-color=4a1206"] },
    {
      name: "tile-signal-night",
      src: "tile-red-day",
      gain: SIGNAL_RED.map((g, i) => g * [1.08, 1, 1][i]),
      ring: "f3ecdc",
      focusFlags: ["--ring=11.5:17", "--ring-radius=8", "--halo=17:18.4", "--halo-color=4a1206"],
      shadow: NIGHT_TILE,
    },
  ],
  // the screens on the project pages, framed as the mock frames its window:
  // a thin band of dark charcoal with rounded corners
  mats: [
    { name: "mat-day", src: "mat-ink", shadow: ["3:6:9:0.24", "0.5:1:1.5:0.3"] },
    { name: "mat-night", src: "mat-ink", gain: [1.25, 1.25, 1.3], shadow: ["3:6:9:0.5", "0.5:1:1.5:0.55"] },
  ],
  // round seals in cinnabar paste and its kin, one per status: ink (off),
  // jade, ochre, vermilion
  pins: { src: "seals", shadow: ["0:0:1:0", "0:0:1:0"] },
  // a label and inline code: a straight-cut slip of washi
  tapes: [
    { name: "chip-day", src: "chip-day" },
    { name: "chip-night", src: "chip-night" },
  ],
  props: [
    // the brand's seal, 重 (chóng), after the name: a block of cinnabar, the
    // character the paper's cream
    { name: "seal-brand", srcs: [{ src: "seal-brand" }], resize: { width: 120 }, pad: 4, shadow: ["0:0:1:0", "0:0:1:0"] },
  ],
  // Brushwork painted on white, lifted off it (build-kit inks). By night the
  // ink is gofun white (`tint`), the seals still cinnabar.
  inks: [
    // the sun and the moon are one disc of grey wash, its density kept and
    // its ink tinted: by day the mock's faded cinnabar (over the paper, its
    // salmon rose), by night a pale gofun moon
    { name: "sun-day", src: "disc-wash", width: 240, tint: "c15c49", alpha: 1.08, page: true },
    { name: "moon-night", src: "disc-wash", width: 240, tint: "e9e4d6", alpha: 0.95, page: true },
    // the inscription 行遠自邇 and its seal, down the right edge
    { name: "calligraphy-day", src: "calligraphy", height: 600, page: true },
    { name: "calligraphy-night", src: "calligraphy", height: 600, tint: "e8e2d4", alpha: 0.86, page: true },
    // the cards' seal, as a blank: the frame alone (scripts/kits/sumi-seal.mjs
    // cuts it from the first generated seal). The character stamped in it is
    // the project's own (`--glyph`), live text in Sumi's seal face over the
    // paste's grain (sumi-seal.mjs also writes seal-grain.webp, the mask),
    // so no project has art of its own here.
    { name: "seal-blank", src: "seal-blank", width: 160, page: true },
    // The mock's own brush lettering, lifted off its paper
    // (scripts/kits/sumi-letters.mjs): the wordmark, the flagship's title,
    // the "Projects" heading, and the line drawn round "Try it live". Each is
    // a mask (sumi.css): only its alpha is read, so it is lifted whole, its
    // faintest dry streak too (`floor`).
    { name: "letter-brand", src: "letter-brand", width: 524, floor: 0, page: true },
    { name: "letter-title", src: "letter-title", width: 1148, floor: 0, page: true },
    { name: "letter-projects", src: "letter-projects", width: 264, floor: 0, page: true },
    { name: "key-line", src: "key-line", width: 350, floor: 0, page: true },
    // the brush rule after the "Projects" heading
    { name: "rule-day", src: "rule-brush", width: 900, page: true },
    { name: "rule-night", src: "rule-brush", width: 900, tint: "e8e2d4", alpha: 0.9, page: true },
  ],
  // the page's washi, tiled inside every card (grain only: a broad cloud of
  // tone would repeat from tile to tile), its mean the cards' paper
  fills: [
    { name: "washi-day", src: "washi-day", size: 512, alpha: 1, highpass: 24, mean: "e8ded2", gain: 0.8 },
    // the night fibres held down and softened: crisp pale strokes on near
    // black read as scratches on slate
    { name: "washi-night", src: "washi-night", size: 512, alpha: 1, highpass: 24, mean: "1d2230", gain: 0.32, soften: 0.9 },
  ],
  // The scene is one painting: the mock with the page taken out of it, and
  // its sun and inscription too (plate-day-clear; the night an edit of it,
  // plate-night), each finish's sky painted without its sun (`sun.sky`), and
  // the skein of birds the edit added over the flagship's copy cloned out
  // (scripts/kits/sumi-plates.mjs: plate-*-calm), painted on past the mock's
  // edges, 320 px each side and below, for the frame round the stage
  // (scripts/kits/sumi-bleed.mjs: plate-*-bleed; sumi.css --sky-bleed-*).
  // The disc is inked (sun-day, moon-night, above) and hung by the page
  // (.scene-sun), as the inscription is (sumi.css), so both keep their place
  // by the nav at any aspect, where the painting is cropped to cover.
  scene: {
    finishes: ["day", "night"],
    layers: ["sky"],
    bleed: { x: 320, bottom: 320 },
    sun: { sky: { day: "plate-day-bleed", night: "plate-night-bleed" } },
  },
};

export default kit;
