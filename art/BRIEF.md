# Art direction: "Paper Diorama"

The previous direction ("The Bench", an instrument rack) is in git at `149a2de`.
Alternatives considered are in issue #1. The Paper Diorama mockups are kept in
`art/concepts/diorama-*.sm.jpg` (full size, untracked: `diorama-*.png`).

## Thesis

The site is a hand-built cut-paper diorama: a shadow box seen straight-on.
Behind everything is a layered paper landscape (sky, mountains, hills and pines),
lit from the upper left. The content consists of sheets of torn watercolour
paper pinned into the scene. Each project is one sheet. Each screenshot is
mounted in a card window mat. Every control is a tile cut from thick card.
**The screens still run the author's terminal rice.** They are the only part
that isn't paper, the way a photo mounted in a scrapbook stays a photo.

## Why this reads as expensive

It reads as expensive because it looks physically made. Deckled edges are torn,
not drawn. Shadows fall where layers of card sit above one another, so depth comes
from stacking, not from blur. Even a single pine is built up: a dark
silhouette sheet with lighter, snow-tipped tiers of branches laid over it,
and each grove stands in two rows. Each material has its own fibre: watercolour paper,
mounting board and painted card. Nothing is a flat CSS colour except text. The
scene is designed to work as negative space: its middle is calm sky and distant
hill, and its incident (sun, pines, river) sits at the edges where the
sheets do not cover it.

## System

- **Grid:** one centred column (max 1180px) of sheets. The gaps between sheets are
  wide enough (28–56px) for the scene to show through, so sheets read as
  separate objects at different depths, not as a stack of panels.
- **Type:** three roles. Newsreader (a serif) for headlines, set large and
  confident. Archivo for body and UI. JetBrains Mono for labels on paper tape,
  key legends and everything inside a screen. No other families.
- **Shape language:** the outer edges of sheets and mats are torn and
  irregular. Cut card has a crisp edge and a small radius. Pins and the sun/moon
  in the sky are discs. There are no perfect rectangles with shadows, and no pill buttons.
- **Palette (alpenglow, the light rice):** a mountain dusk, after an alpine
  alpenglow photograph (`art/raw/diorama/palette-alpenglow.jpg`). The sky runs
  from slate-lilac `#8e9db0` at the top to peach `#f2b48e` at the horizon,
  with a rose-peach sun and peach-lit clouds. The snow on the peaks catches
  rose light; hills are deep blue-green, the river pale steel, the pines dark
  teal dusted with snow. Sheets are cream watercolour paper under that cooler
  light, ink `#23211d`, and terracotta `#c4663f` is the single accent (the
  primary tile and active pin). Sage `#a9b896` is used for label tape. (A
  brighter noon palette was tried and rejected as too vibrant.)
- **Palette (night):** indigo sky, slate and deep blue-green hills, sheets of
  deep slate-indigo card with cream ink. Terracotta stays the accent.
  The moon, the paper stars and the fireflies in the valley are the only
  warm light.
- **Palette (screens):** the rice tokens, unchanged. Screens of the real
  product (the Tauri Explorer page) show the app itself, in the app theme
  nearest the rice, rather than a recoloured mock-up.
- **Light:** the key light is upper-left and soft (a studio softbox). Shadows fall
  down and to the right, and are tight where layers nearly touch and soft where
  they stand off. Every asset follows this.
- **Materials:** cold-press watercolour paper (sheets), mounting board with a
  white core (mats: lilac-grey by day, ink by night; tiles), painted card (scene and props), brass pushpins.
- **Icons:** no decorative icons. Status is shown by a pin's colour. Actions are
  card tiles with live text legends.
- **Ornament density:** low. The scene carries the illustration. Sheets carry
  only a pin and, where useful, a tape label. Nothing stands in front of a
  sheet that isn't fixed to it: a figure in the margin with no ground under it
  reads as a sticker.
- **Motion:** paper motion is slow and soft. On first load the scene opens
  like a pop-up book: the sky fades up, then the mountains, far hills, near
  hills and pines each rise into place back to front with a slight overshoot,
  and the sheets settle down onto it. Scrolling sinks the near layers faster
  than the far ones. Where WebGL runs, the layers are real planes in depth:
  they hinge up from lying flat, part with true parallax as the pointer
  moves, and shade the layer behind them; motes of dust (fireflies at night)
  hang in the valley. On hover a sheet lifts: its shadow widens and softens
  over 180ms, swapped as authored art. A tile presses flat: its edge band
  shortens and it moves 1px down over 70ms. One cloud drifts slowly (150s).
  Under reduced motion the scene is still and finished. Nothing scales.
- **Responsive invariants:** sheets stack in one column on a phone and keep
  their torn edges (9-slice corners are never scaled). The scene recomposes,
  but its calm centre stays behind the content. The sun (the moon at night) is
  upper left, where the key light comes from, inside the frame's margin.

## Raster kit (all generated; prompts in `art/prompts/diorama/`)

| group | assets |
|---|---|
| scene | `scene/{alpenglow,night}/{sky,mountains,hills-far,hills-near,pines-left-back,pines-right-back,pines-left,pines-right}` full-frame layers (`layer-*` prompts; the groves from `grove-*`, split into back and front rows); `scene-{alpenglow,night}` is them flattened, for the social cards |
| sheets | `sheet-{alpenglow,night}-{normal,hover,focus,pressed}` 9-slice torn paper, shadow baked in (alpenglow is the `sheet-day` generation, relit) |
| tiles | `tile-{alpenglow,night,signal}-{normal,hover,focus,pressed}` 9-slice cut card |
| mats | `mat-{day,night}` 9-slice window mat for screens |
| fittings | `pin-{brass,green,amber,signal}`, `tape-sage` 9-slice label strip |
| props | `cloud-b-alpenglow` (the drifting cloud) |
| screen art | one 1-bit dither per project, used as an alpha mask and recoloured by the rice (kept from The Bench) |
