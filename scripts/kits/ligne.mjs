// Ligne Claire (art/briefs/ligne.md): a page of a European science-fiction
// comic album in the clear line, its panels laid on the album's cream paper:
// caption boxes, powder-blue inset frames, flat lamps, mint caption tags,
// powder-blue code boxes, and the desert establishing shot as the home
// page's hero panel (hero-*, cuts below). Raws in art/raw/ligne; prompts in
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
// gives reads as a dry, broken stroke, not a pen's). A panel lies on the
// album's page as its panels do, its line straight on the paper, and its
// field is the album's paper (`fills`), painted by the page. The scene
// behind the page is that paper alone (scene, below).
//
// Night is the same album's night pages: a panel's cream turned to the
// night blue a colourist lays under a black line, light enough that the
// line still draws it, on a page of the night's deepest blue; the captions,
// tags and lamps are printed colours and keep them, a shade dimmed. One
// focus language: a coral band laid inside the ink border (a panel's, a
// caption's) with an ink line inside it.
//
// Nothing is modelled: the album's sun is in the upper right, as on every
// rock and the planet in the establishing shot, so shadows are flat cut
// shapes offset to the lower left; hover lifts a
// surface up and to the right as its shadow steps out (the shadow stays
// where it lay), pressed sets it down onto its shadow (ligne.css), and no
// state catches a light.

// the line: a panel's border is the page's heaviest line, as an album's
// panel borders are (the original mock's, 3px at its size); what is drawn
// inside a panel (tags, lamps, a screen's frame) takes a finer one, so a
// fitting never outweighs the panel it sits in. A button is a caption box
// lettered over the picture, drawn in the panel's line, as the mock's are.
// (A card prints its sheet a little over a panel's scale, ligne.css, so its
// hand-thinned line averages the panels' 3px.)
const LINE = 3; // page px
const FINE = 2; // page px
// the mock's ink, sampled from its type and lines: a true black (about 3,3,3),
// not the warm near-black (28,20,20) the first rounds took from the layers
const INK = "040404";
// a pen's line: it gives up to a quarter of its width along a side, slowly
const HAND = (seed) => ({ hand: { thin: 0.25, seed } });
// the panel's outer corner, 6px round
const PANEL_ROUND = 6;
// sampled from the original mock (art/originals/ligne.webp): the page's
// cream, which a panel's field is too; from the raws (art/raw/ligne): the
// captions' pale yellow and coral, the frame's powder blue, the tag's mint,
// the code box's blue
const CREAM = "f9f3e2";
const YELLOW = "fce89e";
const CORAL = "e25d42";
const POWDER = "b9d4e9";
const MINT = "cee5d1";
const CODE = "b5d3e7";
// a keycap is a white caption, as a balloon is: pale yellow is the album's
// narration, the shelves' headings, and never what you press
const WHITE = "fffaf0";
// the mock's buttons: the call a bright sky blue, the other the page's
// cream a shade deeper, both lettered in ink, by night too (a shade
// dimmed: NIGHT), so they read on the night's picture as by day's
const CALL = "67c1fc";
const BUTTON = "f9f5e6"; // (249,245,230), sampled from the mock's "Try it live"
// the night page: cream to the night's blue (a panel's field by night,
// ligne.css --ligne-field), in the hue of the night sky in the hero's
// picture, lighter than the page's deepest blue it lies on, so the black
// line draws it plainly (2.8:1); cream type 5.9:1, the faintest 4.6:1
const FIELD_NIGHT = "4757a6";
// printed colours by night: each a shade dimmed (x 0.95, 0.94, 0.92); the
// narration's yellow further, so a shelf's caption never outshines the
// panels and the coral primary, but deepened toward gold rather than
// greyed (dimmed evenly, a pale yellow goes khaki)
const NIGHT = { [YELLOW]: "dcbf5c", [CORAL]: "d7573d", [POWDER]: "b0c7d6", [MINT]: "c4d7c0", [CODE]: "acc6d5", [WHITE]: "eee8da", [CALL]: "5fb3ea", [BUTTON]: "ede6d4" };
// a flat shadow, `d` page px down and left of the surface, at its scale:
// a flat shape a shade deeper than what it falls on (`tint` at `a`), never
// the ink's black, or along a panel's foot it reads as the line thickened.
// By night, the night's own deep blue
const FLAT = (d, k, a, tint = "2a2418") => [`${-d / k}:${d / k}:0.6:${a}`, "0:0:0.6:0", `--tint=${tint}`];
const NIGHT_SHADE = "0e1440";
const NONE = ["0:0:0.6:0", "0:0:0.6:0"];

// Panels: the ink line, then the field, which the page paints (framed-pane.mjs clears it; ligne.css --plate-fill, the album's
// paper). `frame` is where the field begins, inside the line at its
// fullest: where the pen gives, the art keeps the field's colour up to it.
// Focus: a coral band (4px) inside the ink line, following it, an ink line
// inside that, drawn whole (scripts/ink.mjs `keep`).
const panel = (k, finish, seed) => {
  const field = finish === "day" ? CREAM : FIELD_NIGHT;
  const outside = [[LINE / k, INK, HAND(seed)]];
  const radius = PANEL_ROUND / k;
  return {
    rivets: false,
    glass: { dx: 0, dy: 0, soft: 1, shadeColor: "000000", shadeAlpha: 0, glintAlpha: 0 },
    feather: 1,
    frame: Object.fromEntries(["t", "r", "b", "l"].map((s) => [s, LINE / k])),
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
// every panel rests printed flat on the page, as the mock's do (`flat`,
// no shadow; ligne.css lays it at rest); one you can open stands off it on
// a flat shadow while the pointer is on it (`hover`, 9px) and sets down
// onto it pressed (2px); a shadow by night is the night's deepest blue, to
// be seen at all. (`normal` is the kit's required resting art, unused.)
const sheetShadows = (a, tint) => ({
  normal: FLAT(6, SHEET_K, a, tint),
  hover: FLAT(9, SHEET_K, a, tint),
  pressed: FLAT(2, SHEET_K, a, tint),
  flat: NONE,
});

// Captions: the ink line round a flat face, corners 8px round (the mock's
// buttons). Focus: the ink line, a band of the focus colour (3px), an ink
// line, the face.
const KEY_K = 0.5;
const caption = (face, focus) => ({
  catch: 0,
  ink: { radius: 8 / KEY_K, bands: [[LINE / KEY_K, INK]], fill: face },
  focusInk: { radius: 8 / KEY_K, bands: [[LINE / KEY_K, INK], [3 / KEY_K, focus], [FINE / KEY_K, INK]], fill: face },
});
// a caption is lettered flat on the page, as the mock's are; hover lifts it
// 2px off a flat shadow (0 -> 3px) and pressed sets it down flat again
const captionShadows = (a, tint) => ({ normal: NONE, hover: FLAT(3, KEY_K, a, tint), pressed: NONE });

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
  // caption boxes: cream the neutral, sky blue the call, the focus band
  // coral on both; their fills flat colour, no paper grain, as the album
  // fills its boxes
  tiles: [
    { name: "tile-day", src: "tile-day", ...caption(BUTTON, CORAL) },
    { name: "tile-night", src: "tile-day", ...caption(NIGHT[BUTTON], CORAL), shadow: captionShadows(0.8, NIGHT_SHADE) },
    { name: "tile-signal", src: "tile-signal", ...caption(CALL, CORAL) },
    { name: "tile-signal-night", src: "tile-signal", ...caption(NIGHT[CALL], CORAL), shadow: captionShadows(0.8, NIGHT_SHADE) },
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
    // the page's fibre, fainter than a panel's (the mock's page is all but
    // flat), laid into the scene's paper (scene.paper)
    { name: "page-grain", src: "paper-day", size: 768, alpha: 1, highpass: 32, soften: 0.4, mean: CREAM, gain: 0.5 },
  ],
  // the closer cuts (ligne.css .tier-cut): close-ups the album cuts to after
  // its establishing shot, each drawn at its own scale, by day and by night
  // (the night an edit of the day's drawing): the outpost's door, wide, for
  // the opening tier's strip; the butte, the track and the pillar, upright,
  // beside a page's screenshots. None is in the scene's corners, where its
  // landmarks already stand.
  cuts: [
    ...["outpost", "butte", "track", "pillar"].flatMap((n) =>
      ["day", "night"].map((f) => ({ name: `cut-${n}-${f}`, src: `cut-${n}-${f}`, width: n === "outpost" ? 1600 : 941 })),
    ),
    // the home page's hero panel: the establishing shot of the original
    // mock, from its plate (art/raw/ligne/plate-day, the mock with its
    // lettering painted out), extended upward with sky so a taller panel
    // shows more of it rather than a crop (art/prompts/ligne/hero-day.txt;
    // the plate's own panel composed back under the generated sky, so it
    // registers with the mock: scripts/kits/ligne-raws.mjs), and the same
    // panel by night (an edit of it, art/prompts/ligne/hero-night.txt)
    ...["day", "night"].map((f) => ({ name: `hero-${f}`, src: `hero-${f}`, width: 1672 })),
    // and a phone's, its moon painted out from under the stacked buttons
    // (scripts/kits/ligne-raws.mjs phone)
    ...["day", "night"].map((f) => ({ name: `hero-${f}-phone`, src: `hero-${f}-phone`, width: 1672 })),
    // the wordmark: the mock's own brushed "chong", an ink mask the page
    // fills with its ink (scripts/kits/ligne-raws.mjs wordmark; ligne.css)
    { name: "wordmark", src: "wordmark", width: 728 },
  ],
  // The scene is the album's page: its paper, the page's colour by day and
  // the night's deepest blue by night (layer-sky-*: flat frames of those
  // colours, art/prompts/ligne/layer-sky-*.txt), the paper's fibre laid in
  // at the page's scale. The panels are the page's (ligne.css), the desert
  // the hero panel's picture.
  scene: {
    finishes: ["day", "night"],
    flat: [], // --k-scene-flat is the hero panel (hero-<finish>.webp)
    layers: ["sky"],
    paper: { layers: ["sky"], tile: "page-grain", size: 384, blur: 0.3, amount: 1 },
  },
};

export default kit;
