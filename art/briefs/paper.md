# Art direction: "Paper Diorama"

The default style (`data-style="paper"`), and the base every other style
overrides (its kit's tokens are kit.css's `:root` and
`:root[data-rice="paper"]`). The system it shares with the others is in
`art/BRIEF.md`. This file is the target: the **original mock**,
`art/originals/paper.webp` (full resolution `art/raw/originals/paper.png`,
1672x941), with `paper-project.webp`, `paper-launch.webp` and
`paper-phone.webp` for the project pages, the launch page and the phone.
The `concept-*` images and the earlier alpenglow kit are not the target.

## Thesis

A cut-paper shadow box on a bright day. The whole page is one diorama:
layers of torn and cut handmade paper standing one in front of another, from
a pale blue sky with a coral paper sun down through slate mountains, green
ridges, a river valley with a stone bridge and a village, rolling foreground
hills, to the hiker's rocks and the signpost at the edges. The interface is
more paper laid into it: a torn cream band across the top that the brand
sits on, torn sheets for the hero, a cream mat for the window, a torn band
the project cards are pinned to, and the plants and the lettered stone of
the foreground growing over its edge. Every surface is paper; only the
screens are not.

## Signature devices (requirements: a missing one is a defect)

Positions are the mock's pixels (1672x941).

1. **Torn-paper cloud band across the top** (y 0-~105): cream handmade
   paper with a layered, fibrous torn lower edge and a soft shadow under it;
   a gap of sky near x 1030-1180; a small white paper cloud on it at the top
   left. The brand and the nav sit on it. A sprite on `.masthead::before`
   (it must stay under the brand at every aspect), generated in register
   with the plate. The top-right pine and mountain peak rise IN FRONT of the
   strip's lower edge (`tips`, `.masthead::after`: a cut of the mock's
   tips, x 1524-1672, y 30-112, right of the links, kit `tips-day` /
   `tips-night`, pad 4; its box ends at the stage's right edge so it adds
   no sideways scroll). Stage art: it registers only where the scene and
   the stage do, so the rule is gated to 16:9 (aspect 1.74-1.82); at other
   shapes the strip covers the tips (see Known gaps).
2. **Brand line on one line**: "chong" in a heavy old-style serif (x 205,
   ~52px), a thin vertical rule (x 362, 31px tall), then the tagline "tools,
   games, and the agents that play them" in the same serif, regular, ~20px,
   on the same line. No mark before the name.
3. **Nav as words** at the top right (x 1260-1497, ~20px serif, regular,
   untracked, ~35px apart, navy-black ink), the last word ending at x 1497,
   the whole group on the band's right strip: here the masthead's keys
   (index, theme, style). Their words are longer than the mock's, so the
   strip's right piece runs on ~32px to the left under them
   (paper-sprites.mjs `runOn`: ONE sprite, its torn end moved left by a
   smooth eased column warp of the right piece's own paper, so there is no
   seam, no lighter rectangle and no tonal band at the foot; round 6, M2).
   Its fibre is the mock's fine tooth (`BAND_TONE`: local tone taken from
   the solid paper only, so the torn edges carry no band; the long veins
   at 0.2, the fine grain at 0.5, plus a seeded tooth noise): measured
   fine 3.3 against the mock's 3.5, crinkle 2.0 against 2.1. The tip's
   silhouette ends at x ~1145 where the mock's ends at ~1180: content
   (the links start at x 1200 and are longer than the mock's words).
4. **Coral paper sun** at the upper left (centre ~185,150, ~130 across),
   behind the far mountains. Stays in the sky layer.
5. **Hero on two torn cream sheets** (x 288-738, y 137-412): an upper sheet
   with "Tauri Explorer" (heavy serif, ~64px, centred, near-black) and "A
   keyboard-first file manager" (medium, ~30px, centred under it, navy-black);
   a lower sheet under it, holding "Alpha testers wanted" (medium, ~23px,
   left at x 363) and the two buttons, its torn foot and shadow ~20px under
   the buttons (y ~412). The upper sheet's shadow falls on the lower one.
   The lower sheet is NARROWER than the headline plate and ends in a torn
   diagonal, as the mock's lets the mountain show: the sprite's right end
   is cut by `trimRight` / `trimmedRight()` in paper-sprites.mjs (a
   soft-alpha torn edge along the polyline in the hero entry, a 2.5px pale
   fibre rim), after which the sheet is 475x269 at (272,131).
6. **Paper buttons**: "Join the alpha" on a dark sage-green paper board with
   white lettering, "Try it live" on a cream paper board with near-black
   (12,10,9) lettering; both softly rounded, slightly deckled, serif medium
   ~23px, 59px tall (x 360-543 and 563-716, y 336-395). No arrow.
7. **The window on a cream mat**: the app window (x 787-1455, y 113-472,
   rounded ~10px) mounted on a cream deckled paper mat with rounded corners
   ~14px proud of it on every side, casting a soft shadow. The screen is lit
   in the visitor's rice (light by day). Inside, as the mock's app: a sans
   face, TWO inset rounded panes (1.6cqw radius, 1px rule, a gap between
   them, no hairline divider) on the window's frame, each head between
   chevrons (`‹ ~/Repos ›`) with its item count; the window's corners
   ~14px (`--xw-round: 14u`); the selected row a pill with a chevron at
   each end in the scene's palette (`--xw-select`: indigo `#4a62ab`
   by night, the slate-blue `#4c6a91` by day, never the saturated rice
   blue); by day the frame and panes are the mat's warm cream (`#e8dcc7`,
   `#f4ecdc`), not the page's brightest white; no kind column, the status
   line's chords as keycap chips (`.xw-hints > .xw-hint > kbd`: the cap's
   height scales with the window, the plus set at the cap's own size; a
   chord that does not fit wraps to a clipped second line, never cut
   mid-word). The `~/Repos` pane lists every project plus dotfiles: its
   rows are whole (`grid-auto-rows: 0` clips what does not fit), none over
   the status line, at every size from 900 to 2560 wide.
8. **"Projects" on a torn-paper label** (x 47-335, y 532-607): a small torn
   cream scrap, tilted a little, "Projects" in the heavy serif ~44px. No
   rule after it.
9. **The cards' torn band**: a long band of torn cream paper across the
   whole width (y ~575-880), torn along its top, behind the cards.
10. **Four cream cards pinned to it**: rounded cream paper cards (x 69-1603,
    ~370 wide, 20 apart, y 602-860), each with a matte, dull bronze tack at
    its top centre (~21px across), its title in the serif, semibold, black,
    ~29px (the lead "Scrivo" ~37px) at its top left (the title's centre at
    y ~636, its screen y 660-843 under it), and the screen set into the
    stock: ONE treatment on every screen of the site (the home row, the
    shelf cards below the fold, the night finish; the project page's print):
    no padding or mat. **The well is a PRINTED SHEET PASTED FLUSH into the
    card (settled in round 9 by the lead; do not reopen)**: no outline, no
    inset shadow, no glare (`.screen-glass` hidden on the cards, the module
    screens and the project page's print); the paper's own tooth and fibre on
    its face (`public/kit/paper/well-grain.webp`, lifted off the card stock's
    generation by `scripts/kits/paper-well.mjs` and laid over the face and the
    drawing in `overlay`, so one file serves a light sheet and a dark one);
    a tone a little apart from the stock so it reads as a second paper
    (`--screen-face` #e8dcc7 by day against the stock's mean #ddc8b0, the
    night's own dark paper by night: light by day, dark at night); crisp ~7u
    corners and a faint contact shade (`0.5px 1px 1.5px rgba(52,36,22,.3)`)
    where the sheet's thickness stands off the stock. The illustration is
    fitted by its own bounds (the Screen's `--drawn-x/-y/-w/-h`,
    docs/architecture.md "Content is data"): drawn whole at 87.5% of the
    well's height, centred, never cropped, unless its width would pass 88%
    of the well's (`--face-ar`: 1.825 on the home, 1.5 on the module
    screens and the project figure's 3:2 stacked), so a wide drawing in a
    squarer well stands smaller (the project figure's square well on the
    stage: ~55% of its height, at the 88% width cap). The project figure's
    plate takes the same finish inside its mat.
    The two reviews' reasons: rev 5 (round 6) asked for a PRESSED-IN well
    with a hairline (#d9c6ac face, a 1px dark rim, an inner shadow along the
    top and left, the art at 75% of the well's height); rev 9, set beside the
    mock's flush, dense screens, read that as a generic UI inset: a flat,
    grainless tan box with an outline and an inner shadow, the art floating
    at 45-55% of it. The lead compared the two side by side (CMP-cards.png)
    and agreed with rev 9. The cards' stock is smooth and lightly rounded with a
    soft deckle (`card-cream` in paper-sprites.mjs: the silhouette displaced
    by noise of amplitude 2.4 / 1.1px, not the ripped edge of the torn
    sheets). The lead card is larger (x1.03) and pinned by hand, tilted
    -1.3deg; the row sits where the mock's does (cards y ~601-860, "Projects"
    scrap centred on y ~567). The lead card is nudged up 5px and right 8px
    so its foot, with the other cards' margin, clears the foreground
    leaves (the Scrivo screen no longer sits flush with its card's edge).
11. **The lettered stone** at the lower right (x 1490-1672, y 760-941): a
    flat pale stone lettered SAME / CURIOSITY / FURTHER with a short stroke,
    standing in front of the fourth card's corner.
12. **Foreground over the band**: green paper leaves and ferns along the
    bottom and up the band's left end, two small white flowers right of
    centre, pale rocks along the foot, all in front of the band and the
    cards' lower corners. It reaches the bottom edge at every size: the
    sprite is drawn 420 mock px taller than the frame it was cut from (the
    foliage quilted from the scene's near layer, `paper-quilt.mjs`, ending
    in leaf tips), so a screen taller than 16:9 (1440x900, 1280x1024) shows
    leaves to its foot, never the scene's own foreground at its own scale
    meeting the sprite in a seam, and never a repeated strip.
13. **The hiker** with backpack and staff on pale rocks at the left
    (~230-320, 320-470), looking into the valley; tall layered pines behind
    him at the left edge.
14. **The signpost** at the right (x 1520-1650, y 265-545): BUILD, EXPLORE,
    PLAY on wooden arrow boards, on a post among pines and a big rock. Whole
    on every desktop screen: narrower than 16:9 (1440x900) the right
    cut-outs are anchored to the right edge (`--right-anchor: 1`, with the
    CSS scene's right-back grove), not cropped.
15. **The valley**: the stone arched bridge, the village with its church
    tower and red roofs, the blue river winding toward the viewer, between
    green ridges, under slate and snow mountains.
16. **Type**: one old-style serif (Crimson Pro) for the brand, nav,
    headline, buttons, heading and card titles: the words set large in
    near-black (#0d0b0a), the small type in navy-black (#10161f); the body
    face (Archivo) for running text on other pages, as the project mock
    does; mono only on screens and labels.
18. **Pins**: one material everywhere, the mock's matte tacks (no gloss):
    dull bronze for the cards and every sheet, and the same tack painted
    sage, ochre or terracotta for the status lights (`pins`). The phone's
    hero card is held by a COPPER one (`pin-copper`: the bronze head
    graded warm, `--k-pin-copper`), as the phone mock's.
19. **Shelf headers below the first screen** ("Tools / things I use every
    day / 4 PROJECTS", the Games header): a torn paper TAB of the set, not a
    flat bar. On the stage (900px and over; round 7) it is a strip of the
    cards' RIBBON (`--k-ribbon`, the paper the cards' band is cut from: torn
    along both its edges at the stage's scale, its ends cut square, a
    3-slice stretched along its length), under a paper-coloured fill
    (`--divider-under`, inset 12px) that hides the slices' seams; the phone
    mock's rounded strip read there as a smooth rounded rectangle, and the
    kit's sheet at the strip's height stretched its grain four to one, like
    a plank. Stacked, it stays the phone strip's 9-slice (`--k-strip`:
    deckled ends and edges, fibre, its soft shadow) under the same kind of
    fill. Both: tilted -0.3deg, label, note and count are data and sit on it
    in the serif, and it grows with any text. The tab is tucked up under the
    prose plate (and the shelf under it) so no sliver of the hiker or the
    castle shows between them.
17. **Pop-up depth**: the scene is layered paper that rises into place (CSS
    layers; the 3D diorama on capable devices), never one flat picture.

## Plate, layers and sprites

- Plate: `art/raw/paper/plate-day` (the original with the interface painted
  out). The scene is cut from it into the kit's eight registered layers
  (`scripts/kits/paper-layers.mjs`, then `scripts/kits/paper.mjs` `scene`),
  each a full 16:9 frame: sky (opaque: blue paper, the coral sun, the
  clouds; the band taken out), far (the slate and snow mountains), mid (the
  green ridges and the valley with its river, bridge and village), near (the
  foreground hills), left-back and right-back (the pine groves at each edge),
  left (the hiker on his rocks), right (the signpost and its rock). Each
  band's outline is where a full-frame edit of the plate with that band
  removed (`remove-*`, in register to the pixel) differs from the plate.
  Where a layer shows, its pixels are the plate's, so the settled scene is
  the plate. The plate, a generation, is softer than the mock: where the
  scene shows in the mock (no interface over it; the two register to the
  pixel), it takes the mock's fine detail (its high frequencies over the
  plate's colour; by night scaled by the night's grade), and every frame
  is sharpened once (sigma 0.8) against the page's two resamplings (the
  kit frames the 1672 cuts at 1920; the browser scales that back). Behind
  nearer layers it carries what the removal continues
  there, so the rise and the parallax never open a hole (a layer slid far,
  on scroll, shows a seam or two along the mountains: the continuation is
  the generator's). The sun stays in the sky layer (`--k-sun: none`).
- The lettered stone and the band are not in the scene: they register with
  the interface, so they are sprites. The sprites are generations from the
  mock in register with it (`band-top-day`, `hero-paper-day`,
  `window-mat-day`, `label-projects-day`, `card-band-day`,
  `foreground-scene-day`), cut to their boxes by `scripts/kits/paper-sprites.mjs`
  and laid on the stage at the mock's coordinates (src/app/styles/paper.css):
  the band on `.masthead::before` (drawn the screen's width, its shadow pad
  an outset past the edges), the hero's two sheets on
  `.launchpad-copy::before` (a 9-slice: the lower sheet's middle stretched
  so its foot lies ~20px under the keys at any size), the mat on `.launchpad-window::before`,
  the label on `.showcase-title::before`, the cards' band on
  `.showcase::before` (a 9-slice stretched through its middle to the row's
  foot, the screen's width), the foreground with the stone on
  `.showcase::after`, over the cards, never catching the pointer.
- Sprite tone and crinkle: each sprite may be graded to its mock's paper
  (`tone` in paper-sprites.mjs: a per-channel gain, and the crinkle, the
  detail between 2 and 12 px across, kept at a fraction of its strength).
  Round 5 (the mock's paper is a fine tooth, not wrinkled): the `mid`
  fraction of the crinkle's band (the long veins) is 0.33 on the hero,
  `mount` and `label`, and 0.45 on `strip` (it was 0.7); the band and `band-left` use
  `BAND_TONE` (round 6: tone from the solid paper only, `mid` 0.2, `fine`
  0.5, a seeded tooth noise `TOOTH_TINT`, see device 3).
  The home's ribbon (the cards' band) is the mock's darker oatmeal
  (gain 0.95/0.92/0.89, crinkle x0.4); the launch page's ledge, from the
  other mock, a lighter cream. The ledge is the ribbon quilted taller
  between its two torn edges (`thickened()`), so it carries every shortcut
  without stretching its fibre into streaks. `band-left` is the band's left
  piece alone, under the other pages' running head. The launch page's sheets
  (the promise, the window's mat) are the window mat's cream paper
  (`mount`, the sheet laid the other way round, brightened 7% by day).
- The two further pages' scenes (`scripts/kits/paper-pages.mjs`, four layers
  each: sky, land, left and right cut-out; swapped under
  `:has(.detail-hero)` / `:has(.launch-hero)`): generations
  `proj-*` / `launch-*` in art/raw/paper (`plate-day`, `plate-night`,
  `remove-left`, `remove-right`, `sky-day`; prompts in
  art/prompts/paper/), cut and graded as the home's layers, with the shared
  helpers in `paper-cut.mjs` and the four-layer cut itself in
  `paper-scene4.mjs` (which the phone's scene shares).
- The phone's scene (`scripts/kits/paper-phone.mjs`, the same four-layer cut
  of `phone-plate-day`, `-plate-night`, `-remove-left`, `-remove-right`,
  `-sky-day`, generated from art/originals/paper-phone.webp and the plate;
  prompts `art/prompts/paper/phone-*.txt`; finishes `phone-day` /
  `phone-night` in scripts/kits/paper.mjs): the portrait mock's own
  composition (a clear sun, the hiker on the hill, tall pines at both edges,
  layered hills). The kit's frames are 16:9, so the portrait is the middle
  590x1080 of a 1920x1080 frame (what a 390x714 phone shows), with the
  sky run on to either side (its sun taken out of the copy) and the land
  mirrored; the left pine and the hiker-with-right-pine cut-outs sit at the
  frame's left and right edges (`--left-anchor: 0`, `--right-anchor: 1`) and
  keep to a phone's edges on any shape of screen. paper.css swaps the
  tokens under `@media (max-width: 899px)` (not on the project and launch
  pages, which keep their own scenes); the 3D scene re-reads them on resize.
- The phone's header strip is a sprite too (`strip`, from
  `phone-strip-day`, a portrait generation read at its own scale): 32px tall
  as the mock's, on `.masthead::before`, clear of the sun.
- Kit materials, generated whole: the torn cream sheet (`sheet-day`: every
  page's sheets, and the night's slate sheets by a gain), the cream card
  (`card-day`: the home's cards, `sheet-card-*`, and the project page's
  print), the cream, sage and terracotta boards (`tile-day`,
  `tile-signal-day`, `tile-clay-day`: the keys), the screens' mats on the
  other pages recoloured from lilac to the mock's cream; the matte tacks
  (`pins`); the sage tape and the red one dyed from it (`tape-red`).
- Type: Crimson Pro (`--font-crimson`) as the display face, bold for the
  brand, headline and heading, semibold for the card titles, medium for the
  pitch, call and keys, regular for the tagline, the nav and the other
  pages' heads.

## The other finish: night

The same diorama by moonlight (`art/raw/paper/plate-night`, an edit of the
day plate, so the two register): an indigo sky with a few paper stars, a
cream paper moon where the sun is, slate mountains with pale snow, deep
blue-green hills, a dark river with silver ripples and the village windows
lit amber. Its layers are cut along the day's lines. The band and the
foreground are graded as the scene is (by the night plate's ratio to the
day's around each pixel); the interface paper (the hero's sheets, the mat,
the label, the cards' band, the cards, the sheets and the cream key) goes to
the night sheets' slate-indigo, with cream ink; the screens go dark with the
dark rices; the green key holds.

## Other pages and the phone

The project, launch and about pages keep the column of torn cream sheets
over the same scene, in the same paper and type. Their masthead is the
home's: its keys and the way back are words in the serif on the strip.

- **Project page** (`paper-project.webp`): its own scene, from its mock (the
  blue gothic cathedral on its winding stair, the red sun, the cloaked
  wanderer, the brown trunk), and the first screen laid out as the mock:
  a narrow card (x 100-860) with the label typed (mixed case) on red paper
  tape held by a brass push-pin at its left end (`pin-push`, cut from the
  mock's own pushpin, `--k-pin-push`: the same pin holds the print); the
  head (round 6, M3, measured on the mock: x-height 31px, ink 62px, line
  pitch 66px, 647px across) in Newsreader (`--font-newsreader`, appended
  to src/app/fonts.ts: the one shared-file change), weight 520, 57.6px,
  tracking -0.012em, line pitch 66px, near-black, over a short rule
  (~200px), its three lines filling the card as the mock's; the lede in Inter
  light (`--font-inter`, weight 310, 24.3px, pitch 33.5px: the mock's
  line 1 is 605px, ours 602); the
  page's paragraphs at the mock's ~24px (a taller card than the mock's with
  the real copy; the wanderer is not where the mock has him, below); the tags on
  chips of the cream board with bullets between, inside the card (the tags
  are in the picture's column in the markup; the column is unwrapped by
  CSS); the picture the project's own 1-bit art, whole with a margin, on a
  deckle-edged print (the torn sheet at a fifth of its scale, in the cream
  of the mock's card: by day the sheets are graded paler and greyer than the
  card sprites' tan, `saturate(.65) brightness(1.06)`), a thick mat (26px
  at the sides, 60px under, as the mock's ~30px frame round a plate), tilted
  -3.4deg and tacked at its top centre by the big brass push-pin (46px),
  its plate the pasted sheet of device 10, captioned "Fig. 1" (the page passes no label; the caption's
  separator is only written with a label: `"Fig. 1 \00b7\20 " attr()`, the
  escaped space keeps it from being swallowed); the next
  section's card peeking at the foot.
  The running head stays (the band's left piece under it): the brand, the
  keys and the way back on its first row, and the page's meta line ("02 ·
  Scrivo · active") on a row of its own under the name, never truncated;
  below 1240px the strip stretches (`::before` to the screen's width) so the
  keys sit wholly on the paper at every width; the meta is hidden where it
  cannot fit (the shared rule, ~1100px).
  **Deliberate departure (round 7, M3): the cloaked wanderer stands on the
  path below the print**, not on the hillside at the card's foot where the
  mock has him (x ~300, y ~760). The pitch's length varies by project
  (Ashen Cathedral's two paragraphs run the card to y ~825, over his old
  place; Scrivo's end at ~790), so no copy fit keeps him clear; the path
  below the print (feet at ~(1040, 796), 0.62 of his size, a soft contact
  shadow under him) is clear of any sheet at every length. He is cut from the
  scene's left layer by colour (`scripts/kits/paper-pages.mjs` `WANDERER`:
  a seed point and box, the boots, the scale and the new place), his old
  place painted back to plain hillside (the left layer cleared where he was,
  the boots' pixels filled from the rows below), and laid on the land layer,
  so he is part of the scene at every size and in both finishes, in register
  with it. Checked on /p/ashen-cathedral (long) and /p/scrivo (short) at
  1440x900, 1672x941 and 1920x1080, day and night.
- **Launch page** (`paper-launch.webp`): its own scene (the sun at the upper
  right, the hiker in the orange jacket with his dog at the lower left), and
  the first screen as the mock: a big sheet flush left (x 90-760) with the
  kicker on sage tape, the two-line headline at 76px (the "+" of "Ctrl+P"
  in the letters' ink and a notch over their weight), the subtitle, the two
  calls to act and the facts line; the live window on its mat beside it
  (x 790-1550), its bezel a thin dark rim (1.8px, #2a2f3d, round 6) round
  the screen (the screen's colours stay the theme's: light by day), on the
  cream mat; and
  the shortcuts ledge under them, which is the page's own
  "Shortcuts your editor already taught you" section brought up by CSS
  order: a torn ledge across the screen, the heading, the chords as
  serif keycaps in three columns with rules between. The explanation
  paragraph (`.launch-lede`) is hidden at desktop widths, as the product's
  own css hides it on a short laptop screen, so the sheet ends above the
  hiker. The ledge sits 8px below the hero (not -4px) with its torn top 6px
  above its box (not 14px), so the hiker's rock and feet show clear of it;
  the window's bezel adds no glare (`.launch-shot .screen-glass` hidden,
  a hairline bezel only), leaving the screenshot's own dimming as the only
  veil.
  Round 6 (M5, and the launch LOWs): the hero is the kit's torn sheet
  (`.launch-copy.faceplate::before`, inset to the mock's x 88-750, y
  98-568; day filter `saturate(.65) brightness(1.06)`), no longer the
  window's mat; the headline is Newsreader 500 at 64.7px (pitch 66) in the
  mock's dark blue-green (#1d2829 by day) and the sub line Inter light at
  18.7px (the mock's line is 537 wide). The keys are hand-cut TORN boards
  (paper-sprites.mjs `TORN`, kit props `torn-clay-*` and `torn-cream-*`,
  four states by day and night each, drawn at twice the page's px so a 68px
  slice is 34u): the terracotta "Join the alpha" lies +1deg on a cream
  under-sheet (-0.7deg, offset 5u left and 7u down) that shows along its
  foot and left end, the near-white "Try it live" +0.7deg; the paper is cut
  from the middle of the kit's own board generations (`board-clay`,
  `board-cream`) graded to the mock's means, torn along every edge by two
  scales of noise with a pale fibre rim; the focus state is a groove in the
  ring colour just inside the tear. Their words are the book face at weight
  480, and by day "Try it live" is in the headline's ink. Only at the stage
  (min-width 900px): below it the keys are the rounded tiles. The first
  section's pin (it straddled the sheet's torn top edge, not on the paper)
  is hidden, the window's bezel is 1.8px, and `.detail-hero.solo` (the
  about page) shows no figure pin.
  Round 7 (M3, M4, LOWs): the page's two extra lines are set compactly so the
  sheet ends where the mock's does (y ~568 at 1672x941) and the hiker shows
  whole: the email note (14u, tucked under the keys) and the facts (12.5u,
  closed under their rule; the fifth fact wraps to a second line); nothing is
  removed. (Round 7 also drew the hiker as gated scene art; round 8
  replaced it, below.)
  Round 8 (M1, M2, M3): the launch page's foreground is stage art, with no
  gate. In the mock the hiker, his dog and rock, and the pines at the
  shortcuts ledge's ends stand IN FRONT of the sheets. They are now three
  whole pieces of cut paper (`scripts/kits/paper-front.mjs`, kit props
  `launch-stage-{hiker,pines-left,pines-right}-{day,night}`), each with its
  own soft cast shadow, laid in `--u` by `.rack-main > .section:has(>
  .reflexes)::after` (stacked over the hero copy and the ledge, z 3) so
  they register at any shape of screen and scroll with the page: no
  aspect-ratio gate, no flat-scene gate, no scroll fade. `hiker` is the
  hiker, dog and rock cut from the mock's own pixels (the rock's foot
  finished as a cut edge); the pines are a generated asset: the mock's two
  pine stands cut off at the frame's foot, so `pines-feet` (prompt
  `art/prompts/paper/pines-feet.txt`, raw `art/raw/paper/pines-feet-b`,
  generated from a pines-only reference of the mock's own silhouettes) draws
  their trunks on to a clean cut base, and the pieces end there (no run-on,
  no stretching). The hiker, dog, rock and pines are painted out of the
  scene's layers (`stageGone`, `scripts/kits/paper-pages.mjs`: the left
  cut-out loses everything below the spruce at its top edge, the right one
  its lowest pines; the land's removal fill shows behind), so no frame
  shows two of them, at any viewport and in the 3D scene (same layers).
  Whole at 1366x768, 1440x900, 1280x800, 1672x941, 1920x1080 and 1920x1200,
  day and night (below 1240px wide the hiker is hidden: the copy's px-minimum
  type pushes text under his head). The Shortcuts sheet's torn top stays
  behind the ridge. At 1672x941 the first screen reads as the mock's picture.
  Round 8 M3 (home, scrolled): a hard vertical layer edge at x ~1462,
  y 830-941 was the lettered stone's cut: the stone's pixels in the scene
  were every pixel of the right layer right of x 1460 and under y 730, a
  straight vertical cut through the leaves and the mid boulder, laid bare once
  the page scrolled its sprite away. Cut now by the stone's own colour
  (`stonePx` in `scripts/kits/paper-layers.mjs`, with the right layer's
  foot holes filled); verified by a vertical-edge scan of the bare scene over
  the scroll range, motion on and off, at 1440x900, 1672x941 and 1920x1080,
  day and night (the old cut is found by the same scan at x 1460-1461).
  "Try it live" has the mock's thick card-stock edge (a second cream board
  of the stock under its foot, ~4px, a shade darker where the first's shadow
  falls on it: `TORN` `under` for `torn-cream`) and a longer, deeper shadow
  (~18px, as measured on the mock's). The keycaps are the book face in its
  regular (400, 26.5u; the mock's "Ctrl" is 38px across).
- **Phone** (`paper-phone.webp`), below 900px: its own scene (the phone's
  four layers above: the sun, the hiker on the hill at the upper right,
  tall pines flanking both edges, layered hills; the scene's foot stays
  behind the content on scroll); the first screen laid out as the mock: a
  header strip 32px tall (the brand, the running links and the theme and
  style keys: no hamburger), clear of the sun; the hero on its card held by
  a tack, "Alpha testers wanted" typed on sage tape over the name, all set
  from the left; the two calls to act full width and standing on the scene
  below the card (not inside it), green then terracotta, each with its
  arrow; the window on its mat, its text ~12.5px; the "Projects" label
  where the mock has its icon dock; the cards two to a row on the band. The
  foreground, composed for the desktop row, is not laid over the stacked
  cards. Round 5: the pin is copper; the eyebrow chip is lowercase
  ("alpha testers wanted." from the sentence-case text, `text-transform:
  lowercase`, weight 600, `geometricPrecision`) so it renders crisp; the
  window is sized to its rows (`aspect-ratio: auto` below 480px; one pane
  of 12 rows, no empty band between the list and the footer, no cut row).

Round 7 (the small items): the home's "Projects" scrap stands where the
mock's does (10px further right, its words 1.5% smaller: 44.3u, the title's
margin and the scrap's offset moved together); the project figure's "Fig. 1"
caption is 15.5u at weight 600 in the black (the mock's strokes are ~2px);
the phone's hero card lies 0.9deg clockwise (the mock's edges measure 0.4 to
1.3deg; its sides lean in, a trapezoid, which is not copied).

Round 8 (the small items, each measured against the original at 1672x941):
- The masthead's cloud is the generator's own white paper and mottle again
  (the band's tone pass had read it with the cream around it: its mid detail
  and tone went to the band's; `paper-sprites.mjs` `bandToned`, a pass of its
  own for the cloud that sets only its tone): interior detail at 2/4 px 3.96
  and 4.59 levels against the mock's 4.46 and 4.93 (it was 3.55 and 3.90).
  The strip's own paper measures no smoother than the mock's (high-pass
  std 3.67/4.21/4.56 at 1.5/3/6 px against 3.35/3.91/4.11), so it is
  unchanged.
- The wordmark "chong" (home and launch mastheads) is the book face at 660:
  the mock's stems measure 6.75px mean (dark runs through the x-height's rows),
  700 gave 6.98, 660 gives 6.71.
- Home, the lower sheet under "Alpha testers wanted": its foot lay ~5px low
  (415 against 410 at 1672x941; `bottom` -47u to -42u) and its right end ran
  on under "Try it live" to x 668, where the mock's ends ~650 and rises left
  past the key's foot (`trimRight` of `hero`, `paper-sprites.mjs`).
- Home, the lead card's title: 40u read a cap height of 28 rows against the
  mock's 25 (its width 102 against 92); 36u, set at the mock's ink x (96) and
  baseline (651): 90 wide, 26 rows. The other titles' widths agree with the
  mock's within 5% (their words and sizes), left as they are.
- Launch: the headline is Newsreader at 560 (500 read 13% less ink than the
  mock's headline), tracked -0.0175em: ink within 0.2% and the first line
  equal in width. (Round 8 also set the palette's veil over the day window to
  the paper's ink at 82%; round 9 replaced it, see M2 above.)
- Phone: the hairline frame inside the hero card was the scene showing through
  the 9-slice's seams (the phone card had no stock under its slices); the card
  has its stock under it now. Its tilt is 0.9deg (the mock's edges 0.4-1.3deg;
  round 7) and stays.
- Home at 1440x900: the "Projects" scrap touches the wanderer's ledge (a few
  px, no overlap). Not fixed: the ledge is scene art under the cover fit, the
  scrap is stage art, and they register only at 16:9; it falls to the same
  cure as the launch page's foreground (a stage piece for the ledge).

Round 9 (rev 9: 3 MEDIUM and the LOWs; measured against the original at
1672x941, captures in `art/raw/paper/.pass/r9/`):
- **M3, the card wells**: the settled form of device 10 above (flush printed
  sheet, grain, ~87.5% of the well's height). Home row, shelves and the
  project figure; day and night; the shelves' meta lines are 12px (below).
- **M2, the launch window** (superseded by round 10's, below: the 1000x631
  capture and its 1396x876 cut are replaced by 880x645, zoomed, 2480x1775):
  the palette's size is baked into the picture.
  The product's still (`public/tauri/hero-quick-open-<theme>.webp`, shared by
  every style, mapped by `src/components/launch/appTheme.ts`) is a 720px
  window in which quick open's 600px palette fills 86% of the width and the
  app is a blurred margin round it: paper.css cannot resize a palette inside a
  picture, and round 8's veil only darkened it. The style therefore uses a
  wider cut of the same app, from the shared pipeline (no second capture
  script): the scene `quick-open-full` of
  `scripts/capture-tauri-shots.mjs` (`SCENES=quick-open-full VIEW=1000x631`,
  3x) captures the web build (tauri-explorer.vercel.app) at a window 1000px
  wide (the narrowest that keeps its sidebar), quick open typed "read", its
  backdrop a light dim in the app theme's own deep colour (14%, 1px blur) and
  the results uncapped, so the palette is **60% of the window's width (the
  mock's is 54%) and shows the ten rows the app gives** with the title bar,
  tabs, sidebar and status bar legible round it; the crop
  `hero-quick-open-wide` of `scripts/shot-crops.mjs`
  (`CROPS=hero-quick-open-wide`) cuts the captures
  (`art/raw/tauri-shots/<theme>/quick-open-full-1000.png`) to the page's
  1396x876 frame inside the window's own edge (nothing of the app cut, the
  status row whole) as
  `public/tauri/hero-quick-open-wide-{solarized,dracula,tokyo-night,aurora}.webp`
  (the four app themes the site wears). `.launch-shot .screen-face` paints
  that cut (`--k-app`, per rice); the product's `<img>` stays in the DOM at
  opacity 0 as the picture's text alternative; the ink veil is gone. Checked
  at 1280x800, 1440x900, 1672x941, 1920x1200, day and night. If the app's own
  UI changes, rerun that scene and crop (`SCENES=` and `CROPS=` leave the
  other shots as they are).
- **M1, the phone home** (390x844 and 360x780, day and night; tablet widths
  481-899 checked too): the window's rows are phone-sized (22px rows, 7-9px
  of pane padding, the words centred in the highlight, 15px chevrons at 9px
  from the ends and the folder icon 14x11 inset 25px, so none collides); its
  mount is the style's torn cream paper cut as a 9-slice (`--k-mount`, slices
  28 27 41 36 art px drawn at 0.6, the box set so the paper stands 7px proud;
  the sprite's shadow pad is lopsided, 20/11/12/25) with a close phone shadow;
  "Join the alpha" is the mock's mid-green torn board
  (`torn-green-*`: `scripts/kits/paper-sprites.mjs` TORN, `board-green`
  graded to the mock's (65, 90, 74), a 300x44 strip so the 9-slice's middle
  is not streaked, four states by day and night, shadowed as the clay one),
  in the same material and treatment as "Try it live" below it. At 481-899
  the window's type was the phone's 3.4cqw, which ran the second pane's path
  under its count at 700px: it is the desktop's 2.4cqw there (min 11px).
- **LOW**: the bottom ~6px of the page was the foreground extension's
  cross-faded join (the quilt averaged two leaf patterns into a blurred green
  band ~20px deep at page y 930-947): `quiltDown` now joins its blocks along
  the minimum-error boundary through their overlap (Efros and Freeman),
  crisp leaves and gaps (`scripts/kits/paper-quilt.mjs`; foreground-day and
  -night rebuilt). The window's folders are the mock's bright blue (#77a9ef
  on the dark app; #4f87d6 on the cream, 3.2:1). The window's edge by day: the
  frame is a step darker than the mat (#d6c8ae) with a darker border, so it
  separates from the cream mount. The shelf cards' meta lines are 12px
  (`.module-top`, `.module-stats`; the stats wrap to a second line where
  they must).
- **Home offsets** (ink and edges at 1672x941 against the original, after the
  fix): the wordmark's left edge and the rule at the mock's x (wordmark +4.6px,
  rule +2.5; tagline 20.7u, its line 359.5 wide as the mock's); the keys'
  edges within 0.5px of the mock's (top 334.8 against 334.7, foot 394.3
  against 394.3; "Try it live" 4% larger in board and words, left edge at the
  mock's); the "Projects" tab's ink foot at y 587 (it stood 6px low; the scrap
  and the lead card's tack meet as the mock's, 248 in the 3x crop); the cards'
  tacks at y 601.1-601.6 (the mock's 601.1-602.2: they stood ~2.7px low), the
  titles' tops within 1px (the lead's 628, cap rows 628-649 against 628-650),
  the screens' feet at 841.5 (the mock's 841) and the cards' foot at 860 (the
  mock's 861.5). The brief's "buttons ~6px tall" measured 1-2px, not 6, and
  the wordmark's "4px left" 4.6. The cards' foot (`.landing` padding-bottom
  77.5u) and padding (18.6u above, 22u below, a 6.5u gap) carry the cards'
  position; the band and the foreground, which lie on the showcase, are held
  where they were (`top` +2.6u).
- Not targets (as the brief says): the trailing full stops and "Fig. 1"
  (shared markup), the phone mock's three-icon strip and plaque title, the
  "+" weight in "Ctrl+P".

Round 10 (rev 10: 1 MEDIUM and the LOWs; captures in
`art/raw/paper/.pass/r10/`, measured against `art/originals/paper-launch.webp`
at 1672x941):
- **M1, the launch window** (device 7 of the launch page; it superseded round
  9's palette-60% cut). The mock's window is 736 x 530 (1.39:1) at x 812-1548,
  y 87-617, on a mat x ~792-1568, y ~68-635; its palette 400 wide (54%),
  rows 31.2 apart, type ~15px, sidebar ~158 wide. paper.css sets the window
  to that (`.launch-hero` column 776u, `.launch-shot` padding 20/18/18/22u,
  margin-top -40u so the mat comes up over the running head's row: the head's
  links end at x ~950; the face `aspect-ratio: 2480 / 1775`; the mat sprite's
  box set out 21/13.3/21/23.7u so the paper's visible edge lies ~20u round the
  window), and the shared pipeline's scene `quick-open-full` captures the web
  build at that scale: the app's own layout drops its sidebar below 861px of
  viewport, so the page is captured at 880x645 (`VIEW=880x645`, 3x) and CSS
  zoomed (which the media query ignores) until the window is 629 layout px
  wide, so its type stands at 1.17 mock px per px. Staged, each a state the app
  has at another size or a palette's own: the sidebar 165u (the "get it" links,
  which are the site's, hidden: they would clip), the status line without its
  key hints (as when narrow), the palette 400u with its prompt and rows set to
  the mock's heights (ten rows, 31u) and its top just under the toolbar, and
  the backdrop a light dim (8% by day in the theme's deep teal, 10% by night),
  **no blur**. Measured at 1672x941: palette rows 31.9px apart (the mock's 31.2),
  row text 16.0px (the mock's ~15); at 1280x800 the rows are 24.3px apart with
  12.3px text, the sidebar's 11.8px, the status line's 10.9px; at 1440x900
  27.4 / 13.8; at 1920x1200 36.5 / 18.4. The crop `hero-quick-open-wide` is
  2480 x 1775 at (80, 80) of the 2640 x 1935 capture, resized to 1800 wide.
  By day the window stands on the mat bare (no bezel: a dark rim was the
  "1px black outline" the mock's dark window never had) with a brown ring
  (`rgba(72,50,30,.38)`) and the paper's soft shadow; by night the thin dark rim
  stays. The Ctrl+P hint is no longer on the mat: it is a slip of the cards'
  ribbon paper (the shelf heads' recipe at 0.3) tucked under it, centred, a hair
  off level, so the window is one framed object.
- **LOW**: the day's cream keycap (`tile-alpenglow` in `scripts/kits/paper.mjs`)
  is graded to the sheet's own cream (the ledge's caps now measure 227,210,190
  on a sheet of 227,210,189; they were 216,196,173) with its top and left
  edges lit at rest and a closer, deeper shadow (the mock's keys are the stock
  they stand on, set off by rim light and shadow). The torn sheet's dark
  flecks are taken out of the sheet art (`scripts/kits/paper-speck.mjs`:
  `sheet-day` -> `sheet-day-clean`, the kit's `sheet-alpenglow` and
  `sheet-night` read it): pixels under the local paper by more than the tooth
  ever is, or brown fibres, are replaced by paper cut from a nearby part of the
  same sheet, feathered (8.6% of the sheet), so no seed or fibre lands beside a
  letter as a tick (the "l" of "Ctrl"; there is no grain laid over type: the
  sheets' fibre is in the sprite under it). The launch email note stands 10u
  under the boards (it had 2u) in the body face's regular, its two underlines
  1px; the facts stay on two lines (the page's fifth fact, "~2.7k unit tests",
  is its own and a line of the sheet's width would need it under 10px). The
  project figure: the caption sits ~6u under the picture as the mock's, the
  stock's deep foot below it; the art is centred in its well by its
  `--drawn-*` bounds (measured: the drawing's centre is within 3px of the
  well's), and the print's proportions match the mock's (460 x 494 against ~460
  x 512 with the tilt; the well 408 square against 416 x 425).
- Noted for the lead: `src/data/screen-bounds.json` is stale for
  `diablo-clone.png` (the art was trimmed after it was written: x 0.4236, w
  0.7806 against the file's 0.419, 0.77), a 2px error; `bun run screens:bounds`
  refreshes it.

## Known gaps

- The window is lit in the visitor's rice: light by day, where the mock's is
  dark (the site's rule: the screens are the rice's). The launch page's
  window is the live app, likewise.
- The cards and the project page's figure show the projects' own 1-bit art,
  not the mock's screenshots or render (the lead's ruling).
- The nav is the site's keys (index, theme, style; on inner pages with the
  way back and GitHub), not the mock's three words: the strip is ~60px
  longer to the left than the mock's, by content.
- Trailing full stops after "A keyboard-first file manager" and "Alpha
  testers wanted" are in the shared markup (`src/app/(rack)/page.tsx`); the
  mock has none, and a style cannot remove a character of the text.
- The launch page's explanation paragraph is hidden at desktop widths (see
  above); its "Opens an email to ..." line and the fifth fact ("~2.7k unit
  tests") are the page's own and stay, set compactly (round 7) so the sheet
  ends where the mock's does at 16:9; at other shapes the stage's own scale
  makes it a line or two taller.
- The launch page's foreground (round 8) is stage art in the page's own px
  (the hiker with his dog and rock, and the two pines at the ledge's ends),
  not scene art, and so departs from the mock in four ways: the hill's crest
  and the green peak that overlapped the sheet's lower-left corner are
  dropped (they could only be scene patches); the left spruce's boughs no
  longer cross the sheet's left edge; below 1240px wide the hiker is hidden
  (the copy's px-minimum type then runs under his head); on ultra-wide
  screens the pieces stand at the stage's edges, so the tallest left pine's
  left side shows the frame's vertical cut where the scene's own pines take
  over. The pines' trunk bases are generated (`pines-feet`), not the mock's.
- The project page's wanderer's old place (the rock's top edge beside his
  boots, x ~300-345, y ~838-850 at 1672x941) keeps a few px of his boots' and
  shadow's stair-stepped pixels; 4px tall, visible at 4x only.
- The launch window's screen is the style's own recapture of the product's
  app (round 10, device 7 of the launch page: the mock's scale, ten rows, a
  light dim, staged: zoomed, narrower sidebar, no key hints, no "get it"
  links), not the shared `hero-quick-open-*.webp`; the mock's is a dark app
  and by day ours is the product's light one (solarized, whose chrome is
  low-contrast by design). The recapture is of the web build at the time (4
  themes), so it does not follow later changes to the app's UI until the
  shared pipeline's `quick-open-full` scene and `hero-quick-open-wide` crop
  are rerun.
- The launch page's hero sheet is the kit's torn sheet, a little less
  ragged than the mock's hand-torn one (a regeneration of the sheet would
  be needed to match its large notches).
- The project figure's drawing stands at ~55% of its square well's height,
  not 87.5%: the projects' 1-bit art is wider than tall, so it meets the 88%
  width cap first (device 10; the lead's rule is the cap).
- The home window carries a 1px dark bezel line and its own drop shadow
  (`.xw`, not its link: the link's isolated stack paints the mat over its
  box-shadow), as round 4 had.
- Wider than 16:9 the bands stretch along their length to the screen's edges
  and the foreground keeps the stage's width: at 2560x1080 the stage's edges
  show where the scene's own foreground (at its larger scale) takes over, a
  hard vertical change in leaf scale (the four sizes of the review are
  clean).
- The masthead tips (device 1) lie over the strip only at 16:9 (1.74-1.82):
  at 1440x900 or 1280x1024 the strip covers the pine's and the peak's tips
  (the stage and the scene do not register there). On the 3D diorama the
  tips are static while the scene parallaxes, so a tilt shows the pine's
  tip move against its own cut-out by a few pixels.
- The wordmark's "o" ornament in the mock is the image model's artefact and
  is not reproduced (the lead's ruling, round 5, M1).
- The project and about pages' foreground pines do not stand in front of
  the cards (the home's foreground sprite and the launch page's pines over
  its ledge are the only ones).
- The phone mock's hamburger and paper tab bar / bottom icon card: the site
  has neither (the running head stays with its keys; there is no tab bar in
  the DOM): "Projects" stands where the dock is. The phone's strip has no
  tagline (it does not fit the mock's 32px strip). On a phone taller than
  the mock's (390x844) the 3D scene shows a little less of each side of the
  portrait core, and a screen wider than the core (a tablet, a phone on its
  side) sees the sky run on, the land mirrored and the cut-outs held to the
  edges.
- The project page's card is taller than the mock's with the real copy
  (up to nine lines at the mock's ~24px): the cloaked wanderer stands on the
  path below the print instead of at the card's foot (see the project page,
  a deliberate departure).
- Round 7 (M1, M2) the kit's under-fill and the strip's tone: the plain
  box the kit lays under every 9-slice stood 0.6 of the sheet's margin in
  from the box's edge, inside the paper's torn outline only up to 28 art
  px, while the tear retreats up to 52: so the box showed past the torn edge
  as square corners and straight slivers on the launch and project sheets, the
  hero when scrolled, and the shelf's modules at night. Now it stands in by 54 art
  px (paper.css, the rule before "no mark before the name"; the cards, the
  strips and the running head keep the kit's). `toned()` in paper-sprites.mjs
  blurred its input in place, so the grade also painted pale paper into the
  soft shadow of every graded strip (the masthead strips' pale stair-stepped
  band): it now leaves the non-opaque fringe as cut (`keepFringe`). Not
  fixed (it changes nothing seen): `mid` in the same function has no effect
  (its two blurs are one).
- The stacked running head on an inner page (390px) was the same defect (the
  strip sprite cut at 152px, a tan box between two pale bars): it is the
  phone strip's 9-slice now, as the shelf head.
