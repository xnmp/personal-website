# Art direction — "The Bench"

Concepts compared in `art/concepts/` (a-rack, b-dusk, c-bigbox). **A wins.** B reads as
generic AI dark-glass. C is kitsch and invites generated box-art slop.

## Thesis

The site is a precision instrument rack on a workbench. Each project is a
**module** slotted between two machined rails. Each module has a printed faceplate,
a status LED and a recessed screen. The chassis is a fixed physical object.
**The screens run the author's terminal rice**, so pressing `t` reflashes the
screen palette (the colours come from the dotfiles) while the hardware stays the same.

## Why this reads as expensive

Everything on it has a physical reason to exist. Screws hold plates. LEDs report
status. The screens are recessed glass, so their light sits *below* the faceplate
surface. Ornament comes from manufacturing (chamfers, engraving, silkscreen),
not decoration. The negative space is printed faceplate, not empty void.

## System

- **Grid:** a 12-column rack between two rails. Modules span 4, 6 or 12 columns.
  The gutter is the rail gap, so modules never float.
- **Type:** Archivo is the silkscreen printing. Wide (`wdth` 112–125) uppercase is
  used for labels, normal width for headlines and body. JetBrains Mono appears
  *only inside screens*, since it is the terminal. Two families, no more.
- **Shape language:** rectangles with 45° chamfered corners, round screw heads,
  pill LEDs. No border-radius soup.
- **Palette (chassis):** the anodised graphite variant (dark rices) and the
  powder-coat warm white variant (paper rice). Printing ink is the plate's
  complement. Signal vermilion `#F0502A` is the single mechanical accent (the
  primary keycap and active LED).
- **Palette (screens):** the rice tokens, verbatim.
- **Light:** the key light is upper-left. Edge catches sit on top and left chamfers,
  and occlusion sits on bottom and right seams. Every asset obeys this.
- **Materials:** bead-blasted anodised aluminium, powder coat, smoked glass, ABS
  keycaps, machined steel screws.
- **Icons:** none decorative. Status is an LED colour, and actions are keycaps
  with live text legends.
- **Ornament density:** low. Silkscreen index numbers, one engraved rule per module,
  screws only at plate corners.
- **Motion:** mechanical. A keycap travels 1px over 70 ms when pressed and
  springs back over 140 ms. An LED fades over 120 ms. A screen powers on with a
  scanline wipe and phosphor bloom over 380 ms, only once on enter. Hover is under
  160 ms and is a state-art swap (edge catch brightens), never scale.
- **Responsive invariants:** rails persist at all widths and become thinner on
  mobile. Modules stack to one column and keep the full plate craft (9-slice
  corners are never scaled). Screens keep their aspect ratio.

## Raster kit (all generated, provenance in `art/prompts/`)

| group | assets |
|---|---|
| chassis | `plate-{dark,light}-{normal,hover,pressed}` 9-slice faceplates |
| screens | `bezel-{dark,light}` 9-slice recessed screen frame, `glass` glare overlay |
| keycaps | `key-{dark,light,signal}-{normal,hover,pressed}` 9-slice |
| fittings | `rail-{dark,light}` repeat-y, `led-{off,green,amber,signal}` |
| environment | `bench-{dark,light}` backdrop |
| screen art | one 1-bit dither per project, used as an alpha mask and recoloured by the rice |
