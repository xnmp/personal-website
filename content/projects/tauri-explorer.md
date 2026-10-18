---
slug: tauri-explorer
glyph: 檔
title: Tauri Explorer
summary: "The file explorer I built to get my setup how I wanted it."
preview:
  src: /tauri/hero-quick-open-{theme}.webp
  alt: Tauri Explorer with Quick Open finding files by name.
  width: 698
  height: 438
heading: "A Fully Featured File Explorer"
href: /p/tauri-explorer
repo: 'https://github.com/xnmp/tauri-explorer'
website: 'https://tauri-explorer.vercel.app'
tags:
  - rust
  - tauri v2
  - svelte 5
  - open source
index: "My file explorer · Rust and Svelte · notes on building it"
stats:
  - "Linux · macOS · Windows"
  - "Rust + Svelte"
  - "In development"
art: /screens/tauri-explorer.png
status: alpha
shelf: tools
tone: amber
version: v1.11.2
email: chonw@proton.me
nix_scheme: 'nix run github:'
nix_repo: xnmp/tauri-explorer
metadata:
  title: "Tauri Explorer · chong"
  description: "Why I built my own file explorer, after using Marta and Fileside and wanting different bits of each."
  openGraph:
    title: "Tauri Explorer · chong"
    description: "Why I built my own file explorer, after using Marta and Fileside and wanting different bits of each."
shots:
  - scene: content-search
    w: 1176
    h: 708
    focus:
      x: 0.25
      'y': 0.06
    label: Content search
    note: "Search results grouped by file, with the matching text beside them."
  - scene: command-palette
    w: 1176
    h: 784
    focus:
      x: 0.25
      'y': 0.06
    label: Command palette
    note: "Changing a theme through the command palette."
  - scene: git-graph
    w: 1696
    h: 374
    focus:
      x: 0.155
      'y': 0.15
    label: Git graph
    note: "The Git graph beside the file list."
order: 1
---

<!-- block: all-projects -->
← all projects

<!-- block: website -->
Tauri Explorer website ↗

<!-- block: github -->
GitHub ↗

<!-- block: headline -->
A Fully Featured File Explorer

<!-- block: subtitle -->
By fully featured I really do mean fully featured

<!-- block: introduction -->
When I was tuning my setup earlier this year and really going hard on the productivity, I realized that there was no file explorer app on any platform that had everything I wanted. So I built it.

Downloads, installation instructions and the feature list are on the [Tauri Explorer website ↗]({{website}}). This page is where I keep the story of building it.

<!-- block: screenshot-alt -->
Tauri Explorer’s window with quick open over it after typing “read”: README.md ranked first, then the feature docs, each with the matched letters underlined

<!-- block: origin-kicker -->
Where it started

<!-- block: origin-heading -->
The little things that bothered me

<!-- block: body-the-little-things-that-bothered-me -->
I used Marta for a while, but I really wanted to customise it. For example, after selecting a folder with Ctrl+P, I'd have to hit Enter twice. And I wanted to hide the status bar. Small things, but they're the sort of things I notice every time I use an app.

I used Fileside on Windows for a while because it had multiple panes and was minimal, but there wasn't even a thumbnail view. I kept finding bits I liked in different file explorers, without finding one that had everything I wanted.

This is the sort of thing I mean in the About section about tuning a workflow. An extra keypress sounds trivial, but getting all those little choices how I want them is quite satisfying.

<!-- block: building-kicker -->
Building it

<!-- block: building-heading -->
What grew out of that

<!-- block: body-what-grew-out-of-that -->
It's written in Rust and Svelte, using Tauri. A lot of the interaction comes from my editor: quick open, content search, a command palette. Then there are the things I want from a file explorer, like thumbnails, different pane layouts and previews.

The point is being able to choose how all of that fits together. Sidebars, columns, the status bar and the terminal can be shown or hidden, and the shortcuts can be changed.

One detail I like is that quick open takes recent use into account. It uses `nucleo` for fuzzy matching and a zoxide-style frecency score, so a path I've just been working in can come before an old frequent match. Content search uses ripgrep's crates directly.

<!-- block: materials -->
Materials**Rust, Tauri v2, Svelte 5**

<!-- block: platforms -->
Platforms**Linux · macOS · Windows**

<!-- block: licence -->
Licence**MIT**

<!-- block: source -->
Source **:link[github/xnmp/tauri-explorer]{href="https://github.com/xnmp/tauri-explorer" class="nowrap"}**

<!-- block: project-notes -->
How I built it →
