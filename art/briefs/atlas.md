# Art direction: "Celestial Atlas"

One of the selectable styles (issue #1; `data-style="atlas"`). The Paper
Diorama's brief (`art/BRIEF.md`) sets the system every style shares: one column
of surfaces over a scene, a calm centre, the key light upper left, the screens
in the rice. This file says only what Celestial Atlas changes. Concept:
`art/raw/atlas/concept-b` (enamel plates in engraved brass over a gilt star
chart), chosen over `concept-a` (parchment in brass in an observatory), whose
parchment and polished brass are the Paper Diorama's paper and Solarpunk's
brass again.

## Thesis

A great engraved star atlas and the instruments that read it. Behind
everything, one enormous chart: by night printed in gold on deep navy, by day
the same plate pulled in sepia on ivory and hand-coloured; constellations as
engraved figures joined by dotted lines, the Milky Way as a stipple, an
astrolabe at the left edge and an orrery at the right, the centre calm sky.
Every surface on the page is an instrument plate: a field of enamel (ivory by
day, navy by night) in a frame of engraved, gilded brass, a small degree arc
engraved in each corner, a brass screw fixing each corner of the content
plates. Controls are the plates' language small: a field of enamel in a slim
burnished gilt bezel, a plain double moulding with no knurling or
graduations (ornament belongs to the plates' corners, never the smallest
controls), the plates' enamel (ivory by day, navy by night), the primary
crimson; screens sit behind a slim gilt bezel; status markers
are glass jewels in brass settings; labels are engraved on narrow gilt
strips, and inline code on a slip of ivory enamel. **The screens still run
the author's terminal rice**.

## Why it reads as expensive

Precision and one precious metal. The gilt is engraved, not polished: fine
line-work along the frames, graduations only where an instrument has them (the
corners' arcs), so the rails stay calm. The enamel is deep and even; the chart
behind is all fine engraving, its centre empty sky.

## System (what differs from the diorama)

- **Type:** IM Fell English (the Fell types, cut in the century of the great
  engraved atlases, `--font-fell`) for headlines; Archivo body and JetBrains
  Mono labels as everywhere. Ink on ivory is a deep navy `#13213f`; on navy,
  ivory `#f1e8d2`.
- **Shape language:** rectangles in gilt frames with engraved line-work;
  round jewels; screws at the content plates' corners only (strips are
  unscrewed, so no heading outranks what it heads). Plates in a row are set
  level.
- **Palette (night, the dark rices):** navy `#13213f`, deep navy `#0b1428`,
  gold `#c9a35a`, brass `#b8893f`, ivory `#f1e8d2`. Crimson `#9e2b2f` is the
  one accent (the primary plate, the active jewel, focus).
- **Palette (day, the light rice):** the daylight plate: ivory enamel and
  paper, sepia engraving, hand-colouring in faded blue, ochre and rose, the
  same gilt.
- **Light:** warm lamplight from the upper left, in both finishes.
- **Labels:** engraved on narrow gilt strips, in navy. Inline code on a slip
  of ivory enamel, in navy (`--chip-ink`). A keyboard shortcut named on the
  page is a keycap on the same slip of ivory enamel: named, never pressed.
- **States:** hover lifts a plate toward the lamp (its shadow widens, the gilt
  catches the light); pressed sets it back (its shadow tightens, the gilt
  dims; enamel is fired colour and holds). Focus is one language everywhere:
  a band of the primary's crimson enamel laid in along the inside of the
  gilt (a plate's frame, following its corners and the arcs engraved into
  them; a button's bezel), with a keyline on its inner side, navy against
  the ivory and gilt against the navy; ivory on the crimson button.
- **Enamel:** the plates' field is painted by the page as a seamless tile
  inside the frame, so its fine surface keeps its scale at any size.
- **Motion:** the diorama's (the instruments part from the chart with
  parallax); nothing new.

## Raster kit (prompts in `art/prompts/atlas/`)

| group | assets |
|---|---|
| scene | `scene/{day,night}/{sky,left,right,near}` full-frame layers, cut from `scene-night` (the gilt chart) and `scene-day` (the daylight plate) |
| sheets | `sheet-{day,night}-{normal,hover,focus,pressed,flat}` 9-slice gilt frame (field cleared), `sheet-{day,night}-sheen`; night graded from day |
| enamel | `enamel-{day,night}` seamless enamel tile (ivory, navy), painted by the page inside the frame |
| strips | `sheet-strip-{day,night}-normal` the frame without screws, its corners mitred |
| tiles | `tile-{day,night,signal,signal-night}-{normal,hover,focus,pressed}` 9-slice enamel button in a slim gilt bezel (ivory, navy, crimson) |
| mounts | `mat-{day,night}` 9-slice slim gilt bezel |
| fittings | `pin-{brass,green,amber,signal}` jewels in brass (clear, emerald, amber, crimson), `tape-{day,night}` gilt label strip, `chip-{day,night}` ivory enamel slip |

No writing, numbers or symbols anywhere in the art: generated characters are
not real ones, and text never belongs in a bitmap.
