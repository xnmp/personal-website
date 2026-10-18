# Editing the website

All authored page copy is in `content/`. The Markdown files are the source of
truth. They are read during the Next.js build, so a deployment includes your
edits without a CMS, database or browser fetch.

## Find the file

| File | Controls |
| --- | --- |
| `content/home.md` | Project index at `/projects`, branding, site metadata, flagship/featured projects, shelf labels |
| `content/about.md` | Landing page at `/` (also `/about`), biography, facts, portrait, draft sections |
| `content/projects/<slug>.md` | Project card/search data, metadata, headings, paragraphs, captions, image descriptions, feature descriptions and measurements |
| `content/tableau-frog.md` | Standalone Tableau Frog showcase, feature ledger, measurements and code examples |
| `content/zheng-shang-you-play.md` | Game instructions and surrounding copy |

Page structure, art, navigation mechanics, chart datasets and interactive demos
remain in code. A new route or a new kind of interactive section still needs a
component. Editing the existing content does not.

## Frontmatter

The YAML between the first two `---` lines holds structured information. For
example, a project's `title`, `heading`, `tags`, `stats`, `status` and `repo`
control its cards and command-index entry. `metadata` controls its browser/search
title and description. `order` determines its place in the project list.
The optional `website` is a public HTTPS URL; Tauri Explorer's project page links
to it beside GitHub, with the editable label in its `website` Markdown block.

Margin Index uses the optional project `summary` for its short description
(falling back to `heading`), and the shared `tags` for the stack line. Its
opening copy is in the `margin-intro` and `margin-description` blocks in
`content/home.md`; `location` controls the navigation rail. The flagship may
include an optional `preview` with `src`, `alt`, `width` and `height`. A
`{theme}` placeholder in `src` follows the visitor’s app colour theme; without
a preview the directory remains text-only.

```yaml
title: Scrivo
status: producing
tags:
  - rust
  - markdown
stats:
  - 340ms vs Typora 965ms
metadata:
  title: 'Scrivo: a markdown editor'
  description: An editor that keeps your formatting intact.
```

Quote a value containing `: `, `#`, or other YAML punctuation. Status values are
`alpha`, `producing`, `paused`, and `complete`; shelf values are `tools` and
`games`. Keep the filename, `slug`, and `href` consistent. Invalid project
metadata stops the build and names the field.

`content/home.md` chooses the `flagship` and the `featured` slugs. Entries must
exist and occur only once across those lists. Other projects appear on their
assigned shelves.

## Markdown blocks

Comments name each existing content slot:

```markdown
<!-- block: headline -->
A markdown reader that opens immediately.

<!-- block: what-it-is -->
What it is
```

Edit the text between comments. Keep the comment names: the page uses them to
put the text in the correct place. Missing or duplicate names stop the build.
The names remain stable even when you rewrite their text.

Paragraph blocks support ordinary Markdown: paragraphs separated by blank
lines, **bold**, *italics*, `inline code`, links, lists, tables and fenced code.
Headings, figure/question/feature labels, feature descriptions and captions occupy inline slots; keep
those to inline text and formatting. Raw HTML and executable MDX are not used.
Metadata, image descriptions and screenshot window titles are plain text.

Some existing copy includes small helpers to preserve its typesetting:

```markdown
:kbd[Ctrl+P]
:os[Ctrl+P for your filesystem.]
:span[words kept together]{class="nowrap"}
:link[More about me]{href="/about" class="text-action"}
```

Keep these wrappers while editing their words. `:os` adapts shortcuts to the
visitor's operating system. `:break[]` is a wrapping opportunity inside a path.
Named `variant` treatments are defined in code, rather than CSS embedded in
content. Most paragraphs need none of these helpers.

The Tauri Explorer file uses `{{version}}`, `{{email}}`, and similar references
to reuse its frontmatter values. Change the frontmatter once; its prose and
download controls use the new value. Its `reflexes`, `shots`, `proof`, and `ledger`
frontmatter arrays hold the shortcut descriptions, screenshot captions and
technical measurements. A proof item with `includeStats: true` inserts the card's
current counts. `stats` separately holds the short card readout.

## About and drafts

The About file's `intro` and section `body` values name Markdown blocks below
the frontmatter. To add a section, add its metadata entry and a uniquely named
body block. `draft: true` displays a labelled draft in development and omits it
from production. Remove the flag when ready.

An optional portrait uses a public asset:

```yaml
portrait:
  src: /portrait.webp
  alt: A description of the photograph
```

## Preview and deploy

```bash
bun run dev
```

Content is loaded by server components on each render, deduplicated within a
request. Reload the page after saving Markdown to refresh both copy and the
shared project index.

`bun run dev` opens the actual pages with editable text, local saving and a
bottom-left Deploy button at http://127.0.0.1:3210. For a plain site preview,
run `bun run dev:site` instead. See the [content editor guide](content-studio.md).

Before publishing:

```bash
bun run test
bun run build
git add content/
git commit -m "Update website content"
git push origin main
```

Run these on `main`, or use your normal pull request workflow. Vercel rebuilds
the site on a push to `main`. The build includes every content file in its
deployment trace. This is a static publishing workflow: saved edits become
public on deployment. The local editor writes the same Markdown sources; the
published website has no enabled editing endpoints.
