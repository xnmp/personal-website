# Art direction: "Natural Garden"

One of the selectable styles (issue #1; `data-style="garden"`). The target is
the **original exploration mock**, `art/originals/garden.webp` (full
resolution `art/raw/originals/garden.png`, 1672x941), the one with the cat
on the ledge. Its finish is the day (the light rice, `paper`). Judge the page
against it, never against `art/raw/garden/concept-*`. The Paper Diorama's
brief (`art/BRIEF.md`) sets what every style shares; this file says what
Natural Garden is.

## Thesis

A cottage garden in soft late-morning sun, painted as a botanical
watercolour: climbing roses over a pale plastered wall, foxgloves, ferns,
daisies and lavender, a stone cottage and a picket gate at the right, a
flagstone path at the foot. The page is written on the garden: dark moss-ink
serif type straight on the plaster, a low drystone wall across the screen
with the author's things on its ledge (a mug, a stack of books, a sleeping
tabby cat, a potted rose), the projects on cream cards stood against it, the
row named on a stone plaque in a pen script. Hand-lettered signs and stones
in the margins carry the mottoes. A small green sprig follows every name.
**The screens still run the author's terminal rice**: light under the light
rice, dark under the dark ones.

## Signature devices (requirements; positions in the original's px)

1. **The garden.** Climbing roses arching across the top edge (x 0-1000 at
   the top, down the left wall); tall pink foxgloves at the left (x 0-90,
   y 280-900); ferns, lavender and daisies along the foot; a stone cottage
   with chimneys at the upper right (x 1430-1672, y 60-330) behind a picket
   gate (x 1500-1672, y 270-500); a flagstone path at the foot. The middle
   behind the copy and the window is pale sunlit plaster, calm and low in
   contrast, its leaf shadows as soft as the mock's.
2. **The creatures.** A monarch butterfly on the trellis at the upper right
   (x 1395-1452, y 62-122) and a **crisp** bumblebee over the foxgloves
   (ink x 198-232, y 452-482: stripes, legs and wings readable). The bee is
   the mock's own pixels in the wall sprite and the plate (no sprite of its
   own); the two are measured to the mock's edge energy (below).
3. **The signs and stones in the margins**, hand-lettered: the wooden board
   "Good Software Brighter Days" with a sprig (x 18-170, y 110-325); the
   small board "Better Things Ahead" with a heart on the gate (x 1555-1640,
   y 330-420); the galvanised watering can "Softer Systems Brighter People"
   (x 0-200, y 690-935); the standing stone "Curious People Build Nicer
   Things" with a heart (x 1540-1665, y 645-830); the flat stone "A More
   Playful Tomorrow" with a sprig (x 1345-1600, y 850-925). They are the
   plate's, whole at every aspect (the plate is registered to the stage and
   painted on past the mock's edges), their lettering the original's own.
4. **The brand**: "chong" in a dark moss-black book serif at a medium
   weight (540 at 54 px, tracking 0.006em; ink x 295-444, y 15-63 against the
   mock's 295-442 x 12-63: Newsreader's ascender is the one thing it cannot
   match; its ink mass 423 against the mock's 425), the mock's own
   four-leaf watercolour spray after it (cut from the original, `leaf-brand`:
   x 452-495, y 18-62, 12 px after the word; by moonlight a pale sage, as the
   name is pale); under it the tagline "tools, games, and the agents that
   play them" in the same serif, regular (x 296-623, y 68-86 against the
   mock's 295-623 x 68-85; the "g" descender clears its "and").
5. **The nav**: serif words (~19.5 px, cap height ~12), the mock's muted
   dark moss green, no frames, ~31-35 px between words, baseline y 40,
   right-aligned to x ~1322 (the mock's "Projects / Notes / Contact"; here
   the page's own keys: index, the finish, the style menu). They stand on
   bare cream plaster: the top edge's vine stops before the first word at
   every rice (by day at x ~1000, where "index" starts at 1012, along the
   vine's own gaps so that it ends on leaf outlines, not a feathered line,
   and runs on to the window's top edge where the mock's leaves meet it; x 906
   by night, where "cosmic dusk", the longest rice name, starts it at 954,
   short of the big rose). On a phone (below 900 px) the plate is cropped to
   start at the bare plaster's left edge (mock x 290, `--layer-x` in
   garden.css), so the name, the tagline and the headline stand on plain
   wall and only a few leaves reach behind the keys, which sit on chips; a
   fuller glow of the plaster (`--l-halo`) keeps the words clear.
6. **The flagship**: "Tauri Explorer" in the serif at a medium weight (470
   at 51 px, a text optical size, tracking -0.02em; ink x 297-597, cap top
   153, cap height ~36). Settled **by measurement** against the mock at
   1672x941: the T's stem 5.3 px (mock 5.3), the stems of "u", "r" and "l"
   4.8 (mock 4.8), the letters' extent 297-597 (mock 294-598). A broad
   two-leaf watercolour sprig ~12 px after the "r", centred on the cap
   height (x ~611-645, y 154-197); under it "A keyboard-first file manager."
   and "Alpha testers wanted." in the serif, regular (x 294-603, y 212-266).
   By day the name and headline are a near-black moss (`#0e1808`), darker
   than the body copy, as the mock's heaviest strokes measure.
7. **The buttons** (y 288-338): "Join the alpha →", flat mottled moss felt,
   radius ~6, a slightly rough darker edge, no gloss and no bevel, with
   cream serif lettering (box x 293.8-487.8, y 287.5-338.1), its arrow an
   open one with a full head (15 x 11, from the baseline up, 12 px after the
   word); "Try it live", an aged parchment tag, radius ~6, a brown rim, a
   darker aged cream with light brown staining at the edges and corners and
   slight corner wear (no gold rim, no bright cream), with dark serif
   lettering (box x 508.3-642.6, y 287.6-337.9). Both are **cut from the
   mock** (`button-cream-d`, `button-green-d`: the mock's board, its
   lettering diffused out, upscaled to the tile height; no prompt), and
   cast the mock's short soft shadow.
8. **The window** (x 691-1337, y 71-421.5, measured on the mock's monitor
   and met to within 1 px): Tauri Explorer, its corners
   rounded (~12), a ~10 px charcoal bezel with a dark outline round a pale
   metal rim (measured: 2 px of light grey on the top edge, 3-4 px of mid
   grey down the sides and along the foot; the mock's outer edge at x
   1340.5), its cast shadow on the plaster at the left and under the foot (in
   the scene: the mock's own pixels there), the title bar in it with the red,
   amber and green lights at the left (centres x 714, 733, 751, y 89), a sprig
   before the name (a sans), centred, and a faint ring-and-dot control at the
   right end (x 1321). Inside the bezel is
   **one light screen** (by day; dark under the dark rices): the two panes
   flush, a hairline between them, no dark gutters, the screen's top
   corners rounded; each pane a path line, a header row ("Name", "Kind")
   and a dense list that holds its rows whole (the left pane's seven are the
   real listing, then plain paper; no filler band, no half-cut row), the
   real rows zebra-striped, the focused one tinted; the status line under both, its
   hints set as the mock's key-cap legend (rounded cap, hairline rim, the
   hint after it). Its foot rests just above the books on the ledge, and its
   bottom-left corner clears the mug's handle and the top book: the
   handle (and the mug's rim) stand **in front of the monitor's chin**, a
   sprite cut from the mock (`mug-front-*`, 42 x 28 px at (686, 396), on
   `.launchpad-window::after`, desktop only). The window's own shadow is a
   contact line: the mock's soft shadow is already in the plate. The
   content is the page's real listing: no Size or Modified columns. On a
   phone the status line is a one-line wrapping row clipped to its height,
   so only whole chords show.
9. **The low wall and its ledge**: a drystone wall of pale honey stone across
   the screen, its ledge just under the window (top course y ~500-560), ivy
   and petals along it; on the ledge, left to right: a cream mug lettered
   "Small tools happier people" with a sprig (x 607-728, y 393-505), a stack
   of four green cloth books with gilt titles "Build / Play / Explore / A
   Kinder Internet" (x 740-955, y 420-512), a sleeping tabby cat curled with
   a paw over the edge (x 1080-1370, y 360-520), and a terracotta pot of
   roses lettered "Same Curiosity New Horizons" (x 1365-1482, y 290-500).
   Registered to the mock to within 2 px at 1:1 (mug, books, cat, pot each
   put back on their own coordinates, the wall's sprite warped to them).
10. **The row's name**: "Projects" in a slanted, thin-stroked pen script
    (Caveat at 34 mock px: 89 x 29 mock px of ink against the mock's 90 x 33,
    starting at x 166) on a weathered
    limestone plaque with **two** rivets (the mock's) and a small sprig after
    it (leaves 18 x 19 mock px at x 267, the mock's 17 x 19 at 269) (x 118-312,
    y 508-568), set on the wall's top course at the row's upper left. The stone is cut from the mock (`label-mock`), its lettering and
    sprig diffused out, 9-sliced; live edges within ~1 px of the mock's.
11. **The four cards** (row x 180-1503.5, y 577.5-821.7 live against the mock's
    181-1503 x 578-818, ~17 apart; widths 324, 317, 311 and 322): **clean, smooth, lightly rounded cream boards of an
    even tone** (a thin tan edge, a soft cast shadow, no deckle), each
    titled in the serif (~22 px, medium) with a sprig after the name, its
    screen a rounded inset flush to the card's padding (~16 px margins). Here
    the screens hold the projects' 1-bit art (the content is the page's), in
    the rice. By day a 1-bit panel is a pale print, not a lit display: a warm
    off-white face and a soft brown rim line with a little shade inside it
    (not pure white, not a hard black outline); the dark screens and the
    night keep the dark 2 px rim.

## The rest of the site

- The cards' board is every surface (the intro sheet, a project page's
  sheets, the about page's), with the same tan edge and shadow.
- A shelf's head (`.divider`) is the "Projects" plaque, its name in the pen
  script.
- Every key is lettered in the serif, a key cap and its legend too; the
  moss tile is the signal, the cream the neutral.
- Body copy is the serif; labels (a kicker, a card's number and state, the
  tags, a shelf's count, the foot's credits and folio) its small capitals; a
  shelf's name the pen script. Mono only inside a screen, and inline code.
- The headlines everywhere (the intro's, a project page's, the launch
  page's; the garden has no inner-page mocks) speak the home's voice: the
  serif at weight 480, optical size 36 and tracking -0.02em, as the flagship
  is set (the display cut is a heavy modern face beside the mock's
  Garamond), near-black moss by day.
- Labels on a strip of weathered copper plant label; inline code chalked on
  a slip of slate.
- **States**: hover lifts a card or a tile toward the sun (a longer, softer
  shadow); pressed sets it back. Focus: a card lies on a mount of moss-green
  board, cut clean; a tile has a channel cut just inside its edge, moss on
  the cream, cream on the moss.

## Type

- Serif: Newsreader (the default `--font-display`), measured the closest of
  the book serifs to the mock's letters (x-height to cap 0.68 against the
  mock's 0.67; "chong" 5.4 x-heights wide against 5.5). Its variable weight
  and optical-size axes are what the weights above are set on.
- Pen script: Caveat (`--font-caveat`), the plaque's and a shelf's name
  (Merienda, the first choice, is upright and broad where the mock's script
  is slanted, tall and thin-stroked).
- Body and labels in the serif (above); the window's title in Archivo, as
  the mock's sans; JetBrains Mono only in a screen and inline code.

## Plate, sprites and finishes

- The plate is registered to the stage (kit.css): drawn at its scale, the
  mock's frame centred across and its top on the page's, so the margin
  props and the bare plaster behind the nav stay where the mock has them.
  It is **painted on 320 mock px past the mock's sides and foot** (the
  bleed: `plate-bleed-*`, the core pasted back exact over it), so it fills
  frames from 4:3 to 21:9 without scaling. The stage subtracts the measured
  scrollbar (0 in headless), so a 1672x941 viewport is 1:1 with the mock and
  is measured directly.
- **The scene is the mock's own detail** wherever the page does not stand
  over it: `detail()` in `scripts/kits/garden.mjs` copies the mock's
  pixels onto the plate and the wall sprite so that, composited, the page's
  scene equals the mock there (excluded: the copy block, the nav, the
  window, the Projects stone and the four cards, each feathered). By night
  the mock's band-passed detail rides the night plate's own light (colour
  ratio of the night to the day composite, a local contrast gain, the
  lettered props replaced whole). Each finished frame is then sharpened once
  (unsharp, amount 0.9, sigma 1) to make up for the kit's q78 webp and the
  browser's downscale (the build otherwise keeps ~half of the edge energy).
  Measured at 1:1 (Laplacian variance, live over mock): wall devices ~100%,
  plate devices 92-111% (butterfly 87%, sign 97%, can 111%); registration
  0 px on every device (sign and gate +1).
- The scene is **one plate per finish with the wall taken out**
  (`plate-open-*`, the mock with its UI, its low wall and the ledge's things
  painted out, the garden continued there; the lettering on the board and
  the stones restored), and the wall with everything on its ledge is **one
  sprite** (`wall-*`, 1672 wide in the plate's frame: day 1672x670 from y
  193, night 1672x680 from y 187) on `.showcase::before`, behind the cards
  and the window. The model-drawn wall drifted unevenly
  from the mock (mug, books, cat and pot by -8 to +20 px), so the recipe
  warps it onto the mock's own coordinates (`wall-reg-*`).
- The core plate (`plate-core-*`, the mock's frame) is composed in
  `scripts/kits/garden.mjs`: bare plaster over the upper middle; the top
  edge's vine and roses laid back (by day the mock's plaster to x 960, past it
  and below its fade only the leaves, keyed from the plaster and cut along a
  path down their gaps; to x 906 by night, from the night plate); the leaf
  shadows beside the headline and behind the nav softened to a fifth of their
  strength; the plate's bush right of "Try it live" (70 px higher than the
  mock's) painted out with the plaster above it, and the mock's own pixels
  from x 641 on there; the five margin props back from the mock.
- There is no bee sprite: the bee is the mock's own pixels in the plate and
  the wall sprite, which are the mock's wherever nothing of the page's stands
  over them.
- The first screen is rigid in mock px: the row stands a fixed distance
  under the window (not at the screen's foot), so window, ledge and cards
  keep the mock's relation at every aspect; a taller screen shows more of
  the plate's path under the row. `.landing` is the stage's height and the
  cards stand at the stage's foot; on a screen shorter than the stage's
  aspect, the page's end is kept clear of the stage's overhang (no slab).
- On a phone the wall is drawn wider than the screen, centred on the things
  on its ledge, across the top of the row, the plaque on its top course.
- **Night** (the dark rices): the same garden under a full moon (upper
  right), the cottage's windows lit, generated as an edit of the day plate so
  the two register; the wall a night edit of the day wall. The cards,
  plaques and sheets are the day's board by moonlight, a pale blue-cream
  parchment keeping its rim and grain, with deep night-blue ink on it
  (better than 4.5:1); the type on the plaster turns cream with a dark
  blue halo.

## Raster kit (prompts in `art/prompts/garden/`)

| group | assets (raw → kit) |
|---|---|
| scene | `plate-open-*`, `plaster-*-b`, `props-out-*` and the original → `plate-core-*`; with `plate-bleed-*` → `layer-sky-*` (scripts/kits/garden.mjs) → `scene/{day,night}/sky` |
| wall | `wall-{day,night}` → `wall-reg-*` (registered) → `wall-{day,night}` (the ledge's things painted on) |
| detail | `plate-core-*`, `wall-reg-*` and the original → `plate-detail-*`, `wall-detail-*` (the mock's detail; no prompt); `plate-detail-*` + `plate-bleed-*` → `layer-sky-*` (sharpened) |
| mug | the original's mug rim and handle (`mug-front-{day,night}`, 42 x 28; no prompt) |
| sheets | `card-day` → `sheet-{day,night}-{normal,hover,focus,pressed,flat}`; night graded |
| tiles | `button-cream-d`, `button-green-d` (cut from the original; no prompt; the generated `button-*` prompts here are superseded) → `tile-{day,night,signal,signal-night}-*` |
| plaque | `label-mock` (cut from the original; no prompt) over `label-day` (the generated stone, the fallback) → `label-{day,night}` |
| sprigs | `sprig-leaf` → `sprig-{day,night}` (a title's); `leaf-brand` (cut from the original) over `sprig-spray` → `spray-{day,night}` (the brand's) |
| fittings | `pins` → `pin-*`, `tape-day` → `tape-*`, `chip-day` → `chip-*` |

The plate keeps the mock's own lettering (its signs and stones are the
scene's, not the page's words); the page's words are never in a bitmap.
