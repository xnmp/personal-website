# Art direction: "Solarpunk"

One of the selectable styles (issue #1; `data-style="solarpunk"`). The Paper
Diorama's brief (`art/BRIEF.md`) sets the system every style shares: one column
of surfaces over a scene, a calm centre, the key light upper left, the screens
in the rice. This file says only what Solarpunk changes. Concept:
`art/raw/solarpunk/concept-a` (chosen over `concept-b`, gilt enamel plaques,
which read heavier and busier).

## Thesis

A golden-hour greenhouse workstation. The page is a set of frosted glass
panes held in thin riveted brass frames, standing in a Victorian glasshouse
full of plants. Controls are enamel plates in brass bezels, like the dials on
an old instrument; status is an enamel indicator stud. **The screens still
run the author's terminal rice**, mounted in brass bezels.

## Why it reads as expensive

Two honest materials, used precisely: polished brass that catches the low sun
on its top and left bevels, and frosted glass that diffuses it. Ornament is
structural (a rivet where a frame needs fixing), never applied. The scene
does the storytelling: hanging baskets, monstera and a potting bench frame
the edges; the centre is warm haze and distant glass.

## System (what differs from the diorama)

- **Type:** Fraunces (soft old-style serif, `--font-fraunces`) for headlines;
  Archivo body and JetBrains Mono labels as everywhere.
- **Shape language:** square-cornered panes with a narrow brass moulding and a
  rivet in each corner; rounded enamel plates; round studs. No torn edges.
- **Palette (day, the light rice):** honey light, brass `#b8893b`, verdigris
  `#5f9c8a`, moss `#4f6b3a`, pale frosted glass `#dfe3cf`, ink bottle-green
  `#1f2b22`. Marigold enamel `#de8a2c` is the one accent (the primary tile,
  the active stud, focus).
- **Palette (night):** the glasshouse by moonlight and lantern: deep smoky
  bottle-green glass `#1f2e28` with cream ink, antique brass, moss enamel
  tiles. Fireflies in the scene are the warm light.
- **Light:** low warm sun from the upper left by day; lanterns from the upper
  left by night. Every asset follows it.
- **Hierarchy:** content panes are riveted; the strips (masthead, shelf
  heads, feet, the picker) are the same glazing without rivets, so no
  heading outranks what it heads. Nothing pins a pane: it stands in its frame
  (the one stud left is the flagship's status lamp).
- **Labels:** a section's kicker is typed on a small brass name-plate (the
  tape role); the other small labels are etched into the glass (a dark cut,
  lit on its lower lip). Content clears the frame by its focus strip.
- **States:** hover lifts a pane into the low sun (its frame's lit sides
  catch warm light, the glass takes a sheen) and raises a plate the same
  way; pressed sinks it out of the light. Focus is one language everywhere: a
  strip of marigold enamel laid in along the inside of a frame (a pane's
  brass, under its rivets; a plate's bezel), with a dark keyline where the
  surface beside it is light. Where marigold would vanish the strip is cream
  enamel: on a marigold plate, and by night on a moss plate, whose lamplit
  bezel is as bright and as yellow as marigold.
- **Glass:** the panes are real glass on the page: the frame is cut out of
  its generated pane and the page lays a tiled frost over the scene behind,
  blurred, so the greenhouse shows through. The frame shades the glass below
  and right of it and glints along its lit edges; the sun (the moon at
  night) leaves a soft pool on each pane from the upper left.
- **Motion:** the diorama's (the scene's layers part with parallax; dust motes
  by day, fireflies at night); nothing new.

## Raster kit (prompts in `art/prompts/solarpunk/`)

| group | assets |
|---|---|
| scene | `scene/{day,night}/{sky,mid,near,left,right}` full-frame layers, cut from `scene-day` |
| sheets | `sheet-{day,night}-{normal,hover,focus,pressed,flat}` 9-slice riveted brass frame (pane cleared), `sheet-{day,night}-{light,sheen}`, `sheet-strip-{day,night}-normal` unriveted |
| glass | `frost-{day,night}` seamless tile, painted by the page under a backdrop blur |
| tiles | `tile-{day,night,signal,signal-night}-{normal,hover,focus,pressed}` 9-slice enamel plate |
| mounts | `mat-{day,night}` 9-slice brass bezel |
| fittings | `pin-{brass,green,amber,signal}` studs, `tape-{day,night}` brass name-plate |
