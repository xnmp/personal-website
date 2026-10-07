# Architecture

A single-author site. Each project is one **module**: a sheet of torn paper
pinned into a layered paper-landscape diorama, with one detail page. There is
no CMS, no database and no auth. The art direction ("Paper Diorama") lives in
[`art/BRIEF.md`](../art/BRIEF.md). Read it before changing anything visual.

The site was previously an instrument rack (metal faceplates, rails, back
panel, bench mat, LED glows). It was re-skinned to the diorama; the old look
is in git at `149a2de`. The class names (`.faceplate`, `.key`, `.screen`,
`.led`, `.rack`) are kept as structural roles, and so are the `(rack)` route
group and `components/rack/`. Those names are historical. Mapping:

| Class | Role | Now |
|---|---|---|
| `.faceplate` | surface | torn paper sheet |
| `.key` | control | card tile |
| `.screen` | mounted screen | window mat |
| `.led` | status marker | pushpin |
| `.rack` | page column | column of sheets over the scene |

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router (read `node_modules/next/dist/docs/`; APIs differ from older Next) |
| Runtime | React 19 |
| Styling | Plain CSS: `src/app/kit.css` (raster kit) + `globals.css` (layout/type) + `rice.css` (generated palettes) |
| Fonts | `next/font/google`: Newsreader (`--font-display`, headlines), Archivo (`--font-print`, body and UI), JetBrains Mono (`--font-mono`, tape labels, key legends, screens) |
| Art | Generated bitmaps in `public/kit/paper` and `public/screens`, composited with 9-slice `border-image` |
| Tests | `bun test tests/` (unit), `bunx playwright test` (e2e, `e2e/*.e2e.ts`) |
| Package manager | `bun` |

## Routes

```
src/app/
  layout.tsx            root: fonts, rice init script, CommandIndex
  (rack)/layout.tsx     wraps every page in <Rack> (the scene + a column of sheets)
  (rack)/page.tsx       home: masthead, hero (intro + flagship sheet, the product first), two shelves of modules (sheets), keys in the foot
  (rack)/p/<slug>/      detail pages (one per project in src/data/projects.ts)
  tableau-frog/         standalone product showcase, deliberately outside the diorama
  og/[card]/            social cards drawn with the kit, captured by scripts/render-og.mjs
  not-found.tsx         404, mounts its own <Rack>
```

To add a project, add an entry to `src/data/projects.ts` (the number, shelf,
status, screen art and tone) and create `(rack)/p/<slug>/page.tsx`. The unit
tests check that numbers are contiguous and that private repos are never
linked.

## Two colour-token families

- **Paper** (`kit.css`): `--print`, `--print-soft`, `--print-faint`, `--signal`,
  plus the `--k-*` bitmap URLs and the `--*-under` centre colours. This is ink
  on the sheets and tiles. There are two finishes: **night** (`:root`, worn by
  every dark rice) and **alpenglow** (`:root[data-rice="paper"]`, the light
  rice). Each finish swaps the scene layers, sheets, tiles, mat and
  inks. Terracotta (`--signal`) is the one accent.
- **Screen** (`rice.css`, generated from the dotfiles by
  `scripts/theme-from-dotfiles.mjs`): `--paper`, `--ink`, `--cyan`, `--rust`,
  `--amber`, `--olive`. These are only used *inside* `<Screen>`: figures,
  charts, code on screens, the index. Pressing `t` cycles the rice,
  which reflashes every screen and swaps the paper finish when it switches
  to/from `paper`. Screens take rice colours in both finishes.

## Components

- `components/rack/`: `Rack` (renders `Scene` and the column of sheets),
  `Scene` (the eight paper layers and the 3D diorama's canvas, client
  component: it marks `<html data-scene="settled">` when the last layer
  finishes rising), `Prop`
  (a cut-paper piece fixed to a sheet, currently the pin), `Screen` (window mat +
  rice-lit face + optional 1-bit art mask), `Key`/`Cap` (tiles with four
  authored states), `Led` (a pushpin), `ModuleCard`, `RackKeys` (`j`/`k`
  focus). These are pure and server-renderable except `Scene` and `RackKeys`.
- `components/notebook/`: page-level primitives kept from the first version
  (`RunningHead`, `Plate`, `Features`, `OpenQuestion`, `Tags`, `Folio`,
  `Divider`). Their CSS turns each block into a sheet, so older pages
  inherit the paper.
- `components/launch/`: the Tauri Explorer page's interaction model. Its
  product shots and live demo follow the rice: `appTheme.ts` (pure, tested)
  maps each rice to the app theme that wears it (paper → solarized, horizon
  → dracula, cosmic-dusk → tokyo-night, rapture → aurora). Every picture of
  the app (the hero, the gallery and the demo's still) is a real
  capture in each of those themes (`scripts/capture-tauri-shots.mjs`, cut by
  `scripts/shot-crops.mjs`; the hero's backdrop dim is staged lighter than
  the app's, as that script says); the page carries one `<picture
  data-rice-shot>` per rice and CSS shows the current one, so only it loads.
  `LiveDemo` loads the demo with `?theme=`, and keeps the still under the
  iframe so the screen is never empty while the app paints. The still is the
  app untouched (no dimming or overlay); the demo's actions ("Run it here",
  "Full screen", or on touch and phone widths "Open the live demo") are tiles
  on the sheet under the screen. A small
  external store (`keyboard.ts`, read through `useSyncExternalStore`) tracks
  held keys, so the tiles press with the real key. It also tracks whether
  the live demo is running. Ctrl+P on that page runs the demo instead of
  printing. The demo's web build only lays out properly from about 1400px
  wide, so `LiveDemo` renders it at 1440×900 and scales it to the screen with
  a ResizeObserver set up in a ref callback. The same callback boots the
  demo when half the screen is in view on a fine pointer; booting that way
  leaves focus with the page, so page keys keep working. An explicit request
  ("Run it here", or Ctrl+P) focuses the iframe once it loads, so the next Ctrl+P
  is the app's own quick open. The store also holds the demo's state (off,
  booting behind the still, live) and whether the app has the
  keyboard; while it does, the plate wears its focus state and the caption says
  how to take the keyboard back. Auto-boot waits while focus is on the demo's
  own tiles.
  On touch screens (`.coarse-only`/`.fine-only`) the key opens the app full
  screen in a new tab.
- `ShotGallery` opens a screenshot's full window in a native `<dialog>` on a
  sheet (Esc and backdrop close it; focus returns). Below 760px the window
  shows at its real size in a panning glass that opens on each shot's `focus`
  point; the glass shades whichever edges have more window beyond them
  (scroll-driven animation, with all four shaded where unsupported). A shot
  left alone on the gallery's last row spans it as a wide strip (the git
  graph's crop is cut wide for it, from its feature-work rows). The Nix
  command's glass
  fades its edges the same way when the command is wider than the glass.
- `CommandIndex` (the `/` index) is a modal `<dialog>` too, so focus stays
  inside it and the page behind is inert; closing hands focus back. Its input
  is a combobox over a listbox (`aria-activedescendant` follows the arrows),
  and results are ranked by `lib/search.ts` (pure, unit-tested): title prefix,
  title word, title, heading, then number/index/tags.
- Landmarks: each page is masthead (`<header>`, banner), `<main
  id="content">` (`.rack-main`, which stacks the sheets), then the
  folio (`<footer>`). The masthead's first Tab stop is a skip link to `main`.
  Headings run h1 (page) → h2 (sections, home shelves) → h3 (items: home
  modules, feature tiles). A home module's link is named by its title and
  described by its one-line heading.
- The theme key prints the theme's name beside its `t` legend, and "theme" on
  touch; its accessible name carries both. `toggleTheme` announces the new
  theme through a polite status region.
- `.fine-only`/`.coarse-only` hide with `!important`: they are visibility
  utilities, and no component display rule may bring hidden copy back.
- Type has three roles (Newsreader headlines, Archivo body, JetBrains Mono
  labels) and two small styles: `.silk` (tracked mono capitals) for labels of a word
  or three, and `.note` (body face, sentence case) for anything read as a
  sentence, such as captions and instructions.
- The Tauri hero's proof strip (`.launch-proof`) reads its counts from the
  same `projects.ts` stats as the home rack, so the two can't drift. It and
  the hero kicker are `.seplist`s: each item's dot hangs in the gap before
  it and the list clips its left edge, so a wrapped line never starts or ends
  on a dot.
- Page shortcuts (`/`, `t`, `j`/`k`, Ctrl+K, Ctrl+P) go through
  `lib/page-keys.ts`: they stand down while the visitor types in a field or
  any modal `<dialog>` (the index, the screenshot viewer) is open.
- `Key` takes `disabled` (buttons only): the tile goes plain (a signal tile
  falls back to the plain tile), its legend prints faint, and it neither
  lifts nor sinks. The Zheng Shang You table uses tiles for Play, Pass and
  Deal again, and draws its seats, trick and hand as tiling-session panes:
  the title set into the border, the pane whose turn it is in the session's
  active-border gradient (`--active-grad`).
- Charts: each returns ECharts' `{ baseOption, media }`, with compact
  overrides below a 520px container. A chart with a timeline (the Eskiv
  heatmap) passes `playWhileVisible` to `Chart`, which plays it only while it
  is on screen and never under reduced motion. Measured x values sit on value
  or log axes, never categories, and lines are straight between measurements.
- The live demo's iframe is out of the Tab order (`tabIndex=-1`): it boots on
  scroll for pointer users, and the keyboard goes in only on request
  (Ctrl+P, "Run it here", or "Give it the keyboard"), by `focus()`.
- The live demo loads the app's web build with `?theme=<app theme>`, so it
  boots into the same picture as its still and every other screen. The web
  build (app repo, `website/index.html`) honours it unless the visitor picked
  a theme inside the demo; an older build ignores it and follows the OS.
- While the demo boots, the caption under the screen says so (with an amber
  pin); nothing is laid over the still.
- Next 16.2's SWC drops the space after an inline element when the text that
  follows spans lines and contains an HTML entity (`</em> gave …&rsquo;…`
  becomes `</em>gave`; fixed in Next 16.4). JSX text uses literal typographic
  characters (’ “ ”) instead of entities, and an e2e test fails on any word
  glued to the end of an inline element in the served HTML.
- `VideoScreen` (Eskiv) shows 1-bit art of the video with a tile that opens it
  on YouTube in a new tab; nothing loads from YouTube on the page.
- The flagship's screen is `PaletteScreen`: the quick-open palette as live
  text in the screen's tone, not a bitmap.
- Screenshots swap to tighter phone crops below 600px (`<picture>`), so the
  text in them stays near its real size. Scripted scrolls go through
  `lib/motion.ts`, which honours `prefers-reduced-motion`.
- `DownloadKey` offers the release asset for the visitor's OS (`platform.ts`,
  pure and unit-tested) and the release page otherwise. It reads the user
  agent through `useSyncExternalStore` with a `null` server snapshot, so the
  static HTML and the first client render both show the release page.

## How the raster kit is composited

Every surface is a bitmap, and CSS only does layout and compositing. The kit
lives in `public/kit/paper/`: `sheet-*`, `tile-*`, `mat-*`, `pin-*`,
`tape-sage`, `cloud-b-alpenglow`, and
`scene/{alpenglow,night}/<layer>.webp`. The flat `scene-{alpenglow,night}.webp`
(the layers composited) is only for the social cards (`--k-scene-flat`).

- **Scene**: `<Scene>` renders `.scene` (fixed, `z-index: -2`) holding eight
  `.scene-layer` divs, back to front: sky, mountains, hills-far, hills-near,
  pines-left-back, pines-right-back, pines-left, pines-right. Each grove is
  two rows of trees (each tree itself cut as stacked tiers of card), the back
  row a separate layer so the rows part as the scene moves. Each layer is a
  full-frame bitmap with identical framing,
  `center bottom / cover`, so they register. The art has a calm centre and its
  incident at the edges and foot. One cloud (`.scene::after`) drifts across in
  150s, in the alpenglow finish only. `scripts/register-layer.mjs` corrects a
  generated layer's vertical drift or scale and can mirror-fill below its
  lowest pixel so the near layers never show a lower edge while they sink.
  Where it runs, the 3D diorama (below) draws these same layers instead.
- **Sheets** (`.faceplate`, plus the page blocks that wear one):
  `border-image: var(--k-plate) 152 fill`, rendered at `--plate-k` (0.5; 0.4
  under 720px). The art is 96px of transparent pad (the baked cast shadow)
  plus a 56px paper corner. The pad hangs outside the box via
  `border-image-outset`, so the paper edge is the box edge. Hover, pressed and
  focus are separate bitmaps on `::after`, crossfaded by opacity (180ms in,
  70ms for pressed), so state changes never scale or recrop. Hover lifts the
  sheet (wider, softer shadow), pressed lays it flat (tight shadow), and focus
  lays it on an under-sheet in the focus colour, torn to follow its deckle,
  that shows past the torn edge (`paper-shadow.mjs --mount`), so focus never
  draws over the pin or the print. `forced-colors` falls back to an outline. The torn rims of sheets
  and mats take the key light (`relight-edge.mjs`): lit along the top and
  left, shaded along the bottom and right.
- **Tiles** (`.key`): the same layering, with four states from
  `tile-{alpenglow,night,signal}`. Slice 60 (20px pad, 40px board) at
  `--key-k` 0.4 (0.55 for `data-size="lg"`). Hover lifts the card: the
  baked shadow falls longer and darker, with a crisp contact line, the
  upper-left bevel catches the key light (no sheen on the face: the 9-slice
  would stretch it into a band), and the tile rises 1px (not under reduced motion); no gloss, the
  board is matte. Focus is a channel cut just inside its edge in the focus
  colour, carrying the board's grain and the key light on its walls, and the legend shifts 1px on
  press. `<Cap inline>` prints a shortcut in running text as the same card at
  half the scale.
- **The Tauri hero's screen** wears the same mat, cut thinner
  (`--mat-k: 0.16`), so the mat frames it without taking its width.
- **Mats** (`.screen`): `mat-day` (lilac-grey board, so a screen stands off
  the cream sheet) and `mat-night` (ink board), each with a white core, as a 9-slice ring over the
  rice-coloured `.screen-face` (with `.screen-edge` above its content: the
  panel's dark edge, which by day fades inward in steps rather than being
  drawn as a line, and the recess shadow, so even a light screen reads as a
  display), with uneven per-side slices because the
  window sits off-centre in its board (`--mat-t/r/b/l`, measured per finish).
  `--mat-k` sets the scale: 0.26 by default (the tear and bevel need it to
  read as cut board), 0.18 on project cards, 0.2 on phones. Mats frame
  screens only; figures are printed on the sheet (`.ledger`) and commands
  typed on tape. The baked shadow falls inside the
  window, across the top and left of the screen. The face is recessed (an
  inset shadow) and `.screen-glass` lays the authored `glass-glare` map over
  it with `mix-blend-mode: soft-light`, so a light screen gets a sheen
  without washing out (fainter at night, where it would read as a glow).
- **Pins** (`.led`): a 14px box with a pin bitmap as `::before`, hung a little
  outside it. Brass when off; `pin-{green,amber,signal}` when on. The head art
  carries its own shadow, so there is no glow layer or blend mode.
- **A long page's sheets** (`globals.css`): on a wide screen the product
  page's sheets vary in width, lie to one side or the other, sit at two
  depths and some are pinned off-centre (`--pin-x`), so they read as separate
  pieces; below 1000px each takes the column. A sheet whose content runs much
  longer than its head (`.section.stack`) puts the head across the top and
  the content under it, as a table, two printed columns or a grid. Every
  sheet stays inside the
  column; the alpha sheet is the one that spans all of it, on the signal pin.
  Stacked sheets, the hero's included, are `--rack-gap` apart.
- **Screenshots** are shown at the app's real size (`--shot-w` from the crop,
  in CSS px), so text matches across sibling shots; each is a print on its
  own pinned sheet sized to it (`.shot`), its figure label and caption under
  it.
- **Depth on a shelf**: every other project sheet lies closer to the scene
  (`sheet-*-flat`, the same paper with a tighter baked shadow) and is pinned
  22px lower, so a shelf reads as separate pieces at different depths.
- **Action tiers**: a sheet carries at most its two calls to action as tiles.
  Utilities beside them (copy an address, jump down the page) are
  `.text-action`: underlined text, with the signal underline of printed
  links.
- **Sheet pins**: every sheet in the column hangs on one pin at the top
  centre of its paper. Project sheets (`ModuleCard`, the flagship) hang on
  their status pin (`<Led className="sheet-pin">`), so the status colour
  fastens the sheet; the status word stays in the sheet's header. Sheets
  drawn by a page block (`.section`, `.detail-hero`, `.colophon`) carry a
  brass pin as `::after`; other sheets use `<Prop kind="pin">`. Thin strips
  (masthead, section heads, folio) have none.
- **Tape** (`.kicker`, `.tape`, inline `<code>`): `tape-sage` (and
  `tape-sage-night`) as a 3-slice `border-image` so the torn ends never
  stretch; inline code is typed on a scrap of it at a finer scale. Code on a
  screen keeps the screen's own colours instead.
- **Seams**: at fractional device pixel ratios (125%/150% Windows scaling,
  2.75x phones) browsers snap the nine slices separately and leave hairline
  gaps on the slice lines. Sheets, mats and tiles have their centre material
  (`--plate-under`, `--bezel-under`, `--key-under`, sampled from the art) as
  a background under them, inset clear of the torn or rounded edge, so a gap
  shows the same material rather than the scene.

### The 3D diorama

Where WebGL and motion are welcome, the scene is drawn by three.js as real
planes in depth (`components/rack/scene3d/`). The CSS layers stay the first
paint and the fallback, and the two show the same picture at rest.

- **Who gets it**: the head script in `app/layout.tsx` sets
  `<html data-scene-mode="3d">` when reduced motion is off, `WebGL2` exists,
  the device has 4GB+ memory, Save-Data is off and `localStorage["nb-scene"]`
  isn't `"flat"`. `Scene`'s canvas ref then imports `scene3d/diorama.ts` (so
  three.js is only fetched there). It falls back to the CSS scene (drops
  `data-scene-mode`) on any error, on a software GL (Chrome's SwiftShader
  isn't flagged by `failIfMajorPerformanceCaveat`, so the renderer's name is
  checked too), or if the first frame takes over 2.5s (`GL_START_BUDGET_MS`). The first
  frame sets `data-scene-gl="on"`, which cross-fades the canvas in over the
  CSS sky and hides the other CSS layers. Under `data-scene-mode="3d"` the
  sheets' entrance is paused until that attribute appears, so the scene
  always rises before they drop; the budget bounds that wait.
- **Sun**: the sun (alpenglow) and moon (night) are painted into the sky,
  upper left, but a layer fitted with `cover` crops them off a narrow frame.
  So the kit build lifts each out (`scripts/lift-sun.mjs`): the sky under it
  is rebuilt from a clean band of the same rows further right, and the sun
  and its cloud become a sprite (`scene/<finish>/sun.webp`, its own baked
  shadow) wherever they are lighter than that clean sky. The page places the
  sprite on its own (`.scene-sun`, `--k-sun`): registered lengths
  `--sun-x`/`--sun-y`/`--sun-d` give the disc's centre and diameter per
  width (the margin beside the column on wide screens, the column's top-left
  corner below 1400px, smaller and higher on a short screen; always clear
  of the masthead), and `--sun-cx`/`--sun-cy`/`--sun-r` say where the
  disc lies in the sprite. The 3D scene reads the same tokens (`sunRect`).
- **Geometry** (`scene3d/framing.ts`, pure, unit-tested): each layer is a
  plane at its own depth, sized so that from the resting camera it covers
  exactly the CSS layer's rect (`layoutPlane`; the sun is a plane of its
  own, placed by `sunRect` from the CSS tokens), with mirrored overscan so no camera
  move shows an edge. The camera only translates (pointer on fine pointers,
  and it rises with scroll), so the layers keep their registration and only
  the parallax changes. The sky and sun planes follow the camera, so they
  sit at infinity: the sun and the moon never slide against the hills.
- **Shadows** are cast in the art's own UV space, not with a shadow map:
  each layer samples the alpha of the layer(s) just in front of it at a
  small offset, down and to the right of the key light, with a mip bias for
  softness. The layers stand metres apart for the parallax, and a shadow map
  would throw the near pines' shadows, shrunk by perspective, into the sky.
  The drifting cloud shades the sky the same way.
- **Colour**: textures are sampled as stored (`NoColorSpace`) and written out
  unchanged (`LinearSRGBColorSpace` output), so the canvas matches the CSS
  scene; textures are premultiplied so cut edges filter toward clear, not
  black.
- **Motion**: the layers hinge up from lying flat, back to front, with an
  overshoot (`hingeAngle`); a shadow grows in as its caster stands
  (`castShadow`). The camera eases back from slightly closer and lower.
  Motes drift in the valley (dust in alpenglow, fireflies at night).
- **Finish**: the art comes from the same `--k-<layer>` tokens, plus
  `--k-drift-cloud`, `--motes` and `--motes-kind`, so a rice change re-dresses
  it (a MutationObserver on `data-rice`).

### Motion

All of it is gated on `prefers-reduced-motion: no-preference`; under reduced
motion the scene is still and finished, and the cloud rests.

- **Pop-up entrance** (`layer-rise`, 1150ms, slight overshoot): on first load
  the sky fades (`layer-fade`) and each other layer rises from below the frame
  with a staggered `--rise-delay`, back to front.
- **Sheets down** (`sheet-down`, 760ms): each child of `.rack-inner` settles
  down 24px onto the scene, staggered by `--nth`, after `--sheets-after`
  (520ms, so the scene lands first; 700ms behind the 3D diorama, from its first frame).
- **Settled**: when the last layer's `layer-rise` ends, `Scene` sets
  `<html data-scene="settled">` and `--sheets-after` drops to 0, so sheets on
  later client navigations don't wait for a scene that is already up.
- **Scroll parallax** (`layer-sink`): where `animation-timeline: scroll()` is
  supported, every layer but the sky also runs `layer-sink` on `scroll(root)`,
  translating `transform` by its `--sink` (2vh for mountains up to 13vh for
  the pines), so near layers sink faster than far ones. It uses `transform`,
  so it composes with the rise on `translate`. Unsupported browsers just get
  the entrance.

- **Shortcuts per platform**: the launch page writes every shortcut the app's
  way (`Ctrl+Shift+F`). `components/launch/shortcuts.ts` (pure, tested) maps
  them for a Mac: Ctrl becomes ⌘ (the app fires Ctrl bindings on Command too),
  Alt becomes ⌥, in Apple's modifier order, except where macOS owns the ⌘
  chord (`` ` ``, H, M, Q, Tab, Space), which stay ⌃. `LiveCaps` prints chords
  through it and `<ForOS>` rewrites shortcuts in running text; the server
  renders the Ctrl spelling and a Mac swaps after hydration.
- **Screenshots**: `scripts/shot-crops.mjs` cuts every gallery and phone crop
  from the 2x raw captures at the raw's own resolution (regions recorded in
  the script), plus a 2560px copy of each full window for the lightbox's
  `srcset`.
- **Screen art**: 1-bit Atkinson-dithered PNGs used as `mask-image`, so the
  rice picks their colour.

Slice insets are measured on the built bitmaps, whose sizes are fixed by
`scripts/build-paper-kit.mjs`. If you regenerate an asset, rebuild the kit and
re-measure before changing `--slice-*`, then run `bun run kit:check` (it checks
`public/kit/paper` by default): every state must share the normal state's
canvas and silhouette, and the light-only states (hover, focus) must register
with it at zero offset in all four 9-slice corners. A mounted state (a
sheet's focus) may grow the silhouette, but must contain the normal's and
leave the paper's own pixels unchanged. Each asset carries its
shadow in its alpha and a state may move the shadow, so the silhouette is the
alpha above 200 (the paper is opaque; shadow never is).

## Image pipeline

All generated art is offline and committed under `public/`. Prompts are in
`art/prompts/` (the kit's are in `art/prompts/diorama/`). Raw generations live
in `art/raw/diorama/<name>/<name>.png`, which is gitignored and can be
regenerated. The kit is generated with Codex headless image generation, which
returns native alpha, so there is no chroma-key step.

1. Generate each asset from its prompt in `art/prompts/diorama/<name>.txt`
   into `art/raw/diorama/<name>/<name>.png`.
2. `node scripts/build-paper-kit.mjs` builds `public/kit/paper` from the raws.
   Each asset is trimmed to its paper, resized to a fixed source size (so the
   slice insets in `kit.css` stay valid), and given its shadow. Per-asset
   grading (gain per finish) lives in the script. It also flattens the scene
   layers into `scene-{alpenglow,night}.webp`. Assets whose raw is missing are
   skipped.
3. `scripts/relight-edge.mjs <in> <out> [--band=] [--shade=] [--lift=]`
   relights a base's outer torn rim for the upper-left key light (a generated
   rim is lit evenly, which reads as an outline). The build runs it on sheets
   and mats before their states are derived.
   States are derived from the normal art, so they register by construction:
   `scripts/derive-state.mjs <normal> <out> hover|focus|pressed [--ring=a:b]
   [--ring-color=hex] [--catch=] [--catch-width=px] [--sheen=] [--halo=a:b] [--groove=depth] [--groove-tint=hex]`.
   A baked shadow's offset plus twice its blur must fit inside the asset's
   pad, or the shadow is clipped to a hard line. Generated hover art
   drifted (the model reframes the object), which made corners jump on hover.
4. `scripts/paper-shadow.mjs <in> <out> --pad=N [--ambient=dx:dy:blur:op]
   [--contact=dx:dy:blur:op] [--mount=width:hex]` bakes the cast shadow into the bitmap's alpha:
   a tight contact shadow plus a wide faint ambient one, down and to the right
   of the key light. Hover/pressed states change only these parameters.
5. `scripts/register-layer.mjs <in> <out> [--dy=N] [--reflect] [--scale=S
   --anchor=left|right]` registers one generated scene layer against the
   others (see Scene above) into `registered.png`, which the build prefers.
   The groves were generated whole (`grove-{left,right}`), then each row
   extracted (`layer-pines-<side>[-back]-alpenglow`, the back row with its
   hidden parts completed) and recoloured for night; both rows of a grove
   take the same `--scale`, so they stay in register.
6. Screen art: `node scripts/dither-mask.mjs <grey.png> public/screens/<x>.png`
   puts it on a shared 360×240 dot grid, so every screen has the same pitch.
   The Tauri Explorer screen is a real capture, not a generation:
   `scripts/prep-ui-capture.mjs` turns the selected row into a solid bar with
   knocked-out text, then `dither-mask.mjs … 360 240 3 4 1` (the trailing `1`
   drops lone dots). Steps are in `art/prompts/screens/tauri-explorer.txt`.
   Frames of flat shapes (the Eskiv run) use `scripts/threshold-mask.mjs`
   instead: a hard cut on the same grid keeps the dots round.
7. Review sheets: `node scripts/contact-sheet.mjs out.jpg 400 4 img…`.
8. Social cards: `bun run og` (needs the dev server). `scripts/render-og.mjs`
   captures `/og/*` to the metadata image files with the light `paper` rice
   forced, so the cards wear the alpenglow diorama.
9. `shot-crops.mjs` also writes the live demo's still
   (`public/tauri/live-app-<theme>.webp`), the app at the demo's 1440×900,
   untouched. Sources live in `art/raw/`.
