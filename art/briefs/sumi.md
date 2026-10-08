# Art direction: "Sumi-e Ink"

One of the selectable styles (issue #1; `data-style="sumi"`). The Paper
Diorama's brief (`art/BRIEF.md`) sets the system every style shares: one column
of surfaces over a scene, the screens in the rice. This file says what Sumi-e
Ink changes. Concept: `art/raw/sumi/concept-a` (hanging-scroll mounts), chosen
over `concept-b` (feathered washi sheets held by tape).

**The concept is the target.** The page is judged side by side with
`concept-a` at the concept's own size (1672x941): it must read as that
picture, not as a page in its palette. The signature devices below are
requirements; a missing one is a defect, not a simplification.

## Thesis

A gallery of hanging scrolls before a sumi-e landscape. Each panel is a
kakejiku: cream kozo washi inside a mount of pale celadon silk, a hair-thin
gold line round the washi, dark lacquered rollers across its top and foot
whose turned knobs stand out past the silk. The flagship is the one scroll
mounted in navy brocade, a jade disc and a vermilion tassel hanging from its
roller. Seals in cinnabar mark the brand, the paintings and the work; brush
strokes of ink head the cards. Behind, a landscape in ink: a gnarled pine on a
cliff at the left, misty ranges across the top, a pavilion, waterfall and
bamboo at the right, cranes, a pale sun, calligraphy inscribed in the corners.

## Signature devices (requirements)

1. **Masthead on torn washi:** a band of cream washi across the top of the
   page, its lower edge torn; on it the brand set large in a heavy serif with
   a square vermilion seal (重, read *chóng*) beside it, a line of serif text
   after a hairline rule, and the page links as plain serif words at the
   right. No silk mount, no buttons. Shelf heads, the footer and the picker
   are the same torn washi.
2. **Hanging scrolls with rollers:** every content panel has visible dark
   wooden rollers top and foot, their knobs standing out past the silk;
   the silk wide enough to read as a mount.
3. **The flagship in navy brocade,** with a jade bi disc and a vermilion silk
   tassel hanging from the right end of its top roller.
4. **A heavy serif headline** (EB Garamond, bold), and serif throughout the
   page's prose and labels; mono only on the screens and for code.
5. **The primary button a vermilion seal-stamp impression** (broken, grainy
   edges, cream serif lettering); the secondary a slip of washi card in a
   thin, dry sumi-brush border, lettered in ink.
6. **Cards headed by an ink brush swash** (the card's number in cream on a
   broad dry-brush stroke), **a round seal at the top right** for the status
   (vermilion, jade, ochre or ink), and a vermilion arrow at the foot.
7. **The opening scroll is a painting too:** a small ink landscape painted on
   its washi at the lower right, a small seal beside it.
8. **Calligraphy and seals in the landscape:** a vertical inscription with its
   seal at the lower left (行遠) and the lower right (山水有相逢), in the
   corners the panels leave clear; the sun a pale disc at the upper right.

## System

- **Type:** EB Garamond (`--font-garamond`): headlines bold, prose regular,
  labels in small capitals. JetBrains Mono on screens and inline code only.
- **Palette (day):** warm washi `#f3ecdc`, sumi ink `#1d1d1f` and its greys,
  pale celadon silk `#c9d3c0`, navy brocade `#26304a`, indigo `#2f3e5c`,
  ochre `#c49a5a`, muted gold `#b89a5a`, vermilion `#c8371e` (the one accent:
  seals, the primary stamp, arrows, focus).
- **Palette (night):** the same gallery by moonlight: the washi ink-dyed near
  black with cream type, the silk silvered, the brocade a deeper navy; the
  landscape in dark indigo washes; brush strokes and calligraphy in pale gofun
  white where black ink would vanish; seals stay cinnabar.
- **Light:** soft daylight from the upper left; moonlight by night.
- **States:** hover lifts a scroll off the wall (its shadow widens, its silk
  catches the light) and a button toward the light; pressed presses it back.
  Focus is one language: a band of vermilion silk inside the gold line (a
  scroll's; a button's border), an ink keyline inside it on light paper.
- **Paper:** the washi inside every mount and band is painted by the page as a
  seamless tile, so its fibres keep their scale at any size.

## Raster kit (prompts in `art/prompts/sumi/`)

| group | assets |
|---|---|
| scene | `scene/{day,night}/{sky,far,mid,near,left,right}`, the left and right with their inscriptions (`calligraphy-{left,right}`) inked in; `scene/{day,night}/sun` |
| scrolls | `sheet-{day,night}-*` celadon mount with rollers; `sheet-brocade-{day,night}-*` the flagship's navy brocade mount |
| bands | `sheet-strip-{day,night}-normal` torn washi band (masthead, shelf heads, footer, picker) |
| buttons | `tile-{day,night}-*` washi card in a dry-brush border; `tile-signal{,-night}-*` vermilion stamp |
| fittings | `pin-*` round seals (ink, jade, ochre, vermilion); `tape-{day,night}` ink brush swash; `chip-{day,night}` washi slip; `seal-brand` 重; `pendant` jade disc and tassel; `vignette-{day,night}` the opening scroll's painting |
| paper | `washi-{day,night}` seamless tile |

Generated characters are checked by eye before use: only 重, 行遠 and 山水有相逢
appear, each as written above.
