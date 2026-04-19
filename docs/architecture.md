# Architecture

Single-author passions site. Each project gets one index card and one detail page — a *lab notebook* framing. No CMS, no database, no auth.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router | File-based routing, RSC by default, static export per page |
| Runtime | React 19 | Matches Next.js 16 |
| Bundler | Turbopack | Default in Next 16 dev + build |
| Styling | Global CSS + Tailwind 4 tokens | One `globals.css`, variable-driven; no CSS-in-JS |
| Fonts | `next/font/google` — Cardo, Crimson Pro, JetBrains Mono | Self-hosted, no FOUT, display serif + body serif + mono |
| Images | Generated via Gemini `gemini-3-pro-image-preview`, resized with `sharp` | See `scripts/resize.mjs` |
| Hosting | Vercel (auto-deploy on push to `main`) | See `docs/deploy-chong-md.md` |
| Package manager | `bun` | Faster installs; lockfile is `bun.lock` |

## Routes

```
/                    src/app/page.tsx              — notebook index, one entry card per project
/p/tauri-explorer    src/app/p/tauri-explorer/…    — detail page for Entry I
```

New project entry = new `src/app/p/<slug>/page.tsx` + a new `<Entry>` block on the index.

## Component layers

### 1. Notebook primitives — `src/components/notebook/`

Pure, server-renderable presentational components. No state, no effects. Each wraps a small piece of layout with the notebook aesthetic baked in. Consumed by both the index and detail pages.

| Component | Purpose |
|---|---|
| `RunningHead` | Top-of-page brand + filing metadata strip |
| `Divider` | Ornamental section break (`◆ Entry I ◆`) |
| `Entry` | Two-column index card (left: pitch, right: plate + features) |
| `EntryLabel` / `EntryHeading` | Card number/title + linkable heading |
| `Tags` / `Tag` | Uppercase monospace tag row |
| `OpenQuestion` | Pull-quote card for unsolved design questions |
| `MarginNote` | Parchment side-note |
| `Plate` | Figure card with `FIG. I —` label and caption |
| `Features` / `Feature` | Grid of short labelled blurbs |
| `Folio` | Page-number footer (`— 1 —`) |
| `PageBackground` | Fixed-position watercolor backdrop, takes `src` prop |

Barrel-exported from `src/components/notebook/index.ts`. Pages import from `@/components/notebook`.

### 2. Project demos — `src/components/demos/`

Interactive or elaborately-composed diagrams tied to a specific entry. Today: `TauriSchematic` (static SVG dual-pane mock). New demos land here. Promote to a Client Component (`"use client"`) when they need state/effects.

### 3. Pages

Compose primitives + demos. No business logic. Hand-written copy.

## Styling strategy

One file: `src/app/globals.css`. Organised by concern with banner comments:

```
:root               — design tokens (colors, fonts, spacing)
@theme inline       — Tailwind 4 token export
body / typography   — base styles
.running-head, .hero, .entry, .plate, .features, .feat, .folio
.entry-link, .read-more, .back-link, .detail-hero, .section, .colophon
.page-bg            — watercolor backdrop
code                — inline mono chip
```

No component-scoped CSS. No CSS modules. The notebook look is a shared visual language — keeping it in one file makes it easy to tune globally.

### Palette

Solarized-light adjacent. Tokens in `:root`:

- `--paper` `#fdf6e3` — parchment base
- `--ink` `#073642` — body text
- `--ink-soft` `#586e75` — secondary text
- `--rust` `#cb4b16`, `--amber` `#b58900`, `--cyan` `#2aa198`, `--olive` `#859900` — accents

### Watercolor backgrounds

Each page renders `<PageBackground src="/bg/…jpg" />` at the top of its tree. The component is a fixed-position `<div>` with `background-size: cover`, `opacity: 0.55`, `mix-blend-mode: multiply` — so the cream paper underneath shows through and tints the watercolor. Swap the image per page by passing a different `src`.

## Image pipeline

Background art is generated offline (not at request time).

1. Prompt → Gemini `gemini-3-pro-image-preview` via `curl` (see session notes; the nanobanana Gemini CLI extension has an auth bug — direct API works)
2. Raw output → `/tmp/gen-images/…jpg`
3. Resize/crop → `node scripts/resize.mjs <in> <out> <w> <h> cover`
4. Ship into `public/bg/` or `src/app/` (for Next.js metadata conventions)

Next.js file conventions that auto-generate `<head>` tags:

- `src/app/icon.png` → `<link rel="icon">`
- `src/app/apple-icon.png` → `<link rel="apple-touch-icon">`
- `src/app/opengraph-image.png` + `.alt.txt` → `og:image` + alt
- `src/app/twitter-image.png` + `.alt.txt` → `twitter:image` + alt

## Adding a new project entry

1. Create `src/app/p/<slug>/page.tsx` — copy `tauri-explorer/page.tsx` as a template. Export `metadata`.
2. Add a new `<Entry>` block to `src/app/page.tsx` with its own `EntryLabel`, `EntryHeading`, `Tags`, `Plate`, `Features`.
3. If the entry needs a custom diagram, add a new component in `src/components/demos/`.
4. Generate a per-page watercolor if desired, drop into `public/bg/`, pass to `<PageBackground>`.
5. Bump `metadata.title` and `metadata.description` for the detail page.

## Non-goals (for now)

- No MDX — hand-authored TSX gives full component access without the setup. Revisit if we end up with >5 entries or long-form writing.
- No CMS / Sanity / Contentlayer — single author, git is the workflow.
- No backend — everything static. Contact is a `mailto:`.
- No analytics — to be added later, probably Plausible.
- No tests — the site is static content. Add snapshot or Playwright tests if an interactive demo grows non-trivial.
