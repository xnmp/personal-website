---
slug: tauri-explorer
glyph: 檔
title: Tauri Explorer
heading: A file manager with the soul of an IDE.
href: /p/tauri-explorer
repo: 'https://github.com/xnmp/tauri-explorer'
tags:
  - rust
  - tauri v2
  - svelte 5
  - open source
index: Keyboard-first file manager · Ctrl+P for your filesystem · alpha open
stats:
  - '2,534 commits'
  - ~2.7k unit tests
  - v1.11.2
art: /screens/tauri-explorer.png
status: alpha
shelf: tools
tone: amber
version: v1.11.2
email: chonw@proton.me
nix_scheme: 'nix run github:'
nix_repo: xnmp/tauri-explorer
metadata:
  title: 'Tauri Explorer: Ctrl+P for your filesystem'
  description: >-
    A keyboard-first file manager for Linux, macOS and Windows. Frecency
    fuzzy-find, ripgrep content search, a command palette, split panes, git
    graph, embedded terminal. Alpha testers wanted.
  openGraph:
    title: 'Tauri Explorer: Ctrl+P for your filesystem'
    description: >-
      A keyboard-first file manager in Rust + Svelte. Try the working copy in
      your browser, then join the alpha.
reflexes:
  - chord:
      - Ctrl
      - P
    what: 'Quick open. Fuzzy-find any file under the tree, ranked by frecency.'
  - chord:
      - Ctrl
      - Shift
      - F
    what: Content search across the tree using ripgrep's own crates.
  - chord:
      - Ctrl
      - Shift
      - P
    what: 'Command palette. Every action, rebindable.'
  - chord:
      - Ctrl
      - Shift
      - D
    what: 'Dual pane. F6 jumps sides, Ctrl+Shift+F5 copies across.'
  - chord:
      - Ctrl
      - T
    what: New tab. Ctrl+Shift+T brings back the last one you closed.
  - chord:
      - Ctrl
      - '`'
    what: 'Embedded terminal, opened in the folder you’re in.'
  - chord:
      - Ctrl
      - Alt
      - G
    what: Git commit graph for the current repository.
  - chord:
      - Ctrl
      - Z
    what: 'Undo for file operations: rename, move, trash.'
shots:
  - scene: content-search
    w: 1176
    h: 708
    focus:
      x: 0.25
      'y': 0.06
    label: Content search
    note: >-
      Ctrl+Shift+F searches inside files, grouped by file with the match in
      context.
  - scene: command-palette
    w: 1176
    h: 784
    focus:
      x: 0.25
      'y': 0.06
    label: Command palette
    note: >-
      Every command, with its shortcut. Here: switching theme without a settings
      page.
  - scene: git-graph
    w: 1696
    h: 374
    focus:
      x: 0.155
      'y': 0.15
    label: Git graph
    note: >-
      The commit graph sits beside your files, so you don’t have to leave for a
      git GUI.
ledger:
  - - '2,534'
    - commits since Jan 2026
  - - ~2.7k
    - unit test cases (vitest)
  - - '193'
    - browser e2e specs
  - - '56'
    - native Tauri e2e files
  - - ~600
    - 'Rust #⁠[⁠test⁠] functions'
  - - '11'
    - CI workflows on 3 OSes
  - - "595\_ms"
    - 'startup p50, down from 837 ms'
  - - "<50\_ms"
    - sort 10k entries (CI budget)
order: 1
proof:
  - text: MIT
    more: ' licensed'
  - text: No telemetry
  - includeStats: true
  - text: 'Builds for Linux, macOS, Windows'
---
<!-- block: all-projects -->
← all projects

<!-- block: github -->
GitHub ↗

<!-- block: spantauri-explorer-version-spanalpha-testers-wanted -->
:span[Tauri Explorer {{version}}]:span[alpha testers wanted]

<!-- block: headline -->
:os[Ctrl+P for your filesystem.]

<!-- block: a-keyboard-first-file-manager-for-linux-macos-and-windows -->
A keyboard-first file manager for Linux, macOS and Windows.

<!-- block: fuzzy-find-any-file-search-inside-all-of-them-and-run-ever -->
Fuzzy-find any file, search inside all of them, and run every action from a palette. Your hands stay on the keyboard the whole time.

<!-- block: join-the-alpha -->
Join the alpha

<!-- block: try-it-live -->
Try it live

<!-- block: opens-an-email-to-email -->
Opens an email to **{{email}}**

<!-- block: what-testers-get -->
What testers get ↓

<!-- block: alt-tauri-explorer-s-window-with-quick-open-over-it-after -->
Tauri Explorer’s window with quick open over it after typing “read”: README.md ranked first, then the feature docs, each with the matched letters underlined

<!-- block: press-these-keys-to-jump-to-the-live-demo-and-hand-it-the -->
Press these keys to jump to the live demo and hand it the keyboard.

<!-- block: quick-open-typing-read -->
Quick open, typing “read”.

<!-- block: the-reflexes -->
The reflexes

<!-- block: shortcuts-your-editor-already-taught-you -->
Shortcuts your editor already taught you

<!-- block: these-are-the-default-bindings -->
These are the default bindings. All of them can be rebound, and chords like :kbd[g] :kbd[h] (go home) work too.

<!-- block: why-another-file-manager -->
Why another file manager

<!-- block: most-of-them-are-polished-but-slow-or-fast-but-punishing -->
Most of them are polished but slow, or fast but punishing

<!-- block: finder-and-explorer-are-polished-but-every-trip-through-th -->
Finder and Explorer are polished, but every trip through them goes through the mouse. Ranger, `lf` and Midnight Commander are fast, but you have to learn a new set of keys first. My IDE already solved keyboard navigation, so this borrows its answers.

<!-- block: quick-open-walks-the-tree-with-jwalk-and-ranks-matches-wit -->
Quick open walks the tree with `jwalk` and ranks matches with `nucleo`, the matcher from the Helix editor. Frecency is zoxide-style: each path scores :span[:code[Σ 1/(hours since:break[] access + 1)],]{class="nowrap"} so a file you opened ten minutes ago beats one you opened a hundred times last year. Content search embeds ripgrep’s own crates :span[(`grep-searcher`]{class="nowrap"} + :span[`ignore`),]{class="nowrap"} so it respects your `.gitignore` and doesn’t shell out.

<!-- block: everything-else-including-sidebars-columns-previews-and-th -->
Everything else, including sidebars, columns, previews and the terminal, is off until you turn it on.

<!-- block: under-the-hood -->
Under the hood

<!-- block: one-person-tested-like-a-team -->
One person, tested like a team

<!-- block: counts-are-from-the-repository-on-6-oct-2026 -->
Counts are from the repository on 6 Oct 2026. The perf budgets are enforced in CI, so a regression fails the build.

<!-- block: also-in-the-box -->
Also in the box

<!-- block: things-you-won-t-find-in-the-screenshots -->
Things you won’t find in the screenshots

<!-- block: replaces-your-file-picker -->
Replaces your file picker

<!-- block: on-linux-it-can-act-as-the-xdg-desktop-portal-file-chooser -->
On Linux it can act as the xdg-desktop-portal file chooser, so other apps’ Open dialogs get Ctrl+P too.

<!-- block: twelve-themes-plus-yours -->
Twelve themes, plus yours

<!-- block: drop-a -->
Drop a `.css` into :code[~/.config/:break[]tauri-explorer/:break[]themes]. It reloads while you edit it.

<!-- block: splits-and-miller-columns -->
Splits and Miller columns

<!-- block: tabs-dual-pane-arbitrary-splits-named-workspaces-and-a-yaz -->
Tabs, dual pane, arbitrary splits, named workspaces, and a yazi-style column view.

<!-- block: careful-file-ops -->
Careful file ops

<!-- block: undo-trash-with-restore-a-conflict-resolver -->
Undo, Trash with restore, a conflict resolver. Cut checks clipboard ownership, so a stale cut becomes a copy instead of a surprise move.

<!-- block: plugins -->
Plugins

<!-- block: ai-rename-ai-organize-and-image-tools-ship-as-plugins-you -->
AI rename, AI organize and image tools ship as plugins you can switch off. A plugin SDK is in preview.

<!-- block: no-telemetry -->
No telemetry

<!-- block: nothing-phones-home -->
Nothing phones home. Bug reports go out only when you send one :span[(:kbd[:os[Alt+I]]).]{class="nowrap"}

<!-- block: the-alpha -->
The alpha

<!-- block: looking-for-a-small-first-cohort-of-people-who-live-in-a-f -->
Looking for a small first cohort of people who live in a file manager

<!-- block: join-the-alpha-2 -->
Join the alpha

<!-- block: testers-get-a-direct-line-to-me -->
**Testers get a direct line to me.** Your reports of data loss or wrong-target operations jump the queue ahead of feature requests, and I’ll tell you what has been tested on your setup before you trust it with real files.

<!-- block: to-join-write-with-your-os-desktop-environment-and-display -->
To join, write with your OS, desktop environment and display scale. That is the whole sign-up.

<!-- block: no-mail-app -->
No mail app? Write to **{{email}}**.

<!-- block: rather-try-it-first -->
Rather try it first? The builds are public: download {{version}} and use it today, then write in when you’re ready.

<!-- block: before-you-say-yes-here-s-what-it-s-like-today -->
Before you say yes, here’s what it’s like today:

<!-- block: builds-are-unsigned -->
**Builds are unsigned.** Windows shows SmartScreen. The macOS build is Apple Silicon only and not notarized (Intel Macs build from source).

<!-- block: no-auto-updater-yet -->
**No auto-updater yet.** New versions are on the release page.

<!-- block: start-on-a-scratch-folder -->
**Start on a scratch folder.** Try copy, move, rename and Trash on test files before you point it at anything you care about.

<!-- block: reporting-is-built-in -->
**Reporting is built in.** Use the command palette (Report Issue) or :kbd[:os[Alt+I]]. Reports are public GitHub issues, so leave out private paths.

<!-- block: install -->
Install

<!-- block: install-version -->
Install {{version}}

<!-- block: linux-appimage -->
Linux: AppImage, .deb, .rpm, a Nix flake and a PKGBUILD. macOS: arm64 .dmg. Windows: .msi or setup .exe.

<!-- block: or-with-nix -->
or, with Nix

<!-- block: code-nix-scheme-breakspan-nix-repo-class-nowrap-class-cmd -->
:command[{{nix_scheme}}{{nix_repo}}]

<!-- block: materialsrust-tauri-v2-svelte-5 -->
Materials**Rust, Tauri v2, Svelte 5**

<!-- block: platformslinux-macos-windows -->
Platforms**Linux · macOS · Windows**

<!-- block: licencemit -->
Licence**MIT**

<!-- block: source-linkgithub-xnmp-tauri-explorer-href-https-github -->
Source **:link[github/xnmp/tauri-explorer]{href="https://github.com/xnmp/tauri-explorer" class="nowrap"}**
