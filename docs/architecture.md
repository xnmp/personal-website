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
| Styling | Plain CSS: `src/app/kit.css` (the raster kit, Paper Diorama's tokens) + `src/app/styles/<style>.css` (each other art direction's tokens) + `globals.css` (layout/type) + `rice.css` (generated palettes) |
| Fonts | `next/font/google`: Newsreader (`--font-display`, headlines), Archivo (`--font-print`, body and UI), JetBrains Mono (`--font-mono`, tape labels, key legends, screens) |
| Art | Generated bitmaps in `public/kit/<style>` and `public/screens`, composited with 9-slice `border-image` |
| Tests | `bun test tests/` (unit), `bunx playwright test` (e2e, `e2e/*.e2e.ts`) |
| Package manager | `bun` |

## Routes

```
src/app/
  layout.tsx            root: fonts, rice init script, CommandIndex
  (rack)/layout.tsx     wraps every page in <Rack> (the scene + a column of sheets)
  (rack)/page.tsx       home: masthead, hero (intro + flagship sheet, the product first), two shelves of modules (sheets), keys in the foot
  (rack)/p/<slug>/      detail layouts (one per project in content/projects/)
  tableau-frog/         standalone product showcase, deliberately outside the diorama
  og/[card]/            social cards drawn with the kit, captured by scripts/render-og.mjs
  not-found.tsx         404, mounts its own <Rack>
```

To add a project, add `content/projects/<slug>.md` (the order, shelf,
status, screen art, tone and written content) and create `(rack)/p/<slug>/page.tsx`. The unit
tests check that numbers are contiguous and that private repos are never
linked.

## Two colour-token families

- **Paper** (`kit.css`): `--print`, `--print-soft`, `--print-faint`, `--signal`,
  plus the `--k-*` bitmap URLs and the `--*-under` centre colours. This is ink
  on the sheets and tiles. There are two finishes: **night** (`:root`, worn by
  every dark rice) and **alpenglow** (`:root[data-rice="paper"]`, the light
  rice). Each finish swaps the scene layers, sheets, tiles, mat and
  inks. Terracotta (`--signal`) is the one accent. A link's underline is
  `--signal-rule` (falls back to `--signal`): a rule needs 3:1 on its
  ground where the signal as text needs 4.5:1, so a style with a deep
  accent on a dark page rules in the accent itself.
- **Screen** (`rice.css`, generated from the dotfiles by
  `scripts/theme-from-dotfiles.mjs`): `--paper`, `--ink`, `--cyan`, `--rust`,
  `--amber`, `--olive`. These are only used *inside* `<Screen>`: figures,
  charts, code on screens, the index. Pressing `t` cycles the rice,
  which reflashes every screen and swaps the paper finish when it switches
  to/from `paper`. Screens take rice colours in both finishes.

## Art directions (styles)

The site can be worn in several art directions (issue #1). A style is a
set of surfaces and type, selected by `<html data-style>`. The illustrated
styles share a raster kit contract. Margin Index uses CSS surfaces and a sparse
server-rendered directory over the same project catalogue; theme state, search,
keyboard handling and reading-page components remain shared.

- **Registry** (`lib/styles.ts`, pure, tested): the shipped styles, in menu
  order. Only a style listed there can be chosen; the head script in
  `app/layout.tsx` applies the stored choice (`localStorage["nb-style"]`)
  before paint and refuses anything unlisted, falling back to `margin` (Margin Index).
- **Tokens**: Paper Diorama's are the base (`kit.css`: `:root` for night,
  `:root[data-rice="paper"]` for day). Every other raster style overrides all of them
  in `src/app/styles/<style>.css`, under `:root[data-style="<id>"]` (night)
  and `:root[data-style="<id>"][data-rice="paper"]` (day). `tests/styles.test.ts`
  fails if a style leaves a token unset (which would show the diorama's art),
  names another style's bitmap, or names a file that doesn't exist. Geometry
  (`--slice-*`, `--*-k`) is shared: every kit is built to the same source sizes.
  A token's `url()` is only fetched where it is used, so a visitor downloads
  only the active kit (e2e checks this per style).
- **Scene slots** are generic depth roles, back to front: `sky`, `far`, `mid`,
  `near`, `left-back`, `right-back`, `left`, `right` (`--k-<slot>`). A style
  may leave any but the sky as `none`; the CSS layer then paints nothing and
  the 3D diorama hides that plane. The diorama maps its mountains, hills and
  groves onto them. A style with no lifted sun sets `--k-sun: none`.
- **Scene art** (`scene` in `lib/styles.ts`): a `diorama` (Paper) is
  layered cut-outs, which the 3D scene stands in depth. A `plate` (the other
  illustrated styles) is one painting: the style's original mock with the page
  painted out (`art/raw/<style>/plate-*`), painted on past the mock's edges.
  The head script sets `<html data-scene-art>` and offers the 3D scene only
  to a diorama; a switch to any other scene kind stands a running 3D scene down
  (its framing covers the frame, which would undo the registration below).
- **Margin Index** uses `scene: "none"`, hides the scene, and clears all raster
  surface tokens. `styles/margin.css` is imported after the shared CSS. Its
  directory displays every project, grouped by shelf; optional summaries and
  a real flagship preview come from Markdown. Hidden presentation stops are
  excluded from `j`/`k` navigation. `e2e/margin.e2e.ts` checks content, navigation,
  viewport bounds, theme persistence and the absence of kit requests.
- **Plate registration** (kit.css): on a desktop a plate's sky layer is
  drawn at the home stage's scale (`--u`), its core (the mock's 1672x941)
  centred across and its top on the stage's, so the props the page stands
  against stay where the mock has them at any aspect; the page's own
  sprites (a ledge, a monitor, a cat) are anchored to the stage the same
  way. The bleed it is painted to (`--sky-bleed-x` each side,
  `--sky-bleed-bottom` below, mock px; the recipe's `scene.bleed`) fills the
  frame round the stage from 4:3 to 21:9 (`tests/styles.test.ts`); past
  that the plate scales up to cover. Below 900px there is no stage, and the
  core covers the frame from its foot. Lengths are in the scene's container
  units (`.scene` is a size container), so a classic scrollbar doesn't
  shift it.
- **Type**: the three roles stay; a style may re-point `--font-display` at its
  own face, declared in `app/fonts.ts` with `preload: false`, so its file is
  only fetched when that style is worn.
- **Menus** (`ChoiceMenu`, used by `StyleMenu` and `ThemeMenu` in the masthead;
  art direction and colour remain independent choices): WAI-ARIA menu
  buttons listing their options as
  `menuitemradio` tiles, the chosen one the signal tile. The menu is a
  popover (`popover="auto"`), so the browser lays it over everything and
  dismisses it on Escape or a click elsewhere. Menus portal to the document
  body so masthead-only surface tokens cannot remove their backing or ink.
  Each is measured as it opens
  (`menuPlacement`, `lib/menu.ts`), placed in viewport coordinates on the side
  of its key with room, and constrained to scroll internally on short screens.
  A resize closes it. The keyboard opens it synchronously on the checked item (a
  popover's `toggle` event comes a task later, and a key pressed before it
  would land on the button); arrows, Home and End move (`nextItem`), Enter
  or Space chooses, and focus leaving the menu closes it. On a phone the key
  is a palette glyph on a square tile (and below 400px the theme key its
  disc), so the brand and three keys share one row at 320px. It is not part
  of the `t` cycle: the rice colours the screens in every style.
- **Briefs**: the diorama's is `art/BRIEF.md`; each other style's is
  `art/briefs/<style>.md`, with its prompts in `art/prompts/<style>/` and its
  kit config in `scripts/kits/<style>.mjs`.
- **Framed surfaces** (Solarpunk's brass round frosted glass): a sheet that is
  a frame round a material slices without `fill` (`--plate-slice`) and the
  page paints the material itself: `--plate-fill` tiled
  (`--plate-fill-size`/`-repeat`), with `--plate-backdrop` over the scene
  behind it and `--plate-round` keeping it inside the frame's corners; it
  falls back to the solid `--plate-under` under
  `prefers-reduced-transparency`. So the material tiles at any size, where a
  9-slice would smear it across its stretched edges. `--plate-sheen` is the
  light the material takes as its sheet lifts (crossfaded in with the hover
  art; not on focus or press). `--key-inset` is the room a tile's legend
  needs inside a bezel. The fill and its backdrop start `--plate-fill-in`
  inside the frame's outer edge (the fill layer is inset by it and its
  border-image pushed back out by as much), past a brass frame's soft fringe
  or a mount's clear margin, so the frost never shows outside the frame.
- **Rails and strips**: a frame whose rails keep one profile along their
  length is mitred in the build (`mitre`, under Image pipeline), so its
  keylines run on round the corners without a step. A strip whose rail
  material has a broad grain (mottled silk) repeats it rather than stretching
  it (`--strip-repeat: round`; `stretch` by default).
- **State art only**: kit.css changes state by swapping art, in every
  style. Nothing filters a whole sheet: a brightness filter clips white
  paper and mounts, and changes the colours of the screen a sheet carries.
- **Per-style layout tokens**: `--key-lift` raises a tile's legend off its
  centre by the card's thickness where that shows along its foot (0 for a
  flat slip or a bezel); `--hero-align` and `--hero-stagger` set how the
  opening pair hang (the diorama pins one lower; a scroll gallery hangs both
  from one line).
- **Tier cut**: a style that sets the opening pair level (`--hero-align:
  stretch`) can fill the shorter column's foot with a panel of its own
  scene (`.tier-cut`, kit.css: `--tier-cut: block`, the crop by
  `--tier-cut-at` and `--tier-cut-size`), framed by the flat plate. The home
  hero and the Tauri Explorer launch hero carry the slot (`aria-hidden`);
  it is hidden where the pair stack. The cut takes the column's spare height
  (its flex share outweighs the copy's a thousandfold); without one, the
  copy panel takes it and ends level with its neighbour. A style turns it
  off on a hero whose columns come out nearly equal (atlas's home page),
  where the cut would force the taller panel taller. A cut is a crop of the
  flat scene unless the style gives it a close-up of its own
  (`--tier-cut-art`, built by the kit's `cuts`): a closer framing cropped
  from the scene would be the scene enlarged, and soft. A page's
  screenshots may stand in tiers too (`.shot-tier`, no box unless a style
  sets `--shot-cut`), each print's sheet with a cut level beside it.
- **Fill phase**: `--plate-fill-at` (default `center`) places a tiled fill
  inside a sheet. A style whose material is one large print (cyanotype's
  emulsion) sets it per card in a row, so neighbours are never cut from the
  same place in it.

## Content is data

The project list is loaded from `content/projects/*.md` by `src/data/projects.ts`.
Reordering uses frontmatter `order`; featuring another uses `content/home.md`.
Written content uses named Markdown blocks consumed by the existing layouts.
The parser and metadata validation are pure; filesystem access stays in server
modules. Client-side search receives only the parsed project data as props.
See [the authoring guide](content-authoring.md) for editing and publishing.
Each style holds to the following, and the tests
enforce it.

- **Adding a project** takes three things: a Markdown file in `content/projects/`, its page
  `src/app/(rack)/p/<slug>/page.tsx`, and its 1-bit art in
  `public/screens/`, after which you run `bun run screens:bounds`.
  - Its number is its place in the list.
  - The page's meta, kicker and folio (`ProjectMeta`, `ProjectKicker`,
    `Folio`) read the number from the data, so nothing is renumbered by
    hand.
  - It lands on its shelf, in the index and in the Explorer window's
    `~/Repos` by itself.
  - `tests/projects.test.ts` fails by name if any part is missing.
- **A style dresses an item by what it is, never by which project it is.**
  No selector names a project by its link, slug or title. Per-item
  variation comes from the item's data, which the shared markup passes on:
  - `data-shelf` ("tools" or "games") on cards and modules: an app's card
    may wear an app window.
  - `data-tone`.
  - `--glyph`, the project's one character, as a CSS string, for a seal
    (`content: var(--glyph)`).
  - `--drawn-x/-y/-w/-h`: where the art's drawing sits in its mask, as
    shares of it (centre and size, from `src/data/screen-bounds.json`).
    Fit a drawing by these (centre it, stand every card's at one height)
    instead of measuring each project's art by hand.
- **Repeated items take cycles, not places.**
  - A decoration that varies along a list uses `:nth-child(4n+k)`, so a
    fifth card is dressed like the first.
  - `:first-child` is a role (the lead card) and is fine.
  - A fixed `:nth-child(3)` on a card, module or fact is not.
- **Layouts take any count.**
  - The home row is one row of as many cards as `FEATURED` holds (globals:
    `grid-auto-flow: column`, equal shares).
  - A style may set the mock's own column proportions for four, under the
    quantity query `.showcase-row:has(> li:nth-child(4):last-child)`, and
    leaves any other count to the equal shares.
  - Card heights must not grow with a wider card: three cards stay on the
    first screen.
  - Shelves wrap.
- **The flagship is the one bespoke slot.** Its window is the app's own
  UI (`ExplorerWindow`), so changing `FLAGSHIP` means designing that
  window. Its name, links and labels come from the data. Lettering art that
  paints a word (Sumi's brushed title) is keyed to the word it paints, and
  live type stands in for any other.
- **The tests.**
  - `tests/style-contract.test.ts` reads every stylesheet's selectors for
    the first two rules.
  - `e2e/content.e2e.ts` gives every style's home row three and five
    cards and its shelf one module more and one fewer, and checks the
    layout holds: one row of whole cards on the first screen, no overlap,
    no sideways scroll.

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
- The theme key opens a radio menu of colour palettes; opening it leaves the
  current palette unchanged. `setTheme` persists and announces a selection
  through a polite status region. The `t` shortcut still cycles outside menus
  and dialogs. Both menus share bounded placement, selection, focus return
  and keyboard behavior through `ChoiceMenu`.
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
- The home page's first screen is composed as every style's mock is
  (components/landing, page.tsx): `Masthead` (the brand, the tagline, and
  the keys printed as words), the flagship's name, pitch and keys beside
  its window, and the row of four `ShowcaseCard`s (`FEATURED`,
  `data/projects.ts`) under them; the rest of the projects are on the
  shelves below. It is laid out on a stage of the mocks' proportions
  (globals.css "home landing"): `--u` is one mock pixel, so a style places
  each piece at its mock's coordinates with the `--l-*` tokens and hangs its
  ornaments on the free hooks there; below 900px it stacks. The window is
  `ExplorerWindow`: the app's two panes as live text in the rice, not a
  bitmap, sized to its container (cqw) and holding as many whole rows as
  fit.
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
  `.scene-layer` divs, one per slot, back to front: `sky`, `far`, `mid`,
  `near`, `left-back`, `right-back`, `left`, `right` (in the diorama: sky,
  mountains, far hills, near hills, and each grove's back and front rows). Each grove is
  two rows of trees (each tree itself cut as stacked tiers of card), the back
  row a separate layer so the rows part as the scene moves. Each layer is a
  full-frame bitmap with identical framing,
  `center bottom / cover`, so they register. A style may anchor its `left`
  and `right` cut-outs to their sides instead (`--left-anchor`,
  `--right-anchor`, 0 to 1 as background-position-x) and hold them to
  `--side-span` frame widths (drawn at `--side-size`), so on a narrow
  screen each landmark keeps to its side, smaller, rather than being cropped
  away; the 3D scene reads the same tokens (`framing.ts` `Placement`). Each
  side's back row (`left-back`, `right-back`) goes with it, and a shadow
  between layers placed apart is mapped across (`framing.ts` `casterMap`),
  so it falls where its caster is drawn. The art has a calm centre and its
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
  `.screen-face` is isolated, so that blend composites inside the face: a
  blend that reaches the sheet makes the sheet a render surface of its own,
  and a framed sheet's backdrop blur then has nothing behind it to frost
  (`e2e/styles.e2e.ts` checks the frost).
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
  stretch; inline code is typed on a scrap of it at a finer scale (`--k-chip`,
  in `--chip-ink`: a style may cut its chips from another material, an
  etched slip of glass or a slip of washi, and ink them to suit). Code on a
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
  Where a lift can't read the disc cleanly (a moon on its own glow, a sun
  close to the sky's tone; Sumi-e Ink), the sky is generated clear of it
  and the disc on its own, and the build sizes that sprite and reports its
  `--sun-*` (`scene.sun.sky` / `scene.sun.sprites` in the kit config).
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
- **Sheets down** (`sheet-fade` 230ms, `sheet-down` 760ms): each child of
  `.rack-inner` fades in and settles down 24px onto the scene, staggered by
  `--nth`, after `--sheets-after` (520ms, so the scene lands first; 700ms
  behind the 3D diorama, from its first frame). Both fill `backwards` only:
  an opacity animation left applied after it ends keeps the sheet a backdrop
  root, and a framed sheet's frost dies the next time it repaints (on a
  change of finish, say). The e2e checks the frost after one.
- **Settled**: when the last layer's `layer-rise` ends, `Scene` sets
  `<html data-scene="settled">` and `--sheets-after` drops to 0, so sheets on
  later client navigations don't wait for a scene that is already up.
- **Scroll parallax** (`layer-sink`): where `animation-timeline: scroll()` is
  supported, every layer but the sky also runs `layer-sink` on `scroll(root)`,
  translating `transform` by its `--sink` (2vh for the far slot up to 13vh for
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
`scripts/build-kit.mjs`. If you regenerate an asset, rebuild the kit and
re-measure before changing `--slice-*`, then run `bun run kit:check` (it checks
every kit in `public/kit` by default): every state must share the normal state's
canvas and silhouette, and the light-only states (hover, focus) must register
with it at zero offset in all four 9-slice corners. A sheet's focus may add
to the sheet (the diorama's mount behind it, the brass frame's enamel strip
laid in along its pane), growing the silhouette, but must contain the
normal's and leave its opaque pixels unchanged (to within lossy-encoding
jitter). Each asset carries its
shadow in its alpha and a state may move the shadow, so the silhouette is the
alpha above 200 (the paper is opaque; shadow never is), and a pixel counts as
moved only when it crosses clearly (below 180 to above 220, or back): a soft
edge row whose coverage sits at 200 flips on a hair's change of the shadow
under it, which is antialiasing, not the edge moving. A 2px shift fails.

## Image pipeline

All generated art is offline and committed under `public/`. Prompts are in
`art/prompts/` (the kit's are in `art/prompts/diorama/`). Raw generations live
in `art/raw/diorama/<name>/<name>.png`, which is gitignored and can be
regenerated. The kit is generated with Codex headless image generation, which
returns native alpha, so there is no chroma-key step.

1. Generate each asset from its prompt in `art/prompts/<style>/<name>.txt`
   into `art/raw/<style>/<name>/<name>.png` with `scripts/gen-asset.sh
   art/raw/<style>/<name> [ref.png]` (copy the prompt in as `prompt.txt`
   first; the diorama's raws live in `art/raw/diorama`). It runs one Codex
   session with its built-in image tool; several can run side by side.
2. `node scripts/build-kit.mjs <style>` builds `public/kit/<style>` from the raws
   (the style's config is `scripts/kits/<style>.mjs`; `paper` is the diorama).
   Each asset is trimmed to its paper, resized to a fixed source size (so the
   slice insets in `kit.css` stay valid), and given its shadow. Per-asset
   grading (gain per finish) lives in the config (a scene layer's `gain` by
   `layer`, or by `layer-finish` for one finish). A raw buffer read back into
   sharp is described by its geometry only: sharp's own output info says
   `premultiplied: true` after a resize, and passed back in, it would divide
   every soft edge by its alpha again (a pale halo round every cut-out). It also flattens the scene
   layers into `scene-<finish>.webp`. Assets whose raw is missing are
   skipped. A finish may be graded from another's art rather than generated
   on its own: a sheet, tile, mat or tape names the other finish's raw as
   its `src` with a `gain` (Cyanotype's night is its day under a lamp), and
   the scene's `source` ({ night: "day" }) does the same for every layer,
   graded by the scene's `gain`. A scene layer generated with its ground
   behind it (a photogram's silhouettes on their blue) is keyed (`key`): its
   alpha is how far each pixel stands from the ground's colour toward the
   silhouettes'. A tile may take the light at rest (`lit`: hover's catch
   flags, applied to its base, so every state keeps it) and cast its own
   shadows (`shadow`: deeper on a dark finish). A fill may be `soften`ed
   before its grain is taken. `alphaFloor` (per sheet or strip) clears the soft shadow a
   generator paints under an opaque object (alpha below the floor goes to 0)
   before the trim, so the trim and the baked shadow measure the object, not
   its halo. A mat's window is measured as it is built and reported as the
   `--mat-t/r/b/l` to set.
3. `scripts/relight-edge.mjs <in> <out> [--band=] [--shade=] [--lift=]`
   relights a base's outer torn rim for the upper-left key light (a generated
   rim is lit evenly, which reads as an outline). The build runs it on sheets
   and mats before their states are derived.
   States are derived from the normal art, so they register by construction:
   `scripts/derive-state.mjs <normal> <out> hover|focus|pressed [--ring=a:b]
   [--ring-color=hex] [--ring-radius=px] [--catch=] [--catch-width=px] [--sheen=] [--halo=a:b[,c:d]]
   [--crown=] [--groove=depth] [--groove-tint=hex] [--dim=] [--light=hex]`
   (`--dim`: what a pressed face keeps of its brightness; `--light`: the key
   light's colour, warm so brass stays gold; `--halo`: dark keylines beside
   the focus line, one either side where it must hold against a bezel and a
   face; `--crown`: the line laid in as enamel, proud along its middle).
   A tile's long edges are straightened across the span the 9-slice
   stretches, by a smoothed, fractional shift (a whole-pixel shift that
   changes from column to column breaks a bezel's highlights into seams).
   A frame whose rails keep one profile (`mitre` in a sheet's or strip's
   config) first goes through `scripts/mitre.mjs`: each corner is rebuilt
   from its two rails, mirrored at the slice line and cut from the frame's
   outer corner to its inner one (45 degrees where the rails are as deep),
   with a fine joint line. `tile` first makes the rails seamless along their
   length (for `--strip-repeat: round`); `grain` enlarges the rails' texture
   by its factor, keeping each row's mean (a strip prints at about half a
   sheet's scale, which turns a broad mottle into stripes).
   A framed sheet (`frame` in its config) goes through
   `scripts/framed-pane.mjs`: the frame is a band per side plus, where it is
   riveted, a disc per corner rivet (fitted to the rivet's rim); the pane is cleared for the
   page's fill and given the frame's shade and a glint along its lit edges;
   focus lays an enamel strip along the pane's edge under the rivets (or,
   `side: "frame"`, re-dyes the frame's inner edge; a band of the frame's
   own material, a scroll's silk laid in on its washi, takes the frame's
   texture mirrored across the edge, `weave`); a frame with no line to end
   on (a cyanotype's brushed edge) hands over to the page's material over
   `feather` px instead of ending square;
   the light pool and hover sheen (`-light`, `-sheen`) fade in from every
   edge of their square, so no edge of the layer shows on the pane. All of
   it stays straight between the corners and inside the 56px a sheet's
   corners keep unstretched. Its states are finished losslessly and encoded
   once. A tiled material (`fills`) is made seamless from a generated
   square (`mono` keeps only the grain's lightness, on the mean's hue: a
   stone's pits, not a painted grain's stains; `despeckle` clears specks
   lighter than their surround by more than its threshold, a print's
   flecks of bare paper; `veil: <hex>` writes the grain alone, as that
   colour over a clear tile, for the page to lay over a flat tint it
   paints itself, ligne's fittings). A sheet's base can be cut
   to a fixed `height` where `prescale` needs whole px. `grain` (on a sheet,
   a tile, a mat or a tape: `{ fill, size, k, gain }`) lays a fill's grain
   into the asset's art at the size the page prints the fill over the scale
   the asset prints at, so what is cut from or printed on the page's
   material carries its texture (a stone slab's chamfer, an album's flat
   tints); fills are built before the sheets for it. A `cuts` entry is an
   opaque close-up panel (`{ name, src, width }`), scaled and encoded once,
   for the page to crop into a tier cut. An `inks` entry is brushwork
   generated on white (`{ name, src, width | height, tint?, alpha?, page? }`)
   lifted off it by unmultiplying the white (alpha from the darkest channel,
   colour what gives the pixel back over white); `tint` recolours its
   unsaturated ink for a dark ground and leaves a seal's red, and `page`
   writes it to the kit (sumi's opening-scroll painting). The scene's
   `overlays` (`{ [layer]: [{ ink, at, mist? }] }`) composite an inked sprite
   (`${ink}-${finish}`) into a layer after its grade, at `at` in the
   1920x1080 frame, optionally on a soft wash of the ground (`mist`), so an
   inscription registers with the landscape in the flat and 3D scenes
   alike (sumi's corner calligraphy). A frame whose band must not
   stretch its texture along a side is drawn as its ink alone (an `ink`
   band of colour `null` is left clear) and its band painted by the page,
   a flat colour under a `veil` fill (ligne's screen frames and captions).
   Rails that must never read as a printed trim are rebuilt in
   `scripts/mitre.mjs`: `lengthenRails` quilts a rail longer from pieces of
   itself along a minimum-error cut, never reusing a piece nearby (`pool`
   draws from all four rails; `quiet: {share, depth}` cuts only from the
   calmest share of the pieces, each scored by its worst 12px chip within
   `depth` of the outer edge); `tileRails` then makes each rail seamless
   along its length for `round`, its `blend` crossfading the rail's broad
   tone through the overlap while keeping the cut's grain (each side works
   on the art as the sides before it left it, right, bottom, top, left, so
   no side puts back a corner another has handed over; a rail it will
   repeat is begun by `lengthenRails` `splice` with the piece that best
   follows the copy of its far corner, not with its drawn first piece);
   `smoothRails` (before a `mitre`, which cuts the corners from the rails as
   finished)
   evens a rail's broad tone across it, or with `along` medians it along
   its length (a row of stamped stars goes; the mouldings running the
   rail's length stay). `window` (`clearWindow` in framed-pane.mjs) clears
   a frame's whole window from its centre out to the metal (judged by
   saturation, the finish's gain divided out), for frames whose window is
   rounded inside a square cut; its frame is then the art's own metal
   (`frameMask` `cleared`: a rounded corner or an arc reaching past the
   frame's line stays in every state), and the focus band (`fillet`) is
   laid in up to that metal, its depth measured from the metal's real edge
   (round a corner, round an arc), the metal over it. `alignPane` (opt-in per kit)
   puts the pane's sides on the lossy encoder's 8px blocks; a frame whose
   inner edge is a hard line keeps it off (the shift leaves a sliver).
   A surface drawn rather than generated (Ligne Claire) is ruled by
   `scripts/ink.mjs`: nested rounded rectangles (`rings`, one per band of
   ink or colour, then the fill), polygons, and a caption's tail hung from
   its foot (`tail`), each band's weight divided by the scale the page
   prints it at. A band drawn by `hand` gives a little of its width along
   its sides (slow waves, none at the corners), every band inside moving
   with it; a band marked `keep` (a focus band) is reported to the glaze,
   and the frame of a drawn sheet is exactly what is not its field (`drawInk`
   returns the field's coverage; `frameMask` `field`), so the page's fill
   runs right up to a line that gives. An ellipse contour draws a lamp's
   flat highlight (`pins.ink.glint`), toward the upper left, or the upper
   right (`pins.ink.light: "right"`) for a style lit from there. A ring's
   band can restart the rounding (`round`: an ink line round a rounded
   window cut in a square band). A generated head can be ringed (`pins.rim`,
   by name: a white dot across a print's white margin and its blue). A sheet the page prints well below
   its art's size is stored at that size (`prescale`; the style sets
   `--plate-slice` to match), so the browser never resamples its fine lines
   (a rail scaled in one axis and a corner in both filter differently: a
   seam at each slice). `pins.night` (a gain)
   grades the status markers for the night finish (`pin-<name>-night`).
   The scene has two more steps: `paper` (blur a ground layer, premultiplied,
   and lay the fill tile's grain in, so the scene's paper is the sheets'),
   and `photogram` (an object generated modelled printed as a silhouette:
   its cover from its lightness, its colour flat). A finish's `warm` is
   multiplied into the layer's gain, never clamped between, and a scene
   `gain` is one number or one per channel.
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

### Super-resolution (@2x)

The build works in mock pixels (1672x941 sources), so a scene drawn at the
stage's scale on a large or HiDPI screen (`--u` times the device pixel ratio,
about 2 on a 3440px monitor or a 2x laptop) shows each file pixel twice over.
Rather than re-plumb the derive scripts, a last stage makes a 2x sibling of
selected shipped files through the API or an external generator and conforms them to the
1x file, which stays the source of truth.

- **List**: `art/hires.json` names the shipped files (`src` under `public/`)
  and the defaults (model `gpt-image-2.5-sunburst`, `factor` 2, WebP
  `quality` 75). `bun run hires [--only x] [--dry]` makes
  `<name>@2x.webp` beside each; the prompt is `art/prompts/hires/upscale.txt`.
  It calls the imagegen skill's keyring wrapper (`HIRES_PYTHON`,
  `HIRES_IMAGEGEN` override the paths); `--dry` makes no requests.
- **External generation**: `provider` is `"api"` by default, or `"external"`,
  in `defaults` or an asset. `external: { "sizes": ["1254x1254"] }` in either
  place declares allowed output canvases; the asset setting replaces the default.
  These sizes are configuration, not tool guarantees. External factors must be
  integers from 1 to 8 and divide both dimensions of every allowed size. The
  built-in tool probes returned 1580x995 for an 816x514 request, and 1254x1254
  for a square 1024x1024 request; only the observed square size is enabled.
  Source tiles are exactly the allowed canvas divided by the factor, with
  64-source-pixel overlaps. Small/edge tiles are centred without scaling and
  their padding uses the same push-pull colour fill as transparent pixels.
  Thus 42x28 uses one padded request; 644x119 uses two square requests.
  Run `bun run hires --only public/kit/<source>.webp` to emit missing request
  images and `requests.json` in that asset's cache. It reports
  `AWAITING <n> external tiles: <path>` and never invokes the API for that asset.
  `bun run hires --requests [--only <source>]` lists already-emitted pending
  request files, one absolute path per line, without processing or generation.
  Each JSON request gives absolute `requestPath` and `outputPath`, complete
  `prompt`, `allowedSizes`, `factor`, and expected output `width`/`height`.
  View each request, pass only that website-derived image and its prompt to
  built-in image_gen, and copy its output to the exact `outputPath`. Re-run the
  first command to conform, gate and publish. Returned aspects must be within
  1% relative error of the request; other aspects are rejected before resizing.
  Matching outputs are resized to the full expected canvas, then only the known
  padding is removed. Existing alignment, tone, alpha, feathering and gates follow.
  `--remerge` works from cached outputs; external `--force` is rejected (remove
  a cached tile explicitly to request a replacement). After a pass run
  `bun run hires:css --write`; incomplete groups keep their 1x CSS.
  External cache keys include provider, allowed sizes and padding version; API
  digests stay byte-identical. New external locks record `provider: "external"`;
  provider-less legacy locks continue to mean API. The candidate decisions and
  CSS reference locations are in `docs/hires-external-audit.json`.
- **Kit-native ink**: `provider: "resample"` with
  `generator: { "type": "ink", "kit": "ligne", "name": "mat-day" }`
  runs the restricted density mode of `scripts/build-kit.mjs` in private scratch
  directories. The normal kit build and hires use the same ink, grain, state,
  shadow and lossless encoding operations. Geometry is resolved at 1x before
  doubling; ink widths, radii, tails, frame insets, shadow offsets/blur, padding
  and grain sampling scale together. `HIRES_KIT_RAW` optionally names the parent
  raw directory; all raw inputs are read-only. The generator verifies a shared
  1x render against the shipped bytes before generating a twin. Resolved kit
  parameters and the renderer version enter the lock recipe/cache digest.
  Family membership is unchanged; native states generate rather than derive
  residuals. Delivered lossless pixels must pass exact dimensions and Lanczos3
  downsampled premultiplied RGBA MAE <= 1/255. Native geometry replaces block
  matching evidence; canonical equality and state-change gates still apply.
  Grain rendering rejects source rasters smaller than the full seamless tile
  including its quarter-tile margin. `scripts/hires/audit-ink.mjs` re-checks 1x byte identity and 2x MAE.
- **Tiles**: a file larger than the API's output limits (3840px edge, 8.3 MP)
  is cut into overlapping tiles (`scripts/hires/tiles.mjs`) and feathered
  back together.
- **Conforming** (`scripts/hires/merge.mjs`): the model keeps the
  picture but not its exact geometry or tone. Each tile is aligned to the 1x
  by block matching (DoG-luminance ZNCC, alpha-weighted) and a smooth warp,
  iterated up to three times; its low frequencies are then replaced by the
  1x's (`toneMatch`), so only the new fine detail is the model's. Alpha is the
  1x alpha resized. A transparent cut-out is sent with its clear area
  push-pull filled, so the model sees no matte.
- **Gates**: after alignment, the reliable blocks' residual must be at most
  0.6 source px (median) and 1.0 (p90), and the blurred MAE at most
  `--max-mae`; the maximum is reported, not gated (redrawn texture matches
  poorly anywhere). With at least 1% alpha-weighted visible area, fewer than
  max(3, 20% of blocks containing visible paint) reliable blocks rejects as
  "cannot establish alignment"; below 1% the gates are skipped. A rejected
  file is not written; `stats.json` says why. `--accept` overrides conformance
  after review; it never overrides state-change reproduction or registration invariants.
- **Cache**: requests, model tiles, stats and a lossless `master.png` live in
  `art/raw/hires/<path>/<key>/` (gitignored), keyed by the 1x file's bytes,
  factor, model and prompt. A cached tile is never requested again;
  `--remerge` re-runs conforming and encoding from the cache alone. A kit
  rebuild that changes a 1x file changes its key, so its @2x must be made
  again (and `bun run hires` will request it). `--remerge --verify` checks the
  cached assets' gates and byte-compares existing outputs without publishing;
  byte-identical outputs get lock entries too.
- **Provenance**: committed `art/hires.lock.json` records each output's source
  SHA-256, factor, model and full cache key. Every output write updates it.
  CSS only considers a sibling available when its lock matches the current
  1x bytes, factor and model; `--check` and the repo test name every stale or
  unlocked sibling with the fix: `bun run hires --only <source>`.
- **Serving**: each CSS declaration that names a 1x file with a @2x sibling is
  followed, in the same rule, by a one-line twin under
  `@media (min-resolution: 1.5dppx), (min-width: 2200px)` naming the @2x. A
  twin beside its declaration keeps the cascade as authored (a later phone
  override still wins). `bun run hires:css --write` writes and updates the
  twins; `--check` (also a test) fails when one is missing, stale or orphaned.
  A 1080p desktop at 100% keeps the 1x files.
- **Diorama**: the 3D scene reads the same tokens, so it gets the @2x URL
  under the same media query; it decodes each layer at the drawing buffer's
  width rounded up to 640px buckets (1920 or 1280 at least, 3840 at most),
  never past the file's own width (`scene3d/layer-bitmap.ts`). Crossing a bucket
  reloads the art; a pixel-ratio change refreshes the renderer and finish too.
- **A scene ships whole**: manifest entries may share a `group` (Paper's
  layers use `paper/<finish>`). CSS wires the group only when every member
  has a lock-valid @2x; incomplete groups stay at 1x and `--check` reports
  them as info. Manually held files are unnecessary; existing files in
  `art/raw/hires/held/` can stay there.
- **Borders**: CSS discovers `border-image` and `border-image-source` inputs,
  following custom-property aliases across stylesheets and theme/finish scopes.
  Border assets (including assets also used as backgrounds) get
  `image-set(url(...@2x.webp) 2x)` inside the same twin query. Numeric slices,
  widths and outsets stay authored. Ordinary background twins keep raw URLs.
  Reconciliation rejects raw density substitutions, nested image-sets and wrong
  media queries. Existing background twins are unchanged.
- **Registered states**: each interaction-state entry has `family` (an id like
  `paper/sheet-night`) and `reference` (the normal state's `public/...` path).
  The canonical normal is also a member and references itself. Families require
  exact 2x, enforce lossless WebP and compose with existing groups: every member
  must be valid before CSS delivers any member. Every member's lock recipe records
  the sorted member paths and canonical reference; removing or adding a manifest
  member invalidates the entire family and fails CSS `--check`, even after twin
  reconciliation. `--only` includes the complete
  matching family and processes canonical normals first.
  `scripts/hires/states.mjs` compares decoded 1x premultiplied RGBA exactly
  (invisible RGB does not count), expands that difference mask by nearest-neighbour
  2x, and copies canonical RGBA everywhere outside it **after** tone and alpha
  processing. Changed footprints keep the own candidate at full weight. Feather
  weights ramp outside the changed mask and are clipped at its boundary so no
  unchanged footprint is modified. Glyph protection precedes registration.
  Transparent RGB is canonicalised to zero before encoding. Decoded shipped
  outputs must have zero differing premultiplied RGBA pixels outside the mask
  (alpha-zero pixels compare equal regardless of encoder RGB rewrites);
  suppression of more than 10% of intended-change source footprints also rejects, without `--accept`
  overriding either registration invariant. Changed-region premultiplied MAE is
  gated by `--max-mae` in addition to normal conformance gates.

- **State derivation (`residual-v5`)**: pending family states default
  to `stateDerivation: "auto"`; asset settings override family settings. Modes
  remain `"generate"`, `"residual"` (derive), and `"auto"`. Auto measures RMS of
  `delta - Gaussian(sigma=1, delta)` over all four premultiplied channels in the
  exact 1x difference mask. HF <= `stateResidualMaxHf` (default 4/255) derives;
  crisp deltas generate. Transfer requires a lock-valid shipped normal.

  **Noise model and intended support.** Filter the signed premultiplied RGBA
  delta with a sigma-1 Gaussian so uncorrelated speckle cancels. Per-channel
  high-frequency residual MAD, scaled by 1.4826, estimates noise on exact changed
  pixels. Propagate through the filter using `||G||2 / ||I-G||2 =
  0.28228 / 0.87252`; the noise floor is `max(8, 3 * estimated filtered sigma)`
  in byte code units. The fixed floor allows quantisation and weak paint noise;
  it is an empirical tolerance, not proof that all small changes are random.
  Coherent evidence at that floor expands by three source pixels of contributing
  support, intersected with exact differences. Derivation and suppression share
  this intended-change mask. Registration retains the exact difference mask for
  canonical equality. Noise-only footprints copy the canonical exactly.

  **Transfer and gamut.** Opaque intended-change pixels (both source alphas
  >= 0.98) receive `premul(normal@2x) + U(premul(state) - premul(normal))`.
  Translucent intended-change pixels receive `U(premul(state))`; noise-only
  pixels copy the canonical bytes. U is pixel-centred bilinear interpolation
  of signed floating channels, without intermediate byte rounding. Clamp alpha
  to [0, 255], then each premultiplied RGB channel to [0, clamped alpha], then
  unpremultiply and round for encoding (zero RGB at zero encoded alpha).
  Residuals retain canonical glyph protection. Lossless encoding canonicalises
  invisible RGB and checks decoded visible equality outside the exact difference
  mask.

  Downsample the decoded result with Lanczos3. Opaque regional diagnostics
  compare `down(result) - down(normal@2x)` with the source premultiplied delta;
  translucent diagnostics compare the result absolutely with the source state.
  MAE, p99 and sample counts are diagnostic only, with zeros for empty regions;
  resampling is not an identity on crisp antialiased edges.

  Additive-everywhere v6 was considered and rejected: it regressed conformance
  on 14 states by preserving canonical colour error and clamped 15.7% of intended
  pixels. Shipped v5 passes 118/118 states on both gates; the real batch produced
  atlas `sheet-day-hover`, `sheet-night-pressed` and sumi `tile-night-pressed`
  with correct visuals.

  **Gates and inherited alignment.** Generated candidates require whole-image
  and state-scoped conformance: sufficient alignment evidence, median <= 0.6px,
  p90 <= 1px, blurred RGB MAE <= `--max-mae` (14), and registered premultiplied
  state MAE <= that limit. Derived candidates inherit alignment from the locked
  canonical; they do not repeat displacement or reliable-block-count gates.
  `conformance.alignment` records `inherited`, canonical path and reason.
  Colour MAE, exterior equality, suppression and reproduction still apply.
  Colour conformance remains absolute against the source state: preserving an
  accepted canonical's colour error can reject an otherwise accurate additive
  transfer. Alignment inheritance does not waive that colour gate.

  Reproduction selects filtered source channels at
  `max(noiseFloor, min(24, filteredPeak / 2))`. At least 90% of evidence pixels
  must retain the sign and half the magnitude of every selected channel in
  filtered `down(output) - down(normal@2x)`. If no evidence survives, the maximum
  absolute filtered output-minus-canonical delta across the entire image must
  stay inside the same noise floor; an empty denominator is not acceptance.
  Registration also preserves at least 90% of intended source footprints.
  **`--accept` waives conformance only, never reproduction, proportional
  suppression, dimensions or outside-mask invariants.**

  **Fallback.** Auto falls back once to derivation when generation fails any
  conformance/reproduction gate or a provider cannot supply a candidate,
  including unavailable external tiles and mixed provider/candidate failures.
  Filesystem/programming errors are not provider failures. Record residual
  `method`, `fallbackReason`, available generated diagnostics and provider stderr
  tail. Explicit generate retains failure behavior. Derivation must pass its own
  gates; a failed derivation never loops back to generation. Auto tries this
  fallback before applying a conformance acceptance override.

  **Historical locks and request identity.** New publications use
  registered-v3/residual-v5. The explicit `HISTORICAL_DERIVATION_GENERATIONS`
  allowlist also accepts registered-v2/residual-v4, plus pre-routing
  registered variants only for implicit auto without a recorded policy.
  Recompute each generation's recipe with today's resolved settings and match
  its corresponding derivation digest; unknown generations fail. Historical
  acceptance never skips source, settings, family membership, canonical
  dependency, request key, output hash or decoded geometry validation. Canonical
  bytes enter the derivation digest. Paid tile identities retain the original
  registered-v2 namespace and literal non-periodic family sigma=4; actual sigma
  is validated separately. Derivation changes reuse paid tiles, but protection
  and registration are recomputed rather than reusing derived PNGs.

  `--pending` skips each valid member, including accepted outputs and accepted
  fallbacks, until inputs change. A pending sibling cannot re-gate an accepted
  normal; load its shipped output as the reference. Dry runs derive only with a
  valid normal and otherwise defer gates. `scripts/hires/audit-states.mjs` audits
  locked outputs read-only; `--calibrate --baseline <jsonl>` fixes a cohort and
  evaluates candidates in memory. Optional `--cache <directory>` checks the
  current request's generated master; missing evidence stays unknown, never a
  passing output or proof of provider failure. Neither mode mutates locks,
  outputs or cache.

  Own-state alignment and displacement/evidence gates use only the visible
  state-difference mask plus four source pixels of context (S2 plus eight output
  pixels). Evidence grids fit that support's bounding box; discarded whole-sheet
  paint is excluded from those scoped checks. Whole-image conformance, composite fidelity and decoded outside-mask
  equality still gate the final registered image. A failed sibling does not
  block other siblings; a failed canonical normal blocks its dependants.
  Optional `stateCrop: true` requests a difference bounding box plus 16 source
  pixels of margin when that rectangle covers at most 25% of the sheet. The
  request cache includes the normal-source hash and crop geometry. Model tiles
  remain reusable; protection precedes registration. Recompute registration from
  the conformed candidate pixels so refreshed tiles cannot reuse stale derived
  PNG compositions.

- **Settings provenance.** Every publication records `settingsDigest` over
  resolved provider, factor, model, sigma, encode quality/lossless, apiQuality,
  note and external settings (ignored for non-external assets). Defaults and
  overrides resolve before hashing. Validation requires this digest even for
  grandfathered recipes. Source identity and recipe separately cover family,
  reference/membership, crop, derivation policy, periodic halo, generator,
  glyphs and protection; dependencies are recursively validated. `group` affects
  delivery only. Encode quality/lossless and ordinary sigma reuse paid tiles;
  periodic sigma changes request geometry. API quality changes non-high API
  keys, preserving historical high-quality keys; external keys are unaffected.
  Notes affect request prompts, external sizes affect external request keys,
  and protection affects delivery only. The one-time legacy backfill and its
  audited manifest restriction are recorded in
  [hires-settings-migration.md](hires-settings-migration.md).

- **Periodic materials**: `periodic: true` preserves modular source context
  through request padding, alignment, resampling, tone matching and restored
  alpha. It starts with a 32-source-pixel halo (larger when needed by sigma), uses
  a wrapping Gaussian, and crops the exact central 2x rectangle only after
  conforming. External canvas padding repeats the original source period,
  including beyond the halo. Provider fit and tile counts include the halo.
  The decoded WebP is compared with a pixel-centred, premultiplied bilinear
  periodic 1x baseline. Signed wrap jumps and adjacent first-derivative errors
  are measured separately for x/y. Model grain need not match baseline pixels:
  each axis measures the same errors on 15 interior cuts, takes the 90th
  percentile of their RMS/p99, and permits seam excess of 2 RMS / 5 p99 code
  values (0..255). `SEAM_GATE` versions gate calibration separately from pixel
  processing and cache identities. Twenty real-material controls (periodic
  Lanczos 2x + manifest-quality WebP) need up to 1.89 RMS / 5 p99 excess;
  synthetic ramps alone underestimated natural texture and codec tails.
  Tests retain real controls and reject encoded 12/20-code boundary damage.
  Enamel-day's reviewed 3x3 repeat has no obvious boundary seam: decoded error
  jump RMS/p99 1.50/6, derivative 1.74/7; post-flow median/p90 0.25/0.35 source px.
- **Protected glyphs**: API/external entries can supply a non-empty `protect`
  array of `{ x, y, w, h }` rectangles in source pixels. Integer rectangles
  must lie inside the source, with positive sizes. `protectFeather` defaults
  to 6 output pixels and accepts integers 0–64. At exact 2x, after merging,
  tone and alpha restoration, the deterministic premultiplied bilinear source
  replaces each rectangle exactly; a smoothstep feather extends outside it.
  Overlaps use maximum coverage. Pixels beyond the feather stay unchanged.
  Conformance gates inspect the protected master, including its tile regions,
  before encoding. `stats.json` records `protect` and `protectFeather`.
  Protection changes the processing recipe and invalidates the lock, including
  when removed, but never enters the tile cache key or request prompt. Rect
  edits therefore reuse paid tiles.
- **Deterministic maps**: `provider: "resample"` bypasses all model requests and
  produces exact 2x by deterministic premultiplied bilinear interpolation.
  It first refuses detail with HF RMS above **0.6/255**, including in `--dry`;
  `--accept` cannot override this provider constraint. HF is RMS(C - Gaussian
  sigma=1(C)) over composited RGB, measured over black and white and taking
  the worse result. Transparent RGB never counts as detail, but alpha texture
  does. `glyphs: true` is allowed only on resample entries and is recorded in
  the lock: for small seals, glyph fidelity outweighs recovered detail, so it
  explicitly exempts them from the HF refusal. Without it, the refusal is
  unchanged. Generator assets synthesize their own field and are exempt.
  Five cleared
  Ligne/Cyanotype skies and phone grounds use resample alongside the light maps.
  The six analytic `sheet-{day,night}-light` maps instead supply
  `generator: { "type": "sheen", "color": "ffe6a8", "alpha": 0.3, "streak": 0.12 }`
  (settings vary per finish). They run the same pure `sheenImage` field used by
  `scripts/framed-pane.mjs` / `scripts/build-kit.mjs`, directly at 512px.
  Locks name `premultiplied-bilinear-v1` or `framed-pane/sheen-v1` respectively.
  Atlas copy skies use `generator: { "type": "smooth-field", "from":
  "public/kit/atlas/sky-quiet-day@2x.webp", "median": 57, "blur":
  4.5933014354066986, "grain": 1, "seed": 83 }` (matching night input).
  Median and blur use output pixels, scaled from the 1672×941 recipe to
  3840×2160 (25×3840/1672 rounded to odd 57; 2×3840/1672 for blur).
  The pure byte-input generator median-filters, blurs, then adds seeded
  Mulberry32 grain shared across each pixel's RGB channels. Its lock model is
  `smooth-field-v1`; `dependencies` maps `from` to its file SHA-256.
  The input must be an existing lock-valid manifest output. Changed dependency
  bytes invalidate the derived lock in CSS checks and `--pending`; a pending
  upstream regeneration also makes downstream outputs pending. `--only`
  includes transitive dependencies and families; stable topological ordering
  puts dependencies first, and cycles are rejected. No derived output ships
  when its dependency fails.
- **Learned super-resolution**: flat line art that generative tiles restyle
  (the atlas `page-frame` borders, where image_gen bevelled solid gold strokes)
  uses `provider: "resample"` with `generator: { "type": "sr", "model":
  "realesr-animevideov3" }`. `srImage` runs `realesrgan-ncnn-vulkan -s 2` in a
  private temp directory of the asset's keyed cache. Like classic SR pipelines,
  only luma and alpha come from the model, which also boosts chroma along
  strokes (orange streaks on gold). Cb/Cr come from a Lanczos 2x of the source
  wherever that is opaque enough to carry colour (`srLuma`). The output must
  pass the same `kitConformance` gate as native kit art: its 2x downscale must
  match the source. The `edgeStructure` check against the Lanczos 2x also
  applies (no inset), because model texture at Nyquist averages away in a
  downscale.
  The raw model output becomes the cached `sr.png` only once the asset ships
  (`finishAsset` resolves true: gates passed or `--accept`, or byte-identical
  under `--verify`). A rejected output is never reused, and the next run asks
  the model again. `--force` reprocesses the shipped pixels without rerunning
  the model; `--remerge` never runs it and skips an asset with no cached
  output. A lost Vulkan device can exit 0 with some or all tiles empty. The
  gates reject a partial canvas. A uniform canvas (transparent, black, any
  fill) from varied input is refused outright, even under `--accept`.
  `scripts/hires/sr.mjs` pins each model name to the SHA-256 of its 2x weight
  files. `srRecipe` (the pins plus an implementation version) joins the
  processing recipe, as `kitRecipe` does, so new weights or post-processing
  invalidate both cache and lock. Regeneration refuses missing or mismatched
  weights before invoking the binary. The binary and weights are an optional
  local install, needed only to regenerate: lock and CSS checks never touch
  them. `HIRES_SR_BIN`, `HIRES_SR_MODELS` and `HIRES_SR_GPU` override the
  binary path, weights directory and Vulkan device. `sr` entries must be
  standalone, uncropped and non-periodic, without `glyphs`. Locks name
  `real-esrgan-ncnn/<model>`. GPU inference is not bit-reproducible across
  devices; the cache and `outputSha256` pin the shipped pixels instead.
- **New provenance**: the manifest and lock remain version 1. New external
  locks name the real tool, `codex-image_gen`, in `model`; historical external
  entries carrying the API model still validate. An overridden conformance or
  seam gate records `accepted: true`; merely supplying `--accept` on a passing
  asset does not. New processing recipes add `recipeDigest`, `outputSha256`,
  `width` and `height`; derived states also add `derivationDigest`. `lockMatches`
  recomputes recipe/dependency digests from state bytes, normal bytes, canonical
  shipped bytes and the versioned mask/feather/tone/alpha recipe, and validates
  shipped hashes and exact decoded dimensions before CSS makes them available.
  Every API/external output now uses the same decoded hash/geometry validation,
  even without a recipe. A mandatory settings digest covers effective pixel and
  request options; see [the one-time migration](hires-settings-migration.md).
  Dependency validation recursively checks both generator inputs and state
  canonicals. Post-processing settings preserve paid tile identity.
  `bun run hires --dry` is read-only and ends with asset counts per provider,
  estimated uncached API requests (before optional retries), and pending
  external tiles. The inventory also includes protected cyanotype glyph art and deterministic
  Sumi seals; adding manifest entries alone does not publish their twins.

- **Pending assets**: `bun run hires --pending` skips processing assets only when
  their current source and lock match and the shipped output matches its recorded
  hash and exact dimensions. Recipe, family membership and registered-state
  dependencies are validated too. A family is skipped only when every member is
  current; `--only` still expands to the whole family. Legacy locks without output
  proof are accepted when existing lock validation passes and output metadata
  confirms exact factor-times-source dimensions, without rewriting the lock.
  Newly written locks record output proof for every provider.
  Combine with `--dry` to report the skipped count and remaining plan without
  writing files, or with `--retry-rejected <n>` to retry only remaining work.

- **Rejected candidates and budgets**: `--retry-rejected <n>` defaults to zero.
  A gate/decode/provider failure can replace a candidate; missing sources,
  process-launch errors, filesystem failures, stale provenance and publication
  failures do not retry. Every replaced output is retained as
  `tile-N.rejectedK.png` (including malformed returned PNGs). API replacements
  run immediately; external replacements re-emit `requests.json` for the next
  generation pass. `--remerge`/`--verify` never replace or request candidates.
  `--verify` also leaves the lock untouched, even for byte-identical output.
  There are at most n extra API calls per asset per invocation, shared across
  tiles and transport/gate failures. Replacing a failed set requires enough
  budget for the entire set; a multi-tile first generation still costs one
  request per missing tile. External reservations persist in `attempts.json`
  across passes of the same cache key, preventing budget reset on each pass.
  Logs and `stats.json.attempts` record dispatched requests, extra requests,
  per-tile attempt counts and rejection history; pending external requests also
  have stats. Cached API outputs cost zero requests in a remerge's stats.
- **Concurrent lock publication**: writers exclusively create
  `art/hires.lock.json.writing`, then re-read, merge, sort and atomically rename
  a unique pending file while holding that guard. Readers see complete snapshots.
  Writers wait at most 30 seconds; locks are never stolen from slow writers.
  If a writer crashes, confirm it has stopped before removing its `.writing`
  file. Errors release ownership and leave the prior lock intact.
