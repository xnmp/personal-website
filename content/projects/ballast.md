---
slug: ballast
glyph: 心
title: Ballast
summary: A mood diary made of markdown files.
heading: A mood diary that keeps every entry as a plain markdown file.
href: /p/ballast
tags:
  - svelte 5
  - tauri 2
  - kotlin
  - local-first
index: Local-first mood diary · desktop + Android · data you can grep
stats:
  - 133 commits
  - 599 unit · 102 e2e
  - desktop + Android
art: /screens/ballast.png
status: producing
shelf: tools
tone: olive
metadata:
  title: 'Ballast: a mood diary made of markdown files'
  description: >-
    A local-first mood diary for desktop and Android. Each entry is a markdown
    file with YAML frontmatter, and a hand-edited file that no longer parses is
    kept byte for byte.
order: 3
---
<!-- block: all-projects -->
← all projects

<!-- block: headline -->
A mood diary that keeps every entry as a plain markdown file.

<!-- block: the-tagline-in-the-readme-is-the-weight-that-keeps-a-ship -->
The tagline in the README is “The weight that keeps a ship stable while it changes course.” I use it the way I used Daylio: open it, pick one of five moods, tick a few activities, write something if I feel like it.

<!-- block: the-data-is-a-folder-of-files-i-can-grep-and-sync-with-syn -->
The data is a folder of files I can grep and sync with Syncthing. It runs on the desktop through Tauri 2 and on my phone as an Android app. The source is private.

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
Daylio’s loop, minus the account

<!-- block: each-entry-has-a-timestamp-one-of-five-moods-rad-good-meh -->
Each entry has a timestamp, one of five moods (rad, good, meh, bad, awful), a list of activities and a free-text note. Activities are mine to define at runtime. The five-step mood scale is the one fixed vocabulary, which I took from Daylio on purpose.

<!-- block: the-bottom-nav-is-entries-a-plus-button-calendar-and-more -->
The bottom nav is Entries, a plus button, Calendar and More. Entries are paged by month. Several entries on one day are normal, since I log a morning and an evening.

<!-- block: the-app-does-no-stats-goals-streaks-or-reminders -->
The app does no stats, goals, streaks or reminders. The bar for adding anything is whether I would actually use it.

<!-- block: the-data -->
The data

<!-- block: one-file-per-entry -->
One file per entry

<!-- block: layout-from-readme -->
Layout from README.md and docs/rewrite-v1.md. The note and activity ids below are placeholders, not one of my entries.

<!-- block: figure-fig-1-ballastdata -->
FIG. 1 · BallastData/

<!-- block: caption-the-filename-is-the-authority-on-when-an-entry-hap -->
The filename is the authority on when an entry happened, so one directory listing is enough to build the month index.

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
Moods are stored by name so a grep for `mood: "awful"` works. Activities are stored by stable id, so renaming one in the settings changes how old entries display without touching their files. Entries have their own opaque id, separate from the filename, so changing an entry’s time does not change its identity.

<!-- block: technical-choices -->
Technical choices

<!-- block: treating-the-files-as-something-other-tools-will-edit -->
Treating the files as something other tools will edit

<!-- block: parseentry-in-src-lib-persistence-entryfile -->
`parseEntry` in `src/lib/persistence/entryFile.ts` falls back to the filename for the time and treats the whole file as the note when the frontmatter will not parse. A file I broke by hand stays readable and is written back unchanged.

<!-- block: label-parsers-never-throw -->
Parsers never throw

<!-- block: scripts-import-real -->
`scripts/import-real.ts` refuses a target folder that already exists. The import is staged and verified, then made visible, so it cannot overwrite a diary. It prints counts only, never entry text.

<!-- block: label-staged-daylio-import -->
Staged Daylio import

<!-- block: a-pure-domain-a-framework-free-application-layer-and-one-s -->
A pure domain, a framework-free application layer, and one `StoragePort` with memory, Tauri filesystem and Android SAF implementations. One shared contract suite runs against all of them.

<!-- block: label-ports-and-adapters -->
Ports and adapters

<!-- block: three-in-repo-plugins-each-rust-plus-kotlin-data-folder-th -->
Three in-repo plugins, each Rust plus Kotlin: `data-folder` (the Android Storage Access Framework), `brief-notifications` and `app-update`.

<!-- block: label-custom-tauri-plugins -->
Custom Tauri plugins

<!-- block: something-else-can-drop-a-markdown-brief-and-a-latest -->
Something else can drop a markdown brief and a `latest.json` into a synced `briefs/` folder. Android checks it about every 15 minutes with WorkManager, verifies the SHA-256 in the manifest, and posts a notification.

<!-- block: label-daily-brief-via-workmanager -->
Daily brief via WorkManager

<!-- block: the-more-screen-files-bugs-and-feature-requests-as-github -->
The More screen files bugs and feature requests as GitHub issues. The token stays on the machine, outside the synced folder, and a screenshot upload is rolled back if the issue fails to create.

<!-- block: label-feedback-to-github-issues -->
Feedback to GitHub issues

<!-- block: writes-go-through-a-temporary-file-and-a-rename-on-desktop -->
Writes go through a temporary file and a rename on desktop, and a temporary-and-backup swap on Android. Creating a new entry uses exclusive create, so a stale directory listing cannot make it overwrite a file that Syncthing just delivered. A malformed `activities.json` makes loading and saving fail visibly instead of being treated as a first run.

<!-- block: verified-numbers -->
Verified numbers

<!-- block: what-the-last-release-recorded -->
What the last release recorded

<!-- block: from-docs-handover-2026-10-02-release -->
From docs/handover-2026-10-02-release.txt and the git log. Counts are as of release 0.3.5.

<!-- block: 133-commits-between-2026-07-05-and-2026-10-02 -->
133 commits between 2026-07-05 and 2026-10-02.

<!-- block: 599-unit-tests-and-102-browser-e2e-tests-passed-for-0 -->
599 unit tests and 102 browser e2e tests passed for 0.3.5, plus Rust formatting, tests and Clippy, Android plugin tests, and real-emulator keyboard tests in CI.

<!-- block: the-signed-android-bundle-for-0 -->
The signed Android bundle for 0.3.5 is 21,009,953 bytes and went to the Google Play internal testing track.

<!-- block: a-ci-gate-measures-idle-background-behaviour-on-an-api-35 -->
A CI gate measures idle background behaviour on an API 35 emulator: it fails if the app uses more than a small CPU allowance, touches the network, renders more than three frames or holds wake locks over 250 ms while backgrounded.

<!-- block: version-1-was-a-much-larger-personal-research-instrument-a -->
Version 1 was a much larger personal research instrument, and the rewrite removed most of it. It is still on the `pre-rewrite` git tag, and its snapshot document records 104 passing tests (9 test files) at that point.

<!-- block: rough-edges -->
Rough edges

<!-- block: the-rewrite-that-cut-scope-and-what-is-unsettled -->
The rewrite that cut scope, and what is unsettled

<!-- block: docs-rewrite-v1 -->
`docs/rewrite-v1.md` is the plan for the rewrite. It lists what v2 leaves out: stats, goals, streaks, reminders, photos, search, encryption and sync. Sync is Syncthing’s job. The old experiments, protocols and job board were removed outright.

<!-- block: edits-are-checked-against-a-revision-just-before-they-are -->
Edits are checked against a revision just before they are written, but the storage providers have no atomic compare-and-swap. A writer that lands in the gap after that check can still win.

<!-- block: the-last-release-reached-play-s-internal-testing-track -->
The last release reached Play’s internal testing track. The handover says installation on a physical phone was not observed during that session.

<!-- block: the-source-is-private-so-the-numbers-above-are-mine-and-no -->
The source is private, so the numbers above are mine and nobody else can rerun them.

<!-- block: stats-are-deferred-not-ruled-out-and-the-bottom-nav-has-ro -->
Stats are deferred, not ruled out, and the bottom nav has room for a slot. I have no rule yet for what “missed in practice” means, so I do not know when one would get built.

<!-- block: materialssvelte-5-tauri-2-rust-kotlin -->
Materials**Svelte 5, Tauri 2, Rust, Kotlin**

<!-- block: vintagejuly-2026-to-now -->
Vintage**July 2026 to now**

<!-- block: statusactive-v0 -->
Status**Active, v0.3.5**

<!-- block: sourceprivate -->
Source**private**
