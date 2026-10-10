# Art direction: "Celestial Atlas"

One of the selectable styles (issue #1; `data-style="atlas"`). The target is
the original mock, `art/originals/atlas.webp` (full size: `art/raw/originals/
atlas.png`, 1672x941), generated from the user's tile on the ten-direction
board (`art/originals/atlas-tile.webp`; where the two disagree, the tile is
the user's). It is a **night** picture: it is matched under the dark rices
(`cosmic-dusk`). The `concept-*` raws are later re-imaginings and not the
target.

## Thesis

An antique engraved celestial atlas, printed in gold on deep navy: the night
sky over a lake, full of stars, its constellations drawn as gilt figures
joined by dotted lines, a celestial grid's arcs over it all, a full moon and
an observatory on a cliff. The page is a plate of that atlas: the whole of it
in a fine gilt double border, every card and window in a thinner gilt double
rule with small scroll flourishes in its corners, the type an old-style roman
in cream and gold, the motto in spaced gilt capitals at the foot.

## Devices (each a requirement; mock px at 1672x941)

1. **Night sky.** Deep navy (`#0b1a2b`) full of fine stars and gold
   four-point sparkles, a Milky Way haze right of centre. *Scene (plate).*
2. **Constellations.** Gold engraved figures, a bear (upper left, x60-190
   y130-245) and a bird (left, x20-180 y305-480), with their dotted star
   lines across the sky. Their fine line (the coat's hatching, the feathers)
   is as strong as the mock's. *Scene; the figures are the mock's own px laid
   back over the plate (derive.mjs sky, FIGURES), a touch sharpened, and the
   quiet field keeps them (derive.mjs quiet).*
3. **Celestial grid.** The radial grid at top centre (x600-1050 y0-210), the
   long arcs across the sky, the great armillary arcs at the lower right
   (x1340-1672 y440-941), a half-dial on the left edge and quarter-dials in
   the lower corners (the lower left crisp gold). *Scene; the lower corners' quarter-dials are the frame's (below), pinned to the viewport's corners.*
4. **Moon.** A full moon, upper right (x1460-1540 y145-228; centre
   1499.7, 186.4, disc radius 41.2), its limb soft and a pale-blue bloom
   round it, a long tail of it out to ~70px: on a ring 54-84px round the moon
   the sky's luminance measures the mock's 36-44 (mean 38.7; live 37.4 at
   1672, 37.0 at 1440, 37.2 at 1920, 37.5 at 1024; it was 30.6 with the dark
   disc of the soft moon: the matte must never return). *A sprite of its own
   (the scene's sun, `moon-night-mock`, derive.mjs moon): the mock's own
   disc lifted 4x (lanczos, so the craters keep its contrast) and its bloom
   as the sprite's alpha (the median over angle of the mock's px at each
   radius, less the sky 100-130px out, tapered to nothing by r=80), a
   pale-blue light of one colour per radius; the plate under it carries the
   mock's sky with the moon's disc filled flat to the sky and the bloom taken
   off (derive.mjs sky: `MOON`, `bloomOf`), so the sprite over it gives the
   mock's px back. Four corner marker px (alpha 3) keep the sprite's canvas
   whole through the kit's trim. On a phone, where the headline spans the
   screen, right of its first line.*
5. **Observatory.** A domed observatory with lit windows and a telescope on a
   pedestal beside it, on a cliff at the right (x1300-1610 y250-440), the
   cliff falling to the lake. *Scene.*
6. **Mountains and lake.** A dark range over a lake with a town's lights and
   their reflections (x380-1230 y470-600). *Scene.*
7. **Gilt border.** The mock's own distressed frame, cut from its px: the
   heavy outer rail and the thinner inner one, the notched ladder and
   cartouches down the sides, the short local ruler marks along the top (no
   full-width ruler row), the corners' scrolls at their full length (the top
   left's swirl runs ~140px in, the top right's hangs the junction under the
   nav's rule). *A frame round the viewport (`body::before`), on every page,
   so it holds at every aspect; out of the plate. The art is `page-frame`
   (derive.mjs frame: the gilt's alpha from its gold-ness against a sky
   estimate and its colour unmixed from the sky, 1664x933 RGBA), a CSS
   9-slice (slice 152, `round`; on a phone, a little over half size, laid
   at its own size and cut: `repeat`): the corners whole and the mock's own
   run of each edge between them, so at 1672x941 it is the mock's frame to
   the px and on any other shape the same frame lengthened. The same px are
   taken out of the plate (derive.mjs sky: `BORDER`, the matte dilated 2px,
   filled with the window median of the sky that is not gilt, and its
   grain), so the border prints once. The overlay devices it replaced (the
   top band, the junction, the old drawn rails) are gone from the kit.*
8. **Compass rose.** Beside the brand at the upper left (x45-140 y15-135): a
   thin-line eight-point star (its long points N/S/E/W, the diagonals short,
   a small cross between) in two fine gold rings, the mock's: a line drawing,
   not a filled star. *The brand's mark (`.masthead .brand .led`), anchored
   to the stage so it stays against the name; drawn (derive.mjs compass, an
   SVG), out of the plate.*
9. **Brand.** "chong" in a warm gold-cream old-style roman (~52px, book
   weight), lowercase, x163 y45-80 (the mock's px: top 252,226,152). The
   tagline under it in the same face (~20px, a lighter weight than the name),
   cream.
10. **Masthead rule.** A double gilt rule under the brand and the nav
    (y108-116), from the compass's right into the right border, a small
    diamond (~6px) at its left end, a tick across both rules at its right
    end (x1404) with the upper rule run on to x1417 and tipped with a small
    diamond, the mock's small device where it meets the border (the frame's
    own top-right corner carries the rest of it), and the pendant hung on it
    at x1161: a small ring (~9px) over a stem that crosses both rules (y107-123),
    swelling where it meets the upper (round 7; the plate's repaint of it
    left a star there, sunk away with the one at the rule's end: `STRAYS`).
    *`.masthead::after`.*
11. **Nav.** The keys as cream roman words (~27px) at the top right (y62).
    On the inner pages the running head's keys are the same words.
12. **Headline.** "Tauri Explorer" large (~90px) in pale champagne gold
    leaf (`#e6c986`): the leaf's mottle (derive.mjs foil), lit along its
    tops, faintly embossed (a dark halo round the glyphs, a crisp shade at
    its lower right, a soft shadow); the night's leaf (`foil-night`) measures
    the mock's mean (233,196,124 against 236,200,124) and its mottle (sd
    12/15/19 against 12/18/24).
    Set by measurement at 1672x941, the mock's: stems 10px (T, E; the
    lowercase 8-9, the l 8), the E's stem 192px on from the T's, the last r's
    259px on from the E's, cap 59px, bbox x197-692, baseline y261; its
    glyph px average 226-230,201,133-142 (q50 241-245,205-209,124-148).
    (Rev 1 read it too heavy, rev 2 too light: the stems say 10, which is
    EB Garamond at 520, tracking -0.016em, in the roman the page loads.)
13. **Pitch.** "A keyboard-first file manager." and "Alpha testers wanted." in
    cream roman (~42px), two lines, baselines y310 and y356.
14. **Primary button.** "Join the alpha →": a plate of weathered
    parchment-gold leaf (the mock's px at the left of the words: 214,172,91,
    mottled, 8-9 of spread) in a pale gilt rim (the mock's, 226-241,194-218,
    127-156, 2px), a warm-black keyline just inside it (1.3px, 3.5px in) with
    a lighter gilt hairline inside that (the doubled inner line), the corners
    cut, and an inset bracket in each corner (an L, elbow 7px in, arms 5px;
    no round rivets); no second rule across the face.
    The words semibold, near-black roman (~25px), centred; no hard shadow;
    x202-437 y400-452 (derive.mjs tiles/signal, drawn on clear: nothing
    shows outside the notched frame).
15. **Secondary button.** "Try it live": navy in two fine, distressed gold
    rules, both the window's gold (round 7, M2: the mock's lines run 150-198 /
    115-166 / 72-108, not a pale cream and a grey; live outer 184,148,85,
    inner 162,131,80, mottled along the line and flecked through in places:
    derive.mjs tiles, the night's `wear`), both chamfered; its label the
    primary's size, book weight; x458-626 y400-452.
16. **Window.** The dark app window (x781-1277 y160-442) in a gilt double rule
    (a light one, its two lines ~5px apart) with corner flourishes (the
    cards' frame at about the mock's scale, `--wk` 0.5), a few px outside it,
    and inside it a dark recessed band (the night, a hairline of the window's
    edge at its inner side, along the panes only) before the panes
    (`.xw::after`). The bezel round the panes is the title bar's and the
    status line's own dark (5,22,38); the two panes are recessed rounded insets
    (7px radius, a 1px lighter border 27,42,58, a dark shade round them) of
    the mock's deep teal-navy (14,25,39), 16px in from each side, at y41-250
    of the window (the left 219px wide, the right 235, 11px apart with a
    hairline between at x241); the title bar's hairline at y32 and the status
    line's at y253 (40,56,74). The lights (13px; vivid red 251,75,65, amber
    253,190,41 and green 70,180,85 at their cores, the mock's) stand at
    x796 and 19px down, the title 96px in, so the frame's corner scrolls clear
    them; the status line's words are 28px in at the left, 25px at the right,
    clear of the lower scrolls. Its words a cool grey, the folders broad
    blue tabs (~20px, 111,178,250), the open row the mock's blue band
    (36,74,119). The real path headers and the "dir" column stay (inside the
    panes), the column going on a window under 330px, where the mono's floor
    would cut the names; a name too long for its pane is cut with its
    ellipsis 10 of the mock's px short of the column (round 8). Its type ~13px on the stage (fewer
    rows), the title beside the lights and 20px in from them (the mock's
    stands at x878), the key hints left out where they don't fit.
17. **Heading.** "Projects" in gold roman (~42px), its P at x82, baseline
    y564, a double gilt rule running on from it to the row's end: the mock's
    two lines are unequal, the upper (y562, 213,164,97 at its core) from
    x243, the lower finer (y566, 178,134,75) starting 13px in from it, both
    dimmer than the page's gilt (80%) and broken at the stars: asterisk stars
    (eight rays, ~22px tall) set on it at x457, 630, 894 and 1005 (the last
    smaller); on a phone, where the rule is 243px and its 13px stars crowded
    it into a smudge over the plate's own, the double rule alone. (Round 6's review called it a single hairline; the mock's px
    are two lines, and weight, inset and brightness are what were off.)
18. **Cards.** Four in a row spanning the mock's edges (outer rules x78-449,
    466-825, 844-1200, 1219-1594, y586-848: 360-375px wide, ~18px apart, the
    mock's uneven widths): a navy field in a thin, weathered, speckled gilt
    double rule (234,187,96 at its brightest; derive.mjs frames, a worn
    copy of the generated sheet) with a scroll flourish in each corner; the
    picture 194px tall in its plate, filigree at its corners, a SINGLE gold
    rule between it and the title band (~60px: the frame's foot under the
    title is the double rule; round 8 took the outer line of the sheet's
    lower edge off the picture's with a mask, `.card-screen::after`),
    filigree at the band's corners; the title in cream roman (~29px), left,
    its letters' feet on the mock's baseline (y823 at 1672x941; round 8
    dropped them 2.5px, `--a-title-drop`, the foot's padding giving it back). The frame is drawn over
    the screen (`.card-mark`), so its flourishes lie on the picture as the
    mock's do. *The picture stands whole (contain, never cover) on a mat of
    the card's field strewn with gold dust, small engraved marks and a few
    dotted constellations (`card-mat-night`/`-day`, derive.mjs mat), with a
    margin of 8% of the plate's height all round; each of the four is set to
    the same height, centred on its drawing's own bounds, by one formula over
    the art's opaque bounds (`--drawn-x/-y/-w/-h`, set by Screen on
    `.screen-art`: `--art-h: 84% / --drawn-h`, `--art-dx/-dy` the drawing's
    centre's offset from the box's), so nothing is cut off and nothing runs
    under the corners' devices (on a phone a size down). No selector names
    a project (the content contract, tests/style-contract.test.ts): the
    row's four uneven columns and the title nudges (`--title-dx`) are set by
    a quantity query, `.showcase-row:has(> li:nth-child(4):last-child)`,
    and the cycle `:nth-child(4n + k)`; any other count takes the shared
    equal shares.*
19. **Motto.** Centred at the foot (y891) in spaced gilt capitals (~21px)
    between two gilt rules (x410-655, x1015-1258). The mock garbles it ("AD
    ASTRDS PER CODEM"); the page sets "AD ASTRA PER CODICEM", decorative, with
    no accessible text.
20. **Clear sky under the words.** No glint or constellation line lands on
    the brand's line, the nav, the headline, the pitch or the keys, at any
    aspect. *The quiet field: behind those words the plate star-reduced
    (derive.mjs quiet), feathered out, registered with the plate.*

## Plate and sprites

- `layer-sky-night`: the original with the UI painted out (`plate-night`),
  then the border and the compass rose taken out too: both are drawn by the
  page. The core (`sky-night`, derive.mjs sky) is not that repaint (it made
  the stars bloom and the sky mottle, and draws the dials and the chart's
  arcs differently from the mock): it is `plate-night`, the mock's own sky,
  where the page hangs nothing; the mock's own px where it does
  (`MOCK_ZONES`: the border's bands, the foot under the cards, the
  constellation above the tagline's end and the right side with its moon,
  each wholly the mock's, so no arc ever prints twice), with the border, the
  moon and the lower dials taken out of them (below); the repaint stands only where the
  page's compass rose does (`PAGE`). The bear and the bird are laid back
  from the mock's px, a touch sharpened (`FIGURE_GAIN`), clear of its
  "Projects" (`UI`). No lettering of the mock's page stays in it.
- **The lower dials belong to the frame** (round 7, M1). The bottom left
  quarter-dial (x10-172 y800-930) and the bottom right one with the arcs that
  run into it down the right edge (x1488-1656 y700-940) are sprites
  (`page-dial-bl`/`-br`, derive.mjs `dials`; kit props `dial-bl`/`-br` and
  the day's), pinned to the viewport's lower corners at `--frame-k` by
  `body::after` (atlas.css), the way the page border is. They were mock px in
  the plate, which is registered to the stage: on a frame taller than 16:9 the
  stage's foot (and the core's, at 941u) lies above the viewport's, so a dial
  left in the plate was cut flat at the core's foot and the continuation drew
  other arcs under it (rev 6: a hard line at y~795 at 1440x900, a brightness
  step, a dark band). Each px is split by weight (`DIALS`, `dialW`): the
  sprite takes the gilt (alpha by gold-ness against the sky estimate, colour
  unmixed: `borderMatte`) at that weight and the plate keeps the rest
  (`dialErase`: the sky's fill), so at 1672x941 they give the mock's px back
  but for a short dip across each feather; the parts under the first and last
  card are cut hard and the plate's corner under them median-cleaned
  (`UNDER_CARD`). The zones partition the px: the border's rails (`inBorder`),
  the dials, the foot's page-drawn rule and motto (`inFootUI`: filled) and
  the plate's own edge (`inEdge`: filled, so the core has no dark rim).
  Past the core, the continuation is plain chart and sky: the generated
  canvases' corners are mirror-cleaned (`cleanCorners`, `CLEAN`), the night
  foot is calmed then re-dusted to the mock's density (`calmFoot`,
  `FOOT_DUST`), the day core's dials are inpainted away (`clearDayDials`,
  `DAY_DIALS`), and `seamTone` brings the continuation's tone to the core's
  along the seam from the sky's own px only. Row luminance (median, x330-1100)
  across the old seam at 1440x900: 24.7 at the core's foot, 23.0-22.0 below it
  (rev 6: 24 then 16); no step at 1280x1024, 1920x1080 or 2560x1440.
- `layer-sky-night-clear` / `layer-sky-day-clear`: the plates with the moon
  painted out (the day's quiet field and bleed edit start from it).
- **The bleed.** The plate is painted on 320 mock px past its sides and its
  foot (`sky-night-bleed`, generated round the core at (320, 0);
  `sky-day-bleed`, an edit of it by day, so the two register), the core
  pasted back over it with a feather of 2px only and the continuation toned
  to it along the seam, fading over 200px (derive.mjs bleed: `BLEED`):
  `sky-night-plate` / `sky-day-plate`, 2312x1261, the scene's sky. A wider
  feather prints the dials' arcs twice (the continuation draws them
  differently), and on a 16:9 screen, where the viewport's edge is the
  core's, that is the first thing seen (the round 5 defect). kit.css hangs
  it from the stage on a desktop, so the core keeps to the UI at any aspect.
  The kit's scene encode (shared build-kit.mjs) is q78 without chroma
  smoothing, which smears the plate's thin gilt lines, so the atlas also
  ships the plates as props (`sky-plate-night`/`-day`, q90 with
  smartSubsample) and atlas.css hangs those (`--k-sky`); the scene's own
  layer is kept for the build's sun and flat scene. Past the core the chart
  runs on: the left half-dial completed as a full ring, the grid's arcs and
  the dotted lines continued, the forest and clouds past the dome, the
  armillary arcs and the lower corners' dials as larger arcs; no new
  landmark, no lettering. Under the core the starfield runs on (no water, no
  horizon): the night canvas is two generations, `sky-night-bleed` for the
  sides and the corners' dials and `sky-night-bleed-foot` across the middle
  of the foot, joined over 80px clear of the dials (derive.mjs nightCanvas).
  The day edit (`sky-day-bleed`) is made from that canvas
  (`sky-night-canvas`), so by day the lake in the core fades into the pale
  sky. A phone shows the core's right (the observatory), as before.
  The core's foot is quieted as the mock's is: the plate's flares and halos
  under the cards and the motto, and in the gap between the "Projects" rule
  and the cards, are sunk into the sky round them (each px held to within a
  few levels of its 31px median, `FOOT`, `GAP`: the mock's dust has a p99 of
  40 over a 23 median, and its one star in the band sits on the motto rule);
  the repaint's glint on the compass's upper point is held down and gilded
  (`GLINT`) and the stars it leaves in the compass's sky (above the N point,
  under the hub) and where the masthead's rule hangs its pendant and ends are
  sunk away (`STRAYS`). The quiet field keeps the plate's own line above the
  tagline's end and by the nav's rule (`QUIET_KEEP`: quieted there it showed
  as a dim ghost of the mock's bright constellation).
  Round 8, the night plate's foot on a frame taller than 16:9 (5:4 shows the
  core's foot where the frame hides it at 16:9): the mock's last rows keep
  the shade its border's rails cast (two rows 3 levels dark) and the
  continuation began a level under them, a hairline and a step across the sky
  with brightness raised. `smoothFootSeam` smooths the sky's tone along y
  there (stars, lines and grain untouched; the day needs none), and
  `FOOT_DUST.grain` is 3 so the grain under the foot is the core's. The
  continuation's chart was sparse beside the mock's top half, so `CHART`
  runs constellation lines on under the foot: seeded runs of 3 to 5 stars
  (thin dashed gold, or fine unbroken), through the plate's own stars where
  there is one and else a new small four-point sparkle, never over its own
  lines nor across one another; found on the night plate and laid on the
  day's in its bronze. No arc is added (a graticule could not be continued
  without a repeat).
- `page-frame`: the mock's border (device 7), a 9-slice round the viewport.
  There is no `masthead-junction` and no `top-band`: the frame carries both.
- `compass-line`: the compass rose alone, the brand's mark: drawn (derive.mjs
  compass), a thin-line rose in two fine rings; no generation.
- `sheet-day`: the generated frame (double rule, corner flourishes) of the
  cards, the sheet every surface wears; `sheet-fine` is it worn as the mock's
  are (derive.mjs frames: thinner rules, antique gilt, flecks of the leaf
  gone, dust at the corners; seeded); the field inside is the page's (navy
  by night, ivory by day). `mat-day` / `mat-night`: the rule round a screen
  (a project page's picture), built from the same worn `sheet-fine` frame as
  the cards' (a double rule, a scroll at each corner: round 6, L7; the
  generated single rule, `mat-fine`, wore to a dashed line), with slices
  67/65/65/66 (atlas.css `--mat-*`, from the build's report). `tile-signal-fine`:
  the gold button; `tile-night-fine`/`tile-day-fine`: the navy/ivory button
  in two fine gold rules (derive.mjs tiles: drawn chamfered on clear, the
  face from `tile-signal`/`tile-night`/`tile-day`). `foil`: the gold leaf of
  the headline.
  `enamel-night`: the card plates' field, its paint grain at the mock's (sd ~3
  per channel over the caption plate: 2.9 in the mock, 2.9-3.6 live; round 7
  raised the gain from 0.5, which left it flat at sd ~0.8).
- `sky-quiet-night` / `sky-quiet-day`: the plates' cores star-reduced, the
  quiet field behind the words.
- In CSS: the masthead rule, the heading's rule and its stars, the cards'
  title band rules, the motto and its rules, the type. The status lights and
  the Tools shelf's gems are the chart's four-point stars.

## A launch page's pair

On /p/tauri-explorer the opening pair is set level; under the shorter one a
framed window onto the plate (`.tier-cut`) shows the plate as the page has
it, fixed to the viewport at the page plate's size and place, so the
observatory is shown once, at the plate's scale (a cut enlarged from the
flattened scene showed it again at three times that).

## Day (the light rice)

The same atlas by day: `layer-sky-day` is an edit of the night plate (so the
two register), the same scene in daylight, the sky pale, the engraving kept
in a deeper gold that reads on it. The words on the scene turn navy, the
headline a deep gilt; the cards' and buttons' fields ivory, the gilt the same.

## System

- **Type:** EB Garamond (`--font-garamond`) for every word: the scene's, the
  buttons', the headings' and the body's (a book face, ~18.5px): the mock's
  old-style roman. JetBrains Mono only for data and code (the screens, the
  labels, the stats).
- **Ink:** cream `#f3e2b4` on navy, gold `#e9c578` for the headline, the
  heading and the motto; by day navy `#13213f`, the rules a deep gilt `#9a7430`, the words in gold a
  shade deeper (`#6e4f1c`).
- **Accent:** gold. Focus is a band laid inside the gilt: bright gold by
  night, bronze by day, on a button navy on the gold plate; a card also takes
  a gold outline.
- No writing, numbers or symbols in any generated art.
