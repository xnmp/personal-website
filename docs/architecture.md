# Architecture

A single-author site. Each project is one **module** in an instrument rack, and
each module has one detail page. There is no CMS, no database and no auth.
The art direction lives in [`art/BRIEF.md`](../art/BRIEF.md). Read it before
changing anything visual.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router (read `node_modules/next/dist/docs/`; APIs differ from older Next) |
| Runtime | React 19 |
| Styling | Plain CSS: `src/app/kit.css` (raster kit) + `globals.css` (layout/type) + `rice.css` (generated palettes) |
| Fonts | `next/font/google`: Archivo (with the `wdth` axis) for print, JetBrains Mono for screens |
| Art | Generated bitmaps in `public/kit` and `public/screens`, composited with 9-slice `border-image` |
| Tests | `bun test tests/` (unit), `bunx playwright test` (e2e, `e2e/*.e2e.ts`) |
| Package manager | `bun` |

## Routes

```
src/app/
  layout.tsx            root: fonts, rice init script, CommandIndex
  (rack)/layout.tsx     wraps every rack page in <Rack> (bench backdrop + rails)
  (rack)/page.tsx       home: masthead, hero, flagship, two shelves of modules
  (rack)/p/<slug>/      detail pages (one per project in src/data/projects.ts)
  tableau-frog/         standalone product showcase, deliberately outside the rack
  og/[card]/            social cards drawn with the kit, captured by scripts/render-og.mjs
  not-found.tsx         404, mounts its own <Rack>
```

To add a project, add an entry to `src/data/projects.ts` (the number, shelf,
status, screen art and tone) and create `(rack)/p/<slug>/page.tsx`. The unit
tests check that numbers are contiguous and that private repos are never
linked.

## Two colour-token families

- **Chassis** (`kit.css`): `--print`, `--print-soft`, `--print-faint`, `--signal`,
  plus the `--k-*` bitmap URLs. This is ink printed on the faceplates. There
  are two finishes: anodised graphite (the default and the dark rices) and
  powder-coat (`paper`).
- **Screen** (`rice.css`, generated from the dotfiles by
  `scripts/theme-from-dotfiles.mjs`): `--paper`, `--ink`, `--cyan`, `--rust`,
  `--amber`, `--olive`. These are only used *inside* `<Screen>`: figures,
  charts, code, the index, inline `<code>` chips. Pressing `t` cycles the rice,
  which reflashes every screen and swaps the chassis finish when it switches
  to/from `paper`.

## Components

- `components/rack/`: `Rack`, `Screen` (bezel + rice-lit face + optional
  1-bit art mask), `Key`/`Cap` (keycaps with three authored states), `Led`,
  `ModuleCard`, `RackKeys` (`j`/`k` focus). These are pure and
  server-renderable except `RackKeys`.
- `components/notebook/`: page-level primitives kept from the first version
  (`RunningHead`, `Plate`, `Features`, `OpenQuestion`, `Tags`, `Folio`,
  `Divider`). Their CSS turns each block into a faceplate, so older pages
  inherit the chassis.
- `components/launch/`: the Tauri Explorer page's interaction model. A small
  external store (`keyboard.ts`, read through `useSyncExternalStore`) tracks
  held keys, so the keycaps press with the real key. It also tracks whether
  the live demo is powered on. Ctrl+P on that page powers the demo instead of
  printing. The demo's web build only lays out properly from about 1400px
  wide, so `LiveDemo` renders it at 1440×900 and scales it to the screen with
  a ResizeObserver set up in a ref callback. The same callback boots the
  demo when half the screen is in view on a fine pointer; booting that way
  leaves focus with the page, so page keys keep working. An explicit power-on
  (the key, or Ctrl+P) focuses the iframe once it loads, so the next Ctrl+P
  is the app's own quick open. The store also holds the demo's state (off,
  booting behind the standby poster, live) and whether the app has the
  keyboard; while it does, the plate wears its focus line and the caption says
  how to take the keyboard back. Auto-boot waits while the power key has focus.
  On touch screens (`.coarse-only`/`.fine-only`) the key opens the app full
  screen in a new tab.
- `ShotGallery` opens a screenshot's full window in a native `<dialog>` on a
  faceplate (Esc and backdrop close it; focus returns). Below 760px the window
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
- Landmarks: each rack page is masthead (`<header>`, banner), `<main
  id="content">` (`.rack-main`, which stacks plates like the rack), then the
  folio (`<footer>`). The masthead's first Tab stop is a skip link to `main`.
  Headings run h1 (page) → h2 (sections, home shelves) → h3 (items: home
  modules, feature tiles). A home module's link is named by its title and
  described by its one-line heading.
- The theme key prints the theme's name beside its `t` legend, and "theme" on
  touch; its accessible name carries both. `toggleTheme` announces the new
  theme through a polite status region.
- `.fine-only`/`.coarse-only` hide with `!important`: they are visibility
  utilities, and no component display rule may bring hidden copy back.
- Type has two small styles: `.silk` (tracked capitals) for labels of a word
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
- `Key` takes `disabled` (buttons only): the cap goes unlit (a signal cap
  falls back to the plain cap), its legend prints faint, and it neither
  lights nor sinks. The Zheng Shang You table uses keys for Play, Pass and
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
  (Ctrl+P, the power key, or "Give it the keyboard"), by `focus()`.
- The live demo loads the app's web build with `?theme=dark`, so it boots
  into the same dark picture as its poster and every other screen. The web
  build (app repo, `website/index.html`) honours it unless the visitor picked
  a theme inside the demo; an older build ignores it and follows the OS.
- The live demo's standby/booting lamp sits on its own dark strip along the
  glass's foot, blanking the poster's status bar so the two never overprint.
- Next 16.2's SWC drops the space after an inline element when the text that
  follows spans lines and contains an HTML entity (`</em> gave …&rsquo;…`
  becomes `</em>gave`; fixed in Next 16.4). JSX text uses literal typographic
  characters (’ “ ”) instead of entities, and an e2e test fails on any word
  glued to the end of an inline element in the served HTML.
- `VideoScreen` (Eskiv) shows 1-bit art of the video with a key that opens it
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

Every surface is a bitmap, and CSS only does layout and compositing:

- **Faceplates**: `border-image: var(--k-plate) 96 fill / var(--plate-w)`. The
  hover, pressed and focus states are separate bitmaps on `::after`,
  crossfaded by opacity, so state changes never scale or recrop. Focus is a
  vermilion line printed inside the bevel (it follows the chamfers), not a CSS
  outline; `forced-colors` falls back to an outline.
- **Rails**: rack-level plates overhang the rails (`--overhang`) so their
  corner screws sit on the rail's hole line. The rail tile is laid out to
  EIA-310 pitch (three holes per U) by `scripts/build-rail.mjs`.
- **Back panel**: between the rails the rack shows its own perforated back
  panel (`--k-back`, a seamless 2x tile from `scripts/build-backpanel.mjs`),
  shaded where it meets the rails, so the seams between modules read as depth.
- **Bench**: a prop-free mat (`--k-bench`) on a fixed layer, `cover`-sized.
- **Bezels**: `border-image` without `fill`, over a face lit by the rice.
- **Seams**: at fractional device pixel ratios (125%/150% Windows scaling,
  2.75x phones) browsers snap the nine slices separately and leave hairline
  gaps on the slice lines. Plates and bezels have their centre material
  (`--plate-under`, `--bezel-under`, the mean of the art's middle) as a
  background under them, inset clear of the chamfered corners, so a gap shows
  the same material rather than the back panel. Keycaps go further: their
  underlay is the cap art stretched whole, which lines up with the 9-slice
  along every slice line because caps render at the art's own proportions
  vertically (about 2.6 slice widths tall), so a gap shows the same lip or
  face. It is the `.key`'s own background, clipped by a border-radius just
  larger than the art's corner, so it reaches the cap's outer edge on the
  slice lines without its corners ever showing past the cap's.
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
- **Keycaps**: the same layering, with three states, and the legend shifts
  1px on press.
- **Screen art**: 1-bit Atkinson-dithered PNGs used as `mask-image`, so the
  rice picks their colour.
- **LEDs**: an unlit dome plus a glow sprite shot on black, composited with
  `mix-blend-mode: screen` (light adds).

Slice insets are measured on the trimmed bitmaps. If you regenerate an asset,
re-trim it and re-measure before changing `--slice-*`, then run
`bun run kit:check`: every state must share the normal state's canvas and
silhouette, and the light-only states (hover, focus) must register with it at
zero offset in all four 9-slice corners.

## Image pipeline

All generated art is offline and committed under `public/`. Provenance is in
`art/prompts/`. Raw generations go to `art/raw/`, which is gitignored and can
be regenerated.

1. `node scripts/gen-image.mjs <out.png> <aspect> <size> <prompt.txt> [ref.png…]`
   (Gemini `gemini-3-pro-image-preview`, direct API). Pass a reference image to
   edit, e.g. to make a pixel-registered hover state from the normal state.
2. Assets are shot on pure magenta. `node scripts/key-asset.mjs <in> <out.webp>
   [maxW]` keys them out, un-mixing the edge colour and removing spill.
3. Screen art: `node scripts/dither-mask.mjs <grey.png> public/screens/<x>.png`
   puts it on a shared 360×240 dot grid, so every screen has the same pitch.
   The Tauri Explorer screen is a real capture, not a generation:
   `scripts/prep-ui-capture.mjs` turns the selected row into a solid bar with
   knocked-out text, then `dither-mask.mjs … 360 240 3 4 1` (the trailing `1`
   drops lone dots). Steps are in `art/prompts/screens/tauri-explorer.txt`.
   Frames of flat shapes (the Eskiv run) use `scripts/threshold-mask.mjs`
   instead: a hard cut on the same grid keeps the dots round.
4. Review sheets: `node scripts/contact-sheet.mjs out.jpg 400 4 img…`.
5. Social cards: `bun run og` (needs the dev server). This captures `/og/*` to
   the metadata image files.
6. Light-only states are derived from the authored normal state, so they
   register by construction: `node scripts/derive-state.mjs <normal> <out>
   hover|focus|pressed [--ring=a:b] [--ring-color=hex] [--halo=a:b]`. Keycap
   focus is derived with `--catch=0 --sheen=0` (so it never looks like hover)
   and a two-tone ring (`--halo` puts a dark keyline inside the bright one). Generated hover art drifted
   (the model reframes the object), which made corners jump on hover.
7. `scripts/grade-highlights.mjs` compresses and warms a bitmap's highlights
   (used on the dark bezel, whose lip came out as the brightest value on the
   page). `scripts/build-rail.mjs` re-lays the authored rail to rack pitch, and
   `scripts/build-backpanel.mjs` re-lays the authored back panel onto an exact
   staggered grid under flat light (`--sheet=hex` recolours it for paper).
   `scripts/bench-mat.mjs` cuts the bench backdrop from the authored desk:
   the mat only (no props to show as fragments beside the rack), with the
   lamp's falloff flattened and the hue unified (`--tint`, `--chroma`).
8. Small material fixes, each keeping geometry: `neutralize-tint.mjs` (pulls
   the light keycaps' mauve skirts to the warm neutral), `glow-alpha.mjs`
   (straight-alpha LED glows for the light chassis, where a screen blend
   vanishes), `standby-poster.mjs` (the dimmed, scan-lined app frame shown
   on the live demo before it boots). Sources live in `art/raw/`.
