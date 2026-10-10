// Paper Diorama (art/briefs/paper.md): a cut-paper shadow box on a bright
// day, cut from its original mock (art/originals/paper.webp). Raws in
// art/raw/paper; prompts in art/prompts/paper.
//
// Five steps run before this recipe, each writing raws it reads:
//   node scripts/kits/paper-layers.mjs    the scene's eight layers, cut from
//                                         the plate (the mock with the
//                                         interface painted out) and its night
//   node scripts/kits/paper-pages.mjs     the project page's and the launch
//                                         page's scenes (four layers each, day
//                                         and night), cut from their own mocks
//   node scripts/kits/paper-phone.mjs     the phone's scene (four layers, day
//                                         and night), cut from its own mock
//   node scripts/kits/paper-front.mjs     the launch page's foreground: the
//                                         hiker and his rock, and the pines at
//                                         both edges, whole pieces of cut paper
//                                         that stand in front of its sheets in
//                                         its mock
//   node scripts/kits/paper-sprites.mjs   the interface's paper (the band, the
//                                         hero's sheets, the window's mat, the
//                                         label, the cards' band, the
//                                         foreground), and the cream card and
//                                         the boards (cream, green, clay), cut
//                                         from generations in register with
//                                         the mock
//
// Alpenglow is the day finish's name (kit.css's, worn by the light rice); its
// art is the mock's bright day. Night is the same diorama by moonlight.

// the mock's own paper, from the generated material's (sampled centres:
// scripts/kits/paper-sprites.mjs leaves each material as generated)
const SHEET = [0.98, 0.956, 0.924]; // the hero's torn sheet
const CARD = [1.01, 1.0, 0.985]; // the cards, their deckle pale in the light
// the night sheets' slate-indigo (kit.css --plate-under by night, #394154)
const SLATE = [0.255, 0.31, 0.47];

// a sprite laid on the stage at the mock's own size (src/app/styles/paper.css
// places each by its box in the frame): its own shadow is the mock's, so the
// kit adds only a breath of contact
const sprite = (name) => ({
  name,
  srcs: [{ src: name }],
  pad: 8,
  shadow: ["0:1:2:0.08", "0:0.5:1:0.10"],
});

// the terracotta and the green torn boards' shadow: short and close
const CLAY_SHADOWS = { normal: ["2:6:6:0.5", "0:1.5:1.5:0.45"], hover: ["3:9:7:0.56", "0:2:2:0.45"], pressed: ["1:3:3:0.38", "0:1:1:0.42"], focus: ["2:6:6:0.5", "0:1.5:1.5:0.45"] };

const kit = {
  raw: "paper",
  out: "public/kit/paper",
  sheet: {
    normal: ["8:14:18:0.26", "1:2:2.5:0.32"],
    // lifted well clear: a much longer, wider, softer and darker shadow
    // (offset + 2 blur stays inside the 96px pad)
    hover: ["16:34:28:0.58", "4:8:8:0.24"],
    pressed: ["3:5:8:0.20", "0.5:1:1.5:0.38"],
    // a sheet pinned closer to the scene than its neighbours
    flat: ["5:9:12:0.22", "0.5:1.5:2:0.34"],
    hoverFlags: ["--catch=0", "--sheen=0.08"],
    mount: 14,
  },
  // A focused sheet lies on an under-sheet in the focus colour. The cream
  // card is the home's cards; the torn sheet every other page's.
  sheets: [
    { name: "sheet-alpenglow", src: "sheet-day-clean", alphaFloor: 8, gain: SHEET, shade: 0.2, under: "c4663f", hover: ["16:34:28:0.78", "4:8:8:0.32"] },
    { name: "sheet-night", src: "sheet-day-clean", alphaFloor: 8, gain: SLATE, shade: 0.45, lift: -0.1, under: "b45a38" },
    { name: "sheet-card-alpenglow", src: "card-cream", gain: CARD, shade: 0.04, lift: 0.1, under: "4f5f4f", normal: ["3:6:8:0.24", "0.5:1.5:2:0.30"], hover: ["10:20:20:0.46", "2:5:6:0.26"] },
    { name: "sheet-card-night", src: "card-cream", gain: SLATE, shade: 0.4, lift: -0.1, under: "8fae8c", normal: ["3:6:8:0.34", "0.5:1.5:2:0.40"], hover: ["10:20:20:0.56", "2:5:6:0.34"] },
  ],
  tile: {
    normal: ["2:5:5:0.30", "0:1:1.2:0.35"],
    hover: ["4:10:5:0.46", "1:2.5:1.5:0.34"],
    pressed: ["1:2:2.5:0.22", "0:1:1:0.40"],
  },
  // The keys are the mock's paper boards: cream, and the sage-green one for
  // the call to act (its cream legend at 7:1 and more). By night the cream
  // board is the night sheets' slate; the green one holds. The terracotta
  // board is the launch page's call to act and the phone's second key
  // (paper-launch.webp, paper-phone.webp), dimmed by night.
  tiles: [
    // (round 10: the day's cream cap is the sheet's own cream, the mock's keys
    // being the stock they stand on, set off by rim light and shadow: the
    // board's mean against the ledge's sheet (227,210,189) was 216,196,173)
    {
      name: "tile-alpenglow",
      src: "board-cream",
      ring: "4f5f4f",
      gain: [0.992, 1.009, 1.039],
      groove: ["--groove=0.35"],
      // (and set off as the mock's are: the top and left edges lit at rest, a
      // closer, deeper shadow under the foot)
      lit: ["--catch=0.8", "--catch-width=4", "--sheen=0"],
      shadow: { normal: ["2:7:6:0.42", "0:1.5:1.5:0.45"], hover: ["3:10:7:0.5", "0:2:2:0.45"], pressed: ["1:3:3:0.34", "0:1:1:0.4"] },
    },
    { name: "tile-night", src: "board-cream", ring: "e58f62", gain: SLATE, groove: ["--groove=0.45"], catch: 1.1 },
    // (the green board casts the mock's deep, dark shadow: it stands well off the sheet)
    {
      name: "tile-signal",
      src: "board-green",
      ring: "f0e2c8",
      gain: [1.05, 1.05, 1.11],
      groove: ["--groove=0.3", "--groove-tint=1e2a20"],
      shadow: { normal: ["2:7:6:0.55", "0:1.5:1.5:0.5"], hover: ["3:10:7:0.6", "0:2:2:0.5"], pressed: ["1:3:3:0.4", "0:1:1:0.45"] },
    },
    { name: "tile-clay", src: "board-clay", ring: "f0e2c8", gain: [0.9, 0.9, 0.9], groove: ["--groove=0.3", "--groove-tint=3a1a10"] },
    { name: "tile-clay-night", src: "board-clay", ring: "f0e2c8", gain: [0.72, 0.68, 0.74], groove: ["--groove=0.4", "--groove-tint=2a120c"] },
  ],
  // the screens' mats on the other pages (the home's window has its own),
  // the day's in the mock's cream mount board (generated lilac-grey)
  mats: [
    { name: "mat-day", src: "mat-day", gain: [1.17, 1.145, 0.97], shade: 0.25, lift: 0.06 },
    { name: "mat-night", src: "mat-night", shade: 0.5, lift: -0.22 },
  ],
  // the mock's matte tacks, one material in four colours: dull bronze (the
  // cards' and every pin's), and sage, ochre and terracotta, painted, for
  // the status lights
  pins: { src: "pins" },
  // the sage tape, and the project page's red one (paper-project.webp), dyed
  // from the sage: the mock's dusty terracotta (#ac6251) lifted a little, so
  // its dark type reads at 5:1
  tapes: [
    { name: "tape-sage", src: "tape-sage" },
    { name: "tape-sage-night", src: "tape-sage-night" },
    { name: "tape-red", src: "tape-sage", gain: [1.06, 0.62, 0.6] },
    { name: "tape-red-night", src: "tape-sage", gain: [0.6, 0.36, 0.4] },
  ],
  props: [
    // the 3D scene's drifting cloud: white paper, as the mock's clouds are
    // (kit.css names it for the day finish)
    {
      name: "cloud-b-alpenglow",
      srcs: [{ src: "cloud-b" }],
      resize: { width: 720, height: 720, fit: "inside" },
      pad: 24,
      shadow: ["6:10:12:0.24", "1:2:2:0.28"],
    },
    // the project page's polished brass push-pin (paper-sprites.mjs), shadowed as the kit's other tacks
    { name: "pin-push", srcs: [{ src: "pin-push" }], pad: 12, shadow: ["2:4:3:0.35", "0.5:1:1:0.40"] },
    // the launch page's two torn keys, and the phone's green one (paper-sprites.mjs TORN): four states each, by day and night, shadowed as a tile (the mock's boards
    // stand off the sheet with a deep, dark shadow: the clay one's short and close, the green one's the same, the cream one's longer, that runs ~18px below its foot)
    ...[
      ["torn-clay", CLAY_SHADOWS],
      ["torn-green", CLAY_SHADOWS],
      ["torn-cream", { normal: ["2:9:11:0.6", "0:2:2:0.42"], hover: ["3:11:12:0.64", "0:2.5:2.5:0.42"], pressed: ["1:4:5:0.46", "0:1:1:0.42"], focus: ["2:9:11:0.6", "0:2:2:0.42"] }],
    ].flatMap(([k, shadows]) =>
      ["", "night-"].flatMap((f) =>
        ["normal", "hover", "pressed", "focus"].map((state) => ({
          name: `${k}-${f}${state}`,
          srcs: [{ src: `${k}-${f}${state}` }],
          pad: 28,
          shadow: shadows[state],
        })),
      ),
    ),
    // the phone's copper tack (paper-sprites.mjs), shadowed as the kit's other tacks
    { name: "pin-copper", srcs: [{ src: "pin-copper" }], pad: 12, shadow: ["2:4:3:0.35", "0.5:1:1:0.40"] },
    ...["band", "band-left", "strip", "hero", "mount", "label", "ribbon", "ledge", "foreground"].flatMap((n) => [sprite(`${n}-day`), sprite(`${n}-night`)]),
    // the pine's and the peak's tips, lying over the strip: the mock's own pixels, no shadow of the kit's
    ...["tips-day", "tips-night"].map((name) => ({ name, srcs: [{ src: name }], pad: 4, shadow: ["0:0:1:0", "0:0:1:0"] })),
    // the launch page's foreground (paper-front.mjs): whole pieces of cut paper standing in front of its sheets, each with its own soft cast shadow
    ...[
      ["hiker", 20, ["2:5:6:0.32", "0.5:1:1.3:0.30"]],
      ["pines-left", 22, ["3:6:7:0.30", "0.5:1:1.5:0.32"]],
      ["pines-right", 22, ["3:6:7:0.30", "0.5:1:1.5:0.32"]],
    ].flatMap(([n, pad, shadow]) => ["day", "night"].map((f) => ({ name: `launch-stage-${n}-${f}`, srcs: [{ src: `launch-stage-${n}-${f}` }], pad, shadow }))),
  ],
  glass: "glass-glare",
  scene: {
    // the home's two finishes, the two further pages' (kit tokens swapped
    // under :has(.detail-hero) and :has(.launch-hero), paper.css) and the
    // phone's (swapped below 900px): those have four layers (sky, hills-far,
    // pines-left, pines-right); a layer with no raw is not built, and the
    // page names none for its slot
    finishes: ["alpenglow", "night", "project-day", "project-night", "launch-day", "launch-night", "phone-day", "phone-night"],
    // the raws' names, back to front (kit.css maps them to the generic
    // slots); each is the plate's own pixels where it shows, so the settled
    // scene is the mock's. The sun stays in the sky (kit.css --k-sun: none).
    layers: ["sky", "mountains", "hills-far", "hills-near", "pines-left-back", "pines-right-back", "pines-left", "pines-right"],
  },
};

export default kit;
