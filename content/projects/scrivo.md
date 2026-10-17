---
slug: scrivo
glyph: 書
title: Scrivo
heading: A markdown reader that paints first and an editor that never reformats.
href: /p/scrivo
repo: 'https://github.com/xnmp/scrivo'
tags:
  - rust
  - tauri 2
  - codemirror 6
  - markdown
index: Typora-style editor · Rust-rendered reading view · benchmarked against Typora
stats:
  - 340ms vs Typora 965ms
  - 12/12 paired runs
  - 106 test files
art: /screens/scrivo.png
status: producing
shelf: tools
tone: cyan
metadata:
  title: 'Scrivo: a markdown reader that paints first'
  description: >-
    A Typora-style markdown reader and editor on Tauri 2. Rust renders the
    reading view while the window opens, and the editor only decorates your
    text, so it never reformats the file.
order: 2
---
<!-- block: all-projects -->
← all projects

<!-- block: github -->
GitHub ↗

<!-- block: headline -->
A markdown reader that paints first and an editor that never reformats.

<!-- block: i-wanted-typora-s-way-of-writing-without-waiting-for-it-to -->
I wanted Typora’s way of writing without waiting for it to start. Scrivo opens a file in a reading view that Rust has already rendered, and Ctrl+E turns the same window into a live-preview editor.

<!-- block: the-editor-is-built-so-it-cannot-rewrite-your-file -->
The editor is built so it cannot rewrite your file. It puts decorations over the text you typed and never converts it to a document model and back.

<!-- block: rust -->
rust

<!-- block: tauri-2 -->
tauri 2

<!-- block: codemirror-6 -->
codemirror 6

<!-- block: what-it-is -->
What it is

<!-- block: two-surfaces-over-one-text-buffer -->
Two surfaces over one text buffer

<!-- block: from-docs-architecture -->
From docs/ARCHITECTURE.md in the repo.

<!-- block: run-scrivo-notes -->
Run `scrivo notes.md` and you get the reading view. The Rust crate `scrivo-render` (pulldown-cmark plus math-core) turns the file into HTML and MathML in parallel with the window being created. Code highlighting loads after the document is on screen.

<!-- block: press-ctrl-e-and-the-editor-takes-over -->
Press Ctrl+E and the editor takes over. It is CodeMirror 6 with a live preview: the syntax melts away as you write, and tables, math and images render in place. Both surfaces carry positions across as 1-based source lines, so you land where you were.

<!-- block: it-also-has-tabs-a-command-palette-a-contents-sidebar-find -->
It also has tabs, a command palette, a Contents sidebar, find, folding, an Obsidian-theme importer, and autosave two seconds after you stop typing.

<!-- block: technical-choices -->
Technical choices

<!-- block: why-the-editor-cannot-reformat-your-file -->
Why the editor cannot reformat your file

<!-- block: editors-built-on-prosemirror-milkdown-tiptap-parse-markdow -->
Editors built on ProseMirror (Milkdown, Tiptap) parse markdown into a document tree and serialise it back on save. That round trip is where list markers change, escapes appear and tables get rewritten. Obsidian, Zettlr and SilverBullet use CodeMirror live preview for this reason, and so does Scrivo.

<!-- block: the-editor-draws-decorations-over-the-buffer -->
The editor draws decorations over the buffer. Nothing serialises a model back to markdown. Table cell edits are ordinary undoable transactions on the source.

<!-- block: label-text-is-the-source-of-truth -->
Text is the source of truth

<!-- block: src-domain-text-format -->
`src/domain/text-format.ts` records the BOM and the dominant line ending on load and restores them on save. Invalid UTF-8 is refused instead of being decoded lossily and written back.

<!-- block: label-bom-and-line-endings-kept -->
BOM and line endings kept

<!-- block: the-renderer-builds-html-from-parse-events -->
The renderer builds HTML from parse events. No markup from the document passes through, so the page can insert the result as HTML.

<!-- block: label-safe-by-construction -->
Safe by construction

<!-- block: dirty-text-goes-to-a-private-recovery-file-in-app-data-wri -->
Dirty text goes to a private recovery file in app data, written atomically and throttled to 500 ms. On the next launch it offers Restore or Discard, and restoring never overwrites a newer file on disk.

<!-- block: label-crash-recovery-copy -->
Crash recovery copy

<!-- block: src-domain-is-pure-typescript-with-no-dom-no-codemirror-vi -->
`src/domain` is pure TypeScript with no DOM, no CodeMirror view and no Tauri. The app talks to a `Platform` port, and tests use an in-memory adapter.

<!-- block: label-ports-and-adapters -->
Ports and adapters

<!-- block: the-renderer-reports-safe-block-boundaries -->
The renderer reports safe block boundaries. The viewer parses the first HTML chunk before paint and inserts the rest in idle slices.

<!-- block: label-chunked-first-paint -->
Chunked first paint

<!-- block: verified-numbers -->
Verified numbers

<!-- block: startup-against-real-typora -->
Startup against real Typora

<!-- block: source-readme -->
Source: `README.md` and :code[bench/:break[]results/:break[]verified-{medium,large}-chunked.txt] in the repo. One Linux machine, so read these as relative.

<!-- block: bench-ab -->
`bench/ab.mjs` launches Typora and Scrivo in turns inside the same 1280×720 headless compositor, and rotates which one goes first each round. Times start at process launch and include the window system and webview. “Content” is the first screenshot that matches a reference frame I reviewed by hand, to within 0.3% of image tiles. A run that shows a loading screen, an error or no window, or hits the 20 second cap, counts as invalid.

<!-- block: measured-on-2026-09-27-with-release-commit-129cd13-typora -->
Measured on 2026-09-27 with release commit `129cd13`, Typora 1.14.9-1, and 12 valid rounds per file. Medians in milliseconds, lower is better:

<!-- block: figure-fig-1-time-to-verified-first-viewport -->
FIG. 1 · time to verified first viewport

<!-- block: caption-content-median-paired-rounds-scrivo-was-faster-in -->
Content median, paired rounds. Scrivo was faster in 12 of 12 pairs on both files; the paired-median gaps are 626 ms (medium) and 1,682 ms (large).

<!-- block: code-file-app-window-content-medium-8-8-kb-typora-411-965 -->
```
file              app      window   content
medium  8.8 KB    Typora      411       965
                  Scrivo      211       340
large   443 KB    Typora      433     2,016
                  Scrivo      211       356
```

<!-- block: scrivo-s-time-barely-moves-with-file-size-because-the-firs -->
Scrivo’s time barely moves with file size because the first chunk is all it needs before paint. “Complete” here means the viewport stopped changing, not that all 443 KB has been inserted. A native e2e test separately checks that the tail of the large file renders and can be scrolled to.

<!-- block: the-repo-has-58-commits-between-2026-09-26-and-2026-10-05 -->
The repo has 58 commits between 2026-09-26 and 2026-10-05 and 106 test files: 17 domain, 39 browser e2e, 31 native e2e, the rest beside the app code. The Rust crates hold 99 `#[test]` functions.

<!-- block: frames -->
Frames

<!-- block: the-two-reference-frames -->
The two reference frames

<!-- block: these-are-the-files-in-bench-references-that-the-benchmark -->
These are the files in bench/references that the benchmark matches against.

<!-- block: figure-fig-2-scrivo-medium-md-1280-720 -->
FIG. 2 · Scrivo, medium.md, 1280×720

<!-- block: caption-reading-view-in-the-default-light-appearance-the-s -->
Reading view in the default light appearance. The status line says Reading · Ctrl+E to edit.

<!-- block: alt-scrivo-reading-view-of-the-benchmark-medium-document-a -->
Scrivo reading view of the benchmark medium document: a heading, a paragraph with inline styles, a blockquote and nested lists.

<!-- block: figure-fig-3-typora-medium-md-1280-705-cropped -->
FIG. 3 · Typora, medium.md, 1280×705 (cropped)

<!-- block: caption-same-file-in-typora-with-a-dark-theme-the-themes-d -->
Same file in Typora with a dark theme. The themes differ, so compare the content and timing, not the colours.

<!-- block: alt-typora-showing-the-same-benchmark-document-in-a-dark-t -->
Typora showing the same benchmark document in a dark theme with wider paragraph spacing.

<!-- block: rough-edges -->
Rough edges

<!-- block: what-did-not-pan-out-and-what-i-have-not-checked -->
What did not pan out, and what I have not checked

<!-- block: several-startup-experiments-came-back-as-noise-and-the-rea -->
Several startup experiments came back as noise, and the README keeps them. Inserting up to two HTML chunks per idle slice made the full large document land 419 ms sooner, but the first-viewport change was −3 ms on medium and +5 ms on large, which I read as nothing. Parsing the first chunk before paint saved 20 ms on large (10 of 12 pairs). The complete-preview path was 38 ms faster on a 5 MB synthetic file and 6 to 7 ms slower on medium.

<!-- block: mixed-line-endings-get-normalised-to-the-dominant-one-on-s -->
Mixed line endings get normalised to the dominant one on save. The UI says so, but it is a rewrite, and the editor is only lossless for files with one style.

<!-- block: recovery-writes-are-asynchronous -->
Recovery writes are asynchronous. A process killed before the write finishes can lose the last few keystrokes.

<!-- block: obsidian-theme-import-covers-css-variables-only -->
Obsidian theme import covers CSS variables only. Layouts, plugins and companion assets are not supported.

<!-- block: i-have-only-benchmarked-on-linux-with-typora-1 -->
I have only benchmarked on Linux, with Typora 1.14.9-1 running headless in the same compositor. Numbers on macOS and Windows are unmeasured.

<!-- block: typora-does-more-than-scrivo-does-so-part-of-that-gap-may -->
Typora does more than Scrivo does, so part of that gap may be scope and not engineering. I do not have a way to separate “Scrivo is well built” from “Scrivo does less”, and the benchmark does not claim to.

<!-- block: materialsrust-tauri-2-typescript-codemirror-6 -->
Materials**Rust, Tauri 2, TypeScript, CodeMirror 6**

<!-- block: vintagesept-2026-to-now -->
Vintage**Sept 2026 to now**

<!-- block: statusactive -->
Status**Active**

<!-- block: source-github-xnmp-scrivo-https-github -->
Source **[github/xnmp/scrivo](https://github.com/xnmp/scrivo)**
