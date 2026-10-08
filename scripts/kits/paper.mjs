// Paper Diorama (art/BRIEF.md): torn watercolour sheets, cut-card tiles,
// window mats and pushpins over a cut-paper landscape. Raws in
// art/raw/diorama; prompts in art/prompts/diorama.
//
// Alpenglow, worn by the light rice, is the day paper under the cool light of
// a mountain dusk: the generated day art with a slight per-channel gain, so it
// does not warm to pink against the rose sky.
const ALPENGLOW = [1.005, 0.995, 1.01];

const kit = {
  raw: "diorama",
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
  // A focused sheet lies on an under-sheet in the focus colour; at night a
  // deep terracotta. The night paper's pale torn fibres show on every side,
  // so its rim takes the key light strongly; the day paper's barely shows.
  sheets: [
    // by day the shadow falls on a pale scene, so it is darker to read as far
    { name: "sheet-alpenglow", src: "sheet-day", gain: ALPENGLOW, shade: 0.2, under: "c4663f", hover: ["16:34:28:0.78", "4:8:8:0.32"] },
    { name: "sheet-night", src: "sheet-night", gain: 1, shade: 0.45, under: "b45a38" },
  ],
  tile: {
    normal: ["2:5:5:0.30", "0:1:1.2:0.35"],
    hover: ["4:10:5:0.46", "1:2.5:1.5:0.34"],
    pressed: ["1:2:2.5:0.22", "0:1:1:0.40"],
  },
  // The signal board is printed a shade deeper than generated (gain 0.8) so
  // its cream legend holds 4.5:1; its focus channel shows the cream core and
  // its shaded wall falls toward the card's own terracotta. The slate night
  // board needs more light to show the same hover catch.
  tiles: [
    { name: "tile-alpenglow", src: "tile-day", ring: "c4663f", gain: ALPENGLOW, groove: ["--groove=0.45"] },
    { name: "tile-night", src: "tile-night", ring: "e58f62", gain: 1, groove: ["--groove=0.45"], catch: 1.1 },
    { name: "tile-signal", src: "tile-signal", ring: "f0e2c8", gain: 0.8, groove: ["--groove=0.3", "--groove-tint=8a3c20"] },
  ],
  // the night board's cream core shows bright against it, so its rim is toned
  // down on every side (lift < 0) as well as shaded away from the light
  mats: [
    { name: "mat-day", src: "mat-day", shade: 0.25, lift: 0.06 },
    { name: "mat-night", src: "mat-night", shade: 0.5, lift: -0.22 },
  ],
  pins: { src: "pins" },
  tapes: [
    { name: "tape-sage", src: "tape-sage" },
    { name: "tape-sage-night", src: "tape-sage-night" },
  ],
  props: [
    // the drifting cloud, relit like the painted ones; the plain one graded
    // if the recolour is missing
    {
      name: "cloud-b-alpenglow",
      srcs: [{ src: "cloud-b-alpenglow" }, { src: "cloud-b", gain: [1.0, 0.93, 0.88] }],
      resize: { width: 720, height: 720, fit: "inside" },
      pad: 24,
      shadow: ["6:10:12:0.24", "1:2:2:0.28"],
    },
  ],
  glass: "glass-glare",
  scene: {
    finishes: ["alpenglow", "night"],
    // the raws' names, back to front (kit.css maps them to the generic slots)
    layers: ["sky", "mountains", "hills-far", "hills-near", "pines-left-back", "pines-right-back", "pines-left", "pines-right"],
    // trees further back sit deeper in the air: darker and cooler
    gain: {
      "pines-left-back": [0.84, 0.87, 0.93],
      "pines-right-back": [0.84, 0.87, 0.93],
    },
    sun: { box: [14, 40, 256, 244], at: { alpenglow: [167, 120], night: [155, 129] }, pad: 16 },
  },
};

export default kit;
