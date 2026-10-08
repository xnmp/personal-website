// Ligne Claire (art/briefs/ligne.md): panels of a European science-fiction
// comic album in the clear line, caption boxes, powder-blue inset frames,
// flat lamps, mint caption tags, powder-blue code boxes, over the album's
// establishing shot of a desert outpost. Raws in art/raw/ligne; prompts in
// art/prompts/ligne.
//
// The surfaces are drawn flat (scripts/ink.mjs) in the raws' shapes and
// colours (sampled from them, below), so that their ink line comes out at
// its weight in page px on every surface, LINE round a panel and FINE round
// what sits in one: each is drawn at its weight divided by the scale its
// 9-slice prints it at (ligne.css holds the scales: panels 0.5, strips
// 0.25, captions 0.5, mats 0.2, tags, keycaps and code tints 0.25, lamps
// about 0.24). The line is the scene's own ink, and a pen's: a panel's
// gives a little of its width along its sides and is full at the corners
// (`hand`); the fittings' small lines are drawn true (at 2px a line that
// gives reads as a dry, broken stroke, not a pen's). A panel is
// inset over the establishing shot as an album's inset panels are, in a
// narrow margin of white paper outside its line, and its field is the
// album's paper (`fills`), painted by the page. The scene is the generated
// art, retouched to the clear line (art/prompts/ligne/layer-*), its night
// ground laid a tone down.
//
// Night is the same album's night pages: a panel's cream turned to the
// night blue a colourist lays under a black line, light enough that the
// line still draws it (as by day: a field in one black line over the
// scene); the captions, tags and lamps are printed colours and keep them, a
// shade dimmed. One focus language: a coral band laid inside the ink border
// (a panel's, a caption's) with an ink line inside it; cream on the coral
// caption.
//
// Nothing is modelled: the album's sun is in the upper right, as on every
// rock, the arch, the planet and the outpost in the establishing shot (its
// rocket and dome relit to it: art/prompts/ligne/layer-right-*-relight), so
// shadows are flat cut shapes offset to the lower left; hover lifts a
// surface up and to the right as its shadow steps out (the shadow stays
// where it lay), pressed sets it down onto its shadow (ligne.css), and no
// state catches a light.

// the line: a panel's border is the page's heaviest line, as an album's
// panel borders are, a bold inked edge, twice the fittings'; what is drawn
// inside a panel (captions, tags, lamps, a screen's frame) takes a finer
// one, so a fitting never outweighs the panel it sits in
const LINE = 4; // page px
const FINE = 2; // page px
// the scene's ink: the core of its line, sampled from the layers (warm black)
const INK = "1c1414";
// a pen's line: it gives up to a quarter of its width along a side, slowly
const HAND = (seed) => ({ hand: { thin: 0.25, seed } });
// an inset panel's margin of white paper, outside its line (page px)
const MARGIN = 4;
const PAPER = "fffdf6";
// the panel's outer corner: its line's, 6px round, and the margin's round it
const PANEL_ROUND = 6;
// sampled from the raws (art/raw/ligne): the panel's cream, the captions'
// pale yellow and coral, the frame's powder blue, the tag's mint, the code
// box's blue
const CREAM = "f5ebd8";
const YELLOW = "fce89e";
const CORAL = "e25d42";
const POWDER = "b9d4e9";
const MINT = "cee5d1";
const CODE = "b5d3e7";
// a button is a white caption, as a balloon is: pale yellow is the album's
// narration, the shelves' headings, and never what you press
const WHITE = "fffaf0";
// by night the neutral caption is the night's deep blue, lettered in cream,
// below the panel's blue, so the coral primary (lifted) is what calls
const NIGHT_CAPTION = "2b3577";
const NIGHT_CORAL = "ee6448";
// the night page: cream to the night's blue (the panel's own colour by
// night, ligne.css --plate-field), in the hue of the night sky behind it,
// lighter than the moonlit ground (laid a tone down: `scene.gain`) and the
// sky, so a panel parts from the desert as the day's cream does and the
// black line draws it plainly (2.8:1); cream type 5.9:1, the faintest 4.6:1
const FIELD_NIGHT = "4757a6";
// printed colours by night: each a shade dimmed (x 0.95, 0.94, 0.92); the
// narration's yellow further, so a shelf's caption never outshines the
// panels and the coral primary, but deepened toward gold rather than
// greyed (dimmed evenly, a pale yellow goes khaki); the paper margin as the
// night's lamp leaves it, below the cream type
const NIGHT = { [YELLOW]: "dcbf5c", [CORAL]: "d7573d", [POWDER]: "b0c7d6", [MINT]: "c4d7c0", [CODE]: "acc6d5", [WHITE]: "eee8da", fbf3e1: "eee4cf", [PAPER]: "d9d3c4" };
// a flat shadow, `d` page px down and left of the surface, at its scale:
// a flat shape a shade deeper than what it falls on (`tint` at `a`), never
// the ink's black, or along a panel's foot it reads as the line thickened.
// By night, the night's own deep blue
const FLAT = (d, k, a, tint = "2a2418") => [`${-d / k}:${d / k}:0.6:${a}`, "0:0:0.6:0", `--tint=${tint}`];
const NIGHT_SHADE = "0e1440";
const NONE = ["0:0:0.6:0", "0:0:0.6:0"];

// Panels: the paper margin, the ink line, then the field, which the page
// paints (framed-pane.mjs clears it; ligne.css --plate-fill, the album's
// paper). `frame` is where the field begins, inside the line at its
// fullest: where the pen gives, the art keeps the field's colour up to it.
// Focus: a coral band (4px) inside the ink line, following it, an ink line
// inside that, drawn whole (scripts/ink.mjs `keep`).
const panel = (k, finish, seed) => {
  const [margin, field] = finish === "day" ? [PAPER, CREAM] : [NIGHT[PAPER], FIELD_NIGHT];
  const outside = [
    [MARGIN / k, margin],
    [LINE / k, INK, HAND(seed)],
  ];
  const radius = (PANEL_ROUND + MARGIN) / k;
  return {
    rivets: false,
    glass: { dx: 0, dy: 0, soft: 1, shadeColor: "000000", shadeAlpha: 0, glintAlpha: 0 },
    feather: 1,
    frame: Object.fromEntries(["t", "r", "b", "l"].map((s) => [s, (MARGIN + LINE) / k])),
    ink: { radius, bands: outside, fill: field },
    focusInk: {
      radius,
      bands: [...outside, [4 / k, "e2553f", { keep: true }], [LINE / k, INK, { keep: true }]],
      fill: field,
    },
  };
};
const SHEET_K = 0.5;
const STRIP_K = 0.25;
// a panel you can open stands off the page on a flat shadow: it lifts 3px
// on hover (its shadow 6 -> 9px) and sets down 4px pressed (6 -> 2px); a
// shadow on the night sky is near black, to be seen at all. A panel that
// only holds its content is printed flat on the page (`flat`, no shadow;
// ligne.css), so the two never read alike.
const sheetShadows = (a, tint) => ({
  normal: FLAT(6, SHEET_K, a, tint),
  hover: FLAT(9, SHEET_K, a, tint),
  pressed: FLAT(2, SHEET_K, a, tint),
  flat: NONE,
});

// Captions: the ink line round a flat face, corners 3px round.
// Focus: the ink line, a band of the focus colour (3px), an ink line, the
// face.
const KEY_K = 0.5;
const caption = (face, focus) => ({
  catch: 0,
  ink: { radius: 3 / KEY_K, bands: [[FINE / KEY_K, INK]], fill: face },
  focusInk: { radius: 3 / KEY_K, bands: [[FINE / KEY_K, INK], [3 / KEY_K, focus], [FINE / KEY_K, INK]], fill: face },
});
// captions lift 2px on hover (shadow 3 -> 5px) and set down flat pressed
const captionShadows = (a, tint) => ({ normal: FLAT(3, KEY_K, a, tint), hover: FLAT(5, KEY_K, a, tint), pressed: NONE });

// the screens' powder-blue frame: a flat band of blue, inked only round the
// window (an ink line round its outside too stacks a third and fourth line
// inside a panel's own), the band as wide as before, the window's corners
// rounded 2px, its line round them (ligne.css slices the frame to include
// the line: the window opens 120 of the art's px in). The art is the line
// alone, the band left clear: the page lays the blue and the paper's fibre
// in it (ligne.css --mat-fill, --k-fibre), so no slice stretches the fibre
// along a side, and the frame is the same art by day and by night
const MAT_K = 0.2;
const mat = (color) => ({ ink: { radius: 4 / MAT_K, bands: [[(LINE + 8 + LINE - FINE) / MAT_K, color], [FINE / MAT_K, INK, { round: (2 + FINE) / MAT_K }]], fill: null }, shadow: NONE });

// tags and code boxes: a 9-slice drawn small (ligne.css slices it 32 on
// every side, 8 of them the pad, at 0.25)
const TAG_K = 0.25;
const tag = (color) => ({ ink: { size: [160, 80], radius: 2 / TAG_K, bands: [[FINE / TAG_K, INK]], fill: color }, shadow: NONE });
// inline code: a colourist's flat tint behind the words, no line: a box in
// the ink line would read as one more caption to press, and stand taller
// than the line of text it sits in
const tint = (color) => ({ ink: { size: [160, 80], radius: 2 / TAG_K, bands: [], fill: color }, shadow: NONE });
// a label is lettered in a caption balloon, as the album's are: its tail
// hangs from the box's foot near its left end, toward what it names (on the
// page 11px wide, 7.5px deep; ligne.css slices it 76 at the left and 64 at
// the foot to keep it whole)
const balloon = (color) => ({ ...tag(color), ink: { ...tag(color).ink, tail: { x: 18, width: 44, depth: 30, tip: 10 } } });

// what is printed on the album's page is printed on its paper: a flat
// colour still shows the paper's fibre through it. The fill's fibre is laid
// into each fitting's art at the size the page prints the panels' paper
// (ligne.css --plate-fill-size 384) over the scale the fitting prints at
// (scripts/build-kit.mjs `grain`), so a caption or a frame is the same
// sheet as the panel under it, not a sticker laid on it
const FIBRE = (finish, k) => ({ grain: { fill: `paper-${finish}`, size: 384, k } });

const kit = {
  raw: "ligne",
  // flat colour in hard ink lines: lossless, so no colour bleeds into a line
  // (scripts/webp.mjs)
  lossless: true,
  sheet: {
    ...sheetShadows(0.3),
    hoverFlags: ["--catch=0", "--sheen=0"],
    pressedFlags: ["--catch=0", "--dim=1"],
  },
  sheets: [
    { src: "sheet-day", name: "sheet-day", width: 500, ...panel(SHEET_K, "day", 1) },
    { src: "sheet-day", name: "sheet-night", width: 500, ...panel(SHEET_K, "night", 1), ...sheetShadows(0.8, NIGHT_SHADE) },
    // the strips (masthead, feet, picker) hold the page's furniture: printed
    // flat
    { src: "sheet-day", name: "sheet-strip-day", width: 600, ...panel(STRIP_K, "day", 2), states: ["normal"], normal: NONE },
    { src: "sheet-day", name: "sheet-strip-night", width: 600, ...panel(STRIP_K, "night", 2), states: ["normal"], normal: NONE },
  ],
  tile: {
    ...captionShadows(0.3),
    hoverFlags: ["--catch-width=5", "--sheen=0"],
    pressedFlags: ["--catch=0", "--dim=1"],
  },
  // caption boxes: white the neutral (the night's deep blue by night),
  // coral the primary
  tiles: [
    { name: "tile-day", src: "tile-day", ...caption(WHITE, "e2553f"), ...FIBRE("day", KEY_K) },
    { name: "tile-night", src: "tile-day", ...caption(NIGHT_CAPTION, "ee6448"), shadow: captionShadows(0.8, NIGHT_SHADE), ...FIBRE("night", KEY_K) },
    { name: "tile-signal", src: "tile-signal", ...caption(CORAL, "fbf3e1"), ...FIBRE("day", KEY_K) },
    { name: "tile-signal-night", src: "tile-signal", ...caption(NIGHT_CORAL, NIGHT.fbf3e1), shadow: captionShadows(0.8, NIGHT_SHADE), ...FIBRE("night", KEY_K) },
  ],
  // a screen in a powder-blue inset frame
  mats: [
    { name: "mat-day", src: "mat-day", ...mat(null) },
    { name: "mat-night", src: "mat-day", ...mat(null) },
  ],
  // flat lamps: off a cream disc in its ink ring, on its status colour in
  // the album's own palette, mint and apricot printed a tone deeper (as
  // pale as the tags, a lit lamp reads as an empty ring on the cream), and
  // coral
  pins: {
    src: "pins",
    // (with the flat white shape of a highlight on the glass, toward the
    // sun, upper right); an unlit lamp is a grey glass, not the panel's
    // cream (on the cream it reads as an empty ring)
    ink: { line: FINE / 0.24, color: INK, fills: { brass: "cfc8b6", green: "9fd3ad", amber: "f0b07a", signal: "e2553f" }, glint: "ffffff", light: "right" },
    shadow: NONE,
  },
  tapes: [
    // labels in a mint caption tag
    { name: "tape-day", src: "tape-day", ...balloon(MINT), ...FIBRE("day", TAG_K) },
    { name: "tape-night", src: "tape-day", ...balloon(NIGHT[MINT]), ...FIBRE("night", TAG_K) },
    // inline code in a powder-blue box
    { name: "chip-day", src: "chip-day", ...tint(CODE), ...FIBRE("day", TAG_K) },
    { name: "chip-night", src: "chip-day", ...tint(NIGHT[CODE]), ...FIBRE("night", TAG_K) },
    // a printed keycap (a shortcut named in the text, never pressed): a
    // white caption, flat on the page
    { name: "cap-day", src: "tape-day", ...tag(WHITE), ...FIBRE("day", TAG_K) },
    { name: "cap-night", src: "tape-day", ...tag(NIGHT[WHITE]), ...FIBRE("night", TAG_K) },
    // a shelf's heading in a pale yellow narrative caption, as a page of
    // the album opens a sequence ("Meanwhile...")
    // (its line only: the page lays the yellow inside it, with the paper's
    // fibre, ligne.css --caption-fill, as a caption grows to its words)
    { name: "caption-day", src: "tape-day", ...tag(null) },
    { name: "caption-night", src: "tape-day", ...tag(null) },
  ],
  // the panels' field: the album's paper, its fibre only (a broad cloud of
  // tone would repeat from tile to tile), at the field's cream, and by night
  // under the night's blue
  fills: [
    { name: "paper-day", src: "paper-day", size: 768, alpha: 1, highpass: 32, soften: 0.4, mean: CREAM, gain: 1 },
    // the same fibre for a flat tint the page lays where a fitting's box
    // grows (a shelf's caption, a tag of two lines, inline code; ligne.css
    // --k-fibre): its darker fibres as a veil over the colour, at the page's
    // scale (the paper prints its 768px at 384), so a box stretched to its
    // words never stretches the paper in it
    { name: "fibre-day", src: "paper-day", size: 384, highpass: 16, soften: 0.3, mean: CREAM, gain: 1, veil: INK },
    { name: "fibre-night", src: "paper-day", size: 384, highpass: 16, soften: 0.3, mean: CREAM, gain: 0.7, veil: INK },
    { name: "paper-night", src: "paper-day", size: 768, alpha: 1, highpass: 32, soften: 0.4, mean: FIELD_NIGHT, gain: 0.7 },
  ],
  // the closer cuts (ligne.css .tier-cut): close-ups the album cuts to after
  // its establishing shot, each drawn at its own scale, by day and by night
  // (the night an edit of the day's drawing): the outpost's door, wide, for
  // the opening tier's strip; the butte, the track and the pillar, upright,
  // beside a page's screenshots. None is in the scene's corners, where its
  // landmarks already stand.
  cuts: ["outpost", "butte", "track", "pillar"].flatMap((n) =>
    ["day", "night"].map((f) => ({ name: `cut-${n}-${f}`, src: `cut-${n}-${f}`, width: n === "outpost" ? 1600 : 941 })),
  ),
  scene: {
    finishes: ["day", "night"],
    layers: ["sky", "far", "mid", "near", "left", "right"],
    // by night the moonlit desert is laid a tone down, under the panels'
    // blue, so a panel parts from the ground as it does from the sky; the
    // outpost keeps more of its light, its windows lit
    gain: { "mid-night": 0.62, "near-night": 0.62, "left-night": 0.66, "right-night": 0.82 },
  },
};

export default kit;
