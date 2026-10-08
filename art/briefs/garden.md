# Art direction: "Natural Garden"

One of the selectable styles (issue #1; `data-style="garden"`). The Paper
Diorama's brief (`art/BRIEF.md`) sets the system every style shares: one column
of surfaces over a scene, a calm centre, the key light upper left, the screens
in the rice. This file says only what Natural Garden changes. Concept:
`art/raw/garden/concept-b` (limestone tablets set into a walled garden),
chosen over `concept-a` (cream botanical plates with flower sprays), which
was cream paper again, as the Paper Diorama and Sumi-e Ink are.

## Thesis

A walled cottage garden in late-morning sun, painted as a botanical
watercolour. Every surface on the page is a tablet of pale honey limestone
set into the garden: dressed stone with a chiselled, bevelled border.
Controls are glazed ceramic tiles, sage for the neutral and terracotta for
the primary; screens sit in bronze-edged recesses cut into the stone;
status markers are glazed ceramic beads; labels are stamped on strips of
weathered copper plant label, and inline code is chalked on slips of slate.
Behind it all, the garden: foxgloves and hollyhocks at the left, an old
gate and a stone wall with climbing roses at the right, a flagstone path and
clipped box along the foot, the centre open sky and haze. **The screens
still run the author's terminal rice**.

## Why it reads as expensive

Real garden materials, each used for what it is: dressed stone for the
tablets, glaze for what you press, bronze where a screen is set, copper and
slate for labels, as a garden's own furniture is. The painting keeps its
detail at the edges and its centre to sky; the tablets carry no ornament of
their own: the garden round them is theirs.

## System (what differs from the diorama)

- **Type:** EB Garamond (a classical book face, the type of the old
  gardening books, `--font-garamond`) for headlines; Archivo body and
  JetBrains Mono labels as everywhere. Ink on the stone is a deep moss-black.
- **Shape language:** rectangular tablets with a crisp chiselled chamfer and
  square corners, lit on their upper left and shaded on their lower right;
  softly rounded tiles in a glossy glaze (its sheen across their upper third,
  their rim lit and shaded as the tablets'), round beads. Strips (masthead, shelf heads, feet, picker) are
  the same plain tablets. Tablets in a row are set level.
- **Palette (day, the light rice):** limestone `#e8dcc0`, moss `#4f6b45`, sage
  `#8fa77f`, rose `#d98c9a`, ink `#2d3328`. Terracotta `#c46a43` is the one
  accent (the primary tile, the active bead, focus).
- **Palette (night):** the same garden under a full moon: the stone cooled
  to a silvered blue-grey, the garden in blue shadow with its colour drained,
  the moon at the upper left (a sprite the page keeps whole in the margin).
- **Light:** warm late-morning sun from the upper left by day; moonlight
  from the upper left by night.
- **Labels:** stamped on strips of weathered copper plant label, in ink.
  Inline code chalked on a slip of slate, in cream (`--chip-ink`).
- **States:** hover lifts a tablet toward the light (its shadow widens, its
  bevel catches the sun) and a tile with it; pressed sets it back (its
  shadow tightens, the stone dims). Focus is one language everywhere: a
  band of terracotta glaze laid in along the inside of the bevel (a
  tablet's, a tile's), with a dark keyline beside it where the surface is
  light; cream on the terracotta tile.
- **Stone:** the tablets' face is painted by the page as a seamless tile
  inside the bevel, so its grain keeps its scale at any size; the bevel is
  cut from the same block, and carries the same grain at the same scale
  (laid into the edge's art), never a smooth moulded frame round it.
- **Motion:** the diorama's (the garden's layers part with parallax); nothing
  new.

## Raster kit (prompts in `art/prompts/garden/`)

| group | assets |
|---|---|
| scene | `scene/{day,night}/{sky,far,mid,near,left,right}` full-frame layers, cut from `scene-day` and `scene-night` (the same garden by moonlight) |
| sheets | `sheet-{day,night}-{normal,hover,focus,pressed,flat}` 9-slice tablet (face cleared), `sheet-{day,night}-sheen`; night graded from day |
| stone | `stone-{day,night}` seamless limestone tile, painted by the page inside the bevel |
| strips | `sheet-strip-{day,night}-normal` the same tablet at the strips' scale |
| tiles | `tile-{day,night,signal,signal-night}-{normal,hover,focus,pressed}` 9-slice glazed tile |
| mounts | `mat-{day,night}` 9-slice bronze-edged recess |
| fittings | `pin-{brass,green,amber,signal}` glazed beads (cream, sage, ochre, terracotta), `tape-{day,night}` copper plant label, `chip-{day,night}` slate slip |

No writing, numbers or symbols anywhere in the art: generated characters are
not real ones, and text never belongs in a bitmap.
