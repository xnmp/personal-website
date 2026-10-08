# Art direction: "Cyanotype"

One of the selectable styles (issue #1; `data-style="cyanotype"`). The Paper
Diorama's brief (`art/BRIEF.md`) sets the system every style shares: one column
of surfaces over a scene, a calm centre, the key light upper left, the screens
in the rice. This file says only what Cyanotype changes. Concept:
`art/raw/cyanotype/concept-a` (brushed prints on watercolour paper over a
photogram), chosen over `concept-b`.

## Thesis

A sun-printing studio. Every surface on the page is a cyanotype print: a
sheet of heavy white watercolour paper brushed with Prussian-blue emulsion,
the brushing stopping short of the paper's edge in dry, ragged strokes that
bite into the blue to different depths, so a margin of bare white paper
frames each blue panel. No two neighbouring prints are the same print. The
prints are held to the wall with short, broad pieces of cream paper tape
across their top corners, each print taped by hand (the pieces' lengths
and angles differ).
Behind them hangs one enormous photogram: the white silhouettes of the
studio's things laid on blue paper when it was exposed (fern fronds at the
left, a keyboard and loose keycaps at the right, clock gears and a pair of
compasses along the foot), the centre open blue. Controls are paper labels:
slips torn from off-white watercolour paper against a ruler, typed in
blue-black ink; the one accent is a label torn from sun-yellow paper. **The screens still run the author's
terminal rice**, in white card window mounts.

## Why it reads as expensive

One process, used honestly. Every surface was made the same way (paper,
emulsion, sunlight), so the page needs no ornament: the brushed edge, the
deckle, the tape and the photogram's soft-edged silhouettes are what a
cyanotype is. The blue is deep and varied (brush marks, paper tooth), the
white is paper rather than a fill, and the photogram keeps its detail at
the edges and its centre open. Narrower than a desktop, the keyboard is
left off the wall (its margin too narrow to hold it clear of the prints);
the ferns and the tools at the foot keep the edges.

## System (what differs from the diorama)

- **Type:** Bodoni Moda (a Didone, the type of the cyanotype's own century,
  `--font-bodoni`) for headlines; Archivo body and JetBrains Mono labels as everywhere. Type on
  the prints is white, as if printed through a stencil.
- **Shape language:** rectangular prints with ragged brushed edges inside a
  clean paper margin; labels torn against a ruler (straight, softly deckled
  edges, no printed rule); round paper dots. Tape only across a print's top corners; strips (masthead, shelf
  heads, feet, picker) are prints without tape, so no heading outranks what
  it heads. Prints in a row hang from one line.
- **Palette (day, the light rice):** Prussian blue `#1f4e8c` and its deep
  `#12325e`, white paper `#f6f4ee`, cream tape `#efe6cf`, blue-black ink
  `#142033`. Sun yellow `#f2c14e` is the one accent (the primary label, the
  active dot, focus).
- **Palette (night):** the same studio after dark, under a desk lamp at the
  upper left: the blues deepen toward ink, the paper and tape warm to a
  lamplit cream, and the photogram falls back into shadow behind the prints,
  warmed by the same lamp and only a little deeper toward the far corner
  (the prints hang evenly lit in front of it: a pool the wall falls off from
  and the prints do not reads as two lights). The yellow holds.
- **Light:** soft daylight from the upper left by day; a warm lamp from the
  upper left by night.
- **Labels:** typed on narrow strips of cream paper tape, in blue-black ink.
  Inline code on a straight-cut slip of white card, in ink (`--chip-ink`).
- **States:** hover lifts a print off the wall (its shadow widens, its
  margin's lit edges catch the light) and a label toward the light (its
  shadow lengthens, its face brightens); pressed presses it flat to the
  wall (it sets down a hair, its shadow closes). Nothing is laid over a whole
  print: a brightening clips the white paper and the mount, and changes the
  colours of the screen it carries, which are the app's own. Focus is one language
  everywhere: the print or label is marked as chosen, as a photographer marks
  a contact sheet, with a sun-yellow rule laid inside its edge (a keyline of
  ink beside it where the surface is light; ink on the yellow label).
- **Paper:** the prints' blue is painted by the page as a seamless tile
  inside the margin, so its tooth and brush marks keep their scale at any
  size; the margin and the brushed edge are the sheet art.
- **Motion:** the diorama's (the photogram's layers part with parallax, as
  if the objects still lay at their heights above the paper); nothing new.

## Raster kit (prompts in `art/prompts/cyanotype/`)

| group | assets |
|---|---|
| scene | `scene/{day,night}/{sky,far,mid,near,left,right}` full-frame layers, cut from `scene-day`; the night layers are the day's graded for lamplight in the build. No sun or moon. |
| sheets | `sheet-{day,night}-{normal,hover,focus,pressed,flat}` 9-slice print (blue cleared); night graded from day |
| paper | `print-{day,night}` seamless tile of brushed emulsion, painted by the page inside the margin |
| strips | `sheet-strip-{day,night}-normal` a print without tape, at near a card's scale, its rails cut from the prints' calmer stretches |
| tiles | `tile-{day,night,signal,signal-night}-{normal,hover,focus,pressed}` 9-slice torn paper label |
| mounts | `mat-{day,night}` 9-slice white card window mount, bevelled |
| fittings | `pin-{brass,green,amber,signal}` paper dots (white ringed in blue-black ink, pale green, coral, sun yellow; a dot sits across a print's edge, over the white margin and the blue), `tape-{day,night}` cream paper tape, `chip-{day,night}` card slip |

No writing, numbers or symbols anywhere in the art (no keycap legends, no
clock numerals): generated characters are not real ones, and text never
belongs in a bitmap.
