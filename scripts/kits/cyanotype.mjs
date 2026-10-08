// Cyanotype (art/briefs/cyanotype.md): prints brushed in Prussian blue on
// white watercolour paper, taped at their top corners, paper labels, a white
// card window mount, over a photogram. Raws in art/raw/cyanotype; prompts in
// art/prompts/cyanotype.
//
// Only the day finish is generated. Night is the same studio after dark under
// a desk lamp: every asset graded from the day's (`gain`, LAMP), so the two
// finishes are the same paper by construction; the lamp's falloff across the
// studio, prints and photogram alike, is the page's (cyanotype.css). One focus language: a
// sun-yellow rule laid inside the edge, as a photographer marks the chosen
// frame on a contact sheet.

// lamplight: the blues deepen, the whites warm to a lamplit cream (not
// kraft: the paper stays the brightest thing in the room)
const LAMP = [0.97, 0.91, 0.79];
// the sun-yellow label holds under the lamp: it stays the one accent
const LAMP_SIGNAL = [1, 0.97, 0.9];
// a label's focus: a grease-pencil rule laid inside its torn edge, with ink
// keylines either side where the label is light (yellow alone would not hold
// on white paper); on the yellow label, a finer rule of ink (a broad one
// outweighs every other line on the page). Ruled square to the label's
// bounds (--ring-radius), not along its torn edge: a rule following the
// deckle steps where the 9-slice stretches it.
const LABEL_FOCUS = (key) =>
  key ? ["--ring=10:19", "--ring-radius=1", "--crown=0.12", "--halo=8.5:10,19:20.5", `--halo-color=${key}`] : ["--ring=10:13", "--ring-radius=1", "--crown=0.12"];
// labels lit by the lamp cast deeper shadows on the darker wall
const NIGHT_SHADOW = {
  normal: ["2:5:5:0.45", "0:1:1.2:0.5"],
  hover: ["6:14:7:0.66", "1:3:2:0.42"],
  pressed: ["1:2:2.5:0.38", "0:1:1:0.55"],
};

// The prints: the blue is cleared for the page's own (print-*.webp, kit.css
// --plate-fill), so its tooth and brush marks keep their scale at any size.
// The paper margin and the brushed edge are the art: a coat brushed on by
// hand, drying out at the end of each stroke into bites of bare paper that
// reach into the blue to very different depths. There is no line for the
// cut: `frame` is where solid blue begins on each side (the deepest bite on
// it, measured on the base), and the art hands over to the page's blue over
// `feather` px past it (scripts/framed-pane.mjs). Margin, the deepest bite
// and a sheet's focus rule laid in inside it must fit in the 56px a corner
// keeps unstretched (the centre slice is the page's, never drawn): based at
// 410, the deepest is 40.
//
// The edge is the print's one ornament, so it must never read as a trim:
// - no two neighbouring prints are the same print. Two were generated
//   (sheet-print-a, -b), each also hung turned end for end (`turn`: a print
//   lit evenly has no up), and the page hangs the four in turn
//   (cyanotype.css), each taped down differently;
// - the rails are rebuilt from pieces of themselves (scripts/mitre.mjs
//   lengthenRails, each print from its own `seed`) to a run longer than
//   most surfaces that wear them, so a bite does not come round again
//   within one, before they are made to tile (tileRails; a stretch smears
//   their dry ends into streaks; cyanotype.css --plate-repeat,
//   --strip-repeat). A strip's sides are cut down to its height rather
//   than squeezed into it. Each rail begins with the piece that best
//   follows the copy of its far corner the repeat hands over from
//   (`splice`), not the piece drawn after its near corner: a dry streak
//   crossing that hand-over ends square against a bite.
// No shade or glint on the pane: it is the same sheet as its margin.
const PANE = { dx: 0, dy: 0, soft: 1, shadeColor: "000000", shadeAlpha: 0, glintAlpha: 0 };
const TILED = { sides: ["t", "r", "b", "l"], overlap: 32 };
const PRINT = { rivets: false, glass: PANE, width: 410, feather: 6, tileRails: TILED };
const turned = ({ t, r, b, l }) => ({ t: b, r: l, b: t, l: r });
const A = { src: "sheet-print-a", frame: { t: 31, r: 35, b: 31, l: 40 } };
const B = { src: "sheet-print-b", frame: { t: 38, r: 36, b: 40, l: 38 } };
// short, broad pieces of tape, one over each top corner, laid down and in
// from the wall across it, most of it on the print: it holds the corner,
// and its end on the wall stays clear of the next print's. Each print is
// taped by hand: the pieces' lengths and angles differ, and no two that meet
// across a gutter (the right of one print, the left of the next, in the
// order the page hangs them) lie at mirrored angles, which would read as a
// row of chevrons. Cream crepe paper, translucent: the print and the wall
// show through it, and it throws a fine shadow where it lifts at its torn
// ends. [angle, length, in from the side, down from the top]
const tape = (pieces) =>
  pieces.map(([angle, size, x, y], i) => ({
    src: "tape-piece",
    size,
    corner: i ? "tr" : "tl",
    at: [x, y],
    angle: i ? -angle : angle,
    aspect: 2.2,
    alpha: 0.78,
    tint: [1.06, 1.05, 1.03],
    shadow: [1, 2, 2.5, 0.5],
  }));
// the four prints the page hangs in turn (cyanotype.css), each a print, a
// way up, a quilting seed and its tape; across the gutters: a|b 25/55,
// b|c 50/22, c|d 30/58, d|a 55/28
const PRINTS = [
  { id: "", ...A, seed: 3, decal: tape([[28, 66, -15, -14], [25, 60, -12, -13]]) },
  { id: "-b", ...B, seed: 5, decal: tape([[55, 62, -13, -16], [50, 68, -16, -17]]) },
  { id: "-c", ...A, frame: turned(A.frame), turn: true, seed: 11, decal: tape([[22, 64, -14, -12], [30, 58, -11, -14]]) },
  { id: "-d", ...B, frame: turned(B.frame), turn: true, seed: 17, decal: tape([[58, 68, -15, -17], [55, 60, -12, -15]]) },
];
// The page repeats a rail a whole number of times along its edge
// (--plate-repeat: round), so the rail is scaled by the edge's length over
// the nearest whole number of rails: a rail as long as the longest sheet
// is squeezed to a third on a card (its brush bites crowd) and drawn out on
// a wide one (they smear). A rail about as long as a card's side keeps
// every sheet within about 0.75-1.3 of the drawn size, its bites alike from
// a card to a page-wide print. A sheet's rails run 505px (about 480 on the
// page, 370 on a phone) each way
const SHEET = { lengthen: { length: [505, 505], pool: true, splice: TILED.sides } };
// A page's own prints (a section, a detail page's opening, its foot) run
// the width of the column, about 1100px: a card's rails would come round
// twice along one edge, a bite seen twice on one print. Two wide prints,
// their long rails a page's width, hang in turn there (cyanotype.css, from
// 900px; narrower, a page's prints are a card's width and hang the four).
// They are never pressed, so only their resting and flat art is made.
const WIDE = { lengthen: { length: [1100, 505], pool: true, splice: TILED.sides }, states: ["normal", "flat"] };
// a strip's 960 across (about 630 on the page), its sides cut to 120. A
// strip hangs at near a card's scale (cyanotype.css), so its bites are as
// coarse as a card's, but it is short: its rails are cut only from the
// prints' calmer half (`quiet`: the pieces whose bites reach least far
// in), so the brushed edge on a strip stays shallow and its line clears it
const STRIP = { lengthen: { length: [960, 120], pool: true, quiet: { share: 0.5, depth: 40 }, splice: TILED.sides }, states: ["normal"] };
// focus: the grease-pencil rule, on the blue just inside its brushed edge:
// matte wax, taking the paper's tooth only faintly (more reads as foil)
const MARK = { side: "pane", width: 9, color: "f2c14e", grain: 0.35 };

const kit = {
  raw: "cyanotype",
  sheet: {
    // the pane's sides on the lossy block grid (scripts/build-kit.mjs): the
    // face the page paints runs under the sliver it leaves
    alignPane: true,
    // a firm contact shadow: the margin must part from the photogram's whites
    normal: ["6:10:13:0.3", "1:1.5:2:0.42"],
    // lifted off the wall: a longer, wider, softer shadow
    hover: ["12:25:20:0.54", "3:6:6:0.24"],
    // pressed flat to the wall (and set down a hair, cyanotype.css
    // --plate-press-shift): the shadow closes to a line under the margin
    pressed: ["1:1.5:2:0.22", "0:0.5:1:0.5"],
    flat: ["4:7:9:0.24", "0.5:1:1.5:0.36"],
    // the paper margin's lit edges catch the light
    hoverFlags: ["--catch=0.35", "--catch-width=14", "--sheen=0", "--light=fffaf0"],
    // laid back flat: its shadow tightens, and it keeps its light (a dimmed
    // margin beside the undimmed mount glued to it reads as soiled paper; a
    // catch on a deckled edge follows its every fibre and comes out as
    // streaks)
    pressedFlags: ["--catch=0", "--dim=1"],
  },
  sheets: [
    ...PRINTS.flatMap(({ id, seed, ...print }, i) => [
      {
        ...PRINT,
        ...print,
        lengthen: { ...SHEET.lengthen, seed },
        name: `sheet-day${id}`,
        fillet: MARK,
        // the light's pool is the same for every print: the first carries
        // it (lifted, the whole print brightens: cyanotype.css)
        ...(i ? {} : { light: { color: "ffffff", alpha: 0.06 } }),
      },
      {
        ...PRINT,
        ...print,
        lengthen: { ...SHEET.lengthen, seed },
        name: `sheet-night${id}`,
        gain: LAMP,
        fillet: MARK,
        hoverFlags: ["--catch=0.35", "--catch-width=14", "--sheen=0", "--light=ffd9a0"],
        // the lamp's pool across each print from the upper left, as across
        // the photogram behind
        ...(i ? {} : { light: { color: "ffd9a0", alpha: 0.16 } }),
      },
    ]),
    // the page's own prints, wide: two of the prints, taped as the middle
    // two cards are, with their own seeds
    // (each named for the print it is: sheet-*-w-b, sheet-*-w-c)
    ...[PRINTS[1], PRINTS[2]].flatMap(({ seed, id, ...print }) => {
      const lengthen = { ...WIDE.lengthen, seed: seed + 20 };
      return [
        { ...PRINT, ...print, ...WIDE, lengthen, name: `sheet-day-w${id}` },
        { ...PRINT, ...print, ...WIDE, lengthen, name: `sheet-night-w${id}`, gain: LAMP },
      ];
    }),
    // the strips (masthead, shelf heads, feet, picker): two of the prints,
    // without tape, hung in turn
    ...PRINTS.filter((_, i) => i === 0 || i === 3).flatMap(({ id, seed, ...print }, i) => [
      { ...PRINT, ...print, ...STRIP, decal: null, lengthen: { ...STRIP.lengthen, seed }, name: `sheet-strip-day${id}`, ...(i ? {} : { light: { color: "ffffff", alpha: 0.06 } }) },
      { ...PRINT, ...print, ...STRIP, decal: null, lengthen: { ...STRIP.lengthen, seed }, name: `sheet-strip-night${id}`, gain: LAMP, ...(i ? {} : { light: { color: "ffd9a0", alpha: 0.16 } }) },
    ]),
  ],
  tile: {
    normal: ["2:5:5:0.30", "0:1:1.2:0.35"],
    // lifted toward the light: off the wall (a longer, softer shadow), its
    // lit edge and face brightening from the upper left (matte card: no gloss)
    hover: ["6:14:7:0.5", "1:3:2:0.28"],
    pressed: ["1:2:2.5:0.22", "0:1:1:0.40"],
    hoverFlags: ["--catch=0.4", "--catch-width=6", "--sheen=0.2"],
    // laid flat: it dims evenly (a catch on its torn edge reads as a
    // moulded bevel)
    pressedFlags: ["--catch=0", "--dim=0.88"],
  },
  // labels: torn from off-white watercolour paper; the primary torn from
  // sun-yellow paper, its focus rule in ink
  tiles: [
    { name: "tile-day", src: "tile-day", mitre: true, ring: "f2c14e", focusFlags: LABEL_FOCUS("142033") },
    { name: "tile-night", src: "tile-day", mitre: true, gain: LAMP, ring: "f2c14e", focusFlags: LABEL_FOCUS("142033"), shadow: NIGHT_SHADOW },
    { name: "tile-signal", src: "tile-signal", mitre: true, ring: "142033", focusFlags: LABEL_FOCUS(null) },
    { name: "tile-signal-night", src: "tile-signal", mitre: true, gain: LAMP_SIGNAL, ring: "142033", focusFlags: LABEL_FOCUS(null), shadow: NIGHT_SHADOW },
  ],
  mats: [
    { name: "mat-day", src: "mat-day" },
    { name: "mat-night", src: "mat-day", gain: LAMP },
  ],
  // status heads: the off one (a complete project's) is a white paper dot,
  // and it sits across a print's top edge, over the white margin and the
  // blue: white alone vanishes on the margin, dyed the prints' blue on the
  // blue, so it is ringed in the typed ink (`rim`), its ring holding it on
  // the margin and its white on the blue
  pins: { src: "pins", rim: { brass: { color: "142033", width: 4 } } },
  tapes: [
    { name: "tape-day", src: "tape-day" },
    { name: "tape-night", src: "tape-day", gain: LAMP },
    // inline code: a straight-cut slip of white card, a shade down from
    // white so it never outshines the headline
    { name: "chip-day", src: "chip-day", gain: 0.92 },
    { name: "chip-night", src: "chip-day", gain: LAMP.map((g) => g * 0.92) },
  ],
  // the prints' blue, tiled by the page inside the margin, at the sheets'
  // own mean: its brush marks and tooth, with the mottle of a brushed coat
  // (up to 64px; broader would repeat as a cloud from tile to tile), the
  // emulsion's flecks softened (crisp, they read as punctuation by small type);
  // by night the day's mean under the LAMP, as the prints' own blue is, or the
  // page's blue parts from the art's along the brushed edge in a straight step
  fills: [
    // (held to 0.8 of its contrast: Bodoni's hairlines must hold over it;
    // its flecks of bare paper taken out, `despeckle`: each print sets the
    // tile under its title, where a fleck reads as a stray apostrophe)
    { name: "print-day", src: "print-day", size: 768, alpha: 1, highpass: 64, soften: 0.8, mean: "083975", gain: 0.8, despeckle: 36 },
    { name: "print-night", src: "print-day", size: 768, alpha: 1, highpass: 64, soften: 0.8, mean: "08345c", gain: 0.7, despeckle: 36 },
  ],
  scene: {
    finishes: ["day", "night"],
    layers: ["sky", "far", "mid", "near", "left", "right"],
    // night is the day's photogram after dark, graded
    source: { night: "day" },
    // the ferns came back on their paper: keyed off its blue
    key: { layers: ["left"], ground: "0b3e73", light: "eeeeec" },
    // the objects came back modelled (the keyboard's keys lit and bevelled,
    // the gears and the ruler crinkled like foil), not printed: each is
    // printed flat, the bare paper white (the prints' margin) wherever it
    // kept the light off, so the ferns and the keyboard are one process
    photogram: { layers: ["left", "mid", "near", "right"], color: "f6f4ee", cover: { default: [140, 190], near: [70, 130] } },
    // and the paper came back crinkled too, the ghosts of what stood above
    // it with it: their mottle kept, their grain the prints' own (their
    // fill), in the open blue and the silhouettes alike
    paper: { layers: ["sky", "far"], tile: "print-day", size: 720, blur: 6, amount: 1 },
    // after dark the photogram falls back into shadow behind the prints: the
    // blue toward ink, the silhouettes to a dim blue-grey, warmed by the
    // lamp as the prints in front of it are (the same LAMP), and only a
    // little deeper toward the far corner: the prints hang evenly lit in
    // front of it, and a pool the wall falls off from and they do not reads
    // as two lights
    falloff: { night: { at: [0.1, 0.05], reach: [1.7, 1.5], floor: 0.74, tint: [1.16, 1.07, 0.94] } },
    // the gain darkens and cools it all toward ink; the lamp warms back
    // only what it lights, the silhouettes, to the prints' cream (`warm`,
    // by each pixel's lightness), leaving the ground its blue
    grade: { night: { warm: [1.25, 1.1, 0.8] } },
    gain: {
      "sky-night": [0.37, 0.41, 0.48],
      "far-night": [0.37, 0.41, 0.48],
      "mid-night": [0.36, 0.39, 0.46],
      "near-night": [0.37, 0.40, 0.47],
      "left-night": [0.36, 0.38, 0.45],
      "right-night": [0.36, 0.38, 0.45],
    },
  },
};

export default kit;
