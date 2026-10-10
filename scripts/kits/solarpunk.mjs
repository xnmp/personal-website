// Solarpunk (art/briefs/solarpunk.md): frosted glass panes and lacquered
// cards in brass tube, enamel-and-brass plates and studs, in a golden-hour
// glasshouse. Raws in art/raw/solarpunk; prompts in art/prompts/solarpunk.
//
// The brass is authored lit from the upper left, so no rim is relit here.
// One focus language throughout: a strip of marigold enamel laid in along
// the inside of a frame (the sheets' brass, the plates' bezels).
// a tile's focus strip on its bezel lip, between keylines of `key`
const FOCUS = (key) => ["--ring=10.2:17", "--ring-radius=12", "--halo=8:10.2,17:18.6", `--halo-color=${key}`, "--crown=0.3"];

// The two frames, one brass and one bend shape (each generated alone on
// clear, 9-sliced; neither has a mid-arm collar to stretch):
//  - PIPE, the panes' (art/originals/solarpunk-{project,launch}.webp): thick
//    brass pipe with big round bends, a coupling collar just past each bend
//    on both arms and a domed bolt on each bend's outside. Based at 460px
//    the collars end 41px in, inside the 56px corner a 9-slice keeps whole.
//  - CARD, the home cards' (art/originals/solarpunk.webp): slim brass tube,
//    plain along every side, a bolted gusset in each corner.
// Marked cleared, whatever reaches into the pane stays frame in every state;
// the pane begins at the tube's inner edge.
const FRAME = {
  src: "pipe-frame",
  width: 460,
  frame: { t: 22, r: 19, b: 19, l: 19 },
  window: true,
  rivets: false,
  // the tube's lit side catches the sun along that much
  hoverFlags: ["--catch=1", "--catch-width=14", "--sheen=0.14", "--light=ffc25c"],
  pressedFlags: ["--catch=0.45", "--catch-width=14", "--dim=0.8"],
};
const CARD = { ...FRAME, src: "card-brass", frame: { t: 13, r: 13, b: 13, l: 13 } };
// the lamplit brass, graded down from the same art
const NIGHT_BRASS = [0.66, 0.62, 0.58];
// a pill lifted into the light: its hairline catches it, its face warms
const PILL_LIFT = ["--catch-width=5", "--sheen=0.16", "--light=ffd890"];

// The home cards' ivy (solarpunk-ivy.mjs cuts the generated sheets): the
// corner overgrowths at 0.74 of the sheet's pixels (a leaf about 22 mock px at
// 2x), the foot bunches, whose leaves are larger, at 0.56.
const IVY = [
  ["ivy-corner-a", 447],
  ["ivy-corner-b", 292],
  ["ivy-corner-c", 423],
  ["ivy-corner-d", 397],
  ["ivy-foot-a", 359],
  ["ivy-foot-b", 242],
  ["ivy-foot-c", 334],
  ["ivy-foot-d", 331],
];

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
    // the panes: frosted glass in the frame
    {
      ...FRAME,
      name: "sheet-day",
      under: "de8a2c",
      fillet: { width: 10, key: 2, color: "c8701e", keyColor: "3d2408" },
      glass: { shadeColor: "3b2a10", shadeAlpha: 0.42, glintColor: "fff6e0", glintAlpha: 0.75, glintWidth: 4 },
      // the low sun's pool on the pane, at rest and lifted into it, and the
      // reflection that says glass
      light: { color: "ffe6a8", alpha: 0.3, streak: 0.12 },
      sheen: { color: "fff0c8", alpha: 0.6 },
    },
    {
      ...FRAME,
      name: "sheet-night",
      gain: NIGHT_BRASS,
      under: "c9792a",
      fillet: { width: 10, key: 2, color: "ec8a24", keyColor: "120a03" },
      // the glint is the lanterns', warm, like every light the brass takes
      glass: { shadeColor: "050302", shadeAlpha: 0.55, glintColor: "ffd59a", glintAlpha: 0.45, glintWidth: 4 },
      // the moon's pool on the pane, cool, from the upper left, and its
      // reflection across the glass
      light: { color: "c9d6e8", alpha: 0.14, streak: 0.1 },
      sheen: { color: "ffe2b0", alpha: 0.3 },
    },
    // the project cards: the same frame round green lacquer (the page's
    // lacquer, which carries its own light), so the tube casts its shade on
    // a dark face and only a faint glint along it
    {
      ...CARD,
      name: "sheet-card",
      under: "de8a2c",
      // the focus strip is the marigold enamel itself and wider than on a
      // pane: on dark lacquer a brass-toned strip reads as more tube
      fillet: { width: 14, key: 2, color: "e8a24a", keyColor: "0d0802" },
      glass: { shadeColor: "050302", shadeAlpha: 0.55, glintColor: "fff6e0", glintAlpha: 0.3, glintWidth: 3 },
      sheen: { color: "fff0c8", alpha: 0.3 },
    },
    {
      ...CARD,
      name: "sheet-card-night",
      gain: NIGHT_BRASS,
      under: "c9792a",
      fillet: { width: 14, key: 2, color: "f0a640", keyColor: "0d0802" },
      glass: { shadeColor: "050302", shadeAlpha: 0.6, glintColor: "ffd59a", glintAlpha: 0.25, glintWidth: 3 },
      sheen: { color: "ffe2b0", alpha: 0.24 },
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
  // Where marigold would vanish it is cream enamel (the neutral plate's): by
  // night on the moss one, where the lamplit brass beside it is as bright
  // and as yellow as marigold. The face keeps its own gloss.
  tiles: [
    { name: "tile-day", src: "tile-day", ring: "de8a2c", focusFlags: FOCUS("2a1804") },
    { name: "tile-night", src: "tile-night", ring: "fbf1d8", focusFlags: FOCUS("0d0802") },
    // the call to act (every mock's): a pill of matte bottle-green enamel in
    // a crisp ivory hairline; and the home page's second call, the same
    // hairline round clear glass (the page lays the smoke inside it,
    // --key-under). Both are drawn, not generated (art/prompts/solarpunk
    // pill-*.svg): a generation returns the rim as embossed brass.
    // Focus on the enamel is the marigold strip inside the rim; the clear
    // pill has no face to lay it on, so its rim itself turns marigold. Lifted,
    // the matte enamel only warms (a plate's sheen would read as gloss) and
    // the hairline catches the light.
    { name: "tile-pill-green", src: "pill-green", ring: "de8a2c", hoverFlags: PILL_LIFT, focusFlags: ["--ring=9:15", "--ring-radius=51", "--halo=7:9,15:17", "--halo-color=0d0802", "--crown=0.3"] },
    { name: "tile-pill-glass", src: "pill-glass", ring: "e8a24a", hoverFlags: PILL_LIFT, focusFlags: ["--ring=0:6", "--ring-radius=60", "--crown=0.3"] },
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
    { name: "frost-day", src: "frost-day", size: 512, alpha: 0.8, highpass: 10, mean: "efe5c9", gain: 1.1 },
    // by night thinner still and its grain softened, so the lanterns and the
    // lit beds behind a pane bloom through it (denser, it reads as slate)
    { name: "frost-night", src: "frost-night", size: 512, alpha: 0.56, highpass: 10, soften: 0.8, mean: "1f2e28", gain: 0.7 },
  ],
  // The scene is one plate: the original mock with the page painted out
  // (plate-day; plate-night, an edit of it by night, so the two register),
  // painted on 320 mock px either side and below (bleed-<finish>, the core
  // pasted back over it: art/briefs/solarpunk.md), so on a desktop the plate
  // is registered to the stage and still fills a wider or taller frame.
  // Whatever must stand against the page is a prop of its own, anchored to
  // the page.
  scene: {
    // the home page's plate, and the two inner pages' own (project: the study
    // desk with the blueprints; launch: the desk with the notebook and the leaf
    // mug), each cut from its mock and painted on the same way
    finishes: ["day", "night", "project-day", "project-night", "launch-day", "launch-night"],
    flat: ["day", "night"], // --k-scene-flat: the home's plate
    layers: ["sky"],
    bleed: { x: 320, bottom: 320 }, // solarpunk.css --sky-bleed-x, --sky-bleed-bottom
  },
  // The props that stand against the page. The monitor's stand under the
  // live window, cut from the mock's own pixels (solarpunk-stand.mjs; its
  // bezel is the page's own: a charcoal frame, turned with the window); the
  // books, cup and mug beside the copy are one still life; the brand's leaf;
  // the ivy on the cards and the panes; the cards' lacquer, a face the page
  // stretches over a card (not a tile: its light falls across the row); and
  // the phone home's own plate (the phone mock with the page painted out,
  // portrait). By night each is graded down to the lamplight from the same
  // art.
  props: [
    ...["day", "night"].flatMap((f) => {
      const gain = f === "day" ? 1 : [0.5, 0.52, 0.6];
      return [
        { name: `lacquer-${f}`, srcs: [{ src: "lacquer-enamel", gain: f === "day" ? 1 : [0.7, 0.7, 0.76] }], resize: { width: 1400 }, pad: 0, shadow: ["0:0:1:0", "0:0:1:0"] },
        { name: `laptop-deck-${f}`, srcs: [{ src: "laptop-deck", gain }], resize: { width: 1750 }, pad: 24, shadow: ["0:7:10:0.4", "0:1.5:2:0.5"] },
        { name: `monitor-stand-${f}`, srcs: [{ src: "monitor-stand", gain }], resize: { width: 408 }, pad: 16, shadow: ["0:3:5:0.2", "0:1:1.5:0.3"] },
        { name: `still-life-${f}`, srcs: [{ src: "still-life", gain }], resize: { width: 1000 }, pad: 16, shadow: ["-6:4:8:0.3", "0:1:2:0.35"] },
        { name: `ivy-drape-${f}`, srcs: [{ src: "ivy-drape", gain }], resize: { width: 680 }, pad: 12, shadow: ["1:3:4:0.22", "0:1:1.5:0.22"] },
        { name: `ivy-tuft-${f}`, srcs: [{ src: "ivy-tuft", gain }], resize: { width: 620 }, pad: 12, shadow: ["1:3:4:0.22", "0:1:1.5:0.22"] },
        ...IVY.map(([name, width]) => ({ name: `${name}-${f}`, srcs: [{ src: name, gain }], resize: { width }, pad: 12, shadow: ["1:3:4:0.22", "0:1:1.5:0.22"] })),
      ];
    }),
    { name: "leaf", srcs: [{ src: "leaf" }], resize: { width: 160 }, pad: 8, shadow: ["1:3:4:0.35", "0:1:1:0.3"] },
    // the phone home's own plate (the phone mock with the page painted out,
    // and the desk, the mug and the books painted out too: they are props of
    // their own, below; portrait 927x1697), drawn by the page as the scene on a
    // phone
    ...["day", "night"].map((f) => ({ name: `phone-${f}`, srcs: [{ src: `plate-phone-nodesk-${f}` }], resize: { width: 927 }, pad: 0, shadow: ["0:0:1:0", "0:0:1:0"] })),
    // The phone's window is a device on the desk, the mock's mug and books
    // standing in front of its lower corners: the desk, the mug and the books
    // are cut from the phone mock's own pixels (solarpunk-phone-props.mjs) and
    // anchored to the window by the page. Kept at the mock's pixels (the mug
    // and the books are drawn about 0.4 of their size on a phone, so a phone's
    // 3x screen is met at 1:1); the mug and books cast a soft shadow on the desk.
    ...["day", "night"].flatMap((f) => [
      { name: `phone-desk-${f}`, srcs: [{ src: `phone-desk-${f}` }], resize: {}, pad: 0, shadow: ["0:0:1:0", "0:0:1:0"] },
      { name: `phone-mug-${f}`, srcs: [{ src: `phone-mug-${f}` }], resize: {}, pad: 12, shadow: ["7:5:9:0.3", "1:1.5:2:0.3"] },
      { name: `phone-books-${f}`, srcs: [{ src: `phone-books-${f}` }], resize: {}, pad: 12, shadow: ["7:5:9:0.3", "1:1.5:2:0.3"] },
    ]),
  ],
};

export default kit;
