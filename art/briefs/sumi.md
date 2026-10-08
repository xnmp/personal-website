# Art direction: "Sumi-e Ink"

One of the selectable styles (issue #1; `data-style="sumi"`). The Paper
Diorama's brief (`art/BRIEF.md`) sets the system every style shares: one column
of surfaces over a scene, a calm centre, the key light upper left, the screens
in the rice. This file says only what Sumi-e Ink changes. Concept:
`art/raw/sumi/concept-a` (hanging-scroll mounts), chosen over `concept-b`
(feathered washi sheets held by tape), which read as the Paper Diorama in
another palette.

## Thesis

An ink-wash landscape gallery. Each surface on the page is a hanging scroll
(kakejiku): a panel of cream kozo washi in a mount of mottled, pale celadon
woven silk, with a thin gold line along the washi and silk-wrapped rollers
top and bottom whose turned lacquer knobs stand out at the corners. The
scrolls hang in front of a sumi-e landscape: misty mountains in graded ink,
a gnarled pine at the left, bamboo and a pavilion at the right, empty mist in
the middle. Controls are slips of thick matte washi card with the mounts'
hair-thin gold line inset round them; the one accent is vermilion, the colour
of a seal. **The screens
still run the author's terminal rice**, mounted in indigo silk.

## Why it reads as expensive

Restraint and real craft. Mounting silk, washi fibre and lacquer are each
used for what they are, and nothing is decorated: the gold line and the rods
are how a scroll is made. Most of every surface is empty paper; the
landscape carries the mood and keeps its detail at the edges, as a sumi-e
painting leaves its centre to mist.

## System (what differs from the diorama)

- **Type:** Cormorant (high-contrast old-style serif with a brush-like italic,
  `--font-cormorant`) for headlines; Archivo body and JetBrains Mono labels as
  everywhere.
- **Shape language:** rectangular scroll mounts with square corners; rollers
  with turned end knobs on the content scrolls only (the strips, masthead,
  shelf heads, feet and picker, are the same silk mount without rollers, so no
  heading outranks what it heads); cards with softly rounded corners; round
  lacquered beads. No torn edges on the mounts (the washi's fibres are inside
  them). Scrolls in a row hang from one line; a shelf's are one height, the
  opening pair each its own length.
- **Palette (day, the light rice):** warm washi `#f3ecdc`, sumi ink `#1d1d1f`
  and its greys, pale celadon silk `#c9d3c0`, indigo `#2f3e5c`, ochre
  `#c49a5a`, muted gold `#b89a5a`. Vermilion `#c8371e` is the one accent (the
  primary card, the active bead, focus).
- **Palette (night):** the same gallery by moonlight: the scrolls' washi
  ink-dyed near black (`#1e2024`) with cream type, their celadon silk silvered
  by the moon (`#6a776f`), so the mounts stand off the landscape; their knobs
  black lacquer; the landscape in dark indigo washes under a pale moon at the
  upper left. The vermilion deepens to `#d9532e`.
- **Light:** soft daylight from the upper left by day; moonlight from the
  upper left by night (cool, no warm light without a lamp in the scene).
- **Labels:** typed on narrow strips of indigo-dyed washi by day, pale silk
  by night (the tape role), in cream and in ink. Inline code on a
  straight-cut slip of pale washi by day, indigo by night, in ink and in
  cream (its own ink, `--chip-ink`).
- **States:** hover lifts a scroll off the wall (its shadow widens, its silk
  and knobs catch the light) and a card toward the light (matte: no gloss);
  pressed presses it back (its shadow tightens, its silk dims). By night a
  card's edge takes the moon at rest, as the scrolls' silk does. Focus is one
  language everywhere: a band of vermilion silk laid in on the paper just
  inside the gold line (a scroll's, round its washi; a card's), with an ink
  keyline on its inner side where the paper is light; cream on a vermilion
  card. The gold line stays whole.
- **Paper:** the scrolls' washi is painted by the page as a seamless tile
  inside the mount, so its fibres keep their scale at any size.
- **Motion:** the diorama's (the landscape's layers part with parallax; mist
  drifts); nothing new.

## Raster kit (prompts in `art/prompts/sumi/`)

| group | assets |
|---|---|
| scene | `scene/{day,night}/{sky,far,mid,near,left,right}` full-frame layers, cut from `scene-day` (the night layers graded darker in the build), the sky painted clear of its disc; `scene/{day,night}/sun` the sun and the moon, generated alone, hung by the page in the margin behind the pine, painted into the wash (no shadow) |
| sheets | `sheet-{day,night}-{normal,hover,focus,pressed,flat}` 9-slice scroll mount (washi cleared), `sheet-{day,night}-sheen` |
| paper | `washi-{day,night}` seamless tile, painted by the page inside the mount |
| strips | `sheet-strip-{day,night}-normal` the same mount without rollers |
| tiles | `tile-{day,night,signal,signal-night}-{normal,hover,focus,pressed}` 9-slice matte washi card with a gold line |
| mounts | `mat-{day,night}` 9-slice indigo silk screen mount |
| fittings | `pin-{brass,green,amber,signal}` lacquer beads (ink, jade, ochre, vermilion), `tape-{day,night}` washi strip, `chip-{day,night}` washi slip |

No calligraphy, seals or writing anywhere in the art: generated characters
are not real ones, and text never belongs in a bitmap.
