# Paper Diorama: remaining work

State on 2026-10-07, on branch `redesign`. Everything since `149a2de` (the
instrument-rack checkpoint) is uncommitted. The direction, palettes and kit are
described in `art/BRIEF.md`; how the kit is composited is in
`docs/architecture.md`. Other art directions are a stretch goal in issue #1.

## Done

- **Paper Diorama re-skin:** torn sheets, card tiles, window mats, pins, tape,
  and an eight-layer cut-paper scene with a pop-up entrance and scroll
  parallax. The light rice (`paper`) wears **alpenglow**, dark rices wear
  **night**. The trial palettes (day, bright, vibrant) are deleted.
- **3D diorama** (three.js, `components/rack/scene3d/`): the scene's layers
  as planes in depth with true pointer and scroll parallax, a pop-up hinge
  entrance, texture-space paper shadows, a drifting cloud that shades the sky,
  and motes (dust by day, fireflies at night). Falls back to the CSS scene
  under reduced motion, without WebGL 2, on a software GL, on low-memory
  devices, or with `localStorage["nb-scene"] = "flat"`. Steady 6ms frames on
  a desktop GPU at 2560×1440@2x. Geometry is unit-tested; e2e covers 3D on,
  rice switch, opt-out, reduced motion and the WebGL-failure fallback.
- **Layered groves:** each side's pines are two rows (back and front layers),
  every tree cut as stacked tiers of card; generated through the kit pipeline
  (`grove-*` then row extraction and night recolour).
- **Link-preview cards** re-rendered in alpenglow (`bun run og`).
- **Kit tooling:**
  - `scripts/build-paper-kit.mjs` builds `public/kit/paper/` from
    `art/raw/diorama/` (gitignored).
  - `scripts/check-kit.mjs` (`bun run kit:check`) checks state registration
    of the paper kit.
- **Rack clean-up:** the old rack images, prompts, concept JPEGs and the
  rack-only scripts are deleted (staged with `git rm`).
- **Wording:** rack-era copy replaced with "projects", "active", "Field notes",
  "Keys" and "all projects".
- **Fixes from three independent visual reviews:**
  - The skip link showed as a bar at the top of every page.
  - Section strips smeared at their ends.
  - Tile focus ring had a 1px seam.
  - Sheet hover had no visible lift.
  - Tile hover and focus were too weak.
  - The Tauri hero headline wrapped badly.
  - The home hero now has two pinned sheets with the scene showing between.
  - The call to action was undersized.
  - Section headings were too weak.
  - The tablet hero left half the sheet empty.
- **Verification:** type check, lint, 67 unit tests, 41 e2e (21 skipped by
  design), `kit:check` 15/15 and `next build` all pass.

## Fixed in the last review pass

- **Tauri hero:** two sheets; the product is pinned on its own, larger sheet
  beside the promise, set lower with the scene between them, and reaches into
  the scene on wide screens. On phones the product sheet follows the call to action and
  is still on the first screen (the e2e rule stands).
- **Action vocabulary:** masthead nav on every page, "What testers get" and the
  live demo's actions are card tiles.
- **Flagship palette on home:** app-scale type, seven real results, clean
  match underlines.
- **Night tape:** `tape-sage-night` (generated recolour) with cream ink.
- **"+" in Ctrl+P:** headlines set the chord's plus in the mono face, at the
  letters' weight.
- **Drifting cloud** no longer shows on phones (CSS and 3D).
- **Product-shot accent:** left as the app's real blue (it's the product).
- **Sun and moon** stay put when scrolling (the 3D sky sits at infinity);
  the cloud no longer splits at the frame edge.
- **Entrance order:** sheets wait for the 3D scene to rise (bounded by the
  2.5s start budget).
- **Product shots follow the rice:** real captures of the app in the theme
  nearest each rice (`appTheme.ts`), and the live demo opens in it.
- **Alpenglow cloud** relit to match the sky and set lower.
- **Phone masthead** compacted; nav wraps to its own row without overflow.
- **Screens** have a recess and an authored glass glare.
- **Groves** restyled as flat card and scaled down so they frame the sheets.
- **Tile hover/focus** strengthened.
- **One theme for every picture of the app:** the hero, the gallery and the
  demo poster are all captured per theme; the light finish wears solarized
  (cream) rather than the stark light theme. The hero shows the app window
  with its chrome; the phone strip is at real size.
- **Live demo:** the poster lies under the iframe until the app paints, and
  its tiles wrap on narrow screens.
- **Phone masthead:** the theme key reads "theme", so the rice name's length
  can't rewrap it.
- **Entrance:** layers stand up opaque (no cross-fade); sheets start sooner and
  are opaque almost at once.
- **Tiles:** matte hover (a lift, no sheen); focus is an inked ring at rest.
- **Night:** a new mat (ink board, lit cream bevel) and near hills without the
  rim light; the screen glare is fainter.
- **Inline code** is typed on tape; shortcuts in running text are small caps.
- **Install:** the build download is the section's primary tile; the repo
  link doesn't break at its hyphen.
- **Hiker removed** from the site entirely (component, kit art and CSS). It
  broke the ornament rule in `art/BRIEF.md`: nothing stands in front of a
  sheet unless it is fixed to it.
- **Sun and moon** sit in the upper-left margin, clear of the sheets and the
  masthead.
- **Short strips** (running head, folio, status line) use a smaller slice so
  their torn ends don't streak.
- **Live demo on phones:** below 600px the demo shows its still and an
  "Open the live demo" tile; the desktop-only keys are hidden.
- **GPU context loss:** if the browser drops the WebGL context, the CSS scene
  takes over (e2e covered).
- **Live demo** looks like paper: the still is the app untouched (no
  scanlines, standby bar or lamp), and its actions are tiles on the sheet.
- **Sheets** stand apart at every width (no overlap in the Tauri hero).
- **Sun and moon** stay in view at every width: the sky is fitted around its
  sun (`skyFrame`, unit-tested; the CSS computes the same frame).
- **Pins** hold every sheet at the top of its paper; project sheets hang on
  their status pin.
- **Hero product shot** is the whole window (no word cut); the phone strip
  ends between two results.
- **Flagship palette** has even margins and no hollow file icons.
- **Tiles:** hover is a crisp lift (deeper shadow, 1px rise, no edge glow);
  focus is a channel cut into the card.
- **Home** opens on the product: the flagship sheet (screen first, then its
  calls to action) sits beside the intro; the keys legend moved to the foot.
- **Tauri hero shot** is a 720px window shown near real size, on the larger
  of the two hero sheets, so the app's text reads.
- **Shelves** stand at two depths (a tighter-shadow sheet tier, staggered);
  the wide cards have no gap between copy and numbers.
- **Utility actions** (copy, "What testers get") are text, not tiles.
- **Tablet and phone** keep a margin round the column; the sun sits in its
  top-left corner. Tag bullets are gone.
- **Captures** for review run in headed Chrome. Headless Chrome with forced
  GPU sometimes composites blank WebGL frames, which showed up as a black void
  that real browsers don't produce.

- **Tauri hero shot** is a 640px app window, captured as the app draws quick
  open (its own dim and blur, no staging); the phone strip is a 440px window.
- **Sun and moon** are lifted out of the sky (`scripts/lift-sun.mjs`) and
  placed on their own (`.scene-sun`, `sunRect` in 3D), so they are whole in
  the upper-left margin at every width. `skyFrame` is gone; the sky is cover-fitted like the other layers.
- **Actions** are consistent: every copy and jump link is a `.text-action`,
  and the install download is no longer a primary tile.
- **Day mat** regenerated as a lilac-grey board (prompt `mat-day.txt`; the
  first version is kept as `mat-day.v1.txt`), so screens stand off the cream
  sheets.
- **Nix command** wraps after `github:` on phones instead of being cut.

- **Tauri hero shot** is cut to the quick-open palette with a thin margin of
  the app's scrim; the dimmed window filled half the shot and read muddy in
  the light finish.
- **Git graph shot** is cut inside the panel's border and above its rounded
  foot.
- **Primary tile focus**: the channel shows the card's cream core, and its
  shaded wall falls toward the card's terracotta (`--groove-tint`), not
  black; before, it read as a chrome rim.

- **Tauri hero shot** is the whole app window again (800px, edge to edge),
  with quick open over it; the app's backdrop is lightened in the capture so
  the window reads behind the palette (the one staged thing, noted in
  `art/prompts/screens/tauri-explorer.txt`).
- **Mats** are only for screens: the "Under the hood" figures are printed on
  the sheet (`.ledger`), and the Nix command is typed on tape.
- **Mats re-authored** for the scale they are shown at (prompts
  `mat-{day,night}.txt`; the previous ones are `.v2`): coarser tear, a
  wider directional bevel, visible fibre. Shown larger (`--mat-k` 0.26; 0.18
  on project cards, 0.2 on phones) and sliced per finish (`--mat-t/r/b/l`).
- **Light screens** sit deeper in their mats (a stronger recess), and the
  flagship palette's text has no glow on a light rice.

- **Product page composition:** its sheets vary in width (`.sheet-narrow`,
  `.sheet-wide`), lie to either side (`.sheet-start`/`.sheet-end`), at two
  depths (`.sheet-flat`), some pinned off-centre (`.pin-left`/`.pin-right`);
  install and the spec plate share a row (`.sheet-row`). The alpha is the
  end point: wider than the column, a larger head, on the signal pin.
- **Gallery:** every shot is shown at the app's real size (`--shot-w`), one a
  row with its caption beside it, alternating sides; search and the palette
  are cut to their panel.
- **Figures** share a top line; captions hang below.
- **Phone masthead:** the page links are a second row of equal tiles under a
  printed rule.

- **Tauri hero:** a 720px window whose quick-open backdrop keeps a light blur
  and loses its dim (no olive cast in the light theme); the product sheet
  reaches up to 110px into the margin. Below 1200px the hero stacks, the
  promise sheet split in two columns so both calls to action stay on the
  first screen.
- **Sun and moon** below 1400px sit inset from both edges and clear above
  the masthead (`.rack` has more top room).
- **Gallery notes** (label, caption, full-window link) sit at each screen's
  top edge.
- **Tape chips** never split across lines, except a long path on a small
  phone.

- **Tauri hero, 1000–1199px:** the two sheets stay side by side; the
  product's shows quick open close up (the phone strip) and the promise
  drops its explanation, so both calls to action and the product are on the
  first screen. Below 1000px it stacks.
- **Gallery:** each screenshot is a print on its own pinned sheet, sized to
  it, with a "Fig." label and caption under it; the sheets alternate sides.
- **Phone calls to action** share one legend size.
- **Alpha kicker** lost its lamp (the sheet hangs on the signal pin).

- **Tauri hero, 900–1199px (settled after three rounds of opposing
  advice):** reviews asked in turn for stacking (the side-by-side shot was
  too small to read), for side by side (the stacked product fell below the
  fold), and for stacking again (the close-up crop lost the app). What they
  share: the whole window, legible, on the first screen with both calls to
  action. So the hero stacks, the promise sheet is compact (the head on one
  line, the explanation left, the calls to action an equal pair right, the
  explanation dropped on screens under 820px tall) and the product's sheet
  starts on the first screen.
- **Screens read as displays by day:** every screen has a panel edge (a dark
  rim where the panel meets the mat) and its recess drawn above what it
  shows (`.screen-edge`), and the authored glare on every screen, fainter
  over readable content.
- **Theme key** legend sits by its key; the phone live-demo action is on the
  caption's left edge.

- **Sheets stay in the column (settled against earlier advice):** earlier
  rounds asked for a larger hero product and an alpha sheet that stands out,
  which overhanging sheets gave; a later one read the overhang as overflow.
  Both are kept inside the column: the product's sheet keeps its larger share
  of the hero, and the alpha spans the column's full width with a larger head
  on the signal pin.
- **Hero stacks with the column's gap** (`--rack-gap`), so the torn edges
  leave as much scene between them as between any two sheets.
- **Light screens (settled against earlier advice):** one round wanted a
  stronger step from mat to screen, another read the dark hairline as a CSS
  border. Shared goal: the screen reads as its own material. The panel edge
  is now a band that fades inward under the glass, and the hero's backdrop
  is dimmed a little (0.2 neutral, still far lighter than the app's own) so
  the palette stands a clear step lighter than the window behind it.
- **Tile hover** catches the key light on its raised upper-left bevel as
  well as casting the longer shadow (no sheen; the board stays matte).
- **Git-graph shot** starts at the panel's own title and ends between rows.
- **Phone calls to action** at 15px; code chips keep their punctuation.
- **Kept:** the cream focus channel on the signal board at night: it is the
  focus colour that holds 3:1 on terracotta.

- **Hero on the first screen (settled against earlier advice):** rounds
  asked for the whole window, for a close-up, for side by side and for
  stacking. Shared goal: the call to action and a legible app on the first
  screen. The app's smallest window that shows all six quick-open results
  (720x460) is the hero's capture, its backdrop less blurred (1px); the
  product's sheet takes a larger share with a thinner mat and padding (the
  screen ~562px at 1440, up from ~517); on short laptop screens the
  explanation gives way and the head is sized to the height, so both keys
  and the note sit above the fold at 1366x768 and 1280x800; stacked
  (900-1199px) the promise is a short two-column sheet and the column starts
  higher on short screens, so the screen and its palette start on the first
  screen at 1024x768.
- **Light direction on torn rims:** the night sheets' pale fibres and the
  mats' cream core no longer glow evenly on every side; they are lit along
  the top and left and shaded along the bottom and right. Screen recesses
  shade from the top and left only.
- **Sheet focus** (`j`/`k`) lays the sheet on a terracotta under-sheet torn
  to follow its deckle (a square card read as a flat slab), instead of a
  line drawn inside it.
- **Hover:** a sheet's hover shadow is much longer and softer; a tile's
  bevel catches the light (no face sheen, which the 9-slice stretched into a
  band).
- **Hero by day:** the staged dim is solarized's own deep teal, not a
  neutral grey (which turned the cream window khaki), so the palette, with
  the app's own border and shadow, stands clear of it.
- **Night mats:** the cream core along the torn rim is toned down, so the
  mat's edge reads as the day mat's does.
- **Hero screen, larger and still matted (settled against earlier
  advice):** one round asked for a larger screen (the concept's has no mat),
  the next for the mat every other screen wears. Shared goal: a dominant,
  legible screen that belongs to the system. It keeps the mat, cut thinner
  (0.16), and from 1400px its sheet takes 0.73/1.27 of the hero: ~605px at
  1440 (0.87 of the app's size), up from ~562. The backdrop's blur is back
  near the app's own (2.5px), so no cut-off word reads at the palette's
  edges.
- **Hero side by side down to 1100px (settled against earlier advice):**
  rounds have asked for the hero stacked below 1200px (the screen too small
  beside the promise) and side by side at 1180 (stacked, the CTAs floated in
  a sidecar and the screen fell below the fold). With the thinner mat the
  screen is ~528px at 1180, so the hero stays side by side down to 1100px,
  the keys cut a little tighter from 1100 to 1399px. Below 1100 it stacks
  with the calls to action under the subhead and the note beside them.
- **Long sheets:** the shortcut cells align to their tops; the "why" prose
  sets whole paragraphs per column. Day sheet hover casts a darker shadow.
- **Chips** on a small phone wrap only where a long path marks its break
  points (`<wbr>`); a short chip never tears at its hyphen.
- **Narrow phones (320-400px):** the masthead keeps the brand and both keys
  on one row (the keys drop their keyboard legends and the margins tighten);
  an e2e test holds it at 320 and 360.
- **Kicker tape** is cut to its words, two lines at every width, never a
  band across the sheet.
- **Git-graph shot** opens below the panel's head (its "click a commit"
  promises what a still can't do), on whole rows.
- **Night tile hover** catches more light on the slate board.
- **Hero by day, deeper dim:** the light theme's staged dim is 0.3 (dark
  themes keep 0.16), still in solarized's teal, so the cream palette stands a
  clear step off the window (at 0.16 it read as beige on beige).
- **Sun clear of the masthead at every size:** smaller and higher at
  tablet, short-screen and phone sizes (it had slid behind the masthead).
- **Entrance:** sheets come down 300ms after the 3D scene's first frame
  (over its pop-up, not after it) and fade in over the first 30% of their
  drop, so the headline is not held back and arrives softly.
- **Chips** are whole above 480px (their `<wbr>` break points are for small
  phones); the git-graph shot has a row's headroom.
- **Kept:** the hero's explanation gives way on short screens only (by
  height), so it shows at 768x1024 and hides at 1024x768: deliberate, to keep
  the calls to action and the product on a short first screen.
- **Long sheets stack** (`.section.stack`): the shortcuts, "why" and "also
  in the box" sheets put their head across the top, with the shortcuts as a
  two-column table, the "why" prose in two printed columns and the features
  three across, so no column of bare paper runs beside a long list.
- **Prose spacing:** JSX dropped the space at a line break beside an
  element (`,so`, `crates(`); fixed, and an e2e test checks the rendered
  prose of every page for it.
- **Tile hover** catches the light in a tight edge (`--catch-width=5`), not a
  soft glow.
- **Text actions** take focus as a highlighter would (a heavier rule and a
  wash), with a ring under forced colours. On a phone the masthead's page
  links are text actions under a rule, so it has one row of tiles.
- **Theme key** holds 7ch, not 9: the short names no longer trail empty
  board, and cycling barely moves the masthead.

## Gate

Recapture every affected state and run a fresh independent reviewer that
hasn't seen earlier verdicts, until ACCEPT with no HIGH or MEDIUM findings.

**Passed at gate 23 (2026-10-08):** ACCEPT, no HIGH or MEDIUM findings, after
`next build`, tsc, lint, 103 unit tests, 57 e2e and `kit:check` all passed.

### LOW findings worth a pass later

From gate 23, the reviewer's most worthwhile first:

- **Tauri hero at 1024:** stacked, the product shot starts just below the
  first screen and the explanation hides on short screens only. Side by side
  would need the screen too small to read (earlier rounds), so this is the
  open trade-off.
- **Sun and moon below 1440px** shrink to a ~36-48px disc near the top edge
  to stay clear of the masthead; scaling the column's top margin with them
  would let them stay larger.
- **Night mat bevel** reads as a flat cream hairline; shade it as the day
  bevel is, at a lower value (needs the mat's window bevel relit, which
  `relight-edge.mjs` leaves as authored).
- **Inline code chips:** padding gaps beside punctuation (`( grep-searcher`).
- **Phone live-demo still** is the whole window at ~290px; a crop (quick
  open) would read.
- **Phone masthead links** are text actions, not tiles (deliberate, to keep
  one row of tiles); a reviewer would keep them as tiles.
- **Tile hover** is subtle by design (matte board, edge catch only).
- **Mono beyond its role:** the stats' values and some eyebrows.
- **Clouds lit from below** by the alpenglow, against the upper-left key.
- **"Also in the box"** reads closest to a stock layout.

Older:

- **Theme key legend:** it reads `t paper` while the finish is called
  alpenglow. The key shows the rice name from the dotfiles.
- **Night sky:** a star sits close to the hero pin on a phone.
- **Long figure sheet** on project pages leaves its left column empty
  (`/p/lambdaquery` at 900px scroll).
- **Flat CSS pieces:** project tags and some inline code chips are plain CSS
  rather than kit art.

## Housekeeping

- [x] **Commit** the redesign on `redesign` (nothing committed since
      `149a2de`). `nanobanana-output/` is not part of it; leave it out.
- [x] **Dead code:** `scripts/gen-image.mjs` (Gemini) and
      `scripts/key-asset.mjs` (magenta chroma-key) deleted; the kit is
      generated with Codex (native alpha). Both are in git history. The
      single-theme `public/tauri/hero-quick-open-2x.webp` and `-strip.webp`
      are deleted (replaced by the per-theme shots).
- [x] **Stale names:** the misleading ones are renamed: `.bench` is
      `.scene`, `--bench` is `--scene-ground`, `--k-bench` is
      `--k-scene-flat`, and the dead `--k-rail` / `--rail-w` are gone. The
      structural rack-era names (`.faceplate`, `.key`, `.rack`, the `(rack)`
      route group, `components/rack`) stay as roles, as `docs/architecture.md`
      says.
- [ ] **Tauri Explorer redeploy:** the `?theme=` change to
      `~/Repos/tauri-explorer/website/index.html` is uncommitted there and
      needs a redeploy before the live demo honours the theme.
- [ ] **Alpha signup link** (blocked: Discussions are not enabled on
      `xnmp/tauri-explorer` as of 2026-10-08): once the GitHub Discussions thread from
      `~/Repos/tauri-explorer/docs/alpha-recruitment-plan.md` exists, point
      "Join the alpha" (`INVITE` in `src/app/(rack)/p/tauri-explorer/page.tsx`)
      at it, keeping the email as a fallback.
- [x] **Deploy** per `docs/deploy-chong-md.md` after the commit.

## Working notes

- **Rebuild the kit** after any change to the raw art or the build script with
  `node scripts/build-paper-kit.mjs`, then `bun run kit:check`. The raw
  generations in `art/raw/diorama/` are gitignored, so only this machine can
  rebuild the kit.
- **Stale CSS:** Turbopack can serve stale CSS after edits. If a change doesn't
  show, restart with a clean `.next/dev`.
- **E2E after a restart:** right after a dev-server restart, a few e2e tests
  can time out while routes compile. A warm re-run passes.
