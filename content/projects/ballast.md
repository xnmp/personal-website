---
slug: ballast
glyph: 心
title: Ballast
summary: "My mood diary, with the entries kept as Markdown files."
heading: "A diary I can keep as files"
href: /p/ballast
tags:
  - svelte 5
  - tauri 2
  - kotlin
  - local-first
index: "My mood diary · Markdown files · desktop and Android"
stats:
  - "Desktop + Android"
  - "Markdown entries"
  - "Syncthing"
art: /screens/ballast.png
status: producing
shelf: tools
tone: olive
metadata:
  title: "Ballast · chong"
  description: "My Daylio-like mood diary, the rewrite that made it smaller, and why its entries live in a folder of Markdown files."
order: 3
---

<!-- block: all-projects -->
← all projects

<!-- block: headline -->
A diary I can keep as files

<!-- block: introduction -->
I used Daylio, and I like that basic routine: pick a mood, tick a few activities, write something if I feel like it. Ballast keeps that shape, with the entries stored as Markdown files I can read outside the app.

The folder can be searched with grep and synced with Syncthing. There's a desktop app and an Android build. The source is private.

<!-- block: svelte-5 -->
svelte 5

<!-- block: tauri-2 -->
tauri 2

<!-- block: kotlin -->
kotlin

<!-- block: local-first -->
local-first

<!-- block: what-it-is -->
What it is

<!-- block: daylio-s-loop-minus-the-account -->
The bit I wanted to keep from Daylio

<!-- block: body-the-bit-i-wanted-to-keep-from-daylio -->
I kept Daylio's five mood levels: rad, good, meh, bad and awful. The activities are mine to define. Beyond that, an entry is a time and whatever I want to write.

I tend to log a morning and an evening, so several entries on the same day are normal. The diary and calendar are just two ways into those entries.

An earlier version tried to do much more. The rewrite cut it back to the diary. I'm trying to let actual use decide what gets added.

<!-- block: the-data -->
The data

<!-- block: one-file-per-entry -->
What an entry looks like on disk

<!-- block: layout-from-readme -->
An example of the file format, with placeholder text rather than a real diary entry.

<!-- block: figure-fig-1-ballastdata -->
FIG. 1 · BallastData/

<!-- block: caption-the-filename-is-the-authority-on-when-an-entry-hap -->
The filename carries the entry's time, so listing a folder is enough to build the month index.

<!-- block: code-ballastdata-entries-2026-07-27-1005-md-activities-jso -->
```
BallastData/
  entries/2026-07-27_1005.md
  activities.json    # [{ id, name, icon, archived? }]
  briefs/            # optional, written by something else
  .ballast/          # recovery journals, normally empty

--- entries/2026-07-27_1005.md ---
---
id: "entry-1fdd93a0-…"
at: "2026-07-27T10:05"
mood: "good"
activities:
  - "walk"
  - "reading"
---
Placeholder note text, kept verbatim.
```

<!-- block: moods-are-stored-by-name-so-a-grep-for-mood-awful-works -->
Moods are stored by name, which is easy to search for. Activities have stable IDs, so renaming one doesn't require rewriting old entries.

<!-- block: technical-choices -->
Living with plain files

<!-- block: treating-the-files-as-something-other-tools-will-edit -->
The app isn't the only thing touching them

<!-- block: body-the-app-isnt-the-only-thing-touching-them -->
### A broken entry

If an entry's frontmatter won't parse, it stays readable as text and is kept unchanged. Hand-editing a file shouldn't make the app destroy it.

### The old diary

The Daylio importer writes into a new folder and verifies the result before making it visible. It refuses to import over an existing diary.

### Desktop and Android

The diary rules are shared. Desktop files, Android's storage picker and in-memory test storage sit behind the same interface.

### The native bits

A few Rust and Kotlin plugins handle the Android data folder, notifications and app updates.

### Briefs from elsewhere

An external process can leave a Markdown brief in the synced folder. The Android app checks for it and can post a notification.

### Notes for future fixes

The More screen can turn a bug or feature idea into a GitHub issue, so I can record it from the app.

Syncthing means a file can arrive while the app is open. New entries use exclusive create, and edits check the revision before saving. That helps, though it doesn't make concurrent edits impossible to lose.

<!-- block: verified-numbers -->
The rewrite

<!-- block: what-the-last-release-recorded -->
Making it smaller

<!-- block: from-docs-handover-2026-10-02-release -->
Notes from the rewrite and the October 2026 release.

<!-- block: body-making-it-smaller -->
- The first version was a much larger personal research instrument.
- The rewrite kept the entry, calendar and activity management, and removed the old experiments, protocols and job board.
- Version 0.3.5 reached Google Play's internal testing track.
- There is also a background-idle check. A diary sitting in the background has very little reason to keep the phone busy.

The old version is still on the `pre-rewrite` tag. The current repository calls the app Afterglow; the Ballast data-folder name is kept for compatibility.

<!-- block: rough-edges -->
Unfinished bits

<!-- block: the-rewrite-that-cut-scope-and-what-is-unsettled -->
What I might come back to

<!-- block: body-what-i-might-come-back-to -->
For now, sync belongs to Syncthing. Stats, goals and streaks were left out of the rewrite. The plan is to add things when I actually miss them.

- Edits are checked against a revision just before they are written, but the storage providers have no atomic compare-and-swap. A writer that lands in the gap after that check can still win.
- The last release reached Play’s internal testing track. The handover says installation on a physical phone was not observed during that session.
- The source is private, so this page is a description of my setup rather than something someone else can reproduce from a public checkout.

### Open question

I haven't decided when I'd bring statistics back. I'd rather use the diary for a while and see which questions I keep wanting to ask it.

<!-- block: materialssvelte-5-tauri-2-rust-kotlin -->
Materials**Svelte 5, Tauri 2, Rust, Kotlin**

<!-- block: vintagejuly-2026-to-now -->
Vintage**July 2026 to now**

<!-- block: statusactive-v0 -->
Status**Active, v0.3.5**

<!-- block: sourceprivate -->
Source**private**
