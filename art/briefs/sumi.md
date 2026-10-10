# Art direction: "Sumi-e Ink"

One of the selectable styles (issue #1; `data-style="sumi"`). The Paper
Diorama's brief (`art/BRIEF.md`) sets the system every style shares: surfaces
over a scene, the screens in the rice. This file says what Sumi-e Ink changes.

**The original is the target.** The page is judged side by side with
`art/originals/sumi.webp` (full resolution: `art/raw/originals/sumi.png`,
1672x941, the day finish), device by device, at the original's own size. The
later `art/raw/sumi/concept-*` (hanging-scroll mounts in silk and brocade) are
not the target and none of their devices are kept. Coordinates below are the
original's pixels, which the page's stage reproduces (`--u`, globals.css home
landing).

## Thesis

A page brushed onto an ink-wash landscape. The scene is one painting on pale,
warm paper: misty ranges across the top, a lake with boats and a pavilion, a
robed figure on a pine-crowned cliff at the right, a red sun, birds, pines and
rocks along the foot. The site's words are written on the painting itself, the
names in the mock's own dry brush and everything else in a book serif; the only surfaces
are four cards of deckle-edged washi laid at its foot and the app's window.
Cinnabar seals mark the brand, an inscription and each card.

## Signature devices (requirements)

1. **The ink-wash landscape on pale paper** fills the screen: the far ranges
   in mist across the top (from x 470 to 1600), a lake with two junks and a
   pavilion on a wooded spit, an island, the wooded slope down the left
   edge, rocks and pines along the foot, all on warm paper (`#e2d6c8`) with
   its fibres. The paper behind the flagship's copy (80-700, 150-330) is
   open: no bird or wash crosses the words.
2. **The robed figure on the cliff** at the right (1500-1530, 360-440), in a
   straw hat, under a gnarled pine reaching in from the edge.
3. **The red sun** at the upper right, a soft watercolour disc (centre
   1532, 133; 70 across), its lower third breaking into streaks of mist.
4. **The vertical inscription 行遠自邇** (traditional, all four), brushed in
   a slender kaishu column down the right edge (1622-1650, 17-150), with a
   small square seal under it (1623-1649, 162-189) in a deep cinnabar paste,
   its cut lines heavy.
5. **The brush wordmark "chong"** (80-342, 14-116), lowercase, hand-brushed
   in true-black wet ink with dry-brush fray, a slight lean, the g's looped
   tail flicking out and clear of the tagline, with **a red seal 重** after
   it (344-380, 40-89): a block of deep cinnabar with rounded corners, the
   character standing in it in paper cream.
6. **The tagline** "tools, games, and the agents that play them" under the
   wordmark (91-495, baseline 131), a small serif in black at a book weight,
   widely spaced.
7. **The nav as serif words** at the top right (Projects 1247, Notes 1347,
   Contact 1430; baseline 55; about 20px), plain dark ink, no buttons. Here
   they are the masthead's keys (index, theme, style).
8. **"Tauri Explorer" in large hand-brushed sumi calligraphy** (78-652,
   186-310): upright, a bouncing baseline, true-black wet ink, dry-brush
   streaks running along each stroke; the T's bar sweeping far in from the
   left and trailing off dry, its stem running dry down past the pitch's
   line; a blob for the i's dot; a clear space between the words.
9. **"A keyboard-first file manager."** in a sturdy book serif (157-450,
   305-327), and **"Alpha testers wanted." in vermilion** (`#8f231d`, 156-405,
   339-365) under it: both indented under the title, not flush with it.
10. **The vermilion brush-edged button "Join the alpha →"** (154-380,
    390-448): a brick madder red (`#952e2a` over its grain), painted, its
    edges ragged where the brush lifted, cream serif lettering at a book
    weight, a long sturdy arrow close after the words; and **the ink-outlined
    "Try it live"** (404-570, 391-447): a hand-inked line round a patch of
    paper (the scene stops at it), broken where the brush lifted and heavier
    along the foot, black serif lettering at the mock's size.
11. **The window with a thin chrome** (734-1345, 136-481): Tauri Explorer's
    two panes, its title bar, its status line, rounded corners and a soft
    shadow on the paper. Its screen is lit in the visitor's rice (light by
    day, dark by night: a product decision); its frame is a hair of dark
    chrome round it, as thin as the mock's dark window's grey edge. Whole
    rows only.
12. **"Projects" in casual upright brush lettering with a brush rule**
    after it (heading 84-216, 544-592; a thin dry stroke 228-443 near the
    word's baseline, at y 571, thinning to a split tail).
13. **Four washi cards with torn edges** (75-440, 460-827, 847-1213,
    1234-1600; 600-875): cream handmade paper, deckled on every side in an
    irregular grey tear, a little darker and mottled along the edges;
    **serif titles** at the top left (about 26px, semibold), **the screen**
    under each with rounded corners, no mat, a hairline at its edge, lit in
    the visitor's rice. The shelves' cards below the first screen lay their
    screens the same way.
14. **A red seal at each card's lower right**, a different character on each
    (the mock's: 書, 燼, 遊, 智): red character and border on paper
    (zhuwen), standing over the screen's lower-right corner on a patch of
    the card's paper that covers the picture's corner whole. The character
    is the project's own (`--glyph`, one per project in the data), so the
    seal is built, not drawn per project: the paste's frame (`seal-blank`)
    plus the character as live text in a regular-script face (LXGW WenKai
    TC Bold, `--font-seal`) under the paste's grain (`seal-grain`, a mask).
    The face must draw every project's character (traditional forms
    included) and render alike on every OS; no system fallback.

## The plate and its sprites

- **Scene:** `plate-day-calm`: `plate-day-clear` (an edit of the clean plate
  `plate-day`, the original with the UI painted out, with the sun and the
  inscription painted out too), and the skein of birds that edit painted
  over the flagship's copy cloned out (`scripts/kits/sumi-plates.mjs`, both
  finishes); the sky layer, the other scene layers `none`.
- **The bleed:** the scene's sky is `plate-{day,night}-bleed`
  (`scripts/kits/sumi-bleed.mjs`): the calm plate painted on 320 mock px past
  each side and below it (a generation on a ref of the plate in a grey frame,
  `art/prompts/sumi/bleed-day.txt`; the night an edit of the day bleed,
  `bleed-night.txt`), its tone fitted to the plate and the plate itself laid
  back over the core, feathered 24px. On a desktop the sky is registered to
  the stage (kit.css), the core under the UI and the bleed round it: a
  mountain and its pines past the left, the cliff's pine and forested hills
  past the right, low misty hills below (calm under the cards), no figure,
  bird or lettering in it. On a phone the core's own crop is kept: set left of
  centre (at 13% of the core's slack), so the stacked copy stands on its open
  paper between the cliff and the lake.
- **The lettering is the mock's own** (`scripts/kits/sumi-letters.mjs`):
  "chong", "Tauri Explorer", "Projects" and the line round "Try it live" are
  fixed strings, so each is cut from `art/raw/originals/sumi.png`, its paper
  estimated by a grey closing and divided out, its ink density keyed to
  alpha (`letter-*`, `key-line`), and drawn as a mask over the words' ink
  (night recolours it), the real words kept in the page, unseen. The brand and
  "Projects" are site constants. The flagship's title is data: the lettering
  paints the word "Tauri Explorer" and is keyed to it
  (`.launchpad-title[data-text="Tauri Explorer"]`); any other flagship title
  is live text in the brush face (`--font-protest`) in the same box.
- **The sun and the inscription are sprites**, not the plate: the sun turns
  to the moon at night and the inscription to gofun white, and where the
  plate scales past the stage (a tall window) they keep their size. The sun
  is the scene's sun (`.scene-sun`), the inscription two fixed
  pseudo-elements (`body::after` the column, `body::before` its seal), all
  placed from the stage's top right in stage units, so they keep the
  original's place against the nav and each other at every aspect.
- **Sprites, inked off white** (build-kit `inks`): `sun-day`, `moon-night`,
  `calligraphy` (the column and its seal, drawn as two pieces to the mock's
  boxes), the cards' seal frame `seal-blank` (the frame of the first
  generated seal, `seal-shu`, with its character taken out:
  `scripts/kits/sumi-seal.mjs`, which also writes the `seal-grain` mask),
  the heading's `rule-brush`, the lettering. On transparency: `seal-brand`.
- **Materials:** `sheet-washi-{day,night}` (the cards and every sheet: a
  deckled sheet whose paper is the page's own washi tile, its edges repeated
  along a side), `tile-red-day` (the primary button), `tile-line-day` (the
  secondary), `washi-{day,night}` (the paper tile).

## System

- **Type:** the home page's names are the mock's lettering (above). The
  other pages' titles are Protest Revolution (`--font-protest`), the most
  upright dry brush there is, its streaks running along the strokes. EB
  Garamond (`--font-garamond`) for everything else: the nav, the tagline,
  the pitch, the buttons (at 500, the mock's sturdier book weight), the card
  titles, prose and labels. JetBrains Mono on screens and code only.
- **Palette (day):** paper `#e2d6c8`, card washi `#e9dfd2`, sumi ink
  `#1d1d1f` and its greys (the words on the painting a true black,
  `#101011`), brick madder `#952e2a` (the primary button), vermilion
  `#8f231d` as text (the call), cinnabar `#b23a2e` (seals, focus).
  No other hue: a shelf card's status seal is sumi (complete), ochre
  (paused), deep cinnabar (active) or vermilion (alpha).
- **Night:** the same painting as a nocturne (`plate-night-calm`: an edit of
  the day plate, its birds cloned out the same way): blue-black paper, the ranges in silvery washes, the mist a
  luminous blue-grey; a pale moon in the sun's place; the cards ink-dyed
  washi with paler deckles; the words (the lettering too) in cream, the
  inscription in gofun white; the seals stay cinnabar, the inscription's lit
  so it holds on the dark paper.
- **States:** a card lifts off the paper (its shadow widens); focus is a
  cinnabar under-sheet showing past its deckle; a button lifts toward the
  light and presses back; the masthead's words take a cinnabar underline.

Generated characters are checked by eye before use: only 重 and 行遠自邇
appear in the art, each as written above. The cards' seal characters are live
text, never generated.
