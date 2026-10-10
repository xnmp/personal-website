# Art direction: "Ligne Claire"

One of the selectable styles (issue #1; `data-style="ligne"`), #6 on the
ten-direction board. **The target is the original mock**,
`art/originals/ligne.webp` (1672x941; full PNG `art/raw/originals/ligne.png`),
generated from the user's tile on the board, `art/originals/ligne-tile.webp`
(where the two disagree, the tile is the user's). `art/raw/ligne/concept-*`
are later re-imaginings, not the target.

## Thesis

A page of a European science-fiction comic album in the clear line: the
website is laid out as the album lays out a page, as **panels on cream
paper**. Three panels stack down the first screen, each a flat field inside
one even black ink border with slightly rounded corners, the gutters between
them the page's cream: a pale-blue header band, the hero panel (the desert
establishing shot, which is the panel's own picture, not a scene behind the
page), and the projects panel holding four card panels. Everything is
lettered, as a comic is: one plain, slightly condensed comic hand, upright and
italic, the headline in a letterer's heavy italic, the wordmark brushed.
Flat colour everywhere; nothing is modelled, nothing casts a soft shadow.

## Signature devices (requirements; positions in mock px)

1. **The page**: flat cream album paper `#f9f3e2` behind and between the
   panels (the gutters, ~11-24px), a faint fibre at most; a thin ink line
   (3px) round the page's edge. The panels' outer edges stand 24px in at
   the mock's own size: the stage keeps an 8px margin each side for a
   classic scrollbar (globals.css `--stage-w`), so where the screen's width
   limits it the panels and what is set against their edges reach into
   that margin (`--ligne-slack` in ligne.css), and the page's foot is
   brought up the height the stage lacks.
2. **The header band**: a full-width panel (x 24-1649, y 16-96) of flat pale
   sky blue `#82caee` in a 3px black ink border, its corners slightly round.
3. **The wordmark** "chong" in the band's left (x 65-240, y 23-92): heavy,
   hand-brushed italic lowercase lettering, uneven strokes, slightly
   condensed, true black (~175px wide).
4. **The tagline** on the same line after it (x 275-755), its baseline at
   74, a little above the wordmark's (81): casual medium-bold italic hand
   lettering (~25px), black.
5. **The nav** at the band's right ("Projects / Notes / Contact" there; the
   site's index, theme and style keys here): upright hand lettering
   (~27px), black, ~40px apart, centred in the band.
6. **The hero panel** (x 24-1649, y 107-603, 3px ink border, round corners):
   its picture is the desert: pale-blue sky with small flat clouds, the big
   pale peach planet and a small cream moon, red-orange mesas and buttes, a
   tall red cliff at the far right, apricot sand, and the explorer in the
   white spacesuit and grey backpack, seen from behind, centre left (x
   560-730), between the copy and the window.
7. **The headline** "TAURI EXPLORER" in two lines over the sky at the hero's
   upper left (x 78-530, y 125-325): huge (cap height ~88px) heavy italic
   brush capitals with round brush ends, black, the lines set tight and
   **each tilted ~7 degrees** (measured on the mock: TAURI's baseline -8.6,
   its cap line -5.4, EXPLORER's -7.4/-6.6), rising to the right, EXPLORER
   **stepped in 20px** from TAURI (bboxes x 78..334 and 98..527), as a title
   is lettered across a splash panel. The face's stems are measured
   against the mock's (ink area of the thirteen letters, 34,906 mock px^2 against
   the face's 34,755 at weight 700).
8. **The pitch** "A keyboard-first file manager." / "Alpha testers wanted."
   under it (x 98-505, y 335-400): two lines of upright medium-bold comic
   lettering (~30px, its stems measured 4.3px), black, straight on the sky
   (no box, no halo), clear of the clouds.
9. **The buttons** (x 98, y 413-465): comic caption boxes in a 2.5px black
   line, corners ~8px round, no shadow, lettered in bold type leaning 5.5
   degrees (measured on the mock; stems 3.1-3.5px, a pen of 0.047em), black:
   "Join the alpha ->" on bright sky blue `#67c1fc` (x 98-307), "Try it
   live" on cream `#f9f5e6` (249,245,230; x 321-477), both fills flat colour
   (no paper grain).
10. **The window** at the hero's right (x 992-1602, y 150-555): the app's
    window drawn chunky and legible, its edge a **heavy black ink bezel**
    (~4px: the window's 1px edge and a 3px ring) with round corners (~10px),
    set flat on the picture (no soft shadow); a title bar (~40px) of the
    window's own face with three saturated lights (red, yellow, green,
    ~15px) and "Tauri Explorer" **bold** and centred (~20px); its two panes
    inside an **inner hairline frame** (a fine rounded line set ~8px in), a
    row to a name (a neutral UI sans, Inter, sized so its strings run the
    mock's widths, ~32px apart: the window is an application in the scene,
    not lettering) after a large rounded **folder** or a crisp **page icon**
    (a dog-eared sheet with three cut lines, drawn as masks), the
    selected row a solid **azure** bar `#2f6fb5` with white names, the
    folders **sky blue**, the band's and the call's family; no kind
    column, no pane headings; a foot of "N items" at the left and the open
    folder's path at the right. (Its face is lit in the visitor's rice:
    light by day, its ink the page's.)
11. **The projects panel** (x 24-1649, y 627-926): a cream field in the 3px
    ink border, its label **"Projects" lettered into its top border** at the
    left (x 56-162), breaking the line, as a fieldset's legend: the line
    runs under the label, which stands on the panel's own field from the
    line's top edge down (the page and the field are one cream by day, so
    the line is simply broken; by night the field is the panel's lighter
    blue, so the label reads as a gap in the line, never a darker patch);
    **heavy oblique lettering** (the real bold sheared 7 degrees, measured
    on the mock; stems 4.9px, a pen of 0.052em; ~32px: cap 22), black, its
    x-height centred on the line.
12. **Four card panels** in a row inside it (x 41-1631, y 648-910, gutters
    ~16px): each a cream panel in the panels' ~3px soft ink line, corners
    ~6px round, flat on the page, its field flat cream (no grain); its
    screen on top, inset ~6px, a 2px dark edge, wide (~1.85:1); its **title
    below** the screen in **heavy marker lettering leaning 3.5 degrees**
    (the real bold, sheared by the angle measured on the mock and drawn in
    to 92%; cap height ~24px, stems 4.9-5.1px against the mock's 4.7-5.2, a
    pen of 0.054em), black. The screen is a **flat
    ground from the mock's palette, one per card** (the dungeon's slate
    `#3a424d`, the card table's felt `#1f5a3b`, the battlefield's steel
    `#454c63`; a shade deeper by night), the project's own 1-bit art drawn
    on it in a **contrasting ink** (torchlight `#f1cf94`, cardstock
    `#f4eddb`, a marine's blue `#9fd4f5`) and scaled to fill the plate at
    ~88% of its height, its own aspect kept (per art: `--art-h`, centred by
    `--art-dx/--art-dy`, ligne.css), so the row has the mock's weight and
    colour, never a white box with a small stamp.
13. **The first card's screen** (Scrivo) sits in a powder-blue mat `#92cfec`
    as a **mini window**: a chrome bar with the three lights at the left and
    a search and a square icon at the right, over the screen. The screen
    follows the visitor's theme (light by day, as the home window does), its
    art scaled to fill the window's interior as the other cards' fill theirs.
14. Clear-line discipline: even black lines, flat fills, no soft shadows, no
    gradients, no glow.

The site's real content replaces the mock's placeholders (the window's
files, the cards' 1-bit art, "Brood War" for "Brood War AI").

## Type

One comic letterer's hand, Comic Neue (`--font-comic-neue`, 400 and 700,
upright and italic: a pointed A, a double-storey a, plain open forms),
letters every word but two, on every page:

- the nav and the pitch upright 700 (the mock's medium);
- the tagline 700 italic, in words, not capitals; the buttons the upright
  700 sheared 5.5 degrees (the mock's lean, half the face's own italic's);
- the panels' titles (the "Projects" label, the cards', the shelves'
  modules) heavy marker, sheared from the real 700 by the angle measured on
  the mock (the label 7 degrees, the cards' and modules' 3.5): the face's
  own italic leans 11 to 12 and a browser draws `font-style: oblique 7deg`
  upright (it will not slant a face by less than 20 degrees on its own), so
  the page shears the label's box (`skewX` about its baseline), the cards'
  and modules' drawn in to 92%;
- the display headings below the first screen and on the inner pages (the
  intro's "Tools I use every day, *and agents…*", Scrivo's and the Tauri
  page's headlines, the sections' headings) 700, their second voice 700
  italic, never a light one;
- the window's names, the prose (400) and the small labels (tags, kickers,
  shelf labels and panel numbers in italic capitals; facts, statuses,
  counts and the foot upright).

The lettering's pen is heavier than the face's bold, so the lettered words
are drawn with the pen run round their strokes, its width set by measuring
the stems (median width of a word's strokes across its rows, mock against
live at 1672 wide, ink and slant measured by shearing the word until its
column profile is peakiest): 0.037em on the nav (3.75px), 0.036em on the
pitch (4.3), 0.047em on the buttons (3.1-3.5), 0.052em on the legend (4.9),
0.054em on the cards' titles (5.0), 0.03em on the tagline, 0.04em on the
display headings. The two apart:

- The **headline** is Grandstander (`--font-grandstander`) 700 italic caps
  (the weight that matches the mock's ink), its corners rounded to a
  brush's ends (the letters drawn out a pen's radius, 1.15 mock px, all
  round), drawn up 10%, the block rotated -7 degrees, the first line drawn
  out 12px to the left (a negative text-indent, which the tilt makes the
  mock's 20px step: the two words of the one heading are staggered without
  splitting it, so the markup stays the page's).
- The **wordmark** is the mock's own brushed lettering, an ink mask cut from
  the original (`scripts/kits/ligne-raws.mjs wordmark` -> `wordmark.webp`)
  that the page fills with its ink (cream by night); the name stays the
  link's text, transparent in the lettering's box, on the home band and the
  inner pages' running head alike.

The home window is an application in the scene, not lettering: its names,
title and foot are in Inter (`--font-inter`, a neutral UI sans; the title
bold), sized so the strings run the mock's widths. The terminal's JetBrains
Mono only in code and on the screens other than the home window. Ink
`#040404`: the mock's type and lines sample as a true black (3,3,3), not the
warm near-black (28,20,20) the first rounds took from the layers; the kit's
lines (`scripts/kits/ligne.mjs` INK) are drawn in it too.

## Plate and assets

- The page is paper: the scene's only layer is `layer-sky-{day,night}`, a
  flat frame of the page's colour (not generated: `art/prompts/ligne/layer-sky-*.txt`)
  with the album's fibre (`page-grain`) laid in by the kit (`scene.paper`).
- The hero's picture is `hero-{day,night}`: the plate's hero panel interior
  (`art/raw/ligne/plate-day`, the original with its UI painted out), its sky
  graded to the original's, extended upward by generation
  (`art/prompts/ligne/hero-day.txt`) so a taller panel (16:10, 4:3, a phone)
  shows more sky instead of a crop; the night an edit of it
  (`hero-night.txt`). The panel lays it at its foot, full width. The
  generator redrew the planet, so the plate's own panel is composed back
  under the generated sky (`scripts/kits/ligne-raws.mjs ref|compose`) and
  the picture registers with the mock. A phone's stacked hero sets its
  buttons across the sky where the moon hangs, so it lays
  `hero-{day,night}-phone`, the same picture with the moon painted out
  (`ligne-raws.mjs phone`), never a moon cut in half.
- The panels (band, hero, projects) are drawn by the page (`.masthead::before`,
  `.launchpad::before`, `.showcase::before`), so they size with the layout;
  the cards and the inner pages' panels are the kit's 9-slice sheets
  (`scripts/kits/ligne.mjs`), the same line and corner.
- Every panel rests printed flat on the page, as the mock's do; one you
  can open lifts onto a flat shadow (to its lower left, the sun being upper
  right) while the pointer is on it. Focus is a coral band inside the ink
  line, an ink line inside that.

## The other finish (night: the dark rices)

The same album's night page: the page a deep night-blue paper `#1b2047`,
the panels' fields the night's blue `#4757a6` inside the same black line,
the band a dusk blue `#34428f`, lettering in cream; the hero's desert by night (indigo sky with stars, the
planet and moon lit, the mesas and the explorer in moonlight); the headline
lettered in cream with a black ink outline, as a title is on a night sky;
the buttons keep their blue and cream, a shade dimmed (`#5fb3ea`,
`#ede6d4`), lettered in ink. Screens dark in the dark rices.

## Inner pages and phone

Pages of the same album: the running head is the pale-blue band, its keys
lettered words as the home band's are (not caption boxes), its line in the
tagline's bold italic; each
section a cream panel in the ink line on the cream page; screenshots in
their panels, a closer cut of the desert beside them where a tier leaves
room. On the home page the column below the first screen keeps the first
screen's panels' measure (the stage less their margins), so its edges hold
as the page scrolls. On a phone the panels stack at the screen's width: the band (wordmark and
keys, tagline under), the hero (headline, pitch and buttons over the
desert's sky, the explorer and the mesas under them), the window as its own
panel in its ink ring, then the projects two by two.

No writing, numbers or symbols anywhere in the art: text never belongs in a
bitmap.
