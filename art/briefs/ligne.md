# Art direction: "Ligne Claire"

One of the selectable styles (issue #1; `data-style="ligne"`). The Paper
Diorama's brief (`art/BRIEF.md`) sets the system every style shares: one column
of surfaces over a scene, a calm centre, the key light upper left, the screens
in the rice. This file says only what Ligne Claire changes, the light among
it: the album's sun is upper right, as on every rock of its establishing
shot. Concept:
`art/raw/ligne/concept-a` (comic panels over a desert outpost), chosen over
`concept-b` (a ship's bridge), whose cockpit and pilot fill the centre the
scene must keep open.

## Thesis

A page from a European science-fiction comic album, drawn in the clear line:
every outline an even weight of the scene's own warm black ink (the panel's
border the heaviest, what sits in a panel a finer line), drawn with a pen,
not a ruler (a panel's line gives a little of its width along a side and
is full at the corners; the fittings' finer lines are drawn true, where a
2px line that gives reads as a dry, broken stroke), no hatching, flat colour on the
album's paper (a tint printed on paper still shows its fibre: every fitting
carries the panels' paper grain), shadows as crisp flat shapes. Every surface on the page is
an inset panel laid over the establishing shot, as an album sets inset
panels over a splash: a cream field of paper inside one ink border, in a
narrow margin of white paper outside it; controls
are caption boxes, white for the neutral and coral for the primary;
a shelf opens on a pale yellow narrative caption, as a sequence does (pale
yellow is the album's narration, never what you press);
screens sit in powder-blue inset frames; status markers are flat signal
lamps lettered beside the status they mark; labels are mint caption tags,
and inline code is tinted flat powder blue, no line. Behind it all, the establishing shot: a desert planet of apricot dunes
and mesas, a rock arch and an antenna mast at the left, a domed outpost and
its rocket at the right, the centre open sky and sand. **The screens still
run the author's terminal rice**.

## Why it reads as expensive

The discipline of the line. Two ink weights, the panels' and a finer one
for what sits in them, one flat colour per shape, one shadow direction, nothing modelled: everything the eye reads is a
decision. What you can open stands off the page on a flat shadow, a cut
shape, crisp, offset to the lower left; what only holds its content is
printed flat on the page, so the two never read alike. The scene keeps its
detail at the edges and its centre to sky.

## System (what differs from the diorama)

- **Type:** Barlow Semi Condensed (a clean, slightly condensed sans, the
  album's lettering set in type, `--font-barlow`) for headlines and for
  everything a comic letters (captions, tags, a shelf's caption, a panel's
  number, and the small labels: a strip's facts, a status, a figure's
  number, a section's heading, the foot), in capitals; Archivo body; the
  terminal's JetBrains Mono only on the screens and in code. Ink is the
  scene's warm black `#1c1414`.
- **Shape language:** rectangles with slightly rounded corners inside an
  even ink line: 6px round a panel (its 4px paper margin round that), 3px
  round a caption, 2px round a tag, lamp or a
  screen's window (its powder-blue frame a flat band inked only at the
  window, so no stack of outlines builds up inside a card); round lamps. Panels in a row are set level, as on a
  page: where one panel of a tier holds less, a second panel stacks under
  it (the opening tier: a closer cut of the establishing shot under the
  promise), and a page's screenshots are tiers of their own, the print at
  its size with its caption under it and, set level beside it, a closer cut
  of the establishing shot (a different place in it on each tier), never
  prints laid to alternate sides. The night sky's clouds are inked as the
  day's are.
- **Palette (day, the light rice):** cream `#fbf3e1`, mint `#cfe8d5`, powder
  blue `#bcd7ea`, apricot `#f2c39b`, pale yellow `#fbe7a1`, ink `#1c1414`.
  Coral `#e2553f` is the one accent (the primary caption, lettered in ink,
  the active lamp, focus). Lamps print mint and apricot a tone deeper
  (`#9fd3ad`, `#f0b07a`), so a lit one reads on the cream.
- **Palette (night):** the same album's night pages: the panels' cream
  turned to an ink-blue field (`#4757a6`, the hue of the night sky)
  inside the same black line, light enough that the line still draws it,
  type in cream; the neutral caption the night's deep blue `#2b3577`
  lettered in cream, the coral primary lifted (`#ee6448`) so it is what
  calls, the narration's yellow dimmed under both; the paper margin as the
  lamp leaves it; the desert under an indigo sky with stars, laid a tone
  below the panels' blue so a panel parts from the ground as from the sky,
  the outpost lit.
- **Light:** even daylight from the upper right, one direction for the scene
  and the page (the scene's rocks, arch, planet and outpost, and every flat
  shadow, which falls to the lower left); shadows are flat shapes, never
  soft. A lamp's glass carries the flat white shape of a highlight, upper
  right.
- **Labels:** mint caption tags in ink. Inline code tinted flat powder blue
  behind its words, no line, in ink (`--chip-ink`), within the line of
  text. A keyboard shortcut is printed once, as a white keycap flat on the
  page where the text names it (the foot, the launch page); the masthead's
  buttons carry their words alone.
- **States:** hover lifts a panel off the page (its flat shadow steps further
  out) and a caption box with it; pressed sets it down (its shadow tucks in).
  A state's shadow replaces the resting one, never lies over it, and changes
  at once. Focus is one language everywhere: a coral band laid inside the
  ink border (a panel's, a caption's), with an ink line inside it; cream on
  the coral caption.
- **Motion:** the diorama's (the scene's layers part with parallax); nothing
  new.
- **Scene:** the generated layers retouched to the clear line (every shape
  outlined, flat fills, no hatching or airbrushed glow). The arch and mast
  are anchored to the left edge and the outpost and rocket to the right, and
  on a narrow screen they are drawn smaller rather than cropped away
  (`--left-anchor`, `--right-anchor`, `--side-span`); on a tablet or a
  phone, where the panels fill the width, they are drawn as tall as the
  screen, so the mast and the rocket rise into the sky above the masthead
  (on a phone a band of open sky deep enough for the mast's lamp and dish
  and the rocket's nose cone).

## Raster kit (prompts in `art/prompts/ligne/`)

| group | assets |
|---|---|
| scene | `scene/{day,night}/{sky,far,mid,near,left,right}` full-frame layers, cut from `scene-day` and `scene-night` (the same desert by night) |
| sheets | `sheet-{day,night}-{normal,hover,focus,pressed,flat}` 9-slice paper margin and ink border (the field cleared: the page paints it, `--plate-fill`); night graded from day (the cream to ink-blue, the ink stays black). Encoded losslessly: lossy chroma would bleed the focus band into the line |
| paper | `paper-{day,night}` seamless album paper, its fibre only, at the field's cream and night blue, painted by the page inside the line |
| strips | `sheet-strip-{day,night}-normal` the same panel at the strips' scale |
| tiles | `tile-{day,night,signal,signal-night}-{normal,hover,focus,pressed}` 9-slice caption box |
| mounts | `mat-{day,night}` 9-slice powder-blue inset frame |
| fittings | `pin-{brass,green,amber,signal}` flat lamps (cream, mint, apricot, coral), `tape-{day,night}` mint caption tag, `chip-{day,night}` powder-blue code tint, `cap-{day,night}` printed keycap, `caption-{day,night}` pale yellow narrative caption |

No writing, numbers or symbols anywhere in the art: generated characters are
not real ones, and text never belongs in a bitmap.
