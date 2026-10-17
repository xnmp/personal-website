# Markdown content refactor handover

Prepared 2026-10-17 before publishing the completed refactor.

## Scope and state

The initial `redesign` branch was already an ancestor of remote `main`.
Local `main` was fast-forwarded to `2a85ca8` before this work. The refactor
moves the existing written content into 15 Markdown files and adds three
concept images for one additional minimal theme. The mockups are proposals;
none of the existing art directions is replaced.

The user specifically wants the new direction to feel like a technical
person's private garden, with strong resistance to generic AI aesthetics.
See [the three options](design-options/README.md); Reading Room is the
recommended direction. Their exact generation prompts are stored alongside
the images.

## Content architecture

- `content/home.md` holds branding, home text, site metadata and featured slugs.
- `content/about.md` holds About metadata, sections, facts, drafts and prose.
- `content/projects/*.md` holds card/search metadata and project-page copy.
- The standalone Tableau showcase and playable game's surrounding text have
  their own Markdown files.
- `src/lib/content.ts` parses YAML and named Markdown blocks without evaluating
  code. `content.server.ts` owns filesystem access. `project-content.ts`
  validates the project metadata; `project.ts` contains the shared domain types.
- `src/data/projects.ts` reads/sorts the files. The root layout passes only
  serializable project entries to client-side search.
- `src/data/site.ts` supplies shared branding to every running head.
- Existing page components retain layout and interactive embeds. Markdown
  renders prose, inline typography and highlighted code. Named helpers preserve
  keyboard legends, OS shortcuts and wrapping rules without raw HTML.
- `next.config.ts` explicitly traces `content/**/*.md` into deployments.

The [authoring guide](content-authoring.md) explains the editing contract.
Restart the dev server after Markdown edits; builds publish them statically.
New routes or new interactive embed types still require components. Existing
page text can be edited without React changes.

## Verification

- Production build succeeded using `NEXT_DIST_DIR=.next-content-build`.
- TypeScript, lint, and whitespace checks passed.
- 38 focused unit tests passed, including 13 content/renderer tests.
- 80 applicable desktop/mobile browser cases passed; 28 cases intentionally
  skip on devices where the tested affordance does not apply.
- The chart timeline checks now await the first rendered score label before
  sampling playback; all four desktop/mobile timeline checks passed.
- A temporary Markdown-only edit was verified in a fresh server: shared
  branding, home text, card title, search result and detail heading changed.
  The original files were restored in `finally`.
- The broader unit run passed 591 tests and timed out on three existing large
  image comparisons. The entire affected file passed 21/21 with a 30-second
  timeout. No artwork or image-processing logic changed.
- Independent adversarial review reported no remaining P1/P2 findings.
- The UI mechanical detector reported no findings for the changed shared
  notebook components.

Google Fonts briefly returned an extensionless Space Grotesk URL that triggers
an existing Next.js 16.2.3 font-loader bug. An isolated clean build and the final
production build succeeded with the existing font configuration. No font
configuration was changed for this task.

## Workspace notes

`nanobanana-output/` was already untracked before the task and was left alone.
Generated Next.js additions to `tsconfig.json` for isolated verification
directories were removed. Temporary scripts, logs and before/after captures
are under `/tmp`; permanent authoring documentation and mockups are committed.
