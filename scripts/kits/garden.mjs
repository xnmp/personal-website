// Natural Garden (art/briefs/garden.md): tablets of honey limestone with a
// rounded, hand-dressed edge set into a walled cottage garden, glazed tiles, glazed
// beads, copper plant labels, slate slips. Raws in art/raw/garden; prompts in
// art/prompts/garden.
//
// Only the day finish of the surfaces is generated. Night is the same garden
// under a full moon: the stone, tiles and fittings graded from the day's
// (`gain`, MOON), so the two finishes are the same stone by construction;
// the scene has its own moonlit layers (cut from scene-night). One focus
// language: a band of terracotta glaze laid in along the inside of the
// edge (a tablet's, a tile's), with a dark keyline where the surface is
// light; cream on the terracotta tile. The tablets carry no ornament: the
// garden is theirs.

// moonlight: the stone cooled to a silvered blue-grey and dimmed, dark
// enough that cream type, small labels too, holds at better than 5:1
const MOON = [0.39, 0.44, 0.56];
// the sun on honey limestone: the raw came back a little grey and dull
const SUN = [1.05, 1.07, 1.08];
// glaze keeps its colour a little better than stone under the moon
const MOON_GLAZE = [0.52, 0.57, 0.68];
// a tile's focus band inside its glazed rim, its corners as round as the
// tile's
const TILE_FOCUS = (key) => ["--ring=12:18", "--ring-radius=18", "--crown=0.2", ...(key ? ["--halo=10.6:12,18:19.4", `--halo-color=${key}`] : [])];
// tiles in moonlight cast deeper shadows on the dark ground
const NIGHT_SHADOW = {
  normal: ["2:5:5:0.5", "0:1:1.2:0.55"],
  hover: ["6:14:7:0.66", "1:3:2:0.42"],
  pressed: ["1:2:2.5:0.4", "0:1:1:0.6"],
};
// lifted in moonlight: the glaze's rim catches a little cool light; the
// day's broad sheen on the dark glaze reads as a wash laid over it
const NIGHT_HOVER = ["--catch=0.6", "--catch-width=6", "--sheen=0.05", "--light=dfe8f6"];
// the glaze's mottle repeats along a wide tile (tileRails): its lit end's
// tone cross-faded into the repeat, so the hand-over is not a step
const GLAZE_FACE = { blend: 8 };

// The tablets are slabs of dressed stone: a flat face, its edge cut back in
// a chiselled chamfer that meets the face in a sharp arris and its
// neighbour in a mitre at each square corner, lit along the top and left
// and shaded along the bottom and right as it came (no relight). The face is cleared for the
// page's own stone (stone-*.webp, kit.css --plate-fill), so its grain keeps
// its scale at any size; the art keeps the arris. `frame` is where the flat
// face begins inside it, per side, at the base width (measured on the raw's
// luminance profile); the arris, a 2px hand-over and the focus band laid in
// inside it must all fit in the 56px a corner keeps unstretched, the
// rounded corner with them (the centre slice is the page's). No shade or
// glint on the face: it is the same stone as its edge.
//
// The generator lights the chamfer as a material of its own (the sunlit
// slope near white and yellow, the shaded one a saturated brown): its
// light and shade are drawn a little toward the face's colour (`temper`;
// scripts/framed-pane.mjs), so it is the slab's own stone, but only a
// little: the cut reads by its light and shade (held to the face's colour
// it reads as a pale outline, not a cut).
//
// The long edges keep their grain and wear: each rail is rebuilt from
// pieces of itself (scripts/mitre.mjs lengthenRails; never from another
// rail: the light differs from side to side) to a run longer than most
// tablets, and tiled between the corners (tileRails; garden.css
// --plate-repeat): stretched, a chip smears into a streak. Only the rail's
// quieter half is cut from (`quiet`): its chips and cracks, shuffled however
// often, come round as a row of ticks, so they stay where they were drawn,
// by the corners, as a worn slab's are. Two slabs were generated (tablet-day, -b), and the page
// sets them in turn (garden.css), so no two neighbours share their chips.
const FACE = { dx: 0, dy: 0, soft: 1, shadeColor: "000000", shadeAlpha: 0, glintAlpha: 0 };
const TILED = { sides: ["t", "r", "b", "l"], overlap: 32 };
const STONE = { rivets: false, glass: FACE, feather: 2, temper: { light: 0.15, shade: 0.2 }, tileRails: TILED };
// the moon catches the arris's upper and left slopes (scripts/relight-edge.mjs):
// graded from the day, the lit edge barely parts from the face; lifted to
// the silvered blue-white of the moonlit stones painted round it (the
// grade's own blue, brought up), not a neutral grey
const MOONLIT = { shade: 0.12, lift: 0.5, band: 26 };
// and by day the sun: the chamfer came back lit almost evenly (its sunlit
// slopes a few percent above the face, the shaded ones a tenth below), so
// the slab read as a pale board in a frame, not a block cut back at its
// edge; the upper and left slopes catch the sun, the others fall away
const SUNLIT = { shade: 0.1, lift: 0.09, band: 26 };
// the chamfer is the face's stone: the page's stone laid into it at the
// size the page prints it (scripts/build-kit.mjs `grain`; garden.css
// --plate-fill-size 640, the slabs at 0.625 of their art, the strips at
// 0.36), so edge and face are one block, pitted alike. Laid a little
// stronger than the face's: the sheet's encoding and the edge's own light
// soften fine grain the tiled face keeps (by night no stronger than by
// day: laid deeper, the moonlit edge reads as concrete's black aggregate
// round a smoother face)
const GRAIN = (finish, k) => ({ grain: { fill: `stone-${finish}`, size: 640, k, gain: finish === "day" ? 1.3 : 1.2 } });
const SLABS = [
  { id: "", src: "tablet-day", frame: { t: 38, r: 32, b: 34, l: 35 }, seed: 3 },
  { id: "-b", src: "tablet-day-b", frame: { t: 31, r: 28, b: 34, l: 35 }, seed: 7 },
];
// the chamfer and a little of the face: what a chip shows in
const QUIET = { share: 0.5, depth: 40 };
// rails 1000px across (about 620 on the page) and 760 down
const TABLET = { ...STONE, width: 590, lengthen: { length: [1000, 760], quiet: QUIET } };
// the strips (masthead, feet, picker) are plain slabs, their sides cut to a
// strip's height. They print at 0.36 of their art (garden.css), the slabs at
// 0.625: the strip's shadow is drawn deeper by that ratio, so it falls on
// the garden as far as a slab's does
const STRIP_SHADOW = ["10.4:19:24:0.26", "1.7:3.5:4.3:0.34"];
const STRIP = { ...STONE, src: "sheet-strip-day", width: 700, frame: { t: 38, r: 36, b: 34, l: 38 }, lengthen: { length: [1600, null], seed: 5, quiet: QUIET }, states: ["normal"], normal: STRIP_SHADOW };
// focus: terracotta glaze laid in along the inside of the arris, square at
// the corners as the face is, a little proud along its middle, with a dark
// keyline against the pale stone by day; by night the stone is dark enough
// for the glaze alone (a shade deeper: bright, it glows like a lamp)
const GLAZE_DAY = { side: "pane", width: 9, key: 2, keyColor: "2d3328", color: "c46a43", grain: 0.8, crown: 0.22, radius: 3 };
const GLAZE_NIGHT = { side: "pane", width: 9, color: "b65f3c", grain: 0.8, crown: 0.22, radius: 3 };

const kit = {
  raw: "garden",
  sheet: {
    // the pane's sides on the lossy block grid (scripts/build-kit.mjs): the
    // face the page paints runs under the sliver it leaves
    alignPane: true,
    normal: ["6:11:14:0.26", "1:2:2.5:0.34"],
    // lifted toward the sun: a longer, wider, softer shadow, the edge's lit
    // sides catching it
    hover: ["16:34:28:0.52", "4:8:8:0.22"],
    pressed: ["3:5:8:0.22", "0.5:1:1.5:0.4"],
    flat: ["5:9:12:0.24", "0.5:1.5:2:0.36"],
    hoverFlags: ["--catch=0.8", "--catch-width=26", "--sheen=0.08", "--light=fff2d6"],
    // set back: its shadow tightens, the edge drops a little out of the
    // light, the stone a shade dimmer (and the page's stone with it,
    // garden.css --plate-press-dim); deeper, or the edge darkened more than
    // the face, it reads as disabled or as another, greyer stone
    pressedFlags: ["--catch=0.12", "--catch-width=20", "--dim=0.93"],
  },
  sheets: [
    ...SLABS.flatMap(({ id, seed, ...slab }, i) => [
      {
        ...TABLET,
        ...slab,
        lengthen: { ...TABLET.lengthen, seed },
        ...SUNLIT,
        ...GRAIN("day", 0.625),
        name: `sheet-day${id}`,
        gain: SUN,
        fillet: GLAZE_DAY,
        // the sun's pool on the stone, and (lifted) its warmth across it:
        // the same for every slab, so the first carries them
        ...(i ? {} : { light: { color: "fff4dc", alpha: 0.1 }, sheen: { color: "fff6e0", alpha: 0.34 } }),
      },
      {
        ...TABLET,
        ...slab,
        ...MOONLIT,
        ...GRAIN("night", 0.625),
        lengthen: { ...TABLET.lengthen, seed },
        name: `sheet-night${id}`,
        gain: MOON,
        fillet: GLAZE_NIGHT,
        // the moon catches the lifted slab's arris faintly: the day's catch
        // screened onto the dark stone turns it to white trim, and lifts every
        // step in the silhouette's normal into a seam
        hoverFlags: ["--catch=0.2", "--catch-width=26", "--sheen=0.08", "--light=dfe8f6"],
        // the moonlit stone is dark: dimmed by the day's share it barely
        // changes, so it dims further (garden.css --plate-press-dim)
        pressedFlags: ["--catch=0.12", "--catch-width=20", "--dim=0.84"],
        // the moon's pool, cool, from the upper left: a sheen on the stone
        ...(i ? {} : { light: { color: "c9d6ee", alpha: 0.16 }, sheen: { color: "dfe8f6", alpha: 0.24 } }),
      },
    ]),
    { ...STRIP, ...SUNLIT, ...GRAIN("day", 0.36), name: "sheet-strip-day", gain: SUN, light: { color: "fff4dc", alpha: 0.1 } },
    { ...STRIP, ...MOONLIT, ...GRAIN("night", 0.36), name: "sheet-strip-night", gain: MOON, light: { color: "c9d6ee", alpha: 0.16 } },
  ],
  tile: {
    normal: ["2:5:5:0.30", "0:1:1.2:0.35"],
    // lifted toward the sun: off the stone (a longer, softer shadow), the
    // glaze catching the light on its upper left
    hover: ["6:14:7:0.5", "1:3:2:0.28"],
    pressed: ["1:2:2.5:0.22", "0:1:1:0.40"],
    hoverFlags: ["--catch=0.6", "--catch-width=6", "--sheen=0.22", "--light=fff2d6"],
    // pressed into the stone: the glaze dims, its lit edge goes dark
    pressedFlags: ["--catch=0.6", "--catch-width=8", "--dim=0.86"],
  },
  // glazed tiles: sage the neutral, terracotta the primary (a shade deeper,
  // so cream type holds on it). The glaze's mottle repeats along a wide tile
  // rather than stretching into streaks (garden.css --key-repeat).
  tiles: [
    { name: "tile-day", src: "tile-day", tileFace: GLAZE_FACE, ring: "c46a43", focusFlags: TILE_FOCUS("1e241a") },
    { name: "tile-night", src: "tile-day", tileFace: GLAZE_FACE, gain: MOON_GLAZE, ring: "e09068", focusFlags: TILE_FOCUS("0e120c"), shadow: NIGHT_SHADOW, hoverFlags: NIGHT_HOVER },
    // the terracotta catches less of the light: cream type must hold on it
    // (at 4.5:1, its semibold label is not large text)
    { name: "tile-signal", src: "tile-signal", tileFace: GLAZE_FACE, gain: 0.82, ring: "f6ead4", focusFlags: TILE_FOCUS("3a1608"), hoverFlags: ["--catch=0.45", "--catch-width=6", "--sheen=0.08", "--light=fff2d6"] },
    { name: "tile-signal-night", src: "tile-signal", tileFace: GLAZE_FACE, gain: [0.62, 0.62, 0.7], ring: "f6ead4", focusFlags: TILE_FOCUS("2a1006"), shadow: NIGHT_SHADOW, hoverFlags: NIGHT_HOVER },
  ],
  // a screen set in a recess cut into the stone, edged in bronze
  mats: [
    { name: "mat-day", src: "mat-day" },
    { name: "mat-night", src: "mat-day", gain: MOON_GLAZE },
  ],
  // glazed beads, graded by night with the glaze of the tiles
  pins: { src: "pins", night: MOON_GLAZE },
  tapes: [
    // labels stamped on a strip of weathered copper plant label
    { name: "tape-day", src: "tape-day" },
    { name: "tape-night", src: "tape-day", gain: MOON_GLAZE },
    // inline code chalked on a slip of slate
    { name: "chip-day", src: "chip-day" },
    { name: "chip-night", src: "chip-day", gain: 0.8 },
  ],
  // the tablets' face, tiled by the page inside its edge, at the tablet's
  // own mean (grain only: a broad cloud of tone would repeat): the stone's
  // pitting and veining, as tone alone (`mono`: the raw's own hues in it,
  // its brown specks, read as stains on paper), softened a little (crisp,
  // pits read as stray punctuation in the type over them), at a grain fine
  // enough to be the chamfer's own stone
  fills: [
    { name: "stone-day", src: "stone-day", size: 768, alpha: 1, highpass: 32, soften: 0.6, mean: "e7d8bd", gain: 0.9, mono: true },
    { name: "stone-night", src: "stone-day", size: 768, alpha: 1, highpass: 32, soften: 0.6, mean: "565964", gain: 0.6, mono: true },
  ],
  scene: {
    finishes: ["day", "night"],
    layers: ["sky", "far", "mid", "near", "left", "right"],
    // the night layers came back crisper and more saturated than the day's
    // watercolour, the flowers in daylight colour: moonlight takes colour
    // out, and the wash stays soft
    grade: { night: { saturation: 0.55, soften: 1 } },
    gain: {
      "left-night": [0.82, 0.86, 0.95],
      "right-night": [0.82, 0.86, 0.95],
      "near-night": [0.85, 0.88, 0.96],
    },
    // the moon hangs on its own, so the page keeps it whole in the margin
    // (kit.css .scene-sun): the night sky painted without it, the disc
    // generated alone
    sun: {
      sky: { night: "sky-night-clear" },
      sprites: { night: "moon-night" },
      size: 150,
      pad: 16,
      // painted into the wash, not cut and stood off it: no shadow
      shadow: ["0:0:1:0", "0:0:1:0"],
    },
  },
};

export default kit;
