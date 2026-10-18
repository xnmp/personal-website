---
slug: scrivo
glyph: 書
title: Scrivo
summary: "My take on a Markdown editor, starting with the bits I liked in Typora."
heading: "A Markdown editor for my notes"
href: /p/scrivo
repo: 'https://github.com/xnmp/scrivo'
tags:
  - rust
  - tauri 2
  - codemirror 6
  - markdown
index: "My Markdown reader and editor · Typora-style live preview"
stats:
  - "Reading + editing"
  - "Plain Markdown"
  - "Desktop"
art: /screens/scrivo.png
status: producing
shelf: tools
tone: cyan
metadata:
  title: "Scrivo · chong"
  description: "Building a Markdown editor around fast opening, live preview and keeping the source text intact."
order: 2
---

<!-- block: all-projects -->
← all projects

<!-- block: github -->
GitHub ↗

<!-- block: headline -->
A Markdown editor for my notes

<!-- block: introduction -->
I liked Typora's way of writing Markdown, where the formatting appears as you type. I wanted something along those lines that opened faster. That became Scrivo: open a note to read it, then press Ctrl+E when I want to edit.

The other thing I care about is the file itself. If I change a sentence, I want that sentence changed, without the editor also tidying up my list markers or reformatting a table.

<!-- block: rust -->
rust

<!-- block: tauri-2 -->
tauri 2

<!-- block: codemirror-6 -->
codemirror 6

<!-- block: what-it-is -->
Opening a note

<!-- block: two-surfaces-over-one-text-buffer -->
Reading first, editing when I need to

<!-- block: from-docs-architecture -->
A few notes on how the two views fit together.

<!-- block: body-reading-first-editing-when-i-need-to -->
With `scrivo notes.md`, Rust renders the reading view while the window opens. Code highlighting can arrive afterwards; the first job is getting the note on screen.

Ctrl+E switches to a CodeMirror editor with live preview. Tables, maths and images render in place. The reading and editing views carry the source position across, so switching doesn't send me back to the top.

There are tabs, find, a contents sidebar and a command palette. Named files autosave after I stop typing for a couple of seconds.

<!-- block: technical-choices -->
The source file

<!-- block: why-the-editor-cannot-reformat-your-file -->
Keeping the Markdown I wrote

<!-- block: body-keeping-the-markdown-i-wrote -->
Some rich-text editors parse Markdown into a document tree, then generate Markdown again when saving. That can change perfectly valid formatting. Scrivo uses CodeMirror decorations over the source text instead, in the same general family of approaches as Obsidian.

### Editing the source

The preview sits over the text buffer. Editing a table cell still changes ordinary Markdown and participates in undo.

### File details

The editor keeps the UTF-8 BOM and dominant line ending style. It refuses invalid UTF-8 rather than silently replacing bytes.

### Rendering

The reading view builds its HTML from Markdown parse events, rather than passing through the document's own HTML.

### Recovery

Unsaved text gets a separate recovery copy. After a crash I can restore or discard it, without automatically replacing a newer file on disk.

### Keeping it testable

The text and file rules live outside the UI. That lets me check them without opening the desktop app.

### Long documents

The reader inserts the first chunk before paint, then adds the rest in idle slices. A long note shouldn't have to finish rendering before I can see its beginning.

<!-- block: verified-numbers -->
The original annoyance

<!-- block: startup-against-real-typora -->
Did it actually open faster?

<!-- block: source-readme -->
A Linux comparison from September 2026. The scripts and results are in the repository.

<!-- block: body-did-it-actually-open-faster -->
I compared the two apps by launching them in turns and checking screenshots for actual document content. Timing when a window appears would count a blank window as success, which isn't the delay I was trying to fix.

These are medians from 12 paired runs per file, using Scrivo commit `129cd13` and Typora 1.14.9-1 on 27 September 2026. Times are milliseconds.

Scrivo's first-viewport time changes very little between these files because the rest of the document arrives later. This measures the beginning being readable, not the whole file being rendered.

This was useful for checking the specific problem I started with. It isn't a comparison of everything the two editors can do.

<!-- block: figure-fig-1-time-to-verified-first-viewport -->
FIG. 1 · time to verified first viewport

<!-- block: caption-content-median-paired-rounds-scrivo-was-faster-in -->
The content column is the one I was interested in: when there was something to read.

<!-- block: code-file-app-window-content-medium-8-8-kb-typora-411-965 -->
```
file              app      window   content
medium  8.8 KB    Typora      411       965
                  Scrivo      211       340
large   443 KB    Typora      433     2,016
                  Scrivo      211       356
```

<!-- block: frames -->
The comparison

<!-- block: the-two-reference-frames -->
What the timing script looked for

<!-- block: these-are-the-files-in-bench-references-that-the-benchmark -->
These reference captures are what counted as readable content in the startup runs.

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
Still working on it

<!-- block: what-did-not-pan-out-and-what-i-have-not-checked -->
The less tidy bits

<!-- block: body-the-less-tidy-bits -->
Quite a few startup tweaks made no meaningful difference. Inserting more chunks per idle slice helped the full document finish sooner, but barely changed when the first viewport appeared. It was a useful distinction to measure.

- Mixed line endings get normalised to the dominant one on save. The UI says so, but it is a rewrite, and the editor is only lossless for files with one style.
- Recovery writes are asynchronous. A process killed before the write finishes can lose the last few keystrokes.
- Obsidian theme import covers CSS variables only. Layouts, plugins and companion assets are not supported.
- I have only benchmarked on Linux, with Typora 1.14.9-1 running headless in the same compositor. Numbers on macOS and Windows are unmeasured.

### Open question

Typora does more than Scrivo, and I only measured this on Linux. I'm happy that my notes open faster in that setup; I wouldn't turn those runs into a general claim about the better editor.

<!-- block: materialsrust-tauri-2-typescript-codemirror-6 -->
Materials**Rust, Tauri 2, TypeScript, CodeMirror 6**

<!-- block: vintagesept-2026-to-now -->
Vintage**Sept 2026 to now**

<!-- block: statusactive -->
Status**Active**

<!-- block: source-github-xnmp-scrivo-https-github -->
Source **[github/xnmp/scrivo](https://github.com/xnmp/scrivo)**
