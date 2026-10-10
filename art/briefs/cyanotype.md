# Art direction: "Cyanotype"

One of the selectable styles (issue #1; `data-style="cyanotype"`). The target
is the **original exploration mock**, `art/originals/cyanotype.webp` (full
resolution `art/raw/originals/cyanotype.png`, 1672x941), with
`cyanotype-project.webp`, `cyanotype-launch.webp` and `cyanotype-phone.webp`
for the other pages. Judge the page against those, never against
`art/raw/cyanotype/concept-*`. The Paper Diorama's brief (`art/BRIEF.md`) sets
what every style shares; this file says what Cyanotype is.

## Thesis

The whole page is one cyanotype print: a sheet of white paper brushed with
deep Prussian-blue emulsion, its edge torn and dry-brushed, a fine white
blueprint grid ruled across it, and printed into it, at its margins, the
white photograms of the studio's things (fern fronds, a keyboard, gears, a
compass), taped photo prints and handwritten chalk notes. The site's words
stand on the blue in white; its cards are sheets of off-white cotton paper
taped onto the print, their titles typed in Prussian ink. **The screens still
run the author's terminal rice**: light under the light rice, dark under the
dark ones.

## Signature devices (requirements; positions in the original's px)

1. **The print.** Deep Prussian blue (`#082f55` at the top, `#2c5072` mottled
   toward the middle and foot) with visible brush marks and tooth, and a fine
   white blueprint grid: a long rule across at y~130, registration marks and
   crosshairs at the corners, a ruled box round the projects.
2. **The torn white paper edge** round the whole sheet, 10-50 px deep, ragged,
   the blue drying out into it in bristle streaks (deepest at the foot).
3. **The keyboard photogram** at the upper left (x 0-235, y 85-440), its keys
   white-blue, legends Esc, Caps, Shift, Ctrl, Alt. **Deliberate deviation:**
   the mock's keys are invented (four rows, Caps where Enter belongs, glyph
   noise for legends), so the board is drawn from a real ANSI 60% layout
   instead (`scripts/kits/cyanotype-keyboard.mjs`; legends Backspace, Enter,
   Shift, Menu, Ctrl on the end that shows). Pose, scale, footprint and the
   frosted translucent white caps with bright rims follow the mock's board;
   the material is matched by measurement (round 7): luminance inside the
   board's footprint, mock against live at 1672, p10 37/37, median 77/83, p90
   141/141, p97 178/191 (the case a pale ~135 band with a bright rim, the key
   tops slate with a lit edge, the walls deep navy; the legends a finer pen).
   Round 9 makes the legends small, soft and crisp (`LOOKS.frosted.legend`:
   pen 0.044, size 0.2, word 0.84, colour 232, opacity 1): cap height 10 px
   at 1672 (the mock's ~10-11, round 8's 12.5-14), luminance p95 216 / p99 233
   on "Backspace" against the mock's 204-217 / 228-237 on "Esc" and "Caps".
4. **Fern photograms**: a large frond sweeping from the keyboard down the left
   margin and under the projects (x 0-455, y 415-800).
5. **The right column**: "Small tools. Bigger worlds." in chalk at the top
   right (x 1480-1645, y 40-115) with a short underline; two taped photo
   prints (a mountain and pines; a fern), the column of words "IDEAS CODE
   GAMES AGENTS A BRIGHTER TOMORROW" (x 1560-1645, y 505-630), the gears
   (x 1525-1665, y 680-850) and the compass circle at the foot.
6. **Chalk notes against the page**: "Less clicking. More doing." under the
   buttons (x 480-650, y 395-490); "Build. Play. Repeat." at the lower left
   corner (x 30-120, y 815-905); the stamp "SAME CURIOSITY DIFFERENT MEDIUM"
   in a ruled circle at the lower right (x 1560-1660, y 830-920).
7. **The brand**: "chong" in a large bold white serif (x 245-432, baseline
   ~72): a sturdy, bracketed book face (Scotch / old-style, firm hairlines;
   here Newsreader at a text optical size), a cool white (`#d6dbdd`) with
   the print's texture in its letters (the emulsion missing in specks and
   patches), no glow behind it. The tagline "tools, games, and the agents
   that play them" typed under it in a white typewriter face (x 245-798,
   baseline ~106). No mark beside it.
   **The typewriter face** (tagline, nav, both buttons, card titles, the
   kickers and tags) is Special Elite (`--font-typewriter`, fonts.ts): the
   original's is a slab typewriter with a tall x-height, which Courier Prime
   (the earlier face) ran 20% short of at the same measure. Measured on the
   mock (ink widths, cap/ascender height and x-height of "Join the alpha" 145
   x 14 x 10px, "Ashen Cathedral" 181 x 15 x 11, "Contact" 71 x 13.5 x 9,
   the tagline 553 wide at x-height 11), fitted by least squares over several
   typewriter and slab faces: Special Elite lands within 5% on all three at
   buttons 19.2px, card titles 21.5px ("Scrivo" 23.5), nav 18.5px, tagline
   22px with .9px tracking and a 5.4px word space (the mock sets it wide
   between words). The call's label is struck bolder (a text stroke), the
   ruled button's is not.
8. **The nav** typed in white, right-aligned to x~1385 at y~63 (here: the
   index, theme and style keys).
9. **The flagship**: "Tauri Explorer" in the large bold white serif (x 245-677,
   cap 174-224), a ragged brushed chalk rule under it (y~252), dry toward its
   end, then "Alpha testers wanted" in the serif, regular (baseline ~292).
   The same print texture in all of them.
10. **The buttons**: "Join the alpha", a clean-cut slab of cream paper (its
    fibres showing, no torn or perforated edge, no arrow), typed in regular
    Prussian ink (x 245-464, y 324-381); "Try it live", ruled round in a 2 px
    white line on the blue, typed in white (x 484-679). Square corners,
    normal tracking.
11. **The window**: Tauri Explorer's window (x 718-1477, y 120-520), rounded
    ~8 px, a fine dark keyline, a soft shadow, red, amber and green lights, a
    piece of cream tape over its top right corner.
12. **The projects' heading**: "Projects" in the white serif, regular
    (x 156-259, baseline 584), on clear blue (no fern behind it), a fine
    white rule on from it (to x~1058), and on the rule the chalk caption
    "Different toys for a more interesting world.." (x 1082-1460). Above it,
    **the brushed seam**: a ragged white streak of bare paper across the print
    at y~548 (x~120-1520), from the fern's stem, fading before the right
    column.
13. **Four cards** (x 130-1528, y 604-884, ~14 px apart, each cut to its own
    width): off-white cotton paper (`#d8d6d1`, its fibres showing, p5-p95
    about `#d2`-`#e5`), lightly stained by the emulsion toward its margins,
    its torn edge soft, wavy and fibrous as the mock's (carried along a
    smooth displacement and frayed fine, `softEdge`: not the generated
    sheet's even small teeth; no halo and no diffuse shadow, only a tight
    contact shadow); the title typed in regular Prussian ink
    (`#0a2350`) at the top left, normal tracking, "Scrivo" a size up; a wide
    cream margin (~18 px) round the screen, which is set into the paper as a
    small display: a hairline of printed ink-navy bezel (~2 px, ~3 px
    radius, `screen-bezel`, uneven at its inner edge), a paper-tinted face with a
    faint fibre grain (`screen-grain`) and a soft inner shadow, no bevel or
    glare (the screen stays light by day and is dark by night; the art is
    drawn whole at ~76% of the face by its `--drawn-*` bounds, the same on
    the Tools cards below the fold); the paper is uniform fibrous cream under
    the title (round 7: the blue-wash stains at its margins are at the foot
    and the sides only, none along the top edge, where they drew a pale-blue
    rectangle behind the title; measured down a column through the title
    strip, red 224-231 before, 233-234 after, as the mock's paper); one piece
    of translucent cream tape each, at its own corner (Scrivo bottom right,
    Ashen Cathedral top left, Zheng Shang You bottom right, Brood War top
    right). Tape is the only fastener, on the shelves below the fold too: a
    shelf card's status pin (`.led.sheet-pin`) is not drawn here (the status
    is said in words, "ACTIVE").
14. **The ground's tone**: a greyer Prussian (mean about `#1a3f62`, median
    luma ~47, p10-p90 luma 34-94), brush-streaked, mottled, bleached toward
    the edges; not a deep flat navy.

The site's real content (the pitch's second line, the keys' words, the live
window, the projects' 1-bit screens) replaces the mock's placeholders.

## The other pages (cyanotype-project, -launch, -phone)

Each has its own original and its own plate (scripts/kits/cyanotype.mjs
PRINTS: the mock with the site painted out, props left where the mock has
them, painted on 320 px past its edges like the home print's, all onto the
home mock's duotone ramp). The same torn edge round every page and the
masthead of the home page: the name and its keys printed as words on the
print, no paper bar. Links are ruled in their own ink (cream on the print,
navy on paper), never yellow; yellow is the focus ring's alone.

**Project page** (/p/ashen-cathedral, `cyanotype-project`, plate
`scene/project-{day,night}`; swapped under `:has(.detail-hero .tags)`, from
1100px, where the page is laid on the stage in mock px).
1. The label on tape ("07 . Ashen Cathedral", typed, mixed case), x 108-438,
   y 75-125 (round 7: the page's top padding is 86u, so the label stands
   ~20-30px under the running head, not touching it, and the figure's mount
   starts at 102u so the nav links clear its top tape by ~20px; the headline
   moved down 6u only).
2. The headline in white serif, 3 lines, x 115-815, a hairline under it
   (y~362).
3. The lead in the light sans at the mock's size (25px, tracking .02em, 725
   wide; the page's copy runs 4-6 lines where the mock's is 2, and a second
   paragraph follows it in the left column, a size down), then the tags as white-ruled pills
   (24px apart, a dot closing each but the last) kept to the lead's measure,
   running to a second row rather than into the figure (y~500-580).
4. The figure: the project's own 1-bit art, white on the print's blue, drawn
   whole (its drawing brought up to 90% of the face by its `--drawn-*`
   bounds), on a cream mount cut to the art's 3:2 proportions with a
   straight-cut border (21 of the mock's px) and three pieces of translucent
   tape at its corners (mount-project, 560x393, round 8), tilted -1.1
   degrees, x 842-1402, from y 84 (the mock's polaroid is 520x630 from y 60:
   the print is as wide as the column between the headline's measure and the
   keycap drawing allows, so about two thirds of its area; the top is 24 lower
   so the tapes clear the running head's links); across its foot the strip
   "Fig. 1 . <label>" (400 wide, flush right, a paper strip torn at both ends:
   the page's label where it passes one, "Fig. 1" where not). The mock's chalk note
   "procedurally generated" is NOT reproduced (see device 5). The lead is set
   at 24px (the mock's 25) and 712 wide, so the page's copy runs to four
   lines.
5. In the plate: two dimensioned gears, the keycap drawing in its box, the
   fern, the keyboard at the foot and the note "small systems big worlds".
   **Deliberate departure from `cyanotype-project.webp`:** the page serves
   every project (and the about page), so the mock's Ashen Cathedral
   marginalia (the dungeon-corridor etching, and the notes "procedurally
   generated" with its arrow, "deeper always deeper", "geometry from logic
   -not files", "rooms() enemies() loot() repeat()") are painted out of the
   plate: the corridor and the three note groups are edited to plain
   cyanotype field by the model (`art/prompts/cyanotype/corridor-plate-bleed-project.txt`,
   `corridor-bleed-project.txt`) and only the footprint where the edit differs
   (inside the `CORRIDOR` polygons of `scripts/kits/cyanotype-clean.mjs`, tone
   matched on a ring and feathered) is used, so the rest is the original's
   pixels and no patch shows. The `note-procedural` sprite is gone. The home
   page's notes are unchanged. Round 7 fills the right column under the figure,
   which the figure's shorter frame left bare, and round 8 the lower left,
   where the corridor was (the pitch's second paragraph and the tags now fill
   the left column down to y~600, so the open ground is under them: x 70-500,
   y 590-800), with generic ornaments of the
   print (a fern frond, a small meshing gear pair in thin dimensioned linework,
   registration crosses and a run of grid rule; no words, no project-specific
   picture): the plate
   `plate-bleed-project-dense` is the plain plate edited by the model
   (`art/prompts/cyanotype/ornaments-plate-bleed-project.txt`, raw outputs in
   `art/raw/cyanotype/plate-bleed-project-orn/`) and patched in by
   `cleanPatch` only inside the `ORNAMENTS` polygon of
   `scripts/kits/cyanotype-clean.mjs` (a band that avoids the figure, its
   caption strip and the mount's tape; 45,477 px patched), so the rest of the
   plate stays the original's pixels. Round 8's lower-left ornaments (a fern
   frond, a plain circle with its cross-hair, radius and dimension line,
   registration crosses and a tick rule; no words) are the dense plate edited
   again (`art/prompts/cyanotype/ornaments2-plate-bleed-project.txt`, raw
   `art/raw/cyanotype/plate-bleed-project-orn2/`), patched in inside
   `ORNAMENTS_LEFT` (41,982 px) as `plate-bleed-project-full`, the plate the
   project print is built from.
6. The next sheet is the mock's cream panel (x 500-1600 from y 785): a hairline
   with a tick at each end, and the section's headline across it.

**Launch page** (/p/tauri-explorer, `cyanotype-launch`, plate
`scene/launch-{day,night}`; under `:has(.launch-hero)`, from 1100px).
1. The kicker in a ruled frame whose lines run past its corners.
2. "Ctrl+P for your / filesystem." on two lines, bold white serif, then the
   sub on one line (19.5px, 567 wide), then the calls side by side at the
   mock's y 370-433: "Join the alpha ->" a slab of cream paper in bold
   serif, "Try it live" a 1px white hairline box whose four sides run 7px
   past its corners; the email note; the facts between two hairlines.
3. The live window on a thin cream mount (mount-launch), taped at its top
   left and bottom right, tilted -0.7 degrees, in the visitor's theme; the
   keys that hand it the keyboard under it.
4. In the plate: the keyboard drawing with "mechanical minds build better
   tools", ferns up the left edge, the gear pair and the notes ("small files
   big possibilities", "explore faster") at the right, the keycap drawing
   with "good software grows here".
5. The reflexes section moves up (CSS `order`) as the cream band at y 675:
   its headline across it, three chords in ruled columns (the caps navy-edged
   with a faint blue glow, a gap and no plus between them), a blue fern
   printed on its paper at the left (fern-band, cut from the mock).

**Phone** (home, `cyanotype-phone`, from 720px down; the plate
`plate-phone-{day,night}` drawn at the screen's width from the page's top
edge: the print is the mock's own frame, so its fern runs off the top as the
mock's does, with no slab and no seam, and carried on 520 rows below it by
mirroring its plain foot (`PHONE_FOOT`) so that a phone taller than the mock
shows the print and not the scene's flat ground; the page is set against it at
the mock's coordinates in `--pu`, one px of the 899-wide mock).
*Registration (round 7), measured on the mock at 390 wide (mock px x .434).*
The mock's fern frond runs x 230-316 down from the top edge to y 107, its
note "fast focused yours" x 335-380 y 54-105, its "find faster ->" x 165-225 y
228-262 in the gap between the line under the name (centre y 193) and "Join the
alpha" (top 282, bottom 320; "Try it live" 330-370), its window mount from 395.
Live at 390x844 (day and night): the line's centre 195, Join 280-320, Try
331-371, window mount 396, so the print's keyboard, gears, fern and notes meet
the page where the mock's meet its own (the label on tape and the one-line
name are higher than the mock's two-line name needs, so the label is at 90-118
where the mock's is at 50-72: only that chain absorbs the difference).
*Masthead.* The mock's is one row: a small typewriter "chong" (x 20-58), a
hairline rule, the menu at the far right, y 22. Ours is the same row with the
three real keys in place of the menu: the name, the rule, "index" and the
theme and style keys (32px targets), all in the clear to the left of the fern
(the masthead is cut to x 226 at 390, 522 mock px), with the line "tools,
games, and the agents that play them" typed small under it, wrapped (balanced,
two lines) in the same clear. No word crosses the white of the print, so no
glow is needed. The rule is shorter than the mock's (the mock's runs to the
fern with only the menu's icon to the right; three keys leave it ~30-50px).
1. The label on tape above the name ("alpha testers wanted"), the name in a
   large serif (one line, "Tauri Explorer"), the line under it in a light
   sans. The name's weight is measured, not judged (two reviews disagreed):
   in the real face (Newsreader, opsz 16) at 106 pu / weight 520 the capital T
   is 71.5 mock px tall with a 12.1 px stem, the mock's capital P 71 and 12
   (stem/cap .169 both).
2. In the plate: the keyboard's end at the left, the gear pair and the
   fern at the right, the notes "fast focused yours", "find faster ->",
   "fig. 1".
3. Both calls stacked, as wide as the mock's (634 of 899): the slab "Join the
   alpha" in regular serif, "Try it live" ruled in white.
4. The window on its mount with tape at two corners (the launch page's).
5. The strip of cream paper with a gear, a keycap and a fern drawn in blue
   (strip-phone, cut from the mock), torn at both edges, full-bleed.
Every other page, stacked, reads over a close crop of the home print's
calmest piece (the window's middle, above the seam): no seam through the
text, no props. From 721px to 899px the home page has the home print's crop.

## Plate, sprites and finishes

- **The hero window is a print** (desktop, rounds 6-7). A frosted ring of the
  print's blue round it (`.launchpad-window::before`, `--xw-frame`, with the
  screen grain), a pale rim, and over its face a glaze (`.xw::after`,
  `--xw-glaze`: a cool cast, the edge taken deeper into the blue, a 0.6 white
  veil and a fine grain at 160px, multiplied by day so the window keeps its
  light face and its live text, plain alpha by night), so it sits in the
  emulsion instead of lying on it as a crisp card. Round 7 thinned the ring
  from ~9px to 4u (outside the window's box; ~5px of ring seen: a dark
  ink line, a light rim) and made the grain finer and fainter (it read as dirt
  on the glass). Measured at 1672: the pane's day mean luminance 223 (> 150),
  night 31 (< 110); the tagline's descenders to the window's edge 7px (the
  mock's 11, whose face is dark and whose descenders end 3px higher). The
  left pane shows whole rows only: 12 rows of 3.1cqw (`.xw-rows`
  `repeat(auto-fill, 3.1cqw)`; at 3.16 the 12th was 2.6px short and clipped at
  1672), the foot with its "1/12" count and no partial row. A stacked page (the
  phone's window has its own mount) goes without the ring.
- **The cards' paper and frame** (round 6): the stock is whiter and its deckle
  softer (`stock()`: paper gain, `EDGE_SOFT`, `EDGE_FRAY`); the screen's bezel
  is drawn wider and rounder and printed soft (a hair of blur on `.screen-edge`);
  the titles are set in a darker Prussian ink (`--card-ink`). By night the
  wash behind the title ramps in from nothing (it began at full strength at the
  box edge and drew a stepped rectangle behind the title), and a hair of fine
  noise (`--card-dither`, an SVG feTurbulence tile, not a kit file) dithers the
  8-bit steps of the wash away.
- **Night's outer margin** carries the print's own paper grain
  (`NIGHT_GRAIN` in the recipe's `frame()`), where it was a flat lilac. Round 7
  keeps the grain and moves the tone to a deep blue-grey (`PRINT_NIGHT` gain
  `[0.36, 0.44, 0.5]`; with the blue gained any higher over the red it read as
  lilac): the deckle at 1672 is rgb (83, 100, 110) down the left edge and (77,
  93, 106) along the top, green over red and blue only 10-30 above it, where
  lilac has red and blue over green.
- **The launch page's scrim** (the dim over the light app window,
  `.launch-shot .screen-glass`, `data-rice`): `mix-blend-mode: color` at 0.4
  with the print's blue (`rgb(36 96 178)`) rather than a neutral black, so by
  day the window is dimmed in the print's palette (a pale blue) and by night to
  the print's navy; it was a murky grey-green.
- **The keyboards' frosted look** (`LOOKS.frosted` and `LOOKS.frostedInk` in
  `scripts/kits/cyanotype-keyboard.mjs`, header comment with the mock's
  numbers): home is the mock's frosted case (pale ~135 band, bright rim 228
  at 0.06u, slate tops 66-116 with a 208 lit edge and a navy wall); the phone
  board is `frostedInk`, dark navy tops standing in a pale haze of their own
  walls (a blurred pale rect under each cap, leaning toward the light) in a
  clear case with a thick bright rim, as the phone mock's. The project page's
  board is `line` (round 11, below). Place, pose, scale and the ANSI layout
  are unchanged.
  Round 9 re-places the phone's board only (`BOARDS.phone`: `tr [322,596]`,
  `u [58.3,22.4]`, `v [-24.5,44.5]`): the mock's top edge runs 20.5deg (it was
  22), its foot lies 307 px under the top edge (353) and its right edge leans
  29deg from the vertical (25.5), and its lower right now lies behind the
  buttons, as the mock's does, without showing through "Try it live".
- **The paper at the page's edge** (round 9, `PAPER_DAY` in the recipe's
  `frame()`, a gain on the day finish only; night is graded from the
  ungained frame): the deckle's cream was ~10 levels lighter and warmer than
  the mock's. Median rgb of the torn paper at 1672x941, mock against live:
  left 220,217,212 / 215,212,209; right 215,211,206 / 214,211,208; top
  207,206,205 / 211,210,210; bottom 212,212,210 / 213,213,212 (the mock's
  own paper varies 13 levels round the sheet; live is within 5 of it on
  every side).

## Text knocks out the print (round 9)

The print is a fixed backdrop and the copy flows over it, so where the real
copy is longer than the mock's, or the frame is another size, a blueprint rule
or prop landed under a word (the gear under the "paused" chip on
/p/ashen-cathedral at 1440; a rule through the baseline of the launch note and
the "Try it live" crop mark touching "copy" on /p/tauri-explorer at 1672).
Moving single ornaments cannot hold for every project's copy, so it is a rule:

- **The clean ground** (`scripts/kits/cyanotype-ground.mjs`, `groundOf`): the
  print with everything drawn on it taken out, at the print's own pixels and
  grain (home, project, launch; night is the day ground's night grade,
  finished by the same scene step: `kit.scene.finishes` has
  `ground-<finish>` for each print finish, `public/kit/cyanotype/scene/
  ground-*/sky.webp`). "Drawn" is a pixel that is not blue, brighter than the
  tone round it by 34, or a narrow bright stroke (a white top-hat over the
  blurred luma, > 6.5), closed over a dense object (blur 9 > 0.3) and grown
  3 px; the fill is the tone carried in from the bare ground round it
  (normalised gaussians at 9, 26, 80 px) plus the print's own texture copied
  from the nearest bare pixel. Where the print is bare the ground is the print
  itself, so a patch cannot show a seam. It is built from the print before
  `paintKeyboard` (a keyboard's thin glass left ghosts when taken out after).
- **The patch** (`cyanotype.css`, "type knocks out the print"): `--k-ground`
  is the ground, `--knock` that image as a fixed background sized and placed
  as the scene layer is (`--layer-size`, `center top`), so it registers
  pixel for pixel wherever the copy has flowed to. A `::before` under each
  text block (headline, ledes, eyebrow, tags, the launch page's copy, notes,
  caption, the home tagline, the running head's brand, meta and keys) is that
  image through a feathered mask (smoothstep ramp, `--knock-f` 22u wide, 12u
  on the running head, `--knock-pad` 5u / 3u), so the linework fades out
  before it reaches a glyph. It reads as the mock's clear zones, not a box.
  The chips, the launch page's eyebrow and its keys take `--knock` as an
  opaque fill inside their rule. It applies from 1100px (900px for the
  tagline); on the stack below that, the print is a crop with no props under
  the copy. The running head's links are lifted with `position: relative;
  top`, not `translate`: a transformed ancestor breaks a fixed background.
- **Checked** with `art/raw/cyanotype/.pass/r9/collide.mjs` and `matrix.sh`:
  each page is captured, then again with type transparent and the page's own
  rules hidden, and pixels more than 26 levels over the region's median are
  counted under every text rect and chip. /p/ashen-cathedral (long),
  /p/scrivo (short) and /p/tauri-explorer at 1280x800, 1440x900, 1672x941 and
  1920x1080, day and night: no text rect or chip has a crossing print line
  (one exception, below). The home page at 1672x941 is the mock's picture:
  only the tagline takes a patch, which changes 0.24% of the page. Its hero
  copy already stands in clean zones; the harness's remaining flags on the
  home page (the label chip's tape, "Try it live"'s own box, the
  background-clipped wordmark and title) are the page's own paint, not print
  lines.
- **Spacing**: the launch page's keys sit 16u under the lede (23) and the
  note 12u under them (5), so "copy" stands clear of the "Try it live" crop
  mark.

- **Scene**: one layer per print. The home core, `sky-core` (1672x941), is
  `plate-bleed` (`art/prompts/cyanotype/layer-sky-day.txt`), an edit of
  `plate-day` (the original with the site painted out) with its torn edge
  taken off and the window's tape and the ferns behind the window and cards
  taken out, given back the original's own ground in the recipe (`sky()`):
  its tone at every scale above its tooth, its tooth where both show ground,
  the brushed seam (device 12) and the clean band under it.
  `layer-sky-day` is that core painted on 320 px past its sides and foot
  (`bleed-day`, `art/prompts/cyanotype/bleed-day.txt`), the core pasted back
  pixel-exact (`--sky-bleed-x`, `--sky-bleed-bottom`). The project, launch
  and phone prints are built the same way (`plate-project`, `plate-launch`,
  `plate-phone`, their `plate-bleed-*` edits and `bleed-project`,
  `bleed-launch`; prompts in `art/prompts/cyanotype/`). The other scene
  layers are `none`; no sun.
- **One hue.** The print is Prussian blue and white only. Every plate and
  bleed is mapped onto the home mock's own luminance-to-colour ramp
  (`duotone()`: the median RGB of the mock's print pixels per luminance bin,
  smoothed, each colour scaled to keep its bin's luminance), so no lilac,
  pink, teal or green can survive a generation. The ground's tone under the
  site is filled smoothly from outside it (`smoothFill`, a normalised
  gaussian in floats): the earlier 8-bit blur of the masked colour and its
  mask quantised into terraces, each channel stepping at its own place, which
  showed as coloured ribbons across the lower page.
- **The torn edge** (`frame-{day,night}`): lifted off `print-empty`, laid
  round the viewport (`body::before`) at the print's scale on a 16:9 screen.
- **Sprites from the originals**: the chalk notes of devices 6 and 12 (NOTES,
  from the home mock), the fern on the launch band (`fernBand`, from
  cyanotype-launch), the phone's cream strip (`stripPhone`, from
  cyanotype-phone).
- **Cut from the paper tile**: the mounts of the project figure and the launch
  window (`mounts`: a thin straight-cut cream border with a slightly
  wandering edge, translucent tapes baked in, the cast shadow baked in; round
  8, the mock's are thin print borders, not torn cards). Round 9: the launch
  mount is 812x525 around the 782x491 screen (`MOUNTS.launch`; the screen's
  padding is 15u on the sides and 19u below, `cyanotype.css`), so its cream
  border measures 12-16 px at 1672 where it was ~10 (the mock's 11-18), and
  the window is tilted -1.2deg (`.launch-shot .screen`; the mock's top edge is
  -0.5deg, its foot -1.3deg, so the top reads -0.8deg live). Its tapes sit at
  the mock's corners (`tapes`).
- **Procedural, round 8: the tape** (`tape-clear`, `tapeClear()` in the
  recipe; no prompt). The mock's tape is translucent masking tape: a film
  (tone ~204,204,198 at alpha ~0.62) whose alpha mottles (blotchy thinning
  at 56 and 21 px, a streak, a fine grain), torn and fibrous at both ends, a
  fold band where it doubled. Laid over what is under it, so the print's blue
  and its grid lines show through (measured on blue: live ~152,160,161 against
  the mock's 132,145,156 on a card, ~171-181 on the window's corner against
  171,172,170). Every decal and prop tape (`tape()` decals on the sheets,
  `tape-bit-{day,night}`, the mounts' tapes) is this one sprite, graded for
  night. The paper strips (`tape-day`: labels, the caption) are not tape, and
  stay cream paper.
- **Generated**: `card-paper` (torn by a ruler, bright, ragged fibre; the
  cards' stock is cut from it, its rim whitened and a trace of the print's
  blue crept in, `stock()`), `tile-day`, `mat-day`, `pins`,
  `tape-day`, `chip-day`. The call's slab (`slip`) is a hand-cut piece of
  `card-paper`. The status heads (`pins`) are dyed by a gain per head: active
  a pale Prussian, paused the paper's cream, alpha open an ice white.
- **Derived**: the type's print texture (`type-{day,night}`, round 8: a flat
  chalk off-white, no tonal drift, with fine, soft, translucent bites (alpha
  down to 0.28 at most, a soft edge, a haze between them, a little streaked
  with the grain) where the ink starved, 30% of the wordmark's strokes and
  `type-clean-{day,night}`, 9%, for the flagship's name, which the original
  sets crisp. Round 8 measured strokes' interior luma < 140: wordmark 30.7%
  live against 28.1% in the mock, "Tauri Explorer" 13.5% against 10.6%; the
  first tile's bites were hard navy holes, which read as chewed letters.
  Round 9 moves the tile into `scripts/kits/cyanotype-type.mjs` (`TYPE`,
  `typeTiles`; `worn` share .25 depth .72, `clean` share .09 depth .24 soft
  1.1, fine and shallow: the flagship's name has no navy holes, only specks)
  and measures with `art/raw/cyanotype/.pass/r9/distress.mjs` (interior of
  the letters, closed over bites, eroded 2 px; luma < 140), mock against live
  at 1672: "Tauri Explorer" mock 6.5%, round 8 15.5%, now 9.4% (p25 195 in both
  mock and live); the wordmark mock 21.4%, round 8 27.3%, now 22.1%. Small
  text (the eyebrow, the running head's wordmark) takes flat chalk or a
  bite-free window of the tile: a bite is as big as a hairline there),
  the brushed rule under the flagship's name (`rule-title`), and the cards'
  screens (cyanotype-screen.mjs): `screen-bezel-{day,night}`, a 9-slice of
  slim ink-navy band (round 8: ~2.5 px drawn, its width wandering by 40%, a
  frayed outer edge, the ink worn through in small breaks, a hair of it bled
  in past the inner edge: a rough print, not a ruled outline), and
  `screen-grain-{day,night}`,
  a seamless fibre tile for the screen's own paper.
- **Night** is the same print after dark under a desk lamp, graded from the
  day's (`nightOf`, `phone`: the same grade), so the two register by
  construction.

No generated lettering on the site's own surfaces: every word the site says
is live text. The lettering printed into the scene and the notes is the
original's own.

## Tape, mounts and the print's edge (round 10)

- **One tape, two grounds.** The original's tape is warm beige masking tape at
  fairly high opacity: over the print's blue it reads a neutral grey-blue
  (home pieces 170,171,170; the project page's 150-160), over the cream border of
  a mounted print a shade darker and warmer than the paper (204-208,195-198,
  178-180). Solved as one film under normal compositing: tone ~202,193,178 at a
  mean alpha ~0.81 with a two-level mottle (thick 0.88, thin patches 0.48), a few
  creases (a dark line with a pale one beside it), torn ends, a fold, and a
  hairline of shadow outside the film's cut edge. Procedural
  (`scripts/kits/cyanotype-tape.mjs`; the image model draws tape as opaque
  paper). Live: over cream 206,198,185 at the project figure's top left, 207,200,
  187 at its top right; over blue 145-150 (a thin patch included) there, 163-187
  on the home page.
- **The mounts' tape is a sheet of its own** (`mount-tape-project`,
  `mount-tape-launch`, one per finish), laid over the print by a pseudo-element
  in the mount's place and turn (the paper sheet `mount-*` stays behind the
  print): the mock's tape lies across the print's corner as well as the paper's
  border, and a piece behind the print is hidden where they overlap. Pieces are
  ~98x43 and ~96x42 on the project figure (top left, top right turned 17
  degrees, and a third at its bottom left) and 104x40, 112x42 on the launch
  window, as the mock sizes them. Two shared rules reach these pseudo-elements
  and are reset in the style: kit.css hangs a pushpin from every
  `.detail-hero::after` (a `translate: -50%`), and lays the screen's mat on every
  `.screen::after` as a `border-image` (reset with `border-image-source: none`:
  the minifier turns `border-image: none` into an empty declaration).
- **The project print's border** is the mock's ~18px (live: left 16, right 16,
  top 12.5, bottom 18.5), with a brushed, ragged inner edge where the blue bleeds
  into the paper: the print is masked (`print-edge`,
  `scripts/kits/cyanotype-edge.mjs`: the edge wanders about 2px with speckle
  just inside it) over the mount's cream paper. The art stays whole at 3:2; the
  outer edge is straight-cut.
- **The caption strip** (round 11, superseding round 10's scrap) lies across
  the print's bottom edge as the mock's does, right of centre: right-anchored
  135u from the print's right edge, 24u below the edge, padded 14/62/13/60u
  and centred, so "Fig. 1" gets a ~183u strip and a longer caption grows to
  the left (max width: the print's, less 160u). It is never detached from the
  print. "Join the alpha" is clean-edged with fibre threads.
- **The phone's "Try it live"** is an open outline filled with the print's
  clean ground (round 11): `plate-phone-ground-{day,night}`, the phone plate
  with the keyboard and every drawn thing taken out (`groundOf` over a copy
  of the sheet taken before the keyboard is painted, mirror-footed, night
  graded by `phoneNight`), applied as `--k-phone-ground` with
  `background-attachment: fixed` so it registers with the fixed plate. No key
  shows through; there is no flat colour. (`--knock` exists only from 900px.)
- **Keyboards.** The project page's board is `LOOKS.line` (round 11): the
  mock's luminous white-line technical drawing: dark navy keys (66/58) with
  thin crisp white strokes (rim 252 at .062u, foot outlines, a bright 252
  case outline at .066u, a dark tray and a blurred inner glow under it), a
  `glow` bloom in `finish()` (blurred bright pixels re-added as white light),
  no soft/blur (`soft: 0`) and a fine grain. Pose `BOARDS.project` is
  least-squares fitted (Levenberg-Marquardt over 17 key centres measured in
  the mock; rms 1.35px, a perspective fit was 1.14px so affine stays) and
  shows ~4 rows, with a per-pose case margin (`margin: {x: .65, top: .38,
  bottom: .4}`: the mock's case is deep at its right end), which moves the
  case's corner (`cornerOf`, `placeOf`), not the keys. Lab luminance against
  the mock (p10/p50/p90/p97, region 100,790,200x140): mock 53/65/185/226,
  live 56/75/200/235. The launch page's is the frosted glass board
  (`LOOKS.clear`, round 11: bright frosted caps, top 206/164 at .92, rim 232
  at .034u, skirt dark, legends dark 36, a faint glow, soft 0, crisp case rim
  232) with the mock's bigger keys, fading out along its length (`fade`
  [4.2, 5.6]). Its pose is the mock's rotation and scale, with the corner 28px
  lower than the mock's (510) so the case sits under the real copy's facts
  hairline (527); the mock's rows are shorter than its keys are wide, so the
  affine is `u [36,-8.9]`, `v [12.5,31]`. Four rows show above the tear at
  1280, 1440 and 1672. The board is painted into the launch plate's clean
  ground too (`groundBoard`), because the facts block's feathered knock-out
  patch would otherwise wipe the board's top right corner.
- **Air.** At 1440x900 the tagline is set 2.2u lower (`position: relative; top`,
  not a `translate`, which would lay its knock-out patch over the wordmark's "g"
  descender), and the project figure sits 6u lower so its top-right tape clears
  "GitHub" on /p/scrivo.
- **The home page's dead navy** below the intro sheet carries the print's
  generic ornaments (`cyanotype-ornaments.mjs`, no words: a meshing gear pair
  with centre lines, dimension lines, registration marks, tick rules), laid as
  a mask in the finish's chalk from `.intro .hero-more::after` from 1000px.

## Known gaps (and why)

- **The keyboards are code, not the mocks' keys (deliberate).** The mocks'
  four-row boards (wrong keys, Caps where Enter belongs) are painted out of
  the plate sources (`art/prompts/cyanotype/keyboard-*.txt`; the model's edit
  is used only inside a footprint mask in `scripts/kits/cyanotype-clean.mjs`,
  the rest of the plate stays the original's pixels), and a correct ANSI 60%
  board is composited in the kit build on the same pose and scale: home
  (frosted caps), launch (a clear case with crisp white edges, frosted caps
  with walls, an inset top face, switch stems faint through them), project
  (dark navy caps in white linework, `line`) and phone (dark navy tops in a haze of pale walls, a clear
  case with a bright rim). Day and night both show it, since night is a
  grade of the day layer. The layout has a test (`tests/cyanotype-keyboard.test.ts`).
- **1280x1024** (5:4) is out of scope: the shared bleed is held to 4:3-21:9.
- **Project plate on every project page.** The plate is the Ashen Cathedral
  mock's with its project-specific marginalia (the corridor etching and the
  chalk notes) painted out (device 5): gears, keycap, fern, keyboard and the
  generic "small systems big worlds" remain, under every `.detail-hero` that
  has tags. The lower left of the print, where the corridor was, holds
  generic ornaments (a fern, a dimensioned circle, crosses; round 8). The
  about page (no figure, no tags) stands on the same plate from
  1100px, its words where a project's are.
- **Figure.** The mock's is a render of the Butcher; ours is the project's
  own 1-bit art (white on the print's blue), captioned "Fig. 1" (no page
  passes a label). (The mock's "procedurally generated" note is not
  reproduced: it is the Ashen Cathedral's own claim.)
- **Longer copy.** The real lead is 3-6 lines where the mock's is 2, at the
  mock's size: the pitch's second paragraph and the tags row run down to
  y~600 (the mock's end at 510), over the gear drawing's top teeth at 1440
  and 1920 (round 9's knock-out takes the linework from under the chips and
  words), and a longer row runs to a second line. The launch page's
  lede paragraph is hidden from 1100px (the reflexes under the window say it;
  the shared stylesheet hides it on short screens too) and its facts wrap to
  two lines (five facts where the mock has four); the lines below the
  buttons are shortened to fit above the keyboard drawing.
- **Lead tracking.** The mock's lead is set at about .06em tracking; ours is
  .02em (4% narrower on the first line) so the longer copy does not run to a
  fifth line on most pages.
- **Phone.** The home DOM's headline is "Tauri Explorer" (the mock's "Ctrl+P
  for your filesystem." is not on the home page, and no markup is added); the
  label reads "alpha testers wanted." (the DOM's text, with its stop); the
  masthead's row is the mock's form (small name, hairline rule, keys) with
  the product's index, theme and style keys where the mock has a hamburger,
  and the rule is shorter than the mock's (three keys leave it ~30-50px); the
  tagline the mock's masthead lacks is set small under the row, in the clear
  left of the fern; the window keeps the theme's colours (light by day, the
  mock's is dark); the window is shorter than the mock's, so the strip comes
  sooner.
- **Shelf pins and the kit contract.** Round 7 drops a shelf card's status pin
  (tape is the only fastener), so the cyanotype home no longer requests the
  kit's `pin-*` assets on load, which `e2e/styles.e2e.ts` ("every kit asset
  loads", `["sheet-", "tile-", "pin-"]`) asserts for every style. The kit
  still builds the pins; the assertion is the shared file's to relax for a
  style whose fastener is tape.
- **Launch band.** The mock's band has a notch torn out at the lower right
  where the keycap drawing shows; the section is a plain rectangle to x 1415,
  the print showing beside it. Its descriptions are the page's own
  (longer than "Open anything, instantly.").
- **900-1099px.** The page is not laid on the stage there (the stage is too
  small to set the copy clear of the props): the opening flows over the home
  print, props at the margins.
- **Masthead.** The mocks have none on the project and launch pages; the
  product's masthead is hung from the top margin, clear of the opening.
- **Card screens and the window are product content.** The mock's cards hold
  dark, coloured screenshots and its window is dark; ours are the live app in
  the visitor's theme (light by day) and the projects' own 1-bit art in each
  project's colour (cyan, green, red, amber). Their hues are not the print's
  Prussian blue, by ruling; everything the style draws (plates, ferns, keys,
  tapes, the status LEDs) is blue and white only.
- **Figure mount.** The mount is cut to the project art's 3:2 (the mock's
  portrait frame would leave dead blue above and below it), so it is shorter
  than the mock's (560x393 against 520x630: the column beside the headline and
  the keycap drawing allows no more width), it stands from y 84, not the mock's
  60 (its top tapes reach 19 above it and the running head's links, which the
  mock lacks, are down to 54), and its note is under it, not across its corner.
- **Flagship's name.** The original's face is taller than Newsreader at the
  same measure (cap 53px, x-height 33 against our 43 and 29), so at the same
  width its baseline lies ~10px lower; the name is set down onto the mock's
  baseline (the lowercase centres agree within 3px, the capitals sit lower)
  and the brush rule stays where the mock draws it.
- **Scrolling.** The plate is a fixed layer, as in every style: its brushed
  seam and props stay at their viewport height while the page scrolls under
  them, so the seam shows through gaps between cards below the first screen.
- **Inner pages' running head.** It hangs 31u from the
  top (it was 12): the torn edge's paper is ~20u deep there and the dry
  brushwork it dies into another ~14, which flecked the glyphs, so the row
  stands in the clean blue under it, as the home page's does (checked at 1440,
  1672 and 1920).
- **Masthead over the print.** The running head's links land where the
  print's dimension lines and marks run; a glow of the print's blue
  (`--print-ground`) clears the line near each word. The plates keep
  registration crosshairs in fixed places: the links ride 5px above the
  project plate's (at 70px down), and on the launch page, whose crosshair
  stands in the row (686px across, 38px down), they take the print's open top
  right (to 1480px) and stand closer, which clears it from 1280px. Below
  that a link can cross it. (Round 9: the brand, meta and keys also lie on the
  clean ground, so no line passes a glyph at 1280-1920; the one trace is the
  tail of the crosshair's arm fading out at /p/tauri-explorer 1920, 12-23
  pixels under "chong".) The row's meta ("01 . Tauri Explorer . alpha
  open") is one line from 1360px and gone below it (round 11; it was 1640).
  Measured clear of the links (tightest titles: Tableau Frog 65px and Zheng
  Shang You 82px at 1360; 99 and 118 at 1440; the same titles at 1280 leave
  5 and 23, so it stays off there).
- **Round 11 small fixes.** The phone window's traffic lights start 62
  phone-units in (`.launchpad-window .xw-bar`), clear of the tape sheet at
  390px. The detail hero's eyebrow has 14u more air to the headline (padding
  top 86u to 80u, kicker margin-bottom 8u to 22u; the headline sits 8u
  lower net). The figure's art is centred below 1100px (`--fit: 0.86` default;
  the 1100px+ rule keeps 0.9). Art is not cropped: 192 arts (cards and
  figure) checked at 1280, 1440, 1672, 1920, 390 and 360 against the new
  `--drawn-*` bounds, day and night, on /, /p/{ashen-cathedral, scrivo, bwai,
  zheng-shang-you, eskiv, ballast} and /about, 0 clipped (`.pass/r11/clip.mjs`).
