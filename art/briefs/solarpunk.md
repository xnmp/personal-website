# Art direction: "Solarpunk"

One of the selectable styles (issue #1; `data-style="solarpunk"`). The Paper
Diorama's brief (`art/BRIEF.md`) sets the system every style shares: surfaces
over a scene, the screens in the rice. This file says what Solarpunk changes.

**The original is the target.** The home page is judged side by side with
`art/originals/solarpunk.webp` (full resolution: `art/raw/originals/solarpunk.png`,
1672x941, the day finish), device by device, at the original's own size; the
project pages with `solarpunk-project.webp` and `solarpunk-launch.webp`, a
phone with `solarpunk-phone.webp` (each page is its own target: the devices
of those three are listed under "The inner pages" and "Phone"). The earlier
`art/raw/solarpunk/concept-*`
(frosted panes in a glasshouse, gilt enamel plaques) are not the target.
Coordinates below are the original's pixels, which the page's stage
reproduces (`--u`, globals.css home landing).

## Thesis

A sunlit greenhouse workroom of glass and brass. Through arched brass
glazing and hanging ivy a bright city of towers and waterfalls; inside, a
long wooden desk with a sleeping cat at one end, books and a mug, and a dark
monitor running the app. The site's words are cream type set over the shaded
foliage at the upper left; the projects stand along the front of the desk as
cards of green lacquer in brass tube, ivy growing over them.

## Signature devices (requirements)

1. **The greenhouse of glass and brass in warm sun**: arched brass glazing
   bars, ivy hanging from the roof, a solar panel at the top centre
   (1030-1140, 0-100), the city of towers, bridges and waterfalls beyond at
   the right, low golden light from the upper left.
2. **Shade behind the words** (290-740, 0-390): the foliage behind the brand
   and the copy is dim, hazy green, so cream type reads on it.
3. **The brand "chong"** (313-449, about 136 wide; x-height 34-57.5,
   baseline 57.5): a book serif at its regular weight, lowercase, cream with
   a soft shadow, and **a small green leaf** after it (462-497, 22-60),
   painted and matte, **small and muted**: 0.56 em (about 32 px box, the
   leaf's own green about 28 across, as the mock's), centred at (481, 39) as
   the mock's is (measured: bbox 467-494 x 24-51, the mock's 467-495 x
   26-52; round 4's, at 0.64 em, stood 12 px high), a touch
   desaturated, like the leaves on the sign and the mug, never the system
   emoji and never larger than the mock's (the rev 3 take was a glossy lime
   leaf at 1.4x). Measured at 1672: wordmark x 315-449, x-height top 35,
   baseline 57 (mock 58), the g's bottom 73. The masthead's height is pinned to the mock's 96 mock px (the brand may
   grow without moving what is under it).
4. **The tagline** under it (313-627, baseline 87-89, about 19px), cream; the
   g's descender clears it (a gap of about 4 px: the g ends at 73, the
   tagline's ascenders start at about 77). Round 6 took it 1.5 px up and its
   tracking to -0.003 em (it stood 2 px low and 2 px wide).
5. **The nav as cream serif words** at the top right (1140-1398, baseline
   73.5, about 23px, about 30px apart; round 6 lowered the row 5 px, where it
   stood high), on the scene with a soft shadow and,
   behind the links only, **one soft smear of frosted smoke** under the whole
   row, even along it as the mock's is (round 4's separate patches per link
   were blotchy, and "Solarpunk" the weakest over the pale castle): the
   row's own `.instruments::before`, tinted rgb 44 62 64 at .52 under a
   6px backdrop blur, masked at both ends and top and bottom by two
   gradients laid across each other, so there is no band across the page and
   no hard edge. Measured contrast of the cream words against it: 3.1 / 4.1
   / 4.5 over index / theme / style (the mock's: 2.5 / 2.3 / 3.1). Here they
   are the masthead's keys (index, theme, style); the menu's caret is cream.
   The running head on the inner pages ("index paper theme", "<- all
   projects, GitHub") has the same smear under its keys and a pane behind
   the way back (`.head-nav::before`), so they read on every scene at every
   size.
6. **"Tauri Explorer" large in the serif** (312-715, cap height 44, baseline
   205.5), cream.
7. **"A keyboard-first file manager"** (from 316, baseline 242.5, about 29px)
   and **"Alpha testers wanted"** (317-541, baseline 294.5, about 27px), cream.
8. **The calls**, both 46 tall (316-362): **"Join the alpha →"** on a matte
   pill of bottle-green enamel (rgb 35,61,41) in a crisp ivory hairline
   (316-527); **"Try it live"** the same hairline (rgb 241,237,228) round a
   pill of smoked glass (543-700); both lettered in the serif, cream.
9. **The window inside a monitor seen at three quarters**: a chunky bezel
   (about 20 mock px) of weathered bronze-charcoal in a thin brass edge
   (rgb 27,28,30 at its darkest, corners about 12 round) whose left edge
   (x 760, 132-461) is shorter than its right (x 1377, 101-471), the top
   rising to the right; the screen in it (778-1356, 128-450) in the same
   perspective, **dark** as the mock's app is (the live text stays live, in
   a dark theme, by day too), a short title bar with bright red, yellow
   and green lights; its neck and wide foot (970-1170, 470-525) on a leather
   desk mat, centred under the bezel (cut from the mock's own pixels).
   **Its right and bottom edges are a lit brass bevel** (about 7 and 6 mock
   px, bright at the middle, dark at the inner edge, a verdigris bloom here
   and there: `.launchpad-window::after`, a pair of gradient strips on the
   bezel, under the screen), where the lip round the rest is a hairline; the
   light screen (by day) is glass in warm light, a faint sun cast and a
   soft diagonal sheen over it (`.xw::after`, light rice only).
10. **The wooden desk** across the room: its polished top (500-590) with the
    mat (520-565), its pale sunlit front (590-830), the glossy tiled ledge
    below (830-941) with loose ivy leaves.
11. **The sleeping cat** on its mossy cushion on a leather armchair (15-300,
    365-500), at the desk's left end.
12. **The still life beside the copy**: three green books with gilt spines,
    "Better Tools", "Kinder Software", "A Cleaner Internet" (330-560,
    425-515), a brass pencil cup (555-615, 375-500) and a cream mug "Good
    Tools Brighter Days" with a leaf (585-707, 440-545). One sprite, laid
    21 px lower than rev 3 had it. The generation was off the mock's props in
    four places, corrected on its pixels by `scripts/kits/solarpunk-still.mjs`
    (the generation is kept as `still-life.gen.png`): the **pencils** shortened
    (they stood ~14 px tall and their tips nearly touched "Try it live"; the
    mock leaves ~15 px of air, now ~12), their **pink erasers recoloured to
    bronze caps**, the **cup** narrowed to the mock's width (a quarter too
    wide), the **mug** lowered 7 px within the sprite. Residual against the
    mock at 1672: the mug within 2 px, the cup's rim 3 high, the pencil tips
    2 high, the books' tops level but their bottoms ~8 low (the stack is
    drawn taller than the mock's).
13. **The chalkboard sign** at the left, "A BRIGHTER SOFTER MORE CAPABLE
    TOMORROW" with a leaf (20-150, 95-360).
14. **The brass sign "SMALL PROGRAMS BRIGHTER WORLDS"** at the right
    (1425-1595, 440-550), under a brass armillary sphere (1490-1672,
    200-440).
15. **"Projects"** (131-230, baseline 593.5, about 31px) in dark ink on the
    desk's front, a short rule after it (248-330), and **the caption "A few
    things I've made"** at the row's far end (1403-1557, baseline 594, about
    16px), a faint rule leading into it (round 6: the rule is the mock's
    ~65 px, at a quarter of the opacity it had, ending 17 px before the
    words).
16. **Four cards on the desk** (92-460, 474-830, 845-1196, 1214-1578;
    615-857): a **dark, near-opaque mossy emerald enamel** (about rgb 35-50
    under the name and down the sides, a shade bluer at the top; the scene
    only faintly through it) with moss mottled along its foot and one faint
    catch of the sun at the upper right, in a thin frame of brass tube
    (7-10): **no collars on the arms** (the sub-pages' pipe has them; the
    home cards keep the home mock's frame: `card-frame`), round bends and a
    small gusset with a bolt head in each corner; the name in cream serif
    (40 in, baseline 656.5, about 26px: it stands 4 mock px right and 4
    lower than the card's padding puts it, `.card-title` margins) over the
    screen (310 x 160, 672-832: the 1-bit art framed whole, `contain`, in
    an inset) in **a dark rounded bezel** (3 mock px, radius 9; measured on the mock's
    right and bottom edges, between the panel and the rim) with a
    fine light rim round it (`rgb 172 168 146 / .62`, 1.4 px) and the
    panel's own edge a light line within; the panel is lit in the visitor's
    rice (light by day), the bezel is not. Sampled at the same pixels the
    mock and the page agree to about 10 levels under the names (mock
    33-47, page 34-48).
17. **Ivy over the cards**: **heart-shaped leaves** (about 22 mock px on the
    corner clumps, up to 30 on the bunches at the foot, a natural sheen and
    no sparkle) gathered in **asymmetric clumps at the frames' corners**,
    sparse along the top edge, **spilling over the brass and hanging below
    the cards onto the floor**; **each card differs**. Two generated
    sheets, each cut into four sprigs (`ivy-corner-{a..d}`: a clump with a
    vine along the top and one hanging down; `ivy-foot-{a..d}`: a bunch
    draped over a bottom rail), dress the cards by a cycle of four
    (`:nth-child(4n+k)`, so a fifth card is dressed too): card by card a
    corner clump at the top right (a long top vine, a tall side vine, a
    small clump) or a strip of the left corner, a vine down a side below the
    name, a low tuft along the top, a bunch at the left or right foot (the
    third's spreads out past the card). **Never over a title or a screen**
    (checked by diffing the page with and without the ivy inside each name
    and screen: 0 px at 1280, 1440, 1672 and 1920, by day and by night), and
    clear of "Projects" and "A few things I've made". A phone's two-column
    cards wear only the top corner's clump, smaller (`--sp-ivy-k`). The
    sprigs carry no specular highlight; the matte drape and tuft sprites of
    rounds 3 and 4 still dress the inner pages' panes.

The site's real content replaces the mock's: the window and the cards'
screens are lit in the visitor's rice (light by day), the cards carry the
projects' 1-bit art, "Brood War AI" is "Brood War".

## How the page is built over the scene

The scene is **one plate** (the kit's `sky` layer, every other layer `none`):
the original with the page painted out (`plate-day`, an edit of the
original), and by night an edit of that plate (`plate-night`), so the two
register. The plate's right-hand sign came back misspelled ("PRORRAMS"); it
is laid back in from the original under a feathered rectangle (1418, 432,
190 x 132, 10px feather). The two plates, 1672x941, are kept as
`layer-sky-<finish>.core.png`.

**The bleed.** On a desktop the plate is registered to the stage (kit.css:
drawn at `--u`, its core centred, its top on the stage's top), so it is
painted on 320 mock px either side and 320 below (`scene.bleed` in the
recipe; `--sky-bleed-x`, `--sky-bleed-bottom`), to fill a wider or taller
frame:

1. The ref: the core at (320, 0) on a flat grey (128) 2312x1301 canvas
   (16:9; the bottom 40px are cropped off afterwards).
2. Generated with `bleed-<finish>.txt` on it. The first night take
   (`bleed-night.v1.txt`) relit the day bleed with the night core pasted
   in; it kept the day's floor under the night core's dark foreground ivy,
   a hard step at both lower corners, so the night is painted out from the
   grey canvas as the day is.
3. The result scaled to 2312x1301 (fill, lanczos3), cropped to 2312x1261,
   and the core pasted back at (320, 0) under a smoothstep alpha over 24px
   on its left, right and bottom edges, so the core is the plate's own
   pixels; written as `layer-sky-<finish>.png`.

Where the bleed can't fill the frame the plate scales up to cover it and
drifts a little from the stage (at 5:4, about 6%). What must stand against
the page is a prop of its own, anchored to it:

- **The monitor** is the page's own frame round the live window
  (`.launchpad-window::before`): a bezel of weathered bronze-charcoal
  (20 mock px, 22 at the chin; a brass edge, corners 12), and the window
  turned to the mock's three-quarter view, `perspective(1393u)
  rotateY(-15deg)` about (50%, 78.5%), solved from the mock bezel's corners
  (770,132), (1377,101), (1376,471), (760,461). The screen keeps its own
  type; it turns with the bezel. Its **stand is the mock's own neck and wide
  foot**, cut with a hand-read polygon from `art/originals/solarpunk.webp`
  (`scripts/kits/solarpunk-stand.mjs` -> `monitor-stand`, 204x66 at 968,463)
  and laid on the desk at the mock's coordinates (`.launchpad::before`, in
  stage units, under the window so the chin hides the neck's top). The
  window is a dark app (the page's own `--paper`/`--ink` on the window),
  whose status line (`.xw-hints`) holds whole at 1440.
- **The still life** (`still-life`: books, cup and mug) stands on the desk
  line under the launchpad (`.launchpad::after`): at 2:1 the plate rises
  about 50px against the stage, and books left in the plate run into the
  calls.
- **The leaf** is the brand's mark (`.brand .led`, after the name),
  painted and matte (`leaf.txt`; the glossy first take is `leaf.v1.txt`),
  0.64 em with `saturate(.88) brightness(1.07)` and no glow; the phone
  plaque's leaf is the same asset at the same treatment.
- **The ivy on the home cards** (`ivy-corner-{a..d}`, `ivy-foot-{a..d}`,
  device 17) grows on each card from its title's pseudo-elements and its
  mark's: `.card-title::before` and `::after`, `.card-mark::before` and
  `::after`, each hook placed by the card's cycle position
  (`.showcase-row > li:nth-child(4n + k)`) and set from the card's own
  edges (`right`, `bottom`: card-relative mock px), so any count of cards
  is dressed. The sprigs sit on the frames' corners and edges, above the
  plate and below the title and the screen's pointer events; none takes a
  click. The inner pages' panes keep the round 4 drape and tuft
  (`ivy-drape`, `ivy-tuft`).
- The cat, the two signs, the sphere and the greenhouse stay in the plate:
  they sit in the margins, and with the bleed they stay whole at 16:10.
- The shade behind the words is drawn by the page, anchored to the copy
  (`.landing::before`) and the smear of frosted smoke behind the links
  (`.instruments::before`, soft-edged by a mask on every side): the plate
  edit lit the foliage the mock keeps in shade.
- **The stage is true to the mock.** At 1672 the stage is exactly 1672 wide
  at x = 0 (globals.css subtracts only the measured scrollbar): the
  tokens are the mock's coordinates with no compensation.

## System

- **Type: each page follows its own mock.** The home page at a desktop
  width (and the pages with no mock of their own: about) keeps one voice,
  EB Garamond (`--font-garamond`), the home mock's book face: headlines at
  500, the brand at 400, body copy and the calls. A project's page and the
  launch page take their mocks' type: the heavy display serif for the
  headlines (Newsreader, `--font-display`: 500 at 63px, -0.03em on the
  project page; 600 at 78px on the launch page), the sans for body and
  subhead (Archivo, `--font-print`), the mono for the plaques, chips, the
  keys' legends and the facts (`--font-mono`): no new face is loaded. The
  phone home takes the phone mock's type likewise (Newsreader for the
  headline, Archivo, the mono plaque label, the brand's plaque in Garamond).
  The running head and its links stay in the book face on every page.
- **The running head** on the inner pages is the home masthead: the
  wordmark and leaf (a soft shade behind the wordmark, denser than the
  home's; on a desktop the name is 46px at weight 500 with a stronger
  shadow, so it holds over bright foliage: the head's height is pinned, so
  the larger name moves nothing), and the links as cream words on the
  scene, each group over the soft-edged pane of frosted smoke. Its meta label ("07 - Ashen Cathedral - paused") is dropped where
  the page carries the same words on its plaque (the mocks put them in the
  pane); the head stands over the ivy.
- **Palette (day):** honey sunlight, brass, cream type `#f6eedb`, dark ink
  `#1d281f`, bottle-green enamel and lacquer, smoked glass; marigold
  (`--signal`, `#e8a24a`) is focus.
- **Palette (night):** the same greenhouse by moonlight, lanterns and strings
  of warm lights; the props graded down to the lamplight; the cream type the
  same; "Projects" turns cream on the lamplit desk.
- **Surfaces: two frames, one brass.** The inner pages' panes take the
  sub-mocks' **thick rounded pipe with big round bends, a collar on each
  arm by each bend and a domed bolt on the outside of each bend**
  (`pipe-frame`, generated alone on clear, 9-sliced; `sheet-day`,
  `sheet-night`, drawn at `--plate-k: 1.35`, a tube about 14px thick). The
  home cards keep the home mock's thinner frame without collars
  (`card-frame`: `sheet-card`, `sheet-card-night`, `--plate-k: 0.8`, about
  7px). The panes are glass in the pipe (`frost-*`, or, on the inner pages,
  a milky cream by day (`rgb 251 247 234 / .74`) and bottle-green smoke by
  night, under a light backdrop blur), the shelves' project sheets
  (`.module`) among them; the first screen's four cards, as the mock's stand
  on its desk, are dark mossy enamel in the card frame (the page laying
  `lacquer-<finish>` inside, its sunlit half on the even cards, its shaded
  half on the odd); the strips (shelf heads, feet, picker) are the old
  unriveted glazing. Brass plaques (cream by day, dark bronze by night) and
  pills of green enamel in a brass rim are drawn in CSS (a brass gradient
  on a `border-box` background).
- **Calls:** the call to act is a matte pill of green enamel in a crisp
  ivory hairline (`tile-pill-green`) site-wide; the home page's second
  call is the same hairline round smoked glass (`tile-pill-glass`). Both
  are drawn (`pill-*.svg`, rendered with sharp at 2400x480 into
  `art/raw/solarpunk/pill-*/`): generations gave the rim as embossed brass.
  46 mock px tall on the home page. Other keys are enamel plates in brass
  bezels (`tile-day`, `tile-night`).
- **Focus:** a strip of marigold enamel inside a frame or rim (the glass
  pill's rim itself turns marigold; on the lacquer cards the strip is wider,
  so it doesn't read as more tube); cream where marigold would vanish.
- **States:** hover lifts a pane or a plate into the low sun; pressed sinks
  it out of the light (`scripts/derive-state.mjs`).

## The inner pages (`solarpunk-project.webp`, `solarpunk-launch.webp`)

Each has a scene of its own, generated from its mock as the reference
(`plate-project-day`, `plate-launch-day`, and by night `plate-project-night`,
`plate-launch-night`), painted on 320 mock px on three sides the way the home
plate is (`bleed-project-day` and the rest, `solarpunk-bleed.mjs`), and
swapped in on `:root[data-style="solarpunk"]:has(.detail-hero)` /
`:has(.launch-hero)` (`scene/<finish>/sky`): the study desk with the
blueprints, the pen, the books, the lamp and the planter; the desk with the
notebook and the leaf mug. The first screen is laid out on the stage (mock
px) from 900 px (the launch page from 1100), the panes turned toward the room
(`perspective` and `rotateY`), the markup untouched (CSS layout and `order`
only; no element added or duplicated).

**A project's page** (`/p/ashen-cathedral`; devices, in the mock's pixels):

1. The left pane (150-968 x 85-640): cream glass in the thick pipe, turned
   about 8 degrees so its right edge recedes.
2. The **mono kicker plaque** (205-488 x 155-212), brass-rimmed cream.
3. The headline, three lines of the heavy display serif (about 66px, baselines
   282/350/418; weight 650 and -0.036em on the face's axis, in the mock's
   near-black green, `--sp-head`); the sans lede (about 25px).
   **The words are level and crisp**: text under a perspective or a rotation
   is resampled by the compositor and goes soft (measured on /p/scrivo: the
   copy's gradient energy is 50% higher level than turned, and a plain 2D
   rotation is as soft as the perspective), so the pane's glass and frame (its
   `::before`) are turned about 8 degrees and the text, chips and plaque stand
   level on them, moved by layout (`left`, margins), never a translation. The
   text's measure is trimmed (700 / 690 mock px) so its right edge clears the
   receding frame. (The figure pane and the second pane's heading are still
   turned, as the mock's: the first is an image, the second large type.)
4. The **dark brass-rimmed mono chips** (y 548-598) with a brass dot between.
5. The figure in its own pipe pane (990-1375 x 105-630) with a brass-edged
   frame round the screen, **a domed brass bolt in each of the frame's
   corners** (`.screen-face::after`, four lit domes), and a **"Fig. 1 - <label>" caption plate** across
   its foot (the label the page passes as `aria-label`; where it passes
   none, "Fig. 1").
6. The **tilted second pane** (205-1370 x 655-800) with its heading in the
   display serif, turned about -2.3 degrees.
7. Ivy: a drape over each pane's top left corner, a tuft at each foot, at the
   card ivy's matte scale (rescaled with the sprites: drape 330 mock px, tuft
   240-270).
8. **The figure is whole**, with a paper margin (kit.css `.screen-art`:
   `contain`, inset 4%), on /p/scrivo (a landscape art in a portrait frame)
   and /p/ashen-cathedral alike; nothing is cut.

**The launch page** (`/p/tauri-explorer`):

1. The pipe-framed cream left pane (55-755 x 62-545): the **dark plaque** with
   the mono label (kept whole inside it at every width, one line or two); the
   headline in two lines of the display serif; the sans subhead; the
   **arrowed pills** (the call to act on bottle-green enamel with a "->", the
   second on ivory in the same brass rim); the facts as one mono line with
   bullets (as many as the project has: the shared seplist wraps a sixth
   onto a second line, a bullet never starting a line); the note.
   **The first screen's budget** (round 6; at 1672x941, mock px against the
   mock's): plaque 132-164 (132-165), headline ink 196-346 (196-346), subline
   361-379 (360-379), pills 412-468 (411-467), facts 496-504 (496-505), the
   pane's frame ending at ~543 (543), so the mug and the notebook show in
   the clear desk beneath it (the mug's rim stays behind the pane: the plate's
   mug is not a sprite). The facts at today's five are one row at 10.9 px
   (the mock's four are 12.2); the **note on the email** ("Opens an email to
   ...", copy, terms) is a small stack beside the pills, in the glass the
   mock leaves clear there, from 1200 px; narrower it is a row under them.
   The headline is 600 at -0.038em in the mock's near-black green.
2. The live window as the **mock's laptop**: a lid with a **thin graphite
   bezel** (7 mock px at the sides and top, 11 at the chin, lit along its
   top edge; round 6 took it from a flat black 11/15; the screen stays lit in
   the visitor's theme, light by day) and under it **the mock's own
   keyboard deck on the sunlit wood** (`laptop-deck-<finish>`, cut from the
   mock by `scripts/kits/solarpunk-deck.mjs` with a feathered polygon and
   laid under the lid's foot by `.launch-shot.faceplate::after`, 899 mock px
   wide, a soft contact shadow baked in): no CSS wedge. The page's own
   screenshot is in the lid (the live demo behind it), the keys that open it
   printed on the desk below.
   **The pitch panel** (`.launch-copy`) takes the mock's **thinner frame**
   (`--plate-k: .8`), its frame turned about 5 degrees about its lower
   middle while **the text stays level** (the turn is on the frame's own
   pseudo-elements, not on the panel), with **ivy trailing along its top
   edge** (`.launch-hero::before`/`::after`, the tuft and drape sprites).
   The glass thickens over its last third and frosts harder (14px) so the
   mug that stands against its foot does not ghost through the bottom edge.
3. The page's own section "Shortcuts your editor already taught you" brought
   up to the ledge with CSS (`order`), its pipe's top edge at the mock's 710
   (the hint pill, "Press these keys...", between it and the laptop's deck,
   under the deck rather than over it) and the heading, keys and captions at
   the mock's 763 / 808 / 868, so the captions, two lines at today's copy,
   end at ~914 inside the first screen (the section's label "THE REFLEXES"
   rides the pipe's inner top edge, out of the flow): a pipe-framed pane
   across the page,
   bottle-green enamel keycaps lettered in the sans (Archivo, the page's own
   sans; the mock's legends are a rounded sans, and no new face is loaded for
   it), 48 x 70 mock px with a 34 x 46 px floor,
   the mock's size: rev 3's were a little large), in columns divided by thin
   brass rules, the explanation under each.

Both pages' panes are skinned as a phone's: narrower than 900 (launch 1100),
the shared layout stacks and the same glass, pipe, plaques, chips, pills and
type apply at a finer tube (`--plate-k` .62, then .46).

## Phone

`solarpunk-phone.webp`: the page follows it (a bright, daylit scene crop, not
a darkened one: the phone plate, `plate-phone-<finish>`, portrait 927x1697,
generated from the phone mock with the page painted out, fixed behind the
page and drawn from the top), over which the stacked first screen sits:

1. The brand on a **brass-rimmed plaque of bottle-green enamel** with **brass
   rivets and a gloss** (`--sp-rivets`, `--sp-gloss`), the **same muted leaf**
   before the wordmark; the links (index, theme, style) as small round
   enamel buttons in a gold double rim (the masthead's links stay; the round
   menu button of the mock is the product's own and is not drawn). The
   masthead is `z-index: 2` so the chain hangs behind it.
2. The call line ("Alpha testers wanted.") as a **brass-rimmed mono "badge"
   hanging on a chain** (`.launchpad-copy::before`, from the masthead) with
   **ivy sprigs** at its ends.
3. The **bold headline** ("Tauri Explorer") in the launch page's display serif
   (Newsreader 540, optical size 26: round 8), deep green by day (`#12301f`),
   cream by night; the subhead in the sans, dark by day (cream by night)
   with a soft halo; no copy stands on bare foliage.
4. Both calls **glossy forest-green pills across the column in a gold double
   rim** (`--sp-gold`, `--sp-enamel`, `--sp-gloss`), lettered in the home
   page's serif (Garamond), an arrow at the pill's end.
5. The window is a **device seated on the wooden desk** (round 8, below): a
   dark glass bezel in a thin brass rim, the mug and the books in front of
   its lower corners.
6. The project cards follow it; their heading "Projects" is a brass plaque.
7. The tagline under the brand is a **small brass-rimmed plaque** (parchment
   by day, bronze by night; the same plaque as the label below it), not a
   translucent grey pill.

## Round 7 (the rev 6 review's findings)

- **Inner-page headlines** are measured against their mocks in the real
  faces (stem width as a share of the em, the ink gap between words), and set
  as the mock sets them: weights 540 (project, 63px: stems 8px, mock 8),
  590 (launch, 78px: stems 11, mock 11) and 500 (phone, mock stems about
  0.115em), each with the tracking paired with word-spacing (the space is a
  glyph, so negative tracking alone closes the words: "outof", "foryour").
  Round 6's 600 to 650 at -0.036 to -0.038em ran the stems 25% heavy and the
  gaps to 7px against the mock's 15 to 18.
- **The launch ledge** is an opaque warm parchment (about rgb 236 224 196,
  lit warmer at its upper left) with no backdrop blur; its keycaps (and the
  hint pill's) are drawn in CSS, deep bottle-green enamel (rgb 10 34 26 to
  25 54 42) in a thin brass rim, not the kit's mottled olive tile.
- **The first call's pill** (the launch page only) is drawn with a bright
  brass rim; the kit's pill carries the home mock's ivory hairline.
- **The launch eyebrow** is bottle green and has no pin; the email note is one
  row under the buttons at 15 mock px in the page's ink, its links underlined
  in brass.
- **The shelves' name band** is a round-cornered brass tube (a masked ring)
  over the strip's own glass, so it frosts what lies behind it (`e2e/styles`).
- **The cards' lacquer** is rebuilt (`solarpunk-lacquer.mjs`: GREY 0.14, gold
  dapples over the upper half) so the panel reads deep green, not grey smoke;
  the screen bezel is glossy dark glass.
- **The monitor** has a 7 mock px black well round its screen (the window's
  own spread shadow).
- **The project pane** has four domed brass rivets just inside its bends (the
  glass pseudo-element's backgrounds, so they turn with it); the chips have a
  3.6 mock px lit rim and 9 mock px beads; the lede is 25 mock px at weight
  330; the running head's leaf is lit and edged in cream.

## Round 8 (the rev 7 review's findings)

Measured on the mocks in their own pixels, scaled to the live size.

- **Phone window as a device (M1).** The phone mock's window: a dark glass
  bezel 7 px at the sides, 8.4 above and 9.7 below (at the phone's 390),
  in a brass rim 6 px thick, outer corners 16 px round, the screen's own 7,
  a camera dot in the top of the bezel; the screen stays light by day, dark
  by night (only the bezel is dark). It is drawn on `.launchpad-window::before`
  (a dark-glass gradient over the brass, `--bz-*`).
  - **The desk.** The fixed cover-fit plate cannot register with a window
    that flows in the page, so the phone plate is regenerated with the mug,
    the books and the desk painted out (`plate-phone-nodesk-{day,night}`,
    prompts `art/prompts/solarpunk/plate-phone-nodesk-*.txt`) and the three
    are cut from the old plates' pixels (`scripts/kits/solarpunk-phone-props.mjs`:
    hand polygons for the mug, with its handle hole cut, and the books, the
    desk's clean planks and moss mirrored out to 927 px) and anchored to
    `.launchpad`: the desk strip behind the window (`::before`, z -1), the
    mug and the books in front of its lower corners (`::after`, z 3). Sizes
    follow `--sp-pu` (100vw / 927, one mock px); the mug is scaled .78 and the
    books .9 so they cover none of the app's last rows (the status line has
    left padding for the mug).
- **Phone headline (M2).** Capitals 26.7 px tall (a 37.3 px face), stems
  0.113 em, baselines 36.6 px apart (0.98 em), words 8 px apart, mean colour
  rgb 19 49 32 (live 21 49 32). Newsreader at 540 weight, opsz 26,
  `clamp(32px, 9.55vw, 52px)`, tracking -0.02em with 0.04em word spacing.
  It had been 500 at the automatic optical size, visibly lighter.
- **The wordmark leaf** is a crafted raster (`leaf.txt`, generated from a
  crop of the mock's leaf as reference, `solarpunk-leaf.mjs` cleans its alpha
  to its largest body): two-tone painted leaf with a dark midrib groove,
  0.61em on the home and the running head's wordmarks, matching the mock's
  leaf position and colour within a pixel; the phone plaque's leaf is 19 px.
  `leaf.v2.txt` is the old matte one. The `aria-label` is unchanged.
- **Home cards' brass** is the same tube graded down (`solarpunk-card-brass.mjs`:
  a tone curve on `card-frame`, highlights pulled 38%, blue pulled 25% more,
  so it reads as the mock's gold, not orange); the widths already matched.
- **Masthead.** No scrim over the link group: each word stands in its own
  soft halo (a radial pane of smoke under the word, blurred, its edge masked
  away; contrast on the pale sky at least about 2.9). The running head's
  shared pane stays (inner pages, where the links are over busier scenes).
- **Home monitor.** The mock's dark bezel measured per side at its own size
  (1672 wide), set in the monitor's own plane before its turn (which
  shortens the left side and lengthens the right) at 19 above, 15 left, 17.5
  right and 22 below (mock px); the black well
  round the screen 2.5 px (was 7). The app's rows are 20 mock px apart
  (`grid-template-rows: repeat(auto-fill, 3.46cqw)` on this window; 23 before).
- **Launch ledge (the shortcuts panel).**
  - The rim was this panel alone at the pipe's full size (`--plate-k: 1.35`,
    about 20 mock px). The mock's pipe is 14 px up its sides and 6 to 10 along
    its top and bottom; the panel is now at the launch pane's 0.8 (about 12),
    and its top edge at the mock's 709 px.
  - The paper is cool cream (rgb 231 217 192 mid-panel, 236 225 201 lit
    upper right, 215 200 160 at the sides; mean luminance 214 against the
    mock's 217) with soft clouds and a light grain (inline SVG
    `feTurbulence`, no raster), a warm side shade and a shaded top edge; it
    was a flat gradient.
  - The eyebrow ("THE REFLEXES") rides 8 px under the pipe and 11 over the
    heading; the heading stands 7 mock px lower than the mock's to make the
    room.
- **The Ctrl+P hint** is a small plaque in the style's vocabulary (the
  same `--sp-plaque` as the labels and pills: cream by day, bronze by night,
  a thin brass rim, a soft shadow on the desk) with the ledge's deep-green
  keycaps, standing on the bare desk under the deck's front edge, covering
  none of the laptop.
- **Scripts added:** `solarpunk-phone-props.mjs` (desk, mug, books),
  `solarpunk-leaf.mjs`, `solarpunk-card-brass.mjs`.
- **Assets added:** `phone-{desk,mug,books}-{day,night}`, a new `leaf`,
  `plate-phone-nodesk-{day,night}` (the `phone-{day,night}` sprite is now cut
  from it), `sheet-card*` rebuilt from `card-brass`.

## Known gaps

- **The phone's three feature tiles (Fast / Native / Open source)** are not
  drawn: the page has no such content (the project cards follow the monitor).
  The mock's round menu button likewise: the masthead's own links stay.
- **The keycaps' legends** are the page's own sans (Archivo), not the mock's
  rounder sans: no face is added for them.
- **The mock's placeholder copy** (a one-line lede, a 3D render in the figure
  pane) is replaced by the page's real copy (two longer paragraphs, 1-bit art),
  so the project page's left pane is about 150 mock px taller than the mock's
  and the second pane starts below the first screen at 1672x941. The
  figure's caption reads "Fig. 1" (no label is passed).
- **The phone's still life is a sprite pair on the page**, not part of the
  fixed plate: the mug and the books follow the window, so their registration
  to the plate's foliage behind them is by blend (the nodesk plate fills the
  space they leave), not by pixel.
- **Props that overlap panes in the mocks** (the launch mug over the pane's
  foot, the project page's books and mug over the second pane) stay in the
  plate, behind the panes: the real copy puts the panes' edges elsewhere, and
  a sprite above them would cover text.
- The mock's launch page is shown with its dark app; the page's live demo
  poster follows the rice (light by day).
- The ledge shows the page's eight shortcuts in four columns (the mock shows
  three groups).
- The launch lid is about 511 mock px tall against the mock's 494: the
  screenshot keeps its own aspect ratio, so the thin bezel can't shorten it.
- The launch lid's screenshot is the page's own blurred poster of the app
  (lit in the rice), where the mock draws its dark app crisp.
- The still life's registration is not exact: one sprite, the books' bottoms
  ~8 px low against the mock at 1672 (see the devices).
- The launch pane's glass lies over the plate's mug (the mock's mug stands in
  front of its bottom edge): the pane ends where the mock's does, and the
  mug's body and leaf show under it, but its rim is behind the glass.

## Scripts (hand steps, so the kit rebuilds from the raws)

- `scripts/kits/solarpunk-bleed.mjs ref|assemble <finish>`: the grey canvas
  to paint out, and the assembled plate with its bleed (`day`, `night`,
  `project-day`, `project-night`, `launch-day`, `launch-night`).
- `scripts/kits/solarpunk-stand.mjs`: the monitor's neck and foot cut from
  the mock.
- `scripts/kits/solarpunk-fix-plate.mjs`: lays the right-hand sign back from
  the original under a feathered rectangle.
- `scripts/kits/solarpunk-deck.mjs`: the laptop's keyboard deck cut from the
  launch mock (a feathered polygon) into `art/raw/solarpunk/laptop-deck/`.
- `scripts/kits/solarpunk-still.mjs`: corrects the still-life generation on
  its pixels (shorter pencils with bronze caps, a narrower cup, the mug 7
  mock px lower), keeping the generation as
  `art/raw/solarpunk/still-life/still-life.gen.png`; writes `still-life.png`.
- `scripts/kits/solarpunk-lacquer.mjs`: the cards' enamel, built from the
  lacquer generation (`art/raw/solarpunk/lacquer`) into
  `art/raw/solarpunk/lacquer-enamel/`: a 32% pull toward grey, gain .74,
  its sun compressed to a faint catch (a knee at 66: what lies above it is
  carried at 0.3), a cool lift at the top (the mock's leaf-shadow is bluer),
  moss mottled over the last third (two octaves of seeded noise), laid at
  .96 alpha; the recipe lights it for the night (gain .7).
- `scripts/kits/solarpunk-ivy.mjs`: cuts the two ivy sheets
  (`ivy-corner`, `ivy-foot`) into four sprigs each (`ivy-corner-a..d`,
  `ivy-foot-a..d`), each trimmed to its leaves (the cut stops if a sheet
  does not hold exactly four separate sprigs).
- `scripts/kits/solarpunk-phone-props.mjs`: the phone's desk strip, mug and
  books, cut from `plate-phone-{day,night}` into
  `art/raw/solarpunk/phone-{desk,mug,books}-{day,night}/`.
- `scripts/kits/solarpunk-leaf.mjs`: cleans `leaf-gen` to `leaf/leaf.png`.
- `scripts/kits/solarpunk-card-brass.mjs`: `card-frame` graded to
  `card-brass/card-brass.png`, the cards' frame source.
- then `node scripts/build-kit.mjs solarpunk`.

## Raster kit (prompts in `art/prompts/solarpunk/`)

| group | assets |
|---|---|
| scene | `scene/{day,night,project-day,project-night,launch-day,launch-night}/sky` (2312x1261: `layer-sky-<finish>`, the plate with its bleed, above) |
| props | `monitor-stand-{day,night}` (cut from the mock), `still-life-{day,night}`, `ivy-drape-{day,night}`, `ivy-tuft-{day,night}`, `lacquer-{day,night}` (from `lacquer-enamel`, scripted), `ivy-corner-{a..d}-{day,night}` and `ivy-foot-{a..d}-{day,night}` (the home cards' ivy, cut from two generated sheets, scripted), `laptop-deck-{day,night}` (cut from the launch mock, scripted), `phone-{day,night}` (the phone plate), `leaf` |
| sheets | `sheet-{day,night}` (the panes, from `pipe-frame`) and `sheet-card`, `sheet-card-night` (the first screen's cards, from `card-frame`) `-{normal,hover,focus,pressed,flat,sheen}` (the panes also `-light`); `sheet-strip-{day,night}-{normal,light}` unriveted |
| glass | `frost-{day,night}` seamless tiles, painted by the page under a backdrop blur |
| tiles | `tile-{day,night}`, `tile-pill-green`, `tile-pill-glass` (from `pill-green.svg`, `pill-glass.svg`) (`-{normal,hover,focus,pressed}`) |
| mounts | `mat-{day,night}` 9-slice brass bezel |
| fittings | `pin-{brass,green,amber,signal}` studs, `tape-{day,night}` brass name-plate, `chip-{day,night}` |

`ivy-corner.txt` and `ivy-foot.txt` are the round 5 generations of the
home cards' ivy (reference: four crops of the home mock's card ivy at
3.2x), each a sheet of four sprigs cut apart by `solarpunk-ivy.mjs`;
`ivy-drape.txt` and `ivy-tuft.txt` are the matte, small-leaved round 4
generations that dress the inner pages' panes; `lacquer-enamel.txt` and
`laptop-deck.txt` are placeholders: those two assets are scripted, not
generated. `*.v1.txt` and `*.v2.txt` prompts are earlier generations kept for reference
(`card-frame.v1.txt` is the first frame, with collars and heavy gussets, now
`pipe-frame`'s thick-pipe cousin; the `layer-sky-*` raws now hold the plates
with their bleed, which have no prompt of their own); `sheet-day`,
`sheet-night`, `tape-day`, `tape-night`, `tile-signal*`, `scene-day`,
`concept-*` and the `layer-*` prompts belong to the concept the original
replaced and are no longer built. The cat and the phone's desk props
(`cat.txt`) are no longer built: the phone follows its own mock.
